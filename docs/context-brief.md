# Context brief: "Cathay Xplorers" (Cathay Hackathon 2026 final)

I'm working on a hackathon project and want you to understand it fully before we go on. Below: what the product is, what the demo looks like, how it's built, and where we are. The final is 14–15 Nov 2026 at Cathay City. We submit on site: a working prototype plus repo link, slides (PDF) and a one-page poster. The prototype is finished as of 15 Nov.

---

## 1. What we're building, in plain language

**Cathay Xplorers** is a concept youth membership mode for a travel app, in the spirit of an airline app like Cathay's. We **never imply a real Cathay integration and use no official logos**. Young people explore what Cathay offers before adulthood, across three tiers, and then "graduate" into full adult membership, keeping everything they earned.

| Tier | Ages | What it offers |
|---|---|---|
| **Little Xplorers** | Under 12 | The trip experience: a child's real flight becomes an adventure on her own phone, synced with her parent's phone |
| **Teen Xplorers** | 12–17 | Small rewards for few miles, at partners and Cathay: a drink at the gate, snacks, blind boxes. Joins with a guardian's approval |
| **Campus Xplorers** | 18 to graduation or 25 | Practical student travel deals and packages, a verified student badge (university email) |
| **Exit** | At graduation or 25 | Full adult membership. Miles, membership years, trip history and passport stamps carry over |

**Little Xplorers in detail.** On the parent's phone, a **junior mode** switch turns Little Xplorers on for a booking. The child (our demo member **Mei**, 7, age band 6–8) gets:
- a **boarding pass** filled in from real flight data,
- **missions** that pay miles inside a yearly cap (Check-in Champion, Boarding Badge, Window Watcher, Arrival Explorer),
- **passport stamps**,
- an **AI-written story** starring **Pip** (a small friendly bird mascot) that unlocks **chapter by chapter as the real trip happens**.

The parent sees the notifications that matter (boarded, departed, delayed, landed), a calm trip timeline with miles, and a "data used" panel. We collect only four things about the child: **age band, destination, flight length, trip events**. Never photos, location, GPS or health data.

**As Mei grows up**, the same Home changes with her age. At 15 and 20 there's no Pip and no story: the boarding pass becomes a plain ticket, the passport becomes a memory page, and **"Picked for you"** shows offers ranked by a toy **dual-encoder recommender** from her age and interests.

**The business pitch:** start the relationship in childhood with rewards tied to real trips, keep it through the teen and student years with small, useful rewards, and convert at graduation into a full member who already has history, miles and status. Miles always stay in the young person's own account (**no pooling**).

**The demo in one line:** Mei joins at 7 → one real flight drives two phones → at 15 and 20 her Home grows up and offers are picked for her → at graduation she becomes a full member and keeps everything.

---

## 2. What the demo looks like

A scripted run on `/demo` (1:45, `docs/demo-script.md`), walked with the arrow keys. A backup video is recorded.

| Beat | What judges see |
|---|---|
| Join | App home with the Xplorers card → the intro roadmap (three tiers and graduation) → sign-up with guardian approval shown as passed → Mei's passport opens |
| Little (two phones) | CX 500 HKG → NRT on both phones. Checked in, the stamp press with the miles counter, a 40-minute delay that both phones react to, the story, landing, and the parent's "family miles" argument |
| Teen (15) | Home with a plain ticket and Picked for you; bubble tea at the gate for 250 miles; a voucher |
| Campus (20) | Verified student, landed; a partner-hostel deal for 4,000 miles; a voucher |
| Exit (22) | "You've graduated": 29,280 miles carried over, the score count-up, the package, every stamp |

The demo panel also has "Mei is…" tick boxes (style and situation traits) that re-rank Picked for you.

**Visual style (DESIGN.md):** clean, modern, friendly travel documents. Fixed palette: Sky `#EAF1F3` background, Paper `#FBFCFA` documents, Jade `#0E5E4E` structure and buttons, Ink `#1D2B33` text, Miles orange `#F2A033` **only** for miles and rewards, Stamp blue `#2E4C9E` **only** for stamps. Red Hat Display, Text and Mono (Mono only for flight data). 393px phone, one hero per screen. Tiers differ only in tone and density: Little is playful, Teen bolder, Campus calmest. Every screen says "Concept screen, synthetic data".

