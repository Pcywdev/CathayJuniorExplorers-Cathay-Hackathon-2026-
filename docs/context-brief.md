# Context brief: "Little Explorers" (Cathay Hackathon 2026 final)

I'm working on a hackathon project and want you to understand it fully before we go on. Below: what the product is, what the demo looks like, how it's built, and what's done so far. Today is Sat 14 Nov 2026, the first on-site day of the final (14–15 Nov, Cathay City). We submit on site: a working prototype plus repo link, slides (PDF) and a one-page poster.

---

## 1. What we're building, in plain language

**Little Explorers** is a concept "junior mode" for a family travel app (in the spirit of an airline app like Cathay's, but we **never imply a real Cathay integration and use no official logos**). It turns a child's real flight into an adventure the child earns from.

When a parent turns on junior mode for a booking, the child (our demo kid is **Mei**, age band 6–8) gets her own phone screen with:
- a **boarding pass** filled in from real flight data,
- **missions** that pay miles (Check-in Champion, Boarding Badge, Window Watcher, Arrival Explorer),
- **passport stamps** she collects,
- an **AI-written story** starring **Pip** (a small friendly bird mascot) that unlocks **chapter by chapter as the real trip happens**,
- a **graduation screen**: "Mei at 18" sees a score and a package that carries her childhood miles into an adult membership.

The parent has their own phone screen showing the notifications that matter (boarded, departed, delayed, landed), a calm trip timeline with miles earned, the junior mode switch, and a "data used" panel. We collect only four things about the child: **age band, destination, flight length, trip events**. Never photos, location, GPS or health data.

The business pitch: the reward is tied to the child's **actual** trip, not a generic game. Miles stay in the child's own name (**no pooling of miles** into the parent's account; that's a hard rule), and they pay off at 18 through a published graduation formula. That builds a lifelong member.

**The demo in one line:** Mei's real flight loads → her story begins → check-in, a delay, boarding, take-off and landing fire across both phones at once → she "graduates" at 18 with everything she earned.

---

## 2. What the demo looks like on stage

The pitch is 3 minutes of business, then 2 minutes of tech. The tech part is this live demo, with **two real phones side by side, both mirrored onto the big screen**.

| Time | What judges see |
|---|---|
| 0:00–0:20 | Architecture slide: one event travelling through the system (gate scan → rules engine → AI story with safety checks → two phones). Tagline: "Rules now, AI later." |
| 0:20–0:50 | Parent turns on junior mode. Mei's real flight (CX 500, Hong Kong HKG → Tokyo NRT) loads. Chapter 1 of her story appears. |
| 0:50–1:30 | A "Simulate trip" control fires the trip events. Both phones react together. On the delay, the story switches to its "delayed" branch. |
| 1:30–1:50 | Mei at 18: the graduation screen. |
| 1:50–2:00 | "Four data fields, every rule visible, built on existing airline systems." |

**The six trip events** (a real flight won't move during a 2-minute pitch, so a Simulate control fires them in order, and simulated events are labelled as such):

| Event | Child phone | Parent phone |
|---|---|---|
| Junior mode on | Welcome: a passport cover opens, Pip peeks out, chapter 1 ready | Confirmation + data used |
| Checked in | Check-in Champion +30 miles | "Mei is checked in for CX 500" |
| Delayed (40 min) | Pip: "We have extra time!", bonus mini-mission, delayed story version | "Delayed 40 min" |
| Boarded | Boarding Badge stamp +50, chapter 2 unlocks | "Mei has boarded CX 500" |
| Departed | In-flight chapter, available offline | "Departed …, landing about …" |
| Landed | Arrival Explorer +40, Tokyo stamp, final chapter | "Mei has landed in Tokyo" |

Demo order is welcome → check-in → delayed → boarded → departed → landed (the delay comes before boarding because a gate-side delay is the realistic case).

**Visual style (from our DESIGN.md):** clean, modern, friendly travel documents. It should feel like a child's own boarding pass and passport: crisp paper surfaces on a light sky background, flight details set like a real ticket, stamps that look inked. Fixed palette: Sky `#EAF1F3` background, Paper `#FBFCFA` documents, Jade `#0E5E4E` structure and buttons, Ink `#1D2B33` text, Miles orange `#F2A033` **only** for miles and rewards, Stamp blue `#2E4C9E` **only** for stamps. Fonts: Red Hat Display, Text and Mono (Mono only for flight data like HKG, gate 23, seat 34K). 393px phone viewport, one hero per screen, one shadow style, no gradients, no emoji as icons, sentence case. Every screen carries a small label: "Concept screen, synthetic data".

Child screens built:
- **Home:** a Jade sky band with a drag-to-spin 3D route globe (three.js, static SVG fallback), Pip waving, a boarding pass as the hero (HKG ✈ NRT, gate 23, seat 34K, guilloche pattern, barcode stub with the reward, tilts when dragged, press-and-hold to tear), a "runway" miles track (e.g. 1,250 of 2,000 miles this year), the mission list, and a passport page with staggered, rotated, inked stamps plus "Next stop: Tokyo".
- **Story:** an illustration taking about 55% of the screen, Pip flying, one or two sentences per page, a chapter map with locked chapters visibly waiting.
- **Mission complete:** a 3D stamp press (the stamp thumps down), then a miles counter that lands exactly on the final value.
- **Welcome** (passport cover opens) and **Graduation** (score count-up, package, Pip's proud pose).

Parent screens: **/parent** (timeline styled like a departures board, notification banner) and **/family** (a "family miles" argument: money the family can use by age 7–30 if Mei keeps her miles versus moving them to the parent, with cited research figures). **/demo** shows both phones side by side with a control panel to pick the screen and the trip moment.

---

## 3. Team and ownership

- Two builders. **Backend owner (me, "Earth")**: `backend/`, `shared/`, deployment, architecture slide. **Frontend teammate**: `frontend/`. `docs/` is shared. Each side proposes changes to the other via `docs/api.md`.
- Working with Claude Code. One feature per branch (`feat/<name>`), merged to `main` via PR only when it runs. Pure business logic gets pytest tests written **before** the code.
- Key docs: `docs/plan.md` (full scope, wins on any conflict), `docs/api.md` (the contract, most important file), `docs/progress.md`, `docs/decisions.md` (one line per decision), `docs/DESIGN.md`, `docs/architecture.md`, `docs/deploy.md` (Cloud Run runbook), `docs/backend-walkthrough.md` (plain-language guide to the system).

## 4. Hard rules

- Synthetic data only, except real OAG flight data. Never imply real Cathay integration. No official logos ("Cathay style" means mood only).
- No pooling of miles.
- Child data limited to the four fields above.
- **Only the backend calls OAG.** OAG quota is 1,000 requests / 30 days (shared), so everything is fixture-first and cached, and the demo works fully offline.
- API keys only in `.env` (gitignored). Never in code, commits or screenshots.
- **Every displayed number comes from `shared/program.json`.**
- No new dependencies beyond the agreed stack without asking.

---

## 5. Technical details

### Stack
- **Backend:** Python 3.11, FastAPI, Uvicorn, httpx, SQLModel (SQLite), pydantic-settings, pytest. Live updates via **Server-Sent Events**. Local env: conda env `Cathay-Hack`. Docker image built from the repo root so it can include `shared/program.json` and `backend/fixtures`.
- **Frontend:** Vite + React + TypeScript, Tailwind v4 (tokens in the `@theme` block of `src/index.css`), Framer Motion for 2D motion, plain three.js (lazy-loaded) for at most one 3D moment per screen. No router library (a small pushState helper in `src/nav.ts`). PWA service worker planned for offline chapters.
- **Deploy (planned, on site today):** Docker → Google Cloud Run (backend, `--max-instances=1` because the SSE broker is in memory); frontend on Cloud Run or Vercel.
- **AI:** one LLM behind one wrapper function. The provider depends on which credits we get on site. Current approach: the `openai` Python SDK, pointed at OpenAI itself or at an OpenAI-compatible endpoint such as Gemini via `LLM_BASE_URL`.
- **Tools:** `tools/fetch_oag.py` (saves OAG fixtures, never re-fetches an existing one without `--force`), `tools/shoot.py` (Playwright screenshots at 393×852), a `/screen-check` skill that checks screens against DESIGN.md, `tools/demo_trip.py` (narrated end-to-end backend demo: creates a trip, holds two SSE streams as child and parent, fires all events).

### Architecture
```
Child phone      Parent phone        (same React app, different routes)
     │  REST           ▲  SSE /api/trips/{id}/stream (same event to both)
     ▼                 │
   FastAPI backend: routers → logic (pure rules engine) → services (OAG, LLM, stories)
     │              │                 │
   OAG API +      LLM wrapper +     SQLite (trips, events, stories)
   fixtures       safety + fallback
```
The backend publishes each event **once** to the trip's channel. Both phones subscribe and render their own version. Polling fallback: `GET /api/trips/{id}` every second.

### Program numbers (`shared/program.json`, illustrative, awaiting business-team sign-off)
- Annual earn cap: **2,000 miles**. Mei starts at **1,250** earned this year.
- Missions: Check-in 30, Boarding 50, Window 30, Arrival 40.
- Graduation score: 5 pts per membership year (max 75), 4 per family flight (max 100), 2 per 5,000 junior miles (max 25), so max 200. Bands 0–60, 61–130, 131–200.
- Top band only: 150 Status Points head start (Silver = 300). Family transfer allowance 120,000 → 80,000 → 40,000 over three years (a limit, not miles received).

### Real flight data (OAG)
- Demo flight **CX 500, HKG T1 15:25 → NRT T2 20:20 local, 235 min, Airbus A330-300, 14 Nov 2026.** Arrival airport is NRT, not "TYO".
- Two fixtures saved: `CX500_2026-11-14.json` (demo flight, schedule only) and `CX500_2026-11-11.json` (operated, actually delayed).
- OAG gives a gate only once the flight operates, and never a seat. So gate and seat are synthetic, deterministic and **labelled in the UI** (the API's `synthetic` field lists which ones). The demo is pinned to gate 23, seat 34K.
- Fixture-first: a fixture miss calls OAG live only if `OAG_LIVE=true`, and saves the response as a new fixture. Raw OAG is never exposed; the API returns a child-friendly subset.

### API (all live on the backend, camelCase JSON)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness |
| GET | `/api/flights/lookup?carrier=CX&number=500&date=2026-11-14` | OAG flight → boarding pass data |
| POST | `/api/trips` | Junior mode on: `{childName, ageBand: "6-8"/"9-12", carrier, number, date, language}` → creates the trip, stores its story, emits `junior_mode_on` |
| GET | `/api/trips/current` | Newest trip (the child phone finds it without typing an id; a new trip resets the demo) |
| GET | `/api/trips/{id}` | Trip, missions (locked/available/done), cap, branch, chapter lock states, events, lastEventId, dataUsed |
| GET | `/api/trips/{id}/chapters` | Every story version for offline storage, locked ones included |
| POST | `/api/trips/{id}/events` | Fire `checkin`/`boarded`/`departed`/`delayed`/`landed` (`delayMinutes`/`newGate` for delayed) |
| POST | `/api/trips/{id}/missions/{missionId}/complete` | The child pressed the stamp on the phone (how Window Watcher completes) |
| GET | `/api/trips/{id}/stream` | SSE; `id:` per event; replay via `?after=N` or `Last-Event-ID`; ping every 15 s |
| POST | `/api/graduation/score` | `{membershipYears, familyFlights, juniorMiles}` → score, breakdown, band, package (stateless) |

One event shape goes to both screens:
```json
{ "type": "boarded", "at": "2026-11-14T10:05:00+08:00", "source": "simulated",
  "mission": { "id": "boarding", "title": "Boarding Badge", "miles": 50 },
  "cap": { "used": 1330, "limit": 2000 }, "chapterUnlocked": 2, "branch": "on_time",
  "childMessage": "Boarding Badge collected!", "parentMessage": "Mei has boarded CX 500",
  "systemLines": ["Mission rule passed: Boarding Badge", "Cap check 1,330 / 2,000 ✓", "Chapter 2 unlocked"] }
```
`systemLines` never appears on the phones. It's for logs and the architecture slide wording.

### Rules engine (pure functions in `backend/app/logic/`, fully tested)
- Events → missions: checkin → Check-in Champion, boarded → Boarding Badge, landed → Arrival Explorer. Window Watcher has no airline trigger: the child completes it on the phone.
- Mission opening: check-in available from the start, boarding after check-in, window and arrival after departed.
- Cap: awards are trimmed to fit under 2,000. A mission still counts as done at 0 miles.
- Whichever comes first pays (the stamp press or the trip event). Repeats never award or unlock twice. Event order isn't enforced.
- Chapters: junior_mode_on → 1, boarded → 2, departed → 3, landed → 4. A delay switches the branch to `delayed` for the rest of the trip.

### Story pipeline
- **4 chapters, 7 versions:** chapter 1 `both`; chapters 2–4 each `on_time` and `delayed`. One page per chapter. Keys: `checkin`, `boarding`, `inflight`, `landing`.
- Stored as a template with `{name}`, `{city}` and `{gate}` placeholders, filled when the phone asks. So the AI never sees the child's name, and a changed gate shows up on the next fetch. The landing chapter also has `unlockAt` = scheduled arrival + delay, so it can open offline. No GPS.
- Source is fixture-first: a reviewed AI story fixture for the flight and age band → otherwise the pre-written fallback story (`backend/fixtures/stories/fallback.json`, title "Pip and the jade sky"). `generatedBy` says `llm` or `fallback`. **The child never sees a failure.**
- **English only for now** (team decision, a departure from the plan's EN + Traditional Chinese). The JSON stays keyed by language so 繁中 can be added later without an API change. Slides must not promise Chinese.
- AI input is only four fields: destination city, flight length, aircraft name, age band. One call writes all 7 versions as JSON. Style guide in the prompt: warm, short sentences, never scary, a delay is always good news, no real people or brands, no emoji or markdown. Plus a pre-written example chapter. No RAG, no fine-tuning.
- Safety checks: JSON parse (code fences stripped), shape and structure validation, a banned-word list (harm/fear words and airline/brand names), no emoji or markdown, readability limits per age band (6–8: at most 14 words per sentence and 45 per page; 9–12: 20 and 70). Any failure → fallback. Reasons are human-readable, e.g. "banned word 'crash' in chapter 3", for the architecture slide.

---

## 6. What's done so far

**Backend (merged to `main`, 145 tests passing):** skeleton + health, program loader, OAG fixtures + flight lookup, rules engine, trips/events/SSE with SQLite persistence and replay, graduation score, child-completed missions, fallback story + `GET /chapters`.

**Backend in progress (branch `feat/story-llm`, uncommitted):**
- `app/logic/story_prompt.py`: prompt builder with reading levels.
- `app/logic/story_safety.py`: `parse_story` + `check_story`.
- Tests written first: `test_story_prompt.py`, `test_story_safety.py`, `test_llm.py`.
- Config for the LLM: `LLM_PROVIDER` ("" = fallback only, "fake" = canned output for tests, "openai" = the SDK), `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` (required, never guessed), `LLM_LIVE=false` by default so no trip waits on the AI on stage, `LLM_TIMEOUT_SECONDS=30`. `openai` added to requirements.
- Still to write: the wrapper itself, `app/services/llm.py`.
- The plan: use the fake provider now, plug in real credentials on site, generate Mei's story once, review it, and save it as a fixture so the demo is offline and safe.

**Frontend (on its own branches, not yet wired to the API):** all child screens (welcome, home, story, mission complete, graduation), parent `/parent` and `/family`, and the `/demo` side-by-side page with a control panel. Everything runs on API-shaped mock events through one hook, `useTrip()` (`src/trip/`); `?at=welcome|checkin|delayed|boarded|departed|landed` picks the trip moment. Wiring the API means replacing only that hook's source. `/screen-check` passed.

**Not done yet / next:**
- Backend: LLM wrapper + live generation on site, Cloud Run deploy (gcloud and LLM credentials arrive on site today), offline fixtures mode check, README + architecture.md, architecture slide, backup demo video.
- Frontend: swap mocks for `GET /api/trips/current` + the stream, `GET /chapters` (pick the version by `branch`, map `key` to art and `unlockOn` to "Opens when…" wording), graduation score, the mission-complete POST, the Simulate trip control on the real API, the PWA service worker for offline chapters, the two-phone mirrored setup. P1: read-aloud via browser speech, delay branch shown live, graduation polish.
- Open questions: delay bonus mini-mission miles (not in program.json, so it awards 0 for now); simulated events show the real clock time; story voice in delayed chapters 3–4 uses first-person "We" (team to decide); `program.json` still awaiting business-team sign-off.

**Feature-freeze goal:** the full demo runs end to end with Wi-Fi off.

---

Please confirm you've understood the project. Then summarise in a few lines what the demo looks like and where we are, so I can check your understanding before we continue.
