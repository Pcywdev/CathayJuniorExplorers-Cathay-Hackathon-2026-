# Progress

Read this at the start of every session. Tags: **P0** must work by Friday · **P1** only if P0 is solid. B = backend, F = frontend.

## Xplorers MVP (tonight, 14 Nov)
Scope v2 (plan.md). Frontend-only on mock data, about 4.5 hours, for the recorded video. Done when: the filmed path runs end to end and every new screen passes /screen-check.
- [x] Docs and data: plan.md Scope v2, CLAUDE.md, decisions, DESIGN.md tiers, `shared/program.json` `xplorers` section
- [ ] Earth: Xplorers mock data in `frontend/src/data/`, read from `program.json` `xplorers`
- [x] Teammate: 1 App home with a Cathay Xplorers entry card (awareness)
- [x] Teammate: 2 Xplorers intro: three tiers, "Join" (awareness → acquisition)
- [x] Teammate: 4 Sign-up: Leo (14), pre-filled form, "Guardian approved ✓", "Welcome to Teen Xplorers" tier card (acquisition + activation)
- [x] Teammate: 7 Little Xplorers: existing screens, renamed on screen (engagement)
- [ ] Earth: 8 Teen Xplorers rewards: balance, rewards list, one redemption ending in a voucher (engagement)
- [ ] Earth: 9 Campus Xplorers deals: verified badge, deals list, one deal detail (engagement)
- [x] Teammate: 10 Exit "You've graduated": carry-over, score count-up, package, all stamps, "Continue as a Cathay member" (retention)
- [ ] Earth: persona slider, Mei 7 → 15 → 20 → exit, moving between screens 7, 8, 9, 10
- [x] Picked for you grid on the child home (replaces My missions), age-weighted random draw from `xplorers.discover`; Member age timeline in the demo panel (`?age=`). Files: `src/xplorers/discover.ts`, `src/components/{DiscoverGrid,AgeTimeline}.tsx`
- **For Earth (teammate notes):** (1) `shared/program.json` `xplorers.discover` was added by the teammate side for the grid: please confirm or move it. (2) Exit carried miles use `mocks/graduation.ts` `juniorMiles` 48,000, which isn't in program.json and doesn't follow Mei's 24,000 at 20; the Family screen projects 29,280 at 22. Please add an exit balance to `personas.mei` so screens 9, 10 and Family agree. (3) Sign-up now uses Mei, not Leo (user decision); the tier card's welcome miles read `personas.leo.startingBalance` (200): please rename it to a generic new-member value. (4) The Family chart still treats miles as unusable until graduation (now 22); teen/campus redemptions don't show there yet.
- [ ] Both: /screen-check on every new screen; record the video

