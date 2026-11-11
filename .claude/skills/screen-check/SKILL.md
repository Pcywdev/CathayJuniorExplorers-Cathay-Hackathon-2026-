---
name: screen-check
description: Screenshot /child and /parent at 393x852, check every shot against docs/DESIGN.md, report pass or fail, fix and re-check at most twice. Run before calling any frontend screen done.
---

# Screen check

1. Make sure the frontend dev server is running (`npm run dev` in `frontend/`, port 5173) and, if the screen calls the API, the backend too. Start them in the background if they aren't.
2. Run `python tools/shoot.py` from the repo root (add `--routes ...` for extra screens). Screenshots land in `shots/`.
3. Open **every** screenshot with the Read tool and look at it. Don't judge from code.
4. Check each shot against docs/DESIGN.md:
   - **Palette:** only the eight tokens. Orange (Miles) only on miles and rewards; Stamp blue only on stamps; text on Miles is Ink; no gradients.
   - **One hero per screen:** name it. Is it obviously the most prominent thing? Everything else quieter, no extra containers.
   - **Surfaces:** two radii only (16px documents, pills); the one shadow only on documents; lists separated by Line dividers, not cards.
   - **Type:** sentence case; Mono only for flight data; max one Display size per screen; no letter-spaced capital labels; no single highlighted word in a headline.
   - **Layout:** 20px side padding, left-aligned, no more than ~30% blank, primary button pinned to the bottom, concept label "Concept screen, synthetic data" present.
   - **Banned patterns** (DESIGN.md list): cards everywhere, decoration unrelated to the moment, generic success template, emoji icons, light grey on tint, entrance animations everywhere.
   - Contrast, cut-off text, overflow at 393px.
5. Report a table: screen · hero · PASS/FAIL · each violation with the DESIGN.md rule it breaks.
6. If anything fails: fix it in `frontend/`, re-shoot, re-check. **At most two fix rounds.** If still failing after that, stop and report what's left.
