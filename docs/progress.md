# Progress

Read this at the start of every session. Tags: **P0** must work by Friday · **P1** only if P0 is solid. B = backend, F = frontend.

## Now / Next / Blocked
- **Now:** B: rules engine done on `feat/rules-engine` (logic only, not yet behind an endpoint). Open questions: miles for the delay bonus mini-mission (not in program.json); what triggers Window Watcher.
- **Next:** B: trips + events endpoints using the rules engine, then SSE (all runnable locally, no credentials). Pre-build uses a placeholder flight fixture until OAG access arrives. F: pull repo, static child screens (home, story, mission complete) on mock data.
- **On-site only (hackathon day):** Cloud Run deploy (runbook in `docs/deploy.md`), OAG key and real CX 500 fixture, LLM credentials.
- **Blocked:** `gcloud`, GCP project, OAG key and LLM credentials are all provided on the hackathon day, so none exist in the pre-build · Red Hat font files not in `shared/fonts/` yet · `shared/program.json` awaiting business-team sign-off · Setup ran Wed 11, a day behind the plan's Tue 10 start.

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
- [ ] P0 B: OAG queries for the demo flight; save fixtures; check which fields are missing (gate, seat) (on-site: key provided on the day)
- [ ] P0 F: static child screens (home, story, mission complete)

## Day 2 · Wed 11
Done when: simulating "boarded" updates both phones.
- [ ] P0 B: flight lookup + cache + fixture fallback (OAG boarding pass)
- [x] P0 B: rules engine with tests first (missions, annual cap, chapter unlock, branch) · `app/logic/rules.py`, 16 tests
- [ ] P0 B: `POST /api/trips`, `GET /api/trips/{id}`, `POST /events` for all six events
- [ ] P0 B: SSE stream (polling fallback documented)
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