---

## 3. Team and ownership

- Two builders. **Backend owner ("Earth")**: `backend/`, `shared/`, deployment, architecture slide. **Frontend teammate**: `frontend/` (and the recommender in `tools/xplorers_mapping`). `docs/` is shared. Changes to the other side are proposed via `docs/api.md`.
- Working with Claude Code. One feature per branch, merged to `main` by PR when it runs. Pure business logic gets pytest tests written **before** the code.
- Key docs: `docs/plan.md` (scope, wins on any conflict), `docs/api.md` (the contract), `docs/architecture.md` (diagram and production path), `docs/progress.md`, `docs/decisions.md`, `docs/DESIGN.md`, `docs/backend-walkthrough.md`, `docs/architecture-slide.md`.

## 4. Hard rules

- Synthetic data only, except real OAG flight data. Never imply real Cathay integration. No official logos.
- No pooling of miles.
- Child data limited to the four fields above. Teen and Campus personas and the recommender's training users are synthetic; guardian approval and university verification are shown as passed, never collected.
- **Only the backend calls OAG.** Quota 1,000 requests / 30 days, so everything is fixture-first and cached, and the demo works offline.
- API keys only in `.env` (gitignored). Never in code, commits or screenshots.
- **Every displayed number comes from `shared/program.json`.**
- No new dependencies beyond the agreed stack without asking.

---

## 5. Technical details

### Stack
- **Backend:** Python 3.11, FastAPI, Uvicorn, httpx, SQLModel (SQLite), pydantic-settings, pytest; live updates over **Server-Sent Events**. Conda env `Cathay-Hack`. Docker image built from the repo root.
- **Frontend:** Vite, React, TypeScript, Tailwind v4 (tokens in `src/index.css`), Framer Motion, three.js for at most one 3D moment per screen. A small pushState helper (`src/nav.ts`) carries `?at=`, `?age=`, `?name=` and `?traits=` between screens.
- **AI:** the `openai` SDK behind one wrapper (`app/services/llm.py`): OpenAI, or an OpenAI-compatible endpoint (e.g. Gemini) via `LLM_BASE_URL`.
- **Recommender:** `tools/xplorers_mapping`, stdlib Python, seeded.
- **Tools:** `tools/demo_trip.py` (narrated end-to-end backend run with two SSE streams), `tools/generate_story.py` (generate and review the demo story), `tools/fetch_oag.py`, `tools/shoot.py` (screenshots at 393×852), the `/screen-check` skill.
- **Run:** locally for the submission. Cloud Run runbook in `docs/deploy.md`, not used.

### Architecture
```
Child phone      Parent phone        (same React app, different routes)
     │  REST           ▲  SSE /api/trips/{id}/stream (same event to both)
     ▼                 │
   FastAPI backend: routers → logic (pure rules engine) → services (OAG, LLM, stories)
     │              │                 │
   OAG API +      LLM wrapper +     SQLite (trips, events, stories, OAG cache)
   fixtures       safety + fallback

   Offline: tools/xplorers_mapping (dual encoder) → mapping.json → Picked for you on the phone
```
The backend publishes each trip event **once** to the trip's channel; both phones subscribe and render their own version. Polling `GET /api/trips/{id}` is the fallback.

**In the demo video** the phones run on scripted events in the API's exact event shape (`?at=`, through one hook, `useTrip()`), so the video plays the same every time. The backend doing the same run for real is shown by `tools/demo_trip.py`. Switching the phones to the backend (`?live`) is planned in `docs/live-trip.md` and parked.

### Program numbers (`shared/program.json`, illustrative)
- Annual earn cap: **2,000 miles** (Little Xplorers). Missions: Check-in 30, Boarding 50, Window 30, Arrival 40.
- Mei's balance: 1,250 at 7, 9,800 at 15, 24,000 at 20, **29,280 at exit (22)**.
- Graduation score: 5 points per membership year (max 75), 4 per family flight (max 100), 2 per 5,000 Xplorer miles (max 25), so max 200. Bands 0–60, 61–130, 131–200.
- Top band: 150 Status Points head start (Silver = 300). Family transfer allowance 120,000 → 80,000 → 40,000 over three years, **starting at exit**.
- Teen rewards (`xplorers.teenRewards`), Campus deals (`xplorers.campusDeals`), and the recommender's seed catalogue (`xplorers.discover`).

