#!/usr/bin/env python3
"""Render every prompt in an image-bank run directory via Higgsfield CLI.

Finds each `<run_dir>/var_NN/prompt.txt`, then calls `render_image.py` for it,
attaching the same reference image so the whole bank stays visually coherent.
The reference is sent with every prompt (per the brief) and each result is
written next to its prompt in the same `var_NN` folder.

Usage:
    python3 "Human Images/scripts/render_batch.py" \
        --run-dir "Human Images/output/banco-img5174" \
        --reference "public/media/IMG_5174.png" \
        --aspect-ratio 16:9 --resolution 2k

Add --dry-run to print the commands without rendering. Failures don't stop the
batch; a summary is printed at the end so you can re-run only what failed.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
RENDER_SCRIPT = SCRIPT_DIR / "render_image.py"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Batch-render an image-bank run directory.")
    parser.add_argument("--run-dir", required=True, help="Directory holding var_NN/prompt.txt folders.")
    parser.add_argument("--reference", required=True, help="Reference image sent with every prompt.")
    parser.add_argument("--aspect-ratio", dest="aspect_ratio", default="16:9")
    parser.add_argument("--resolution", default="2k")
    parser.add_argument("--dry-run", action="store_true", help="Print commands without rendering.")
    parser.add_argument("--only", help="Optional comma list of ids to render, e.g. var_01,var_05.")
    args = parser.parse_args(argv)

    run_dir = Path(args.run_dir)
    if not run_dir.is_dir():
        print(f"error: run dir not found: {run_dir}", file=sys.stderr)
        return 1
    if not Path(args.reference).is_file() and not args.dry_run:
        print(f"error: reference image not found: {args.reference}", file=sys.stderr)
        return 1

    only = {s.strip() for s in args.only.split(",")} if args.only else None
    prompt_files = sorted(run_dir.glob("var_*/prompt.txt"))
    if only:
        prompt_files = [p for p in prompt_files if p.parent.name in only]
    if not prompt_files:
        print(f"error: no var_*/prompt.txt found in {run_dir}", file=sys.stderr)
        return 1

    succeeded: list[str] = []
    failed: list[str] = []
    for prompt_file in prompt_files:
        var_dir = prompt_file.parent
        cmd = [
            sys.executable, str(RENDER_SCRIPT), "render", str(prompt_file),
            "--aspect-ratio", args.aspect_ratio,
            "--resolution", args.resolution,
            "--output-dir", str(var_dir),
            "--reference", args.reference,
        ]
        if args.dry_run:
            cmd.append("--dry-run")
        print(f"\n=== {var_dir.name} ===")
        result = subprocess.run(cmd, check=False)
        (succeeded if result.returncode == 0 else failed).append(var_dir.name)

    print("\n--- batch summary ---")
    print(f"ok:     {len(succeeded)} -> {', '.join(succeeded) or '-'}")
    print(f"failed: {len(failed)} -> {', '.join(failed) or '-'}")
    if failed:
        print("Re-run failures with: --only " + ",".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
