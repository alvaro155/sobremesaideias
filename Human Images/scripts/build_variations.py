#!/usr/bin/env python3
"""Generate the 30-prompt image bank derived from public/media/IMG_5174.png.

The reference is a black-and-white, low-key, high-contrast intimate portrait:
single soft side light, deep black void, off-camera gaze, close off-center
framing, dark wardrobe, and a signature long-exposure motion-blur veil of
drifting hair/haze across one side of the frame.

This script keeps that visual language constant (monochrome Double-X grade,
low-key single source, black void, motion veil, framing) and varies ONLY the
character, wardrobe, and scenario across 30 Nano Banana 2 prompts. Each prompt
is written to `<run_dir>/var_NN/prompt.txt`, ready for a reference-conditioned
render at 16:9 / 2k.

Usage:
    python3 "Human Images/scripts/build_variations.py" \
        --run-dir "Human Images/output/banco-img5174"
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

MAX_CHARS = 1500

# Camera/lens/position variants — all within the two allowed bodies. Rotated
# across the bank to satisfy the "unusual angle" rule without breaking
# coherence. Each carries a matching COMPOSITIONAL camera-position phrase.
CAMERA_VARIANTS = [
    {
        "camera": "IMAX MK IV 65mm at ISO 250, low at hip level, tilted up oblique to the subject",
        "lens": "Zeiss Otus 85mm T2.5, wide open, focus on the near eye, far side dissolving",
    },
    {
        "camera": "IMAX MK IV 65mm at ISO 250, floor level looking steeply up past the shoulder",
        "lens": "Zeiss Makro-Planar 65mm T2.2, wide open, focus on the near eye, periphery soft",
    },
    {
        "camera": "ARRI Alexa 35 at ISO 800, hand-held at chest level, slight downward tilt",
        "lens": "Canon K35 85mm T1.8, wide open, focus on the iris, edges dissolving",
    },
    {
        "camera": "ARRI Alexa 35 at ISO 800, low and oblique near the shoulder, slightly canted",
        "lens": "Canon K35 55mm T1.5, at T2, focus on the near eye, far cheek falling away",
    },
]

# Key light side alternates to keep the bank from feeling stamped.
LIGHT_VARIANTS = [
    "Single soft source at 3,200K, 60 degrees camera-left and above, no fill; lit cheek at 60 IRE, shadow side to 8 IRE in a black void, soft falloff across the jaw",
    "Single soft source at 3,000K, 55 degrees camera-right and above, no fill; near cheek at 58 IRE, opposite side to 6 IRE, soft shadow line across the nose",
]

# 30 variations: (subject, subject_short, wardrobe, scenario cue in the void).
VARIATIONS = [
    ("A silver-haired woman in her seventies with thick black-framed glasses", "The woman", "A black wool turtleneck and a heavy strand of dark wooden beads", "a faint doorway"),
    ("A young man with a shaved head and a short dark beard", "The man", "A dark heavy wool overcoat with the collar turned up", "drifting stage haze"),
    ("A Black man in his fifties with a close-cropped grey beard", "The man", "A charcoal henley, top button open", "a dim studio flat"),
    ("A young woman with long straight dark hair parted in the centre", "The woman", "A black satin slip dress with thin straps", "a curtained window"),
    ("An elderly man with deep facial lines under a flat cap", "The man", "A dark double-breasted peacoat", "a bare brick wall"),
    ("An androgynous person with a sleek jaw-length bob", "The person", "A high-necked black silk blouse", "soft rolling haze"),
    ("A teenage girl with freckles and dark curly hair", "The girl", "A dark oversized hoodie, drawstrings loose", "a dim hallway"),
    ("A weathered fisherman in his sixties with a salt-grey beard", "The man", "A thick dark cable-knit sweater", "a low workshop beam"),
    ("A ballet dancer with her hair pulled into a tight bun", "The dancer", "A dark long-sleeved leotard", "a smeared barre line"),
    ("A long-haired musician with stubble in his thirties", "The musician", "A worn black leather jacket over a dark tee", "a smoky club rail"),
    ("A South Asian woman with a small gold nose ring and a dark braid", "The woman", "A dark draped shawl over one shoulder", "a hanging fabric edge"),
    ("An East Asian elder with thin wire glasses and white hair", "The elder", "A dark mandarin-collar jacket", "a paper screen seam"),
    ("A young boxer with sweat on the brow and a strong jaw", "The boxer", "A dark sleeveless training top", "a gym corner shadow"),
    ("A woman in a dark headscarf framing a calm face", "The woman", "A flowing dark abaya", "a latticed shadow"),
    ("A pierced punk in their twenties with a bleached crop", "The punk", "A studded dark denim jacket", "drifting cigarette haze"),
    ("An opera singer mid-breath with an upswept hairstyle", "The singer", "A dark velvet gown with a structured shoulder", "a heavy stage drape"),
    ("An ageing professor with tousled grey hair", "The professor", "A dark tweed blazer over a knit waistcoat", "a wall of dim spines"),
    ("A pregnant woman with both hands resting on her belly", "The woman", "Dark jersey fabric draped across the form", "a soft curtain fold"),
    ("A soldier-type with cropped hair and three-day stubble", "The man", "A dark field jacket, collar up", "low drifting smoke"),
    ("A drag artist with sculpted brows and a sleek wig", "The artist", "A dark sequined wrap catching a single edge", "rolling theatrical haze"),
    ("An Indigenous elder with deep-set eyes and long grey hair", "The elder", "A dark woven wrap over the shoulders", "a faint woven texture"),
    ("A chef with a shaved head and a focused gaze", "The chef", "A dark cross-tied apron over a tee", "a dim kitchen pass"),
    ("A violinist caught at the top of a bow stroke", "The violinist", "A dark fitted blouse, sleeve pushed up", "a smeared bow arc"),
    ("A shaven-headed monk with a serene expression", "The monk", "A coarse dark robe over one shoulder", "a single low candle glow"),
    ("A fashion model with sharp cheekbones and slicked hair", "The model", "A dark structured coat with a high collar", "a seamless dark sweep"),
    ("A widow in mourning with a fine veil over her hair", "The woman", "Black lace over a dark high-necked dress", "a draped black tulle"),
    ("A street poet in a knit beanie with a thoughtful look", "The poet", "A dark scarf wound twice around the neck", "a foggy alley mouth"),
    ("A field scientist with windburned skin and tied-back hair", "The scientist", "A dark collared field shirt", "a dim equipment rack"),
    ("A solemn child of about eight holding a wooden toy", "The child", "A dark crew-neck sweater", "a soft nursery shadow"),
    ("A retired ballerina in her eighties with thin upswept hair", "The woman", "A dark fringed shawl over bare shoulders", "drifting dust in the beam"),
]


def build_prompt(idx: int, subject: str, subject_short: str, wardrobe: str, scenario: str) -> str:
    cam = CAMERA_VARIANTS[idx % len(CAMERA_VARIANTS)]
    light = LIGHT_VARIANTS[idx % len(LIGHT_VARIANTS)]
    return "\n".join([
        f"CAMERA: {cam['camera']}.",
        f"LENS: {cam['lens']}.",
        f"LIGHT: {light}.",
        (
            f"SUBJECT: {subject}, turned three-quarters away, gaze off-camera into "
            f"shadow, matching the monochrome low-key grade, close framing and "
            f"motion-blur veil of @img1 — a different person."
        ),
        (
            "FOREGROUND: A long-exposure smear of drifting hair and haze across "
            "frame-left, half-veiling the face, ghosted and translucent."
        ),
        f"MIDGROUND: {subject_short} sharp on the near eye, soft across the cheek, shoulders sinking into black.",
        f"BACKGROUND: A black void, {scenario} barely readable in deep shadow.",
        f"WARDROBE TONAL BEHAVIOR: {wardrobe}, a dense black mass, only an edge catching the key.",
        "MAKEUP SURFACE PHYSICS: Real skin, visible pores on the lit cheek, faint sheen on the brow, no powder.",
        (
            "POST BEHAVIOR: Kodak Double-X 5222 monochrome, heavy visible organic "
            "grain, crushed blacks, high contrast, no halation."
        ),
        (
            "COMPOSITIONAL GEOMETRY: Subject on the frame-right third, the motion "
            "smear a diagonal veil from top-left, deep negative space, broken framing."
        ),
        "MOOD & ART DIRECTION: Composition and art direction inspired in the work of award-winning directors.",
    ])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build the IMG_5174 image-bank prompts.")
    parser.add_argument(
        "--run-dir", default="Human Images/output/banco-img5174",
        help="Run directory to write var_NN/prompt.txt into.",
    )
    args = parser.parse_args(argv)

    run_dir = Path(args.run_dir)
    run_dir.mkdir(parents=True, exist_ok=True)

    index: list[dict] = []
    over_limit: list[str] = []
    for i, (subject, short, wardrobe, scenario) in enumerate(VARIATIONS, start=1):
        prompt = build_prompt(i - 1, subject, short, wardrobe, scenario)
        var_dir = run_dir / f"var_{i:02d}"
        var_dir.mkdir(parents=True, exist_ok=True)
        (var_dir / "prompt.txt").write_text(prompt + "\n", encoding="utf-8")
        if len(prompt) > MAX_CHARS:
            over_limit.append(f"var_{i:02d} ({len(prompt)} chars)")
        index.append({
            "id": f"var_{i:02d}",
            "subject": subject,
            "wardrobe": wardrobe,
            "scenario": scenario,
            "prompt_file": str(var_dir / "prompt.txt"),
            "chars": len(prompt),
        })

    (run_dir / "variations.json").write_text(
        json.dumps(
            {
                "reference": "public/media/IMG_5174.png",
                "aspect_ratio": "16:9",
                "resolution": "2k",
                "model": "nano_banana_2",
                "count": len(index),
                "variations": index,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print(f"Wrote {len(index)} prompts to {run_dir}")
    if over_limit:
        print("WARNING: prompts over 1500 chars: " + ", ".join(over_limit))
        return 1
    print(f"Longest prompt: {max(v['chars'] for v in index)} chars (limit {MAX_CHARS})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
