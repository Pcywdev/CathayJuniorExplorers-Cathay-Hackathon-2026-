# Backend (FastAPI)

- Routers by feature in `app/routers/` (flights, trips, events, graduation); `main.py` only wires them up.
- Pydantic models for every request and response, in `app/models/`. Match docs/api.md exactly (camelCase on the wire).
- Business rules (missions, cap, chapter unlock, branch, score) are pure functions in `app/logic/`: no I/O, tested first.
- OAG and LLM calls only in `app/services/`, behind one wrapper each, cached, with fixtures for offline.
- Settings only via `app/config.py` (pydantic-settings reads env / `.env`). Program numbers only via `app/program.py`.

## Run (from `backend/`, in the `Cathay-Hack` conda env)
- Setup once: `conda env create -f environment.yml`; after changing requirements.txt: `conda env update -f environment.yml`
- `conda activate Cathay-Hack`
- Dev server: `python -m uvicorn app.main:app --reload --port 8000`
- Tests: `python -m pytest`
- Docker (from repo root, because it copies `shared/`): `docker build -f backend/Dockerfile -t little-explorers-api .`
  then `docker run --rm -p 8080:8080 --env-file backend/.env little-explorers-api`
