# Story rejection example (for the architecture slide)

**This is a test input, not a model reply.** It's the pre-written story with chapter 3 (delayed) swapped for a page that breaks the rules. It was run through the real checks in `backend/app/logic/story_safety.py` (`parse_story`, then `check_story` for age band 6-8). The reasons below are the checks' exact output. Real rejections from the model, if any, are logged by `tools/generate_story.py` in `docs/story-rejections.md`.

Page tested:
> The storm outside looked scary, but Pip said the pilots would keep everyone safe from danger while the plane waited a very long time on the ground.

Reasons returned:
- banned word 'scary' in chapter 3 delayed
- banned word 'danger' in chapter 3 delayed
- sentence too long for 6-8 in chapter 3 delayed (27 words, max 14)

A cut-off reply (`{"title": {"en": "Pip"}, "chapters": [`) returns:
- not JSON (Expecting value)

Either way, the trip gets the pre-written fallback story. The child never sees the rejected text.

**On the slide:** put "Rejected: 'scary', 'danger', sentence of 27 words (max 14) → fallback story" in the story strip, labelled *safety check, test case*.