## Now / Next / Blocked
- **Now:** Xplorers MVP first tonight (section above). Then B: Day 3: score (PR #7) and child missions (PR #8) merged; story with fallback chapters + `/chapters` done on `feat/story` (English only, user decision); next LLM wrapper + safety checks. Open: delay bonus miles (not in program.json); simulated events show the real clock; story voice in chapters 3–4 delayed ("We").
- **Next:** B: Milestone D (LLM wrapper + safety, fake provider now, live on site). F: swap `mocks/story.ts` for `GET /api/trips/{id}/chapters` (pick version by `branch`, map `key`→art, `unlockOn`→wording); plus the earlier swaps (trip + stream, graduation score, mission complete).
- **On-site only (hackathon day):** Cloud Run deploy (runbook in `docs/deploy.md`), LLM credentials.
- **Blocked:** `gcloud`, GCP project and LLM credentials are provided on the hackathon day (OAG key is available now) · `shared/program.json` awaiting business-team sign-off · Setup ran Wed 11, a day behind the plan's Tue 10 start.

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
- [x] P0 F: static child screens (home, story, mission complete) · redesign on `feat/frontend-redesign`: Jade band with 3D route globe, tilting boarding pass with press-and-hold tear, story pages with lock states, 3D stamp press + miles counter

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
- [ ] P0 B: safety checks (JSON, length, banned words, moderation, readability) + pre-written fallback · fallback story done (`fixtures/stories/fallback.json`, English); safety checks in Milestone D
- [x] P0 B: `GET /chapters`; pre-generate and cache Mei's demo chapters · `/chapters` live, fixture-first story source; Mei's AI story fixture made on site
- [x] P0 B: `POST /api/graduation/score` with tests first · `app/logic/graduation.py`, 15 tests, adds `maxScore`
- [x] P0 B: child-completed missions (Window Watcher trigger) · `POST /api/trips/{id}/missions/{missionId}/complete`, 20 tests
- [x] P0 F: story screen with lock states (mock fallback chapters in `src/mocks/story.ts`; wire to `GET /chapters` later)
- [x] P0 F: mission complete animation (stamp + miles counter) · three.js stamp press, SVG stamp thump, counter lands exactly
- [x] P0 F: graduation screen (basic) (on a program.json-based mock until `POST /api/graduation/score` exists)
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
- 2026-11-12 · Frontend + Claude · Home + parent polish against DESIGN.md (impeccable skill): Pip (wave pose), boarding pass with Start mission, mission list states, passport page with inked stamps, parent timeline with done/pending rail, health card hidden behind ?health, mock trip in src/mocks/trip.ts · Next: story screen, mission complete; Red Hat fonts still missing from shared/fonts.
- 2026-11-12 · Frontend + Claude · Redesign (impeccable): PRODUCT.md added; Red Hat fonts self-hosted in shared/fonts; Jade sky band with drag-to-spin three.js route globe (SVG fallback), boarding pass with guilloche, barcode stub, drag tilt and press-and-hold tear; runway miles track; tappable passport stamps; new /story and /complete screens (Pip fly + stamp poses, 3D stamp press); parent timeline as departures board; pushState nav with 200ms slide; HKG → NRT corrected · Next: wire screens to the trips API + SSE, Simulate trip control, graduation screen.
- 2026-11-13 · Frontend + Claude · Child mode across the six events (impeccable): mock trip built from API-shaped events (`src/trip/`), stepped with `?at=welcome|checkin|delayed|boarded|departed|landed`; new /welcome (passport cover opens, Pip peek pose) and /graduation (score count-up, package, Pip proud pose); home reacts per event (Pip's speech line, extra-time pose, delayed time on the pass, bonus row, waiting state, Tokyo stamp, 'See me at 18'); story chapter map + delayed chapter text; /complete?m=<mission>; parent timeline, notification banner and globe from the same events; /demo shows both phones side by side and passes ?at through; screen-check passed after two fix rounds · Next: swap useTrip() for GET /api/trips/current + stream, Simulate trip control.
- 2026-11-13 · Backend owner + Claude · Day 3 re-planned after PR #6 (score → child missions → fallback story + /chapters → LLM + safety). POST /api/graduation/score live: pure logic tested first, top-band-only head start, `maxScore` added; 15 new tests (106 pass); real requests checked · Next: child-completed missions endpoint.
- 2026-11-13 · Backend owner + Claude · Child-completed missions: POST /api/trips/{id}/missions/{missionId}/complete (any available mission, whichever comes first pays, same cap, published on the stream); mission-opening rule moved into rules.mission_unlocked, shared cap helper; 20 new tests (126 pass); real run with two streams checked (201, repeat 200, locked 409) · Next: fallback story + `/chapters`.
- 2026-11-13 · Backend owner + Claude · Story without an LLM: fallback story (7 versions, English, 1 page each, {name}/{city}/{gate}), stories table, fixture-first story source, POST /trips stores it, GET /api/trips/{id}/chapters live (filled on read, landing unlockAt = arrival + delay); pure logic tested first; 19 new tests (145 pass); real run checked incl. old trips and UTF-8 quotes · Next: LLM wrapper + safety checks.
- 2026-11-14 · Backend owner + Claude · Scope v2 (Cathay Xplorers) docs and data only: plan.md Scope v2 section, CLAUDE.md summary + tonight's ownership exception, 8 decisions, DESIGN.md Tiers, program.json `xplorers` section (illustrative) · Next: Xplorers MVP screens on mock data.
