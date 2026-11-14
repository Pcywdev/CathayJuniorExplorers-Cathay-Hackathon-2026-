# Cathay Little Explorers — Build Plan

**Team 2B3E · Cathay Hackathon 2026 final · 14–15 November, Cathay City**

Build the MVP **Tue 10 – Fri 13 Nov**. Polish on site. Submit on site: prototype + repo link, slides (PDF), one-page poster.

---

## Scope v2: Cathay Xplorers (14 Nov)

**This section supersedes anything below that contradicts it.** Sections 1–16 still describe the Little Xplorers trip experience, which is unchanged.

### The change
Little Explorers becomes one tier of a youth membership mode called **Cathay Xplorers**, where young people explore what Cathay offers before adulthood. It is a concept only: no real Cathay integration and no official logos. The demo shows the full member journey from the hackathon challenge: **awareness → acquisition → activation → engagement → retention**.

### Tiers

| Tier | Ages | What it offers |
|---|---|---|
| **Little Xplorers** | Under 12 | The existing trip experience (sections 1–5). Only the name on screen changes. |
| **Teen Xplorers** | 12–17 | Small tangible rewards for few miles, at partners and Cathay: pre-flight drink, snacks, trendy items, blind boxes |
| **Campus Xplorers** | 18 to university graduation or 25, whichever comes first | Practical travel deals and packages; verified student badge |
| **Exit** | At graduation or 25 | The member "graduates" into full adult membership |

- **Exit carries over** miles, membership years, trip history and passport stamps. The graduation score and package work as before (section 5), but they happen at exit, not at 18.
- **Family transfer allowance** (120,000 → 80,000 → 40,000) now starts at exit, not at 18.
- **No pooling.** Miles stay in the young person's own account.
- **Sign-up:** 12–17 needs guardian approval; 18+ verifies by university email. In the demo both show as already passed (✓). We don't build the approval or email-code screens.
- All numbers are in `shared/program.json` under `xplorers` (illustrative, confirm with team).

### Demo screens (for a recorded video)

| # | Screen | Journey stage | Depth |
|---|---|---|---|
| 1 | App home with a Cathay Xplorers entry card | Awareness | Light: static, one tap forward |
| 2 | Xplorers intro: the three tiers, "Join" | Awareness → acquisition | Light: static, one tap forward |
| 4 | Sign-up: new teen Leo (14), pre-filled form, "Guardian approved ✓", then a tier card "Welcome to Teen Xplorers" | Acquisition + activation | Light: static, one tap forward |
| 7 | Little Xplorers: the existing screens | Engagement | Existing |
| 8 | Teen Xplorers rewards: balance, rewards list, one redemption flow ending in a voucher | Engagement (value beyond Cathay) | One complete interaction |
| 9 | Campus Xplorers deals: verified badge, deals list, one deal detail | Engagement | One complete interaction |
| 10 | Exit, "You've graduated": carry-over, score count-up, package, passport of all stamps, "Continue as a Cathay member" | Retention | One complete interaction |

- **Persona slider:** switches Mei between 7 → 15 → 20 → exit, moving between screens 7, 8, 9 and 10.
- Screen numbers follow the journey map; 3, 5 and 6 aren't built.
- Same polish standard on every screen.
- **Update (built, 14 Nov):** screens 8, 9 and the persona slider were dropped. Home now changes with age (Picked for you at 12+ and 18+, plain ticket, MemoryPassport), and the Member age timeline in `/demo` moves Mei between ages. Screen 4 uses Mei (15), not Leo. See decisions.md.

### Tonight's build (done)
- All new screens are **frontend-only on mock data**, so we can record the video.
- No new backend endpoints for Xplorers. The Little Xplorers backend is unchanged.
- The temporary ownership exception for Earth has **ended**; normal ownership applies again.

### After the build: submission readiness
- **Principle:** real where it's hard (the trip, rules engine, two-phone sync and story pipeline run on the backend); mocked where it's catalogue (Xplorers rewards, deals and personas); explained otherwise (`docs/architecture.md` "Production path").
- **Next:** live trip mode (`/demo?live`, mocks stay the default), then the LLM wrapper + safety, exit score from the real endpoint, deploy + offline, the architecture slide and README. The ordered checklist is in progress.md "Submission readiness".

### Superseded below
- Section 1 demo line "she graduates at 18" → she graduates at exit (university graduation or 25).
- Section 5 "Mei at 18" → Mei at exit; transfer allowance starts at exit.
- Section 13 beat "Mei at 18: the graduation screen" → the exit screen, reached through the Member age timeline.
- Section 13 beat "Simulate the trip" → runs on `/demo?live`, so both phones move through the real backend.

