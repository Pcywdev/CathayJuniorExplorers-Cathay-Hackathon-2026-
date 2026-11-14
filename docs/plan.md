# Cathay Xplorers: product and build plan

**Team 2B3E · Cathay Hackathon 2026 final · 14–15 November, Cathay City**

This is the source of truth for scope. It describes the prototype as submitted on 15 Nov. The older "junior mode" plan (Little Explorers only, graduation at 18) is replaced; it's still in git history. Decisions and their dates are in `docs/decisions.md`.

---

## 1. What we're building

**Cathay Xplorers** is a concept youth membership mode in a travel app. Young people explore what Cathay offers before adulthood, in three tiers, and then "graduate" into full adult membership, keeping everything they earned. It's a concept only: no real Cathay integration and no official logos.

**The demo in one line:** Mei joins at 7 → one real flight drives her phone and her parent's phone, with missions, stamps and a story → at 15 and 20, Home changes with her age and offers are picked for her → at graduation she becomes a full member and keeps her miles, years, trips and stamps.

The demo covers the member journey from the hackathon challenge: **awareness → acquisition → activation → engagement → retention**.

---

## 2. Tiers

| Tier | Ages | What it offers | Sign-up |
|---|---|---|---|
| **Little Xplorers** | Under 12 | The trip experience (section 4): two synced phones, missions, passport stamps, an AI story that unlocks with the trip | Through the family account |
| **Teen Xplorers** | 12–17 | Small tangible rewards for few miles, at partners and Cathay: pre-flight drink, snacks, blind boxes | Guardian approval (shown as passed) |
| **Campus Xplorers** | 18 to graduation or 25, whichever comes first | Practical travel deals and packages; verified student badge | University email (shown as passed) |
| **Exit** | At graduation or 25 | Full adult membership | — |

- **Exit carries over** miles, membership years, trip history and passport stamps. The graduation score and package (section 5) happen at exit.
- **The family transfer allowance** (120,000 → 80,000 → 40,000 over three years) starts at exit.
- **No pooling.** Miles stay in the young person's own account.
- Teen and Campus personas are synthetic. Guardian approval and university email verification are shown as passed, never collected.

---

## 3. Demo screens

The demo is a scripted run on `/demo` (`docs/demo-script.md` has the beats and commentary). Mei grows up on screen.

| Journey stage | Screen | Route |
|---|---|---|
| Awareness | App home with a Cathay Xplorers entry card | `/home` |
| Awareness → acquisition | Xplorers intro: the three tiers and graduation as a roadmap, "Join" | `/xplorers` |
| Acquisition + activation | Sign-up: pre-filled form, guardian approval / university email shown as passed, "Welcome to <tier>" | `/signup` |
| Activation | Mei's welcome: her passport opens | `/welcome` |
| Engagement (Little) | Home with the boarding pass, mission complete with a stamp, story, parent timeline, family miles | `/child`, `/complete`, `/story`, `/parent`, `/family` |
| Engagement (Teen, Campus) | The same Home, grown up: plain ticket, no Pip, "Picked for you" offers, an offer and its voucher | `/child?age=15`, `/child?age=20`, `/offer` |
| Retention | Exit, "You've graduated": carry-over, score count-up, package, all stamps, "Continue as a Cathay member" | `/exit` |

- **Home changes with age** (`?age=`). At 12+ it drops the childish parts: no Pip or story, the boarding pass becomes a plain ticket, and the passport becomes a memory page.
- **"Picked for you"** on Home is ranked by a toy **dual-encoder** recommender (section 6), personalised by age and the "Mei is…" traits ticked in the demo panel.
- **`/ahead`** is the exit page as a projection for a member who hasn't graduated yet ("See where this leads").
- Screenshots for slides: `docs/screenshots/`.

---

## 4. Little Xplorers: one trip, six events

On the parent's phone, the **junior mode** switch turns Little Xplorers on for a booking (the event is `junior_mode_on`). The child gets her own screen, and both phones react to the same flight.

