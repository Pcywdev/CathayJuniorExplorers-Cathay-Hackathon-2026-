# Cathay Xplorers

A hackathon concept for a youth membership mode in a travel app. Young people explore what an airline offers before adulthood, across three tiers: **Little Xplorers** (under 12), **Teen Xplorers** (12–17) and **Campus Xplorers** (18 to graduation or 25). At the end they "graduate" into full adult membership and keep their miles, years, trips and stamps.

Little Xplorers is the deep part. Two synced phone screens (child and parent) react to one real flight, missions pay miles inside a yearly cap, and an AI story unlocks chapter by chapter as the trip happens.

Built by Team 2B3E for the Cathay Hackathon 2026 final.

> Concept prototype. All data is synthetic except flight data from OAG. Not affiliated with or integrated into any airline system. No official logos.

## What's real and what's mocked

| Part | Status |
|---|---|
| Flight data (CX 500 HKG → NRT) | Real OAG responses, cached as fixtures, so it runs offline |
| Rules engine: missions, annual cap, chapter unlock, delay branch, graduation score | Real backend, pure functions, tested first |
| Two-phone sync: one event to both phones over Server-Sent Events, replay after reconnect | Real backend; shown end to end by `tools/demo_trip.py` |
| Story pipeline: four-field prompt, AI call, JSON + content + reading-level checks, moderation, pre-written fallback | Real backend |
| Phone screens in the demo video | React app driven by scripted events that mirror the API's event shape |
| Teen and Campus offers, sign-up checks, exit screen | Frontend catalogue screens on illustrative numbers in `shared/program.json` |

Every displayed number comes from [`shared/program.json`](shared/program.json). How each demo piece maps to production is in [docs/architecture.md](docs/architecture.md), under "Production path".

## Run locally

**Backend** (Python 3.11 via conda, from `backend/`):
```
conda env create -f environment.yml     # first time only
conda activate Cathay-Hack
copy .env.example .env                  # keys stay in .env, which is gitignored
python -m uvicorn app.main:app --reload --port 8000
python -m pytest                        # 204 tests
```
Check: http://127.0.0.1:8000/api/health. API reference: http://127.0.0.1:8000/docs and [docs/api.md](docs/api.md).

**See the backend sync** (second terminal, repo root, same env): `python tools/demo_trip.py`. It creates Mei's trip and fires the six trip events. Two SSE streams, standing in for the child and parent phones, print what each receives, including the cap check, a repeated event that awards nothing, and a reconnect.

**Frontend** (Node LTS, from `frontend/`):
```
npm install
npm run dev
```
Open http://localhost:5173/demo for the scripted demo (arrow keys move through the beats), or `/child` and `/parent` on their own.

## Story AI (optional)

With no AI configured, every trip gets the pre-written story. To use an AI, set these in `backend/.env`:

| Variable | Value |
|---|---|
| `LLM_PROVIDER` | `openai` (the openai SDK), `fake` (canned, for dev), or empty (no AI) |
| `LLM_API_KEY` | your key |
| `LLM_MODEL` | the model id (required, never guessed) |
| `LLM_BASE_URL` | empty for OpenAI; an OpenAI-compatible endpoint for other providers (e.g. Gemini) |
| `LLM_LIVE` | `false` on stage (only reviewed story fixtures are used); `true` makes one AI call per new trip |

Generate and review the demo story once with `python tools/generate_story.py`. Run it again with `--save` to keep it as `backend/fixtures/stories/CX500_2026-11-14_6-8.json`. Rejected replies and their reasons go to `docs/story-rejections.md`.

The AI sees only destination, flight length, aircraft model and age band. The child's name is never sent. The model writes `{name}`, and the backend fills it in when a phone asks.

## Docker (from the repo root)
```
docker build -f backend/Dockerfile -t little-explorers-api .
docker run --rm -p 8080:8080 --env-file backend/.env little-explorers-api
```

## Repo
- `backend/`: FastAPI, SQLite (SQLModel), the OAG and LLM services, rules in `app/logic/`
- `frontend/`: Vite, React, TypeScript, Tailwind, Framer Motion, three.js
- `shared/`: `program.json` (every number) and the Red Hat fonts
- `tools/`: `demo_trip.py`, `generate_story.py`, `shoot.py` (screenshots)

## Docs
- [docs/plan.md](docs/plan.md): scope and plan (read "Scope v2" first)
- [docs/architecture.md](docs/architecture.md): system diagram and production path
- [docs/architecture-slide.md](docs/architecture-slide.md): content and layout of the architecture slide
- [docs/api.md](docs/api.md): API contract
- [docs/DESIGN.md](docs/DESIGN.md): design system
- [docs/demo-script.md](docs/demo-script.md): demo video script
- [docs/progress.md](docs/progress.md), [docs/decisions.md](docs/decisions.md): progress and decision log
- [docs/deploy.md](docs/deploy.md): Cloud Run runbook (not used for the submission)