### Real flight data (OAG)
- Demo flight **CX 500, HKG T1 15:25 → NRT T2 20:20 local, 235 min, Airbus A330-300, 14 Nov 2026.**
- OAG gives a gate only once the flight operates, and never a seat: gate 23 and seat 34K are synthetic, deterministic and labelled (the API's `synthetic` field).
- Fixture-first; a live call only with `OAG_LIVE=true`, saved as a new fixture.

### API (backend, camelCase JSON; details in `docs/api.md`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness |
| GET | `/api/flights/lookup` | OAG flight → boarding pass data |
| POST | `/api/trips` | Junior mode on: creates the trip, stores its story, emits `junior_mode_on` |
| GET | `/api/trips/current` | Newest trip |
| GET | `/api/trips/{id}` | Trip, missions, cap, branch, chapter states, events |
| GET | `/api/trips/{id}/chapters` | Every story version, for offline storage |
| POST | `/api/trips/{id}/events` | `checkin`, `delayed`, `boarded`, `departed`, `landed` |
| POST | `/api/trips/{id}/missions/{missionId}/complete` | The child pressed the stamp |
| GET | `/api/trips/{id}/stream` | SSE, replay via `?after=N` or `Last-Event-ID` |
| POST | `/api/graduation/score` | History → score, breakdown, band, package |

No endpoints for Teen, Campus, sign-up or verification: those are frontend screens on program.json (decisions.md 2026-11-14).

### Rules engine (pure functions in `backend/app/logic/`)
- checkin → Check-in Champion, boarded → Boarding Badge, landed → Arrival Explorer; Window Watcher is completed by the child on the phone.
- Awards are trimmed to fit under the 2,000 cap. Whichever comes first pays (stamp press or trip event). Repeats never award or unlock twice.
- Chapters: junior_mode_on → 1, boarded → 2, departed → 3, landed → 4. A delay switches the branch to `delayed`.

### Story pipeline
- 4 chapters, 7 versions (chapter 1 once; 2–4 on time and delayed), one page each, stored with `{name}`, `{city}`, `{gate}` placeholders filled when a phone asks.
- Order: a reviewed story fixture → (only if `LLM_LIVE=true`) one AI call → parse and shape check → banned words, reading level per age band, no emoji or markdown → provider moderation (OpenAI) → otherwise the pre-written story. **A child never sees a failed generation.**
- AI input: destination, flight length, aircraft model (manufacturer dropped, since brand names are banned), age band. Never the name.
- English only. The first real AI runs were rejected (malformed chapter JSON), logged in `docs/story-rejections.md`; a test-case rejection is in `docs/story-rejection-example.md`.

### Picked for you (dual encoder)
- Rules first (hard age limits where real, required traits like "university student", affordability), then a user tower (age bucket, age band, ticked traits) and an item tower (promo id, kind, tags, designed-for ages, miles), trained on ~800 synthetic users and 49 promotions. Held-out AUC 0.82 against a 0.74 popularity baseline.
- Output `frontend/src/xplorers/data/mapping.json`; the phone runs the user tower and draws six offers weighted by score, with a reason line.

---

## 6. Where we are (15 Nov)

**Done:** the backend (204 tests, including the LLM wrapper and story generation), every demo screen, the scripted `/demo`, the dual-encoder recommender, the backup video, README, architecture docs, the architecture slide visual (`docs/architecture-visual.png`), and slide screenshots (`docs/screenshots/`).

**Left:** slides and poster in Canva, submission. Optional: a reviewed AI story fixture.

**Parked:** live trip mode, Cloud Run deploy, the exit screen calling the score endpoint, PWA offline storage, Traditional Chinese stories.

---

Please confirm you've understood the project. Then summarise in a few lines what the demo looks like and where we are, so I can check your understanding before we continue.
