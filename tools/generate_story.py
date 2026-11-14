"""Generate the demo trip story once, show every safety check, and save it only after a person reads it.

Uses the same pipeline as POST /api/trips with LLM_LIVE on: services/stories.generate()
(prompt with four fields, one AI call, JSON shape, content rules, moderation).

Run from the repo root in the Cathay-Hack env, with LLM_PROVIDER / LLM_API_KEY / LLM_MODEL
(and LLM_BASE_URL for a compatible provider) set in backend/.env:
  python tools/generate_story.py                 # generate and print; saves nothing
  python tools/generate_story.py --save          # also write the reviewed fixture
  python tools/generate_story.py --tries 3       # retry up to 3 times; rejections are logged
Rejected attempts are written to docs/story-rejections.md (reasons + raw text) for the slide.
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)  # so pydantic-settings reads backend/.env
sys.stdout.reconfigure(encoding="utf-8")

from app.config import Settings  # noqa: E402
from app.services.oag import lookup_flight  # noqa: E402
from app.services.stories import fixture_path, generate  # noqa: E402

REJECTIONS = ROOT / "docs" / "story-rejections.md"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--carrier", default="CX")
    parser.add_argument("--number", default="500")
    parser.add_argument("--date", default="2026-11-14")
    parser.add_argument("--age-band", default="6-8", choices=["6-8", "9-12"])
    parser.add_argument("--tries", type=int, default=1)
    parser.add_argument("--save", action="store_true", help="write the reviewed story fixture")
    args = parser.parse_args()

    settings = Settings(llm_live=True)
    flight = lookup_flight(args.carrier, args.number, args.date, settings)
    print(f"Flight {flight.carrier} {flight.number} to {flight.destination.city}, "
          f"{flight.duration_minutes} min, {flight.aircraft.name}, age band {args.age_band}")
    print(f"Provider {settings.llm_provider or '(none)'}, model {settings.llm_model or '(none)'}\n")

    for attempt in range(1, args.tries + 1):
        result = generate(flight, args.age_band, settings)
        if result.story is None:
            print(f"Attempt {attempt}: REJECTED")
            for reason in result.reasons:
                print(f"  - {reason}")
            if result.raw:  # a real reply was stopped (not a config or network error)
                log_rejection(args, result.reasons, result.raw)
            continue

        print(f"Attempt {attempt}: PASSED ({'; '.join(result.checks)})\n")
        story = result.story
        print(f"Title: {story.title['en']}")
        for c in story.chapters:
            t = c.text["en"]
            print(f"\n[{c.number} {c.branch}] {t.title}\n  " + "\n  ".join(t.pages))
        if args.save:
            path = fixture_path(settings.fixtures_dir, flight, args.age_band)
            path.write_text(story.model_dump_json(by_alias=True, indent=2, exclude_none=True) + "\n",
                            encoding="utf-8")
            print(f"\nSaved reviewed story: {path.relative_to(ROOT)}")
        else:
            print("\nRead it, then run again with --save to keep it (or save this output by hand).")
        return
    print("\nNo attempt passed: POST /api/trips would use the pre-written fallback story.")


def log_rejection(args, reasons: list[str], raw: str) -> None:
    new = not REJECTIONS.exists()
    with REJECTIONS.open("a", encoding="utf-8") as f:
        if new:
            f.write("# Rejected AI stories\n\nWritten by `tools/generate_story.py`. "
                    "Each entry is an AI reply the safety checks stopped; the child got the fallback.\n")
        f.write(f"\n## {datetime.now():%Y-%m-%d %H:%M} · {args.carrier} {args.number} {args.date} · {args.age_band}\n\n")
        f.write("Reasons:\n" + "".join(f"- {r}\n" for r in reasons))
        if raw:
            f.write("\nRaw reply:\n\n```json\n" + raw.strip() + "\n```\n")


if __name__ == "__main__":
    main()
