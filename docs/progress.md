# Progress

Read this at the start of every session. Scope is in `docs/plan.md` (Cathay Xplorers, as submitted 15 Nov). B = backend, F = frontend.

## Xplorers MVP (tonight, 14 Nov)
Cathay Xplorers screens (plan.md section 3). Frontend-only on mock data, about 4.5 hours, for the recorded video. Done when: the filmed path runs end to end and every new screen passes /screen-check.
- [x] Docs and data: plan.md (Cathay Xplorers), CLAUDE.md, decisions, DESIGN.md tiers, `shared/program.json` `xplorers` section
- [~] Dropped: Earth: Xplorers mock data in `frontend/src/data/` · the teammate's `src/xplorers/` (discover, tiers, memberAge) covers it
- [x] Teammate: 1 App home with a Cathay Xplorers entry card (awareness)
- [x] Teammate: 2 Xplorers intro: three tiers, "Join" (awareness → acquisition)
- [x] Teammate: 4 Sign-up: pre-filled form, guardian approval / university email shown as passed, "Welcome to <tier>" tier card (acquisition + activation) · persona is **Mei (15), not Leo** (teammate decision)
- [x] Teammate: 7 Little Xplorers: existing screens, renamed on screen (engagement)
- [~] Dropped: Earth: 8 Teen Xplorers rewards · covered by Home at 12+ (Picked for you discounts, plain ticket, MemoryPassport)
- [~] Dropped: Earth: 9 Campus Xplorers deals · covered by Home at 18+ (Picked for you student deals)
- [x] Teammate: 10 Exit "You've graduated": carry-over, score count-up, package, all stamps, "Continue as a Cathay member" (retention)
- [~] Dropped: Earth: persona slider · covered by the Member age timeline in `/demo`
- [x] Picked for you grid on the child home (replaces My missions), age-weighted random draw from `xplorers.discover`; Member age timeline in the demo panel (`?age=`). Files: `src/xplorers/discover.ts`, `src/components/{DiscoverGrid,AgeTimeline}.tsx`
- **For Earth (teammate notes), with answers:**
  1. `xplorers.discover` in program.json: **confirmed**; since 15 Nov it is only the dual-encoder generator's seed, and the grid reads `frontend/src/xplorers/data/mapping.json`.
  2. Exit balance: **added** `personas.mei.exitBalance` 29,280 (matches the Family projection at 22). ExitScreen still reads `mocks/graduation.ts` 48,000; switching it is the teammate's change (see Submission readiness item 3).
  3. Renaming `personas.leo.startingBalance` to a generic new-member value: **agreed, not done yet**, because it breaks `SignUpScreen`. Do it together with the teammate's one-line change.
  4. Family chart vs teen/campus redemptions: teammate's call.
- [x] Toy dual-encoder promotion mapping (`python -m tools.xplorers_mapping`) + "Mei is…" trait tick boxes in the demo panel
- [ ] Both: /screen-check on every new screen; record the video

## Submission readiness (Sat 14 – Sun 15)
Principle: real where it's hard (trip, rules engine, sync, story pipeline), mocked where it's catalogue (Xplorers rewards and deals), and explained otherwise (`docs/architecture.md` "Production path"). Done when: the tech beat runs on `/demo?live` through the real backend, the demo runs with Wi-Fi off, and the video is recorded.
**15 Nov: cut to minimum scope** (backup video recorded, no GCP): items 1, 3 and 4 dropped, see decisions.md.
1. [~] Dropped for submission: **Live trip mode** (B+F, branch `feat/live-trip`, plan in `docs/live-trip.md`). Mocks stay the default; `?live` switches both phones to the backend.
   - [ ] Teammate OK (the checklist at the bottom of `docs/live-trip.md`)
   - [ ] B: demo clock (`DEMO_CLOCK=true`): simulated events get scripted times (11:30, 13:10, 14:20, 15:25, 16:07, 20:57) instead of the wall clock · pure `demo_time` tested first, api.md note
   - [ ] F: `src/api/trips.ts` (create, current, get, events, mission complete, stream) + `postJson`; `Trip` type
   - [ ] F: `src/trip/liveTrip.ts` store (poll current, SSE, refetch trip on each event) behind `useTrip()`; screens unchanged
   - [ ] F: `/demo?live`: Trip moment POSTs events forward, a new trip + replay going back, Reset creates a trip
   - [ ] F: mission complete POSTs the stamp press in live mode; trip frozen at mount
