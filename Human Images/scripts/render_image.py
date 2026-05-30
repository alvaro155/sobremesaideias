#!/usr/bin/env python3
"""Render images through the Higgsfield CLI using Nano Banana 2 (`nano_banana_2`).

This is the render destination for the `/image` skill. The skill writes a final
prompt to `Human Images/output/<run_id>/prompt.txt` and then calls this script,
which wraps the documented Higgsfield CLI command:

    higgsfield generate create nano_banana_2 \
        --prompt "$PROMPT" --aspect_ratio "4:5" --resolution "2k"

With a reference image the reference is first uploaded to obtain a UUID and then
passed via `--image "$REF_UUID"`.

Usage:
    python3 "Human Images/scripts/render_image.py" render PROMPT_FILE \
        --aspect-ratio 4:5 --resolution 2k \
        --output-dir "Human Images/output/<run_id>" \
        [--reference /path/to/reference.png] [--dry-run]

The script never falls back to another model or engine. If a render fails the
fix is login, refs, prompt, aspect ratio, resolution, or model access — not a
different engine.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

MODEL = "nano_banana_2"
CLI = "higgsfield"

# Locked to the values accepted by the /image skill.
ALLOWED_ASPECT_RATIOS = {
    "auto", "1:1", "3:2", "2:3", "4:3", "3:4",
    "4:5", "5:4", "9:16", "16:9", "21:9",
}
ALLOWED_RESOLUTIONS = {"1k", "2k", "4k"}

# How long to wait for an async generation to finish before giving up.
POLL_TIMEOUT_SECONDS = 600
POLL_INTERVAL_SECONDS = 5


class RenderError(RuntimeError):
    """Raised when a render cannot be completed."""


def _eprint(*args: object) -> None:
    print(*args, file=sys.stderr, flush=True)


def _ensure_cli_available() -> None:
    if shutil.which(CLI) is None:
        raise RenderError(
            f"The '{CLI}' CLI was not found on PATH. Install and authenticate the "
            "Higgsfield CLI before rendering. This workflow does not fall back to "
            "another engine."
        )


def _run_cli(args: list[str], *, capture: bool = True) -> subprocess.CompletedProcess:
    """Run a higgsfield CLI command and return the completed process."""
    cmd = [CLI, *args]
    _eprint("+ " + " ".join(_shell_quote(a) for a in cmd))
    return subprocess.run(
        cmd,
        check=False,
        text=True,
        capture_output=capture,
    )


def _shell_quote(value: str) -> str:
    if value and re.fullmatch(r"[A-Za-z0-9_./:=@-]+", value):
        return value
    return "'" + value.replace("'", "'\\''") + "'"


def _read_prompt(prompt_file: Path) -> str:
    if not prompt_file.is_file():
        raise RenderError(f"Prompt file not found: {prompt_file}")
    prompt = prompt_file.read_text(encoding="utf-8").strip()
    if not prompt:
        raise RenderError(f"Prompt file is empty: {prompt_file}")
    return prompt


def _upload_reference(reference: Path) -> str:
    """Upload a reference image and return its Higgsfield UUID.

    The CLI surface for uploads is not fully stable across versions, so we try a
    couple of documented forms and parse whatever identifier comes back.
    """
    if not reference.is_file():
        raise RenderError(f"Reference image not found: {reference}")

    upload_forms = [
        ["image", "upload", str(reference)],
        ["upload", str(reference)],
        ["asset", "upload", str(reference)],
    ]
    last_output = ""
    for form in upload_forms:
        proc = _run_cli(form)
        last_output = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode == 0:
            uuid = _extract_id(proc.stdout or "")
            if uuid:
                _eprint(f"Reference uploaded: {uuid}")
                return uuid
    raise RenderError(
        "Could not upload the reference image via the Higgsfield CLI.\n"
        f"Last CLI output:\n{last_output.strip()}"
    )


_UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
_URL_RE = re.compile(r"https?://[^\s\"'<>]+")


def _extract_id(output: str) -> str | None:
    """Pull a job/asset id out of CLI output (JSON preferred, regex fallback)."""
    data = _maybe_json(output)
    if isinstance(data, dict):
        for key in ("id", "uuid", "job_id", "jobId", "asset_id", "assetId"):
            value = data.get(key)
            if isinstance(value, str) and value:
                return value
    match = _UUID_RE.search(output)
    return match.group(0) if match else None


def _maybe_json(output: str):
    output = output.strip()
    if not output:
        return None
    # The CLI may print log lines before/after a JSON blob; grab the first {...}.
    for candidate in (output, _first_json_object(output)):
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return None


def _first_json_object(text: str) -> str | None:
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _extract_image_urls(output: str) -> list[str]:
    """Find downloadable image URLs in CLI output."""
    data = _maybe_json(output)
    urls: list[str] = []
    if isinstance(data, dict):
        urls.extend(_walk_for_urls(data))
    # Fallback: scrape any URL that looks like an image asset.
    for url in _URL_RE.findall(output):
        if url not in urls:
            urls.append(url)
    # De-dupe while preserving order, keep only plausible image URLs.
    seen: set[str] = set()
    result: list[str] = []
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        result.append(url)
    return result


def _walk_for_urls(node) -> list[str]:
    found: list[str] = []
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str) and value.startswith("http") and (
                "url" in key.lower() or "image" in key.lower() or "result" in key.lower()
            ):
                found.append(value)
            else:
                found.extend(_walk_for_urls(value))
    elif isinstance(node, list):
        for item in node:
            found.extend(_walk_for_urls(item))
    return found


def _poll_job(job_id: str) -> str:
    """Poll a generation job until it finishes; return CLI output with results."""
    deadline = time.time() + POLL_TIMEOUT_SECONDS
    last_output = ""
    while time.time() < deadline:
        proc = _run_cli(["generate", "get", job_id])
        last_output = proc.stdout or ""
        data = _maybe_json(last_output)
        status = ""
        if isinstance(data, dict):
            status = str(data.get("status", "")).lower()
        if status in {"completed", "succeeded", "success", "done"}:
            return last_output
        if status in {"failed", "error", "canceled", "cancelled"}:
            raise RenderError(
                f"Higgsfield job {job_id} reported status '{status}'.\n{last_output}"
            )
        # No status field but we already have image URLs: treat as done.
        if _extract_image_urls(last_output):
            return last_output
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RenderError(
        f"Timed out after {POLL_TIMEOUT_SECONDS}s waiting for job {job_id}."
    )


def _download(url: str, dest: Path) -> None:
    _eprint(f"Downloading {url} -> {dest}")
    with urllib.request.urlopen(url) as resp:  # noqa: S310 (trusted Higgsfield host)
        dest.write_bytes(resp.read())


def _guess_extension(url: str) -> str:
    match = re.search(r"\.(png|jpg|jpeg|webp)(?:\?|$)", url, re.IGNORECASE)
    return f".{match.group(1).lower()}" if match else ".png"


def render(args: argparse.Namespace) -> int:
    aspect_ratio = args.aspect_ratio
    resolution = args.resolution

    if aspect_ratio not in ALLOWED_ASPECT_RATIOS:
        raise RenderError(
            f"Invalid aspect ratio '{aspect_ratio}'. Allowed: "
            f"{', '.join(sorted(ALLOWED_ASPECT_RATIOS))}"
        )
    if resolution not in ALLOWED_RESOLUTIONS:
        raise RenderError(
            f"Invalid resolution '{resolution}'. Allowed: "
            f"{', '.join(sorted(ALLOWED_RESOLUTIONS))}"
        )

    prompt_file = Path(args.prompt_file)
    prompt = _read_prompt(prompt_file)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    cli_args = [
        "generate", "create", MODEL,
        "--prompt", prompt,
        "--aspect_ratio", aspect_ratio,
        "--resolution", resolution,
    ]

    reference_uuid: str | None = None
    if args.reference:
        if args.dry_run:
            reference_uuid = "<reference-uuid>"
        else:
            _ensure_cli_available()
            reference_uuid = _upload_reference(Path(args.reference))
        cli_args.extend(["--image", reference_uuid])

    if args.dry_run:
        print("DRY RUN — command that would be executed:")
        print("  " + " ".join(_shell_quote(a) for a in [CLI, *cli_args]))
        print(f"Output directory: {output_dir}")
        return 0

    _ensure_cli_available()
    proc = _run_cli(cli_args)
    combined = (proc.stdout or "") + "\n" + (proc.stderr or "")
    if proc.returncode != 0:
        raise RenderError(
            "Higgsfield generation command failed.\n"
            "Fix login, refs, prompt, aspect ratio, resolution, or model access "
            "and retry — do not switch engines.\n"
            f"CLI output:\n{combined.strip()}"
        )

    # Results may be inline, or we may need to poll an async job.
    image_urls = _extract_image_urls(proc.stdout or "")
    if not image_urls:
        job_id = _extract_id(proc.stdout or "")
        if job_id:
            job_output = _poll_job(job_id)
            image_urls = _extract_image_urls(job_output)

    if not image_urls:
        raise RenderError(
            "Render reported success but no image URL was found in the CLI output.\n"
            f"CLI output:\n{combined.strip()}"
        )

    saved: list[Path] = []
    for idx, url in enumerate(image_urls):
        ext = _guess_extension(url)
        suffix = "" if len(image_urls) == 1 else f"_{idx + 1}"
        dest = output_dir / f"image{suffix}{ext}"
        _download(url, dest)
        saved.append(dest)

    # Persist a small manifest next to the image(s) for traceability.
    manifest = {
        "model": MODEL,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution,
        "prompt_file": str(prompt_file),
        "reference": args.reference,
        "reference_uuid": reference_uuid,
        "images": [str(p) for p in saved],
        "image_urls": image_urls,
    }
    (output_dir / "render.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print("Render complete.")
    for path in saved:
        print(f"  image: {path}")
    print(f"  prompt: {prompt_file}")
    print(f"  manifest: {output_dir / 'render.json'}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="render_image.py",
        description="Render images via Higgsfield CLI + Nano Banana 2.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    render_p = sub.add_parser("render", help="Render an image from a prompt file.")
    render_p.add_argument("prompt_file", help="Path to the prompt .txt file.")
    render_p.add_argument(
        "--aspect-ratio", dest="aspect_ratio", default="1:1",
        help="One of: " + ", ".join(sorted(ALLOWED_ASPECT_RATIOS)),
    )
    render_p.add_argument(
        "--resolution", default="2k",
        help="One of: " + ", ".join(sorted(ALLOWED_RESOLUTIONS)),
    )
    render_p.add_argument(
        "--output-dir", dest="output_dir", required=True,
        help="Directory to write the rendered image(s) and manifest.",
    )
    render_p.add_argument(
        "--reference", default=None,
        help="Optional path to a reference image to condition the render.",
    )
    render_p.add_argument(
        "--dry-run", action="store_true",
        help="Print the CLI command without executing the render.",
    )
    render_p.set_defaults(func=render)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except RenderError as exc:
        _eprint(f"error: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