---

## 1. What we're building

A junior mode inside Cathay's app, shown as **two synced screens (child and parent)** reacting to **one real flight**, with an **AI story that unlocks chapter by chapter** as the trip happens. How the system works is explained on an **architecture slide**, not a third screen.

**The demo in one line:** Mei's real flight loads → her story begins → check-in, boarding, a delay and landing fire across both phones at once → she graduates at 18 with everything she earned.

**How it serves the pitch:** 3 minutes of business, then 2 minutes of tech. The tech segment is this demo. Every rule the business team describes (trip-linked missions, the earn cap, the graduation package) runs live on screen.

---

## 2. The two screens

| Screen | Device | Shows |
|---|---|---|
| **Child** | Phone | Boarding pass, missions, passport stamps, story chapters, graduation screen |
| **Parent** | Phone | Trip notifications, trip timeline, miles earned, junior mode switch, data used |

### Child screen
- Junior mode home: boarding pass filled from real OAG data, missions, miles with the annual cap, passport stamps
- Story: chapters unlock as the trip progresses; locked chapters visibly waiting
- Mission complete: stamp animation, miles counter
- Graduation screen (Mei at 18): score breakdown and package

### Parent screen
- Junior mode switch for the booking
- Notifications that matter: **boarded, departed, delayed, landed**
- **Trip timeline:** each event with time and result, e.g. "10:05 Boarded · +50 miles · 1,330 of 2,000 this year". Useful to a real parent, and it shows the rules working during the demo.
- Miles earned as a quiet line, not an alert
- "Data used" panel: age band, destination, flight length, trip events

### Architecture slide (replaces the third screen)
Owned by Earth. It should let judges trace exactly what they just watched:
- **One event travelling through the system:** gate scan → rules engine (Boarding Badge ✓, cap 1,330/2,000 ✓, chapter 2 unlocked) → child and parent phones
- **The story pipeline:** OAG flight data → generation → safety checks → fallback → stored on the phone, locked
- **The four data fields used**, and what's never collected
- Source for the wording: the `systemLines` field of each event (section 9)

---

## 3. What drives the screens: one trip, six events

| Event | Real trigger | Child | Parent |
|---|---|---|---|
| **Junior mode on** | Parent switches it on | Welcome from Pip, chapter 1 ready | Confirmation + data used |
| **Checked in** | Check-in system | Check-in Champion +30 | "Mei is checked in for CX 500" |
| **Boarded** | Gate scan | Boarding Badge stamp, chapter 2 unlocks | **"Mei has boarded"** |
| **Departed** | OAG status | In-flight chapters, available offline | "Departed 10:42, landing about 14:55" |
| **Delayed** | OAG status | Pip: "We have extra time!" + bonus mini-mission, delayed chapter version | **"Delayed 40 min, new gate 23"** |
| **Landed** | OAG status | Arrival Explorer, Tokyo stamp, final chapter | **"Mei has landed in Tokyo"** |

Behind every event, the backend applies the rules: mission check, cap check, chapter unlock, branch switch. These are logged as `systemLines` and shown on the architecture slide.

- **Demo control:** a "Simulate trip" control fires these events in sequence, because a real flight won't move during a 2-minute pitch. Simulated events are labelled as such.
- **Sync:** the backend publishes each event **once** to the trip's channel. Both screens subscribe via SSE and render their own version.

```
Event ──► Backend rules engine (mission, cap, chapter unlock, branch)
              │
              ▼ one event, one channel per trip
          ┌───┴───┐
        Child   Parent           (each subscribed via SSE)
```

**Fallback:** if SSE fights us, screens poll every second. Looks identical on stage.

---

## 4. Story chapters

| Step | What happens |
|---|---|
| **Trigger** | Automatic when junior mode is turned on (in production, also when online check-in opens) |
| **Input** | Real flight data from OAG: destination, flight length, aircraft; plus age band |
| **Generation** | One AI call writes every chapter for the trip as JSON: check-in, boarding, in-flight, landing |
| **Branches** | Later chapters in two versions: on time and delayed |
| **Languages** | English and Traditional Chinese |
| **Safety checks** | JSON format, length, banned words, moderation pass, readability for the age band |
| **Fallback** | Any failure → pre-written chapter. The child never sees a failure. |
| **Delivery** | Saved, downloaded to the phone **locked** |
| **Unlock** | Trip events unlock chapters. Nothing is generated during the flight. |

