# Little Explorers

Concept demo of a junior mode for a family travel app: two synced phone screens (child and parent) react to one real flight, with an AI story that unlocks chapter by chapter. Built for the Cathay Hackathon final, 14–15 Nov 2026; full scope in docs/plan.md (plan.md wins on any conflict).

## Ownership
- Backend owner: `backend/`, `shared/`, deployment. Frontend owner: `frontend/`. `docs/` is shared.
- Stay inside your area; propose changes to the other side via docs/api.md.

## Rules we don't break
- Synthetic data only, except OAG flight data. Never imply real Cathay integration. No official logos.
- No pooling of miles.
- Children's data: age band, destination, flight length, trip events only. Never photos, location or health data.
- Only the backend calls OAG. Cache every response; demo flights live as fixtures so the app works offline. Quota: 1,000 requests / 30 days.
- API keys come from environment variables (`.env`, gitignored). Never hard-code, commit or screenshot them.
- Every displayed number comes from `shared/program.json`.
- No new dependencies beyond the agreed stack without asking.

## Workflow
- Start of session: read docs/progress.md and pick the next task.
- Plan mode for new features; skip it for small fixes.
- One feature per branch (`feat/<name>`); merge to main only when it runs.
- Keep the API matching docs/api.md. If an endpoint must change, update api.md in the same commit and say so clearly.
- Pure business logic gets pytest tests written before the code.
- Before calling anything done: backend runs tests and a real request; frontend runs /screen-check.
- End of session: tick off docs/progress.md, add one session-log line, log decisions in docs/decisions.md, commit.

## Design
@docs/DESIGN.md
