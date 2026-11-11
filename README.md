# Little Explorers

A hackathon concept for a junior mode in a family travel app: two synced phone screens (child and parent) react to one real flight, and an AI story unlocks chapter by chapter as the trip happens. Built by Team 2B3E for the Cathay Hackathon 2026 final.

> Concept prototype. All data is synthetic except flight data from OAG. Not affiliated with or integrated into any airline system.

## Run locally

**Backend** (Python 3.11 via conda, from `backend/`):
```
conda env create -f environment.yml     # first time only
conda activate Cathay-Hack
copy .env.example .env                  # fill in keys
python -m uvicorn app.main:app --reload --port 8000
python -m pytest
```
Check: http://localhost:8000/api/health

**Frontend** (Node LTS, from `frontend/`):
```
npm install
copy .env.example .env
npm run dev
```
Open http://localhost:5173/child and http://localhost:5173/parent

**Docker** (from the repo root):
```
docker build -f backend/Dockerfile -t little-explorers-api .
docker run --rm -p 8080:8080 little-explorers-api
```

**Screenshots:** in the `Cathay-Hack` env, `python -m playwright install chromium` once, then `python tools/shoot.py` → `shots/`.

## Docs
- [docs/plan.md](docs/plan.md): scope and plan (source of truth)
- [docs/api.md](docs/api.md): API contract
- [docs/architecture.md](docs/architecture.md): system diagram
- [docs/DESIGN.md](docs/DESIGN.md): design system
- [docs/progress.md](docs/progress.md): what's done, next, blocked
- [docs/decisions.md](docs/decisions.md): decision log
- [docs/deploy.md](docs/deploy.md): Cloud Run deploy runbook (on-site)
- [shared/program.json](shared/program.json): every displayed number