**Offline:** the app is a PWA. A service worker stores the chapters on the device. The final chapter unlocks at the **scheduled landing time** (from OAG data downloaded before departure) and confirms when the phone reconnects. **No GPS**, ever.

**Prompting:** a style guide (warm, short sentences, no fear, no real people) plus two or three example chapters. No RAG, no fine-tuning.

**Read-aloud (P1):** browser built-in speech. Test voices on the exact demo devices.

**Demo safety:** pre-generate and cache the chapters for Mei's demo flight.

---

## 5. Graduation screen

Inside the child's app. Mei at 18 sees:
- Her score from the published formula (membership years, family flights, junior miles)
- Her package: miles carried over, a Status Points head start capped below Silver, a family transfer allowance shrinking over three years

---

## 6. Numbers (`shared/program.json`)

**Illustrative — business team to confirm. Every screen, slide and the poster must match.**

| Item | Value |
|---|---|
| Annual earn cap | 2,000 miles |
| Missions | Check-in 30, Boarding 50, Window 30, Arrival 40 |
| Score | 5 pts per membership year (max 75), 4 per family flight (max 100), 2 per 5,000 junior miles (max 25) |
| Bands | 0–60, 61–130, 131–200 |
| Top-band head start | 150 Status Points (Silver = 300) |
| Transfer allowance | 120,000 → 80,000 → 40,000 over three years |
| Demo member | Mei, starting balance 1,250 miles |

---

## 7. Priorities

| P0 — must work by Friday | P1 — only if P0 is solid | Cut |
|---|---|---|
| OAG boarding pass | Read-aloud | Separate cost dashboard |
| Six events + Simulate control | Delay branch shown live | Separate time-machine tool |
| Two synced screens | Graduation screen polish | Retention dashboard |
| Story chapters, EN/繁, safety, fallback | | RAG, fine-tuning |
| Offline chapters | | Pooled family balances |
| Graduation screen (basic) | | "Now and Next", calm mode |
| Architecture slide | | Live Cathay view screen |

---

## 8. Stack

| Layer | Choice | Owner |
|---|---|---|
| Backend | Python 3.11, FastAPI, Uvicorn, httpx, SQLModel (SQLite), pydantic-settings, pytest | Earth |
| Live updates | Server-Sent Events | Earth |
| Flight data | OAG Flight Info API via backend, cached, demo flights saved as fixtures | Earth |
| AI | One LLM (Gemini on Google Cloud or Claude on AWS Bedrock, whichever credits we get) behind one wrapper function | Earth |
| Frontend | Vite + React + TypeScript, Tailwind (DESIGN.md tokens), Framer Motion | Teammate |
| Offline | PWA service worker | Teammate |
| Deploy | Docker → Google Cloud Run (backend); Cloud Run or Vercel (frontend) | Earth |
| Code | One GitHub repo; README is a submission item | Both |

---

## 9. API contract (`docs/api.md`)

```
GET  /api/health
GET  /api/flights/lookup?carrier=CX&number=500&date=2026-11-14
POST /api/trips                    junior mode on → creates trip, generates chapters
GET  /api/trips/{id}               trip, missions, miles, chapter lock states
GET  /api/trips/{id}/chapters      chapters for offline storage
POST /api/trips/{id}/events        { type: checkin | boarded | departed | delayed | landed }
GET  /api/trips/{id}/stream        SSE: both screens subscribe here
POST /api/graduation/score         history → score, breakdown, package
```

**One event shape for both screens:**
```json
{
  "type": "boarded",
  "at": "2026-11-14T10:05:00+08:00",
  "source": "simulated",
  "mission": { "id": "boarding", "title": "Boarding Badge", "miles": 50 },
  "cap": { "used": 1330, "limit": 2000 },
  "chapterUnlocked": 2,
  "branch": "on_time",
  "childMessage": "Boarding Badge collected!",
  "parentMessage": "Mei has boarded CX 500",
  "systemLines": ["Mission rule passed: Boarding Badge", "Cap check 1,330 / 2,000 ✓", "Chapter 2 unlocked"]
}
```
`systemLines` isn't displayed on the phones. It's kept for logging, debugging and the architecture slide wording.

**Rule:** any change to the contract is agreed by both of us first and updated in `api.md` in the same commit.

Frontend builds against mock data in `src/mocks/` until each endpoint is live.

---