| Event | Real trigger | Child | Parent |
|---|---|---|---|
| **Junior mode on** | Parent's switch for the booking | Welcome from Pip, chapter 1 ready | Confirmation + data used |
| **Checked in** | Check-in system | Check-in Champion +30 | "Mei is checked in for CX 500" |
| **Delayed** | OAG status | Pip: "We have extra time!", delayed chapter versions | "Delayed 40 min", new departure time |
| **Boarded** | Gate scan | Boarding Badge stamp, chapter 2 unlocks | "Mei has boarded" |
| **Departed** | OAG status | In-flight chapter | Departure time and landing estimate |
| **Landed** | OAG status | Arrival Explorer, Tokyo stamp, final chapter | "Mei has landed in Tokyo" |

The child can also complete an open mission herself (Window Watcher) by pressing the stamp; that's a `mission_completed` event.

Behind every event the backend rules engine decides: mission check, annual cap check, chapter unlock, branch switch. The backend publishes the event **once** to the trip's channel, and both phones get it over Server-Sent Events. The wording is in the event's `systemLines`, used for logging and the architecture slide.

### Story
| Step | What happens |
|---|---|
| Trigger | Once per trip, when the parent turns junior mode on (production: when online check-in opens) |
| Input | Four fields: destination, flight length, aircraft model, age band. Never the child's name: the AI writes `{name}`, filled in when a phone asks |
| Generation | One AI call writes all chapters as JSON: check-in, boarding, in-flight, landing; chapters 2–4 in an on-time and a delayed version |
| Safety checks | JSON shape and chapter structure, banned words, reading level per age band, no emoji or markdown, provider moderation |
| Fallback | Any failure → the pre-written story. A child never sees a failed generation |
| Unlock | Trip events unlock chapters; the landing chapter unlocks by the scheduled arrival time, no GPS |
| On stage | `LLM_LIVE=false`: trips use a reviewed story fixture made with `tools/generate_story.py`, or the pre-written story |

English only for the submission.

---

## 5. Exit: graduation score and package

At exit, the member sees:
- **A score** from the published formula: 5 points per membership year (max 75), 4 per family flight (max 100), 2 per 5,000 Xplorer miles (max 25). Bands 0–60, 61–130, 131–200.
- **A package:** miles carried over, a Status Points head start for the top band (150, below Silver at 300), and the family transfer allowance over three years.

`POST /api/graduation/score` computes this on the backend. The exit screen in the demo reads the same numbers from `program.json`.

---

## 6. "Picked for you": the dual-encoder recommender

A toy version of a hybrid recommender (`tools/xplorers_mapping`, stdlib Python, seeded, synthetic data):
1. **Rules first:** hard age limits only where real (e.g. a hostel 18+), required traits (student, studying abroad), affordability.
2. **Two towers:** a user tower (age bucket, age band, ticked traits) and an item tower (promo id, kind, tags, designed-for ages, miles, required traits), trained with binary cross-entropy on ~800 synthetic users and 49 promotions.
3. **Result:** held-out AUC 0.82 against a 0.74 popularity baseline. Age is learnt, not ruled: a promo's age range is a soft feature.
4. **Output:** `frontend/src/xplorers/data/mapping.json`. The app runs the user tower on the phone and draws six offers weighted by score, with a reason line from the strongest ticked trait.

Traits are interests and travel situation only (e.g. foodie, travels with siblings, university student), never health or location.

---

## 7. What's real, scripted and mocked

| | |
|---|---|
| **Real (backend, tested)** | OAG flight data (cached fixtures), rules engine, trips and events, two-phone sync over SSE, child mission completion, story pipeline with safety and fallback, graduation score. 204 tests. `tools/demo_trip.py` runs it end to end with two live streams |
| **Real (offline tool)** | The dual-encoder recommender; its output drives "Picked for you" |
| **Scripted** | The phone screens in the demo video run on events in the API's exact event shape (`?at=`), so the video plays the same every time |
| **Mocked** | Teen and Campus offers and vouchers, sign-up checks, personas, on illustrative `program.json` numbers |
| **Production path** | `docs/architecture.md` "Production path": how each demo piece maps to a real system |