2. [x] B: LLM wrapper + safety (`services/llm.py`, `services/stories.generate`, `tools/generate_story.py`); rejection example in `docs/story-rejection-example.md` · [ ] on site: run `generate_story.py --save` with the real key and review the story
3. [~] Dropped for submission: B+F: Exit score from `POST /api/graduation/score` and `exitBalance` (ExitScreen is the teammate's)
4. [~] Dropped for submission (no GCP): B: Cloud Run deploy (`docs/deploy.md`), `ALLOWED_ORIGINS` for the deployed frontend, demo runs with Wi-Fi off, backup video
5. [x] B: architecture slide spec (`docs/architecture-slide.md`, built in Canva by the team) + README + architecture.md updated to the finished prototype
6. [ ] Both: rehearse the judge Q&A (`docs/architecture.md` "Production path") · [x] backup video recorded
7. [x] Docs aligned with Cathay Xplorers (plan.md rewritten; README, architecture, slide visual, briefing and design docs); dual encoder documented; slide screenshots in `docs/screenshots/`
8. [ ] Submit: prototype + repo link (judges can open it), slides (PDF), one-page poster

## Now / Next / Blocked
- **Now:** Slides in Canva (architecture visual + `docs/screenshots/`), poster, submit (item 8).
- **Next (optional):** a reviewed AI story fixture (`tools/generate_story.py --save`; the first real runs were rejected for malformed chapters, see `docs/story-rejections.md`); Q&A rehearsal.
- **Open questions:** delay bonus miles (not in program.json); story voice in chapters 3–4 delayed ("We"); the parent screen still labels its switch "Junior mode" (fine: it's the Little Xplorers switch for a booking).
- **Parked after submission:** live trip mode (`docs/live-trip.md`), Cloud Run deploy (`docs/deploy.md`), the exit screen calling the score endpoint, PWA offline storage, Traditional Chinese stories.
- **Blocked:** `shared/program.json` numbers still illustrative, awaiting business-team sign-off.

## Earlier build checklist (Tue 10 – Sun 15, junior-mode plan)
Kept as a record. Unticked items here are superseded by the scope above and the "Parked" list, not open work.

### Day 1 · Tue 10 (setup)
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

### Day 2 · Wed 11
Done when: simulating "boarded" updates both phones.
- [x] P0 B: flight lookup + fixture-first cache (OAG boarding pass) · `GET /api/flights/lookup`, 33 tests
- [x] P0 B: rules engine with tests first (missions, annual cap, chapter unlock, branch) · `app/logic/rules.py`, 16 tests
- [x] P0 B: `POST /api/trips`, `GET /api/trips/{id}`, `POST /events` for all six events · plus `GET /api/trips/current`, SQLite storage
- [x] P0 B: SSE stream (polling fallback documented) · `id:` per event, replay via `?after` / `Last-Event-ID`
- [ ] P0 F: child screens on the API (boarding pass from OAG data)
- [ ] P0 F: parent screen: notifications, trip timeline, miles line, junior mode switch, data used
- [ ] P0 F: Simulate trip control (events labelled simulated)

### Day 3 · Thu 12
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

### Day 4 · Fri 13 (feature freeze)
Done when: demo runs with Wi-Fi off.
- [ ] P0 B: deploy everything (backend Cloud Run, frontend Cloud Run or Vercel)
- [ ] P0 B: offline fixtures mode
- [ ] P0 B: README + architecture.md; architecture slide
- [ ] P0 F: two-phone demo setup, mirrored
- [ ] P1 F: delay branch shown live
- [ ] P1 F: graduation screen polish
- [ ] P1 F: read-aloud (browser speech, tested on demo devices)

### Sat 14 – Sun 15 (on site)
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
- 2026-11-14 · Backend owner + Claude · After the teammate's PR #11: screens 8, 9 and the persona slider dropped; teammate notes answered (`exitBalance` 29,280 added); "Submission readiness" checklist; architecture.md "Production path" (demo → production table for judges); live trip mode planned in `docs/live-trip.md` (opt-in `?live`, demo clock) · Next: agree live mode with the teammate, then the backend demo clock.
- 2026-11-15 · Earth + Claude · Exit miles read from program.json (29,280, was hardcoded 48,000); `/demo` rewritten as a scripted run (27 scenes, phase jumps, arrow keys, one phone when the parent isn't needed); sign-up at 7 leads to Mei's welcome · Next: record the demo video.
- 2026-11-15 · Earth + Claude · Minimum scope for submission: live mode, exit score and deploy dropped. LLM wrapper (`services/llm.py`, openai SDK, fake provider, moderation) and story generation with safety checks and fallback (`services/stories.generate`); 23 new tests (204 pass); `tools/generate_story.py`; rejection example; README, architecture.md (final diagram, honest real/scripted line) and `docs/architecture-slide.md` · Next: slide in Canva, real story fixture, Q&A rehearsal.
- 2026-11-15 · Earth + Claude · Docs aligned with Cathay Xplorers: plan.md rewritten around tiers, journey, Little Xplorers trip, exit and the dual encoder; README, CLAUDE.md, architecture.md, api.md intro, context-brief, backend-walkthrough, demo-script, DESIGN.md intro, PRODUCT.md and frontend/CLAUDE.md updated; architecture visual's Teen/Campus line now names the dual encoder; slide screenshots in `docs/screenshots/` (intro, Little 7, Teen 15, Campus 20) · Next: slides, poster, submit.
