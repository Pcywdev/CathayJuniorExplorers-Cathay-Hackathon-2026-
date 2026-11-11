# Decisions

One line per decision, newest last. Don't re-argue these without a new reason.

- 2026-11-11 · Stack: FastAPI + SQLModel/SQLite + SSE backend on Cloud Run (Docker); Vite + React + TS + Tailwind + Framer Motion frontend; Playwright for screenshots.
- 2026-11-11 · Two screens (child and parent); the Cathay view moved to an architecture slide.
- 2026-11-11 · API uses camelCase JSON on the wire, matching the event shape in plan.md section 9.
- 2026-11-11 · Docker image is built from the repo root (`-f backend/Dockerfile .`) so it can include `shared/program.json`.
- 2026-11-11 · Frontend reads `shared/program.json` directly via a Vite alias (`@shared`), not through the API.
- 2026-11-11 · Fonts: Red Hat files not yet in `shared/fonts/`; system fallback until they're added.
- 2026-11-11 · Tailwind v4: theme tokens live in the `@theme` block of `frontend/src/index.css` (default colours, radii, shadows cleared), not tailwind.config.js.
- 2026-11-11 · No router dependency: two routes handled by a pathname switch in `App.tsx`; revisit if screens multiply.
- 2026-11-11 · Local Python env is the `Cathay-Hack` conda env from `backend/environment.yml` (Python 3.11 + requirements.txt + Playwright); Docker uses python:3.11-slim with requirements.txt only. Dependencies pinned in requirements.txt.
