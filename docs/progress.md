# Progress

Read this at the start of every session. Tags: **P0** must work by Friday · **P1** only if P0 is solid. B = backend, F = frontend.

## Now / Next / Blocked
- **Now:** B: trips, events and SSE stream done on `feat/trips-events` (91 tests pass; two curl streams got the same events live). Open questions: miles for the delay bonus mini-mission (not in program.json); what triggers Window Watcher; whether simulated events should show scheduled flight times rather than the real clock.
- **Next:** B: story generation + safety + fallback (Day 3), `GET /chapters`, graduation score. F: child screens and parent screen on the live API: `GET /api/trips/current` → `EventSource(/api/trips/{id}/stream?after=lastEventId)`, Simulate control posts to `/events` (all in docs/api.md).
- **On-site only (hackathon day):** Cloud Run deploy (runbook in `docs/deploy.md`), LLM credentials.
- **Blocked:** `gcloud`, GCP project and LLM credentials are provided on the hackathon day (OAG key is available now) · Red Hat font files not in `shared/fonts/` yet · `shared/program.json` awaiting business-team sign-off · Setup ran Wed 11, a day behind the plan's Tue 10 start.

## Day 1 · Tue 10 (setup)
Done when: both run locally; backend deployed; one real OAG response saved.
- [x] P0 Repo structure, CLAUDE.md files, shared docs
- [x] P0 `shared/program.json` from plan.md section 6
- [x] P0 B: backend skeleton (`/api/health`, settings, CORS, program loader + test, Dockerfile)
- [x] P0 F: frontend skeleton (Vite + React + TS + Tailwind + Framer Motion, `/child` + `/parent`)
- [x] P0 F: Tailwind theme from DESIGN.md tokens
- [x] P0 Playwright `tools/shoot.py` + `/screen-check` skill
- [x] P0 Docker image builds locally
- [ ] P0 B: deploy hello world to Cloud Run (on-site: gcloud provided on the day; runbook in docs/deploy.md)
- [x] P0 B: OAG queries for the demo flight; save fixtures; check which fields are missing (gate, seat) · `backend/fixtures/oag/`, gate present once operating, seat absent
- [ ] P0 F: static child screens (home, story, mission complete)

## Day 2 · Wed 11
Done when: simulating "boarded" updates both phones.
- [x] P0 B: flight lookup + fixture-first cache (OAG boarding pass) · `GET /api/flights/lookup`, 33 tests
- [x] P0 B: rules engine with tests first (missions, annual cap, chapter unlock, branch) · `app/logic/rules.py`, 16 tests
- [x] P0 B: `POST /api/trips`, `GET /api/trips/{id}`, `POST /events` for all six events · plus `GET /api/trips/current`, SQLite storage
- [x] P0 B: SSE stream (polling fallback documented) · `id:` per event, replay via `?after` / `Last-Event-ID`
- [ ] P0 F: child screens on the API (boarding pass from OAG data)
- [ ] P0 F: parent screen: notifications, trip timeline, miles line, junior mode switch, data used
- [ ] P0 F: Simulate trip control (events labelled simulated)

## Day 3 · Thu 12
Done when: full trip flow end to end.
- [ ] P0 B: story generation via one LLM wrapper, EN + 繁中, on-time and delayed branches
- [ ] P0 B: safety checks (JSON, length, banned words, moderation, readability) + pre-written fallback
- [ ] P0 B: `GET /chapters`; pre-generate and cache Mei's demo chapters
- [ ] P0 B: `POST /api/graduation/score` with tests first
- [ ] P0 F: story screen with lock states
- [ ] P0 F: mission complete animation (stamp + miles counter)
- [ ] P0 F: graduation screen (basic)
- [ ] P0 F: PWA offline chapters (service worker, unlock at scheduled landing)

## Day 4 · Fri 13 (feature freeze)
Done when: demo runs with Wi-Fi off.
- [ ] P0 B: deploy everything (backend Cloud Run, frontend Cloud Run or Vercel)
- [ ] P0 B: offline fixtures mode
- [ ] P0 B: README + architecture.md; architecture slide
- [ ] P0 F: two-phone demo setup, mirrored
- [ ] P1 F: delay branch shown live
- [ ] P1 F: graduation screen polish
- [ ] P1 F: read-aloud (browser speech, tested on demo devices)

## Sat 14 – Sun 15 (on site)
- [ ] P0 B: fixes, backup demo video
- [ ] P0 F: polish, screenshots for slides and poster
- [ ] P0 Submit: prototype + repo link, slides (PDF), one-page poster

## Session log
<!-- One line per session: date · who · what got done · what's next -->
- 2026-11-11 · Backend owner + Claude · Setup: repo structure, CLAUDE.md files, docs (api, architecture, progress, decisions), program.json, FastAPI skeleton (/api/health, settings, CORS, program loader, 2 tests passing), Vite/React/Tailwind v4 skeleton (/child, /parent showing health), shoot.py + /screen-check, Docker image builds and serves on $PORT · Next: Cloud Run hello world, OAG fixtures.
- 2026-11-11 · Backend owner · Setup pushed to origin/main (630c4ce); local Python moved to the `Cathay-Hack` conda env; teammate can pull and start · Next: rules engine while deploy/OAG wait on gcloud + keys.
- 2026-11-12 · Backend owner · Deploy and OAG moved to on-site (gcloud/keys provided on the day); wrote docs/deploy.md runbook · Next: trips + events endpoints locally.
- 2026-11-12 · Backend owner · OAG works now: 2 fixtures saved (CX 500 on 14 Nov schedule, 11 Nov operated + delayed); gate available from status, seat not; docs corrected (OAG no longer on-site only) · Next: flight lookup service + endpoint from fixtures.
- 2026-11-12 · Backend owner + Claude · Flight lookup: GET /api/flights/lookup (fixture-first, synthetic gate/seat, live mode off by default), 33 new tests (51 total pass), api.md updated, Dockerfile ships fixtures · Next: trips + events endpoints.
- 2026-11-12 · Backend owner + Claude · Trips + events + SSE: POST /api/trips, GET /api/trips/current, GET /api/trips/{id}, POST /events, GET /stream (SQLite via SQLModel, in-memory broker, replay by event id), pure trip_view logic tested first; 40 new tests (91 pass); real run with two streams + restart persistence checked; api.md, deploy.md (max-instances=1) updated · Next: story generation (Day 3).
