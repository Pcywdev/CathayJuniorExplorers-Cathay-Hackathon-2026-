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
- 2026-11-11 · Rules engine: a trip's cap starts at the member's miles already earned this year (Mei: 1,250); awards are trimmed to fit under the cap, and a mission still counts as done at 0 miles.
- 2026-11-11 · Events map to missions as checkin→Check-in Champion, boarded→Boarding Badge, landed→Arrival Explorer; Window Watcher is a child action, not a trip event.
- 2026-11-11 · Chapters: junior_mode_on→1, boarded→2, departed→3, landed→4. A delay switches the branch to delayed for the rest of the trip. Repeat events never award or unlock twice. Event order is not enforced.
- 2026-11-12 · This session is a pre-build: gcloud, GCP project and LLM credentials are provided only on the hackathon day, so deploy happens on-site and stories use fallback chapters until then.
- 2026-11-12 · OAG key is available now (corrects the line above): use the Flight Info API (`/flight-instances`, v2, `Content=Status`) to save real fixtures in the pre-build. Master Data only if the key covers it; Flight Info Alerts goes on the architecture slide as the production path, not built. Schedules and Connections not used.
- 2026-11-12 · OAG findings (2 requests used): CX 500 is HKG T1 15:25 → NRT T2 20:20 local, 235 min, A330-300. Gate, check-in counter and actual/estimated times with timeliness appear in `statusDetails` only once the flight operates; seat never appears, so seat stays synthetic and labelled. Arrival airport is NRT, not TYO. Fixtures: `CX500_2026-11-14.json` (demo flight, schedule only) and `CX500_2026-11-11.json` (operated, delayed 11 min out / 23 min in).
- 2026-11-12 · OAG fixtures are fetched with `tools/fetch_oag.py`, which never re-calls OAG for a fixture that exists (use `--force` to refresh, e.g. on demo day).
- 2026-11-12 · Flight lookup returns a child-friendly subset of OAG (cities, local time with its own UTC offset plus UTC, duration, distance, aircraft name, terminals, gate, seat, status delays). Dropped on purpose: ICAO codes, cargo, codeshares, tail number, OAG keys. Raw OAG is never exposed.
- 2026-11-12 · Gate and seat: real OAG gate when the flight operates, otherwise synthetic; seat always synthetic; `synthetic` lists which. Generator is deterministic (sha256). Demo flight CX 500 on 2026-11-14 is pinned to gate 23, seat 34K via `backend/fixtures/synthetic_overrides.json`.
- 2026-11-12 · OAG access is fixture-first and off by default: a fixture miss calls OAG only when `OAG_LIVE=true` and a key is set, and the response is saved as a fixture (so `source` is `fixture` or `oag`; no separate cache layer). OAG failures return 502, not 404. The Docker image now includes `backend/fixtures`.
- 2026-11-12 · Trips and events are stored in SQLite via SQLModel (`backend/data/little-explorers.db`, gitignored, path from `DATABASE_URL`); rows keep JSON text for flight, rule state and event payload. SSE subscribers live in an in-memory broker, so Cloud Run runs with `--max-instances=1`.
- 2026-11-12 · Added `GET /api/trips/current` (newest trip) so the child phone finds the trip without anyone typing an id; creating a new trip is how the demo resets.
- 2026-11-12 · Stream sends `id:` per event; `?after=<lastEventId>` and the browser's `Last-Event-ID` replay missed events, and each connection gets each event once. `lastEventId` and `language` added to the trip body.
- 2026-11-12 · Mission states: check-in available from the start, boarding after check-in, window and arrival after departed. Window Watcher has no trigger yet; the delayed bonus mini-mission awards no miles yet. Notification text is English only for now; event times are in the origin airport's offset (destination for `landed`).
- 2026-11-12 · Event and trip routes that publish are `async def`, so broker publishing runs on the event loop and two POSTs can't interleave a trip's read-modify-write.