---

## 8. Numbers (`shared/program.json`)

**Illustrative, to confirm with the business team. Every screen, slide and the poster must match.**

| Item | Value |
|---|---|
| Annual earn cap (Little Xplorers) | 2,000 miles |
| Missions | Check-in 30, Boarding 50, Window 30, Arrival 40 |
| Score | See section 5 |
| Top-band head start | 150 Status Points (Silver = 300) |
| Transfer allowance (from exit) | 120,000 → 80,000 → 40,000 over three years |
| Mei's balance | 1,250 at 7, 9,800 at 15, 24,000 at 20, 29,280 at exit (22) |
| Teen and Campus rewards, discover catalogue | `xplorers.teenRewards`, `xplorers.campusDeals`, `xplorers.discover` (the recommender's seed) |

---

## 9. Stack

| Layer | Choice |
|---|---|
| Backend | Python 3.11, FastAPI, Uvicorn, httpx, SQLModel (SQLite), pydantic-settings, pytest |
| Live updates | Server-Sent Events, replay by event id; polling as fallback |
| Flight data | OAG via the backend only, cached, demo flights as fixtures (quota 1,000 requests / 30 days) |
| AI | The openai SDK behind one wrapper (`services/llm.py`): OpenAI, or a compatible provider via `LLM_BASE_URL` |
| Recommender | `tools/xplorers_mapping`, stdlib Python |
| Frontend | Vite, React, TypeScript, Tailwind (DESIGN.md tokens), Framer Motion, three.js |
| Run | Locally for the submission; Docker image ready, Cloud Run runbook in `docs/deploy.md` |

---

## 10. API (`docs/api.md`)

```
GET  /api/health
GET  /api/flights/lookup?carrier=CX&number=500&date=2026-11-14
POST /api/trips                                   junior mode on → trip + story
GET  /api/trips/current
GET  /api/trips/{id}                              trip, missions, miles, chapter states
GET  /api/trips/{id}/chapters                     the story, for offline storage
POST /api/trips/{id}/events                       checkin | delayed | boarded | departed | landed
POST /api/trips/{id}/missions/{missionId}/complete  the child presses the stamp
GET  /api/trips/{id}/stream                       SSE: both phones subscribe
POST /api/graduation/score                        history → score, breakdown, package
```
There are no backend endpoints for Teen and Campus rewards, deals, tiers, sign-up or verification: those stay frontend mocks (decisions.md 2026-11-14). Any API change is agreed first and updated in `api.md` in the same commit.

---

## 11. Repo and ownership

```
backend/   FastAPI app (routers, logic, services, models), tests/, fixtures/, Dockerfile   Earth
frontend/  React app (screens, components, xplorers/, trip/, mocks/)                     Teammate
shared/    program.json, fonts                                                           Earth
tools/     demo_trip.py, generate_story.py, shoot.py, xplorers_mapping/
docs/      shared: plan, api, architecture, DESIGN, progress, decisions, demo script, screenshots
```

---

## 12. Submission (15 Nov)

- **Prototype + repo link:** runs locally (README); backup video recorded.
- **Slides (PDF):** architecture slide from `docs/architecture-visual.png` and `docs/architecture-slide.md`; screens from `docs/screenshots/`.
- **One-page poster.**
- **Not in the submission** (parked, plans kept): live trip mode on `/demo?live` (`docs/live-trip.md`), Cloud Run deploy (`docs/deploy.md`), the exit screen calling the score endpoint, PWA offline storage, Traditional Chinese stories.

---

## 13. Rules we don't break

- Synthetic data except OAG flight data. Never imply real Cathay integration. No official logos.
- No pooling of miles.
- Children's data: age band, destination, flight length, trip events. Never photos, location or health data.
- Teen and Campus personas are synthetic; approval and verification are shown as passed, never collected.
- API keys only in `.env` (gitignored). Never in code, commits or screenshots.
- Every displayed number comes from `shared/program.json`.