## 10. Repo structure

```
little-explorers/
├── CLAUDE.md                  shared rules (short)
├── backend/   CLAUDE.md, app/ (routers, logic, services), tests/, Dockerfile
├── frontend/  CLAUDE.md, src/ (components, screens, api, mocks)
├── shared/    program.json
├── docs/      api.md, architecture.md, progress.md, decisions.md, DESIGN.md
├── tools/     shoot.py (screenshots)
└── .claude/skills/screen-check/SKILL.md
```

| File | Purpose |
|---|---|
| `docs/api.md` | The contract between us. Most important file. |
| `docs/progress.md` | What's done, next, blocked + one-line session log. Read at the start of every session. |
| `docs/decisions.md` | One line per decision so we don't re-argue |
| `docs/architecture.md` | Diagram + components. Becomes the README section and tech slide. |
| `shared/program.json` | Every displayed number |

---

## 11. Who does what

| | Earth (backend) | Teammate (frontend) |
|---|---|---|
| Owns | `backend/`, `shared/`, deployment | `frontend/` |
| Builds | OAG service + cache + fixtures, rules engine, events + SSE, story generation + safety, scoring, deploy, **architecture slide** | Child and parent screens, animations, PWA offline, Simulate control, graduation screen |
| Shared | `docs/` | `docs/` |

---

## 12. Timeline

| Day | Earth | Teammate | Done when |
|---|---|---|---|
| **Tue 10** | Setup (master prompt), backend skeleton, **deploy hello world to Cloud Run**, OAG queries, save fixtures | Pull repo, frontend skeleton, port DESIGN.md tokens, static child screens | Both run locally; backend deployed; one real OAG response saved |
| **Wed 11** | Flight lookup + cache, rules engine with tests, events endpoint, SSE stream | Child screens on API, parent screen with notifications and trip timeline | Simulating "boarded" updates both phones |
| **Thu 12** | Story generation, safety checks, fallback, branches, both languages; scoring endpoint | Story screen with lock states, mission complete animation, graduation screen, PWA offline | Full trip flow end to end |
| **Fri 13** | Deploy everything, offline fixtures mode, README + architecture, architecture slide | Polish, delay branch, two-phone demo setup, P1 only if P0 done | **Demo runs with Wi-Fi off. Feature freeze.** |
| **Sat–Sun** | Fixes, backup demo video | Polish, screenshots for slides and poster | Submitted |

---

## 13. Demo script (tech segment, 2 minutes)

| Time | Beat |
|---|---|
| 0:00–0:20 | Architecture slide: one event through the system, OAG → rules engine → AI with safety checks → two phones. "Rules now, AI later." |
| 0:20–0:50 | Parent turns on junior mode → Mei's real flight loads → chapter 1 appears, in English then Chinese |
| 0:50–1:30 | Simulate the trip: check-in, boarding, **delay**, landing — both phones react together; the story branch switches on the delay |
| 1:30–1:50 | Mei at 18: the graduation screen |
| 1:50–2:00 | "Four data fields, every rule visible, built on Cathay's existing systems." |

**Setup:** two phones side by side, both mirrored onto the presentation screen so judges see them react together.

---

## 14. Risks

| Risk | Mitigation |
|---|---|
| OAG quota: 1,000 requests / 30 days, shared | Backend-only calls, cache everything, fixtures by default, "live" for the demo moment |
| OAG fields missing (gate, seat) | Check on day 1; fill gaps with synthetic data, labelled |
| Venue Wi-Fi | Offline mode with fixtures + pre-generated chapters |
| LLM slow or bad output on stage | Pre-generated demo chapters, safety checks, fallback |
| SSE trouble | Polling fallback |
| Two people, four days | P0 only until Thursday evening |

---

## 15. Rules we don't break

- Synthetic data except OAG flight data. Never imply real Cathay integration. No official logos.
- No pooling of miles.
- Children's data: age band, destination, flight length, trip events. Never photos, location or health data.
- API keys only in `.env` (gitignored). Never in code, commits or screenshots.
- Every displayed number comes from `shared/program.json`.
- Something runs end to end at the end of every day.

---

## 16. Setup checklist

**Accounts:** OAG portal key · LLM credentials · Google Cloud project (Cloud Run + Artifact Registry enabled) · private GitHub repo with both of us

**Each machine:** Node.js LTS · Python 3.11 env · Docker Desktop · `gcloud` CLI · Claude Code

**Before Wednesday:** business team confirms `shared/program.json`