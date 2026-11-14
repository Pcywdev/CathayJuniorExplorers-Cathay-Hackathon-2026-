# Architecture

The finished prototype, as submitted on 15 Nov. Solid lines run in the prototype; the dashed source is the production path.

```
  SOURCES                         BACKEND  (FastAPI, Python, one container)              PHONES (React, one app)
 ┌───────────────────┐           ┌──────────────────────────────────────────────┐      ┌────────────────────┐
 │ OAG flight data   │──────────▶│ Flight service   only OAG caller,            │      │ Child phone        │
 │ CX 500 HKG → NRT  │  cached   │                  fixture-first cache         │      │ boarding pass,     │
 └───────────────────┘  fixtures ├──────────────────────────────────────────────┤      │ missions, stamps,  │
 ┌───────────────────┐           │ Rules engine     missions, annual cap,       │ SSE  │ story chapters     │
 │ Trip events       │──────────▶│ (app/logic/)     chapter unlock, delay       │═════▶├────────────────────┤
 │ checkin, delayed, │ POST      │                  branch, graduation score    │ same │ Parent phone       │
 │ boarded, departed,│ /events   ├──────────────────────────────────────────────┤ event│ alerts, timeline,  │
 │ landed (simulated)│           │ Event broker     one SSE channel per trip,   │      │ miles, data used   │
 └───────────────────┘           │                  replay by event id          │      └────────────────────┘
 ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐           ├──────────────────────────────────────────────┤       Teen, Campus: Home with
   Production: DCS     ─ ─ ─ ─ ▶ │ Story service    4-field prompt ─▶ LLM ─▶    │       Picked for you, ranked
 │ check-in, gate    │           │ (services/)      safety checks ─▶ fallback   │       on the phone by the
   scan, OAG alerts              ├──────────────────────────────────────────────┤        dual encoder
 └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘           │ SQLite           trips, events, stories,     │
                                 │                  OAG cache                   │
                                 └──────────────────────────────────────────────┘
                                   shared/program.json: every number, read by backend and frontend

  OFFLINE  tools/xplorers_mapping: dual encoder trained on synthetic users ─▶ mapping.json ─▶ Picked for you
```

## Components
- **Child phone / parent phone:** the same React app on two routes (`/child`, `/parent`). Each renders its own version of every event. `/demo` shows both side by side and walks the scripted demo.
- **React frontend:** Vite, TypeScript, Tailwind, Framer Motion, three.js. The trip screens read `useTrip()`, which builds the trip from API-shaped events (`src/trip/`). In the submitted demo those events are scripted (`?at=`). Switching the source to the backend (`?live`, planned in `docs/live-trip.md`) leaves the screens unchanged.
- **FastAPI backend:** routers by feature, pydantic models matching docs/api.md, 204 tests.
- **Rules engine (`app/logic/`):** pure functions for missions, the annual cap, chapter unlock, the delay branch and the graduation score. Repeated events award nothing.
- **Flight service (`services/oag.py`):** the only caller of OAG. Every response is cached, and the demo flights are stored as fixtures (quota 1,000 / 30 days).
- **Story service (`services/stories.py`, `services/llm.py`):** a reviewed story fixture first. Otherwise (with `LLM_LIVE`), one AI call through the openai SDK (OpenAI or a compatible provider). The reply goes through `parse_story` (JSON shape and chapter structure), `check_story` (banned words, reading level per age band, no emoji or markdown) and provider moderation, falling back to the pre-written story on any failure. The prompt has four fields; the child's name is filled in only when a phone asks.
- **SQLite (SQLModel):** trips, events, stories and the OAG response cache.
- **SSE stream:** one channel per trip; both phones subscribe; replay via `?after` / `Last-Event-ID`; polling `GET /api/trips/{id}` is the fallback.
- **`shared/program.json`:** every displayed number, read by backend and frontend.
- **Picked for you recommender (`tools/xplorers_mapping`):** a toy dual encoder (stdlib Python, seeded). Rules come first: hard age limits where real, required traits, affordability. Then a user tower (age bucket, age band, ticked traits) and an item tower (promo id, kind, tags, designed-for ages, miles) are trained with binary cross-entropy on ~800 synthetic users and 49 promotions: held-out AUC 0.82 against a 0.74 popularity baseline. It writes `frontend/src/xplorers/data/mapping.json`; the app runs the user tower on the phone with the age and the "Mei is…" traits from the demo panel, and draws six offers weighted by score. Production: the same two-tower shape, item vectors in an approximate nearest-neighbour index.

## One event through the system (architecture slide)
gate scan → `POST /events {type: boarded}` → rules engine (Boarding Badge ✓, cap 1,330 / 2,000 ✓, chapter 2 unlocked) → event published once → child and parent phones. Wording comes from the event's `systemLines`.

With live mode (`/demo?live`, planned, not in the submission), the panel's Trip moment would stand in for the gate scan: it would POST a `simulated` event, and both phones, each subscribed to `/stream`, would refetch the trip and redraw. Today `tools/demo_trip.py` plays that role from a terminal.

## Production path
The demo backend is a single-box stand-in so the trip runs in our order on stage. These pieces carry into production **unchanged**:
- the rules engine (pure functions, tested first)
- idempotent, order-tolerant event handling (feeds duplicate and reorder)
- data minimisation in the story prompt
- the story safety pipeline with fallback
- offline chapter unlock

The design point is **events in, decisions out**: we swap the event source, not the logic.

| Demo piece | Production equivalent | Line for judges |
|---|---|---|
| `POST /events` from the demo panel (`source: simulated`) | Airline ops feeds: check-in from the departure control system, boarding from the gate scan, departed/landed from OAG Flight Info Alerts or the airline's own ops feed, as webhooks onto a message queue | "The rules engine doesn't care where an event comes from." |
| Repeats award nothing; order not enforced | Real feeds duplicate and arrive out of order | "Built for messy feeds." |
| Miles and the annual cap in SQLite | Rules decide the award, then post it to the loyalty ledger (source of truth); cap also enforced there | "An accrual-rules service, not a second bank of miles." |
| SSE + in-memory broker, one instance | Parent alerts via phone push (APNs/FCM); in-app live view over managed pub/sub; scaled horizontally | "SSE shows the sync on stage; production uses push for alerts." |
| Story: one LLM call per trip | Batch job when online check-in opens; one call per booking, cached; nothing generated in flight | "One call per trip, before the flight." |
| Prompt gets age band, destination, flight length, aircraft; `{name}` filled after | Same | "The AI never sees who the child is." |
| Safety: JSON shape, banned words, reading level, emoji/markdown, provider moderation (OpenAI); fallback | Plus a human-reviewed fallback library, and rejection-rate monitoring | "A child never sees a failed generation." |
| `GET /chapters` serves every chapter at once, with the landing chapter's `unlockAt` from the schedule, no GPS | The phone stores them (PWA, later the native app cache) and opens chapter 4 offline at `unlockAt` | "Works in airplane mode, no location data." |
| Child data: four fields | Child is a sub-account under a guardian, with consent at sign-up (HK PDPO; COPPA/GDPR-style standards for minors) | "Minimisation enforced in code." |
| Teen guardian approval shown ✓ | Guardian approves in their own app with one tap; miles stay in the teen's name | "Approval is a parent action." |
| Campus verification shown ✓ | University email domain code or a student-verification service, re-checked yearly | "Eligibility is a flag on the account." |
| Picked for you: toy dual encoder on synthetic users; offers and vouchers mocked | Partner catalogue with one-time QR voucher codes that expire; partner scans at the till and is settled per redemption | "Low-mile rewards build the habit; partners pay for footfall." |
| Student deals (mock) | Fares filed with a verified-student eligibility rule; packages from existing holiday products | "Deals are fare rules, not new systems." |
| Exit (mock, score from the real endpoint) | Scheduled at graduation confirmation or 25; the same member ID changes tier, so history stays; package applied; transfer allowance year 1 starts | "Nothing migrates: it's the same account, growing up." |

**What's real in the prototype:** the OAG flight (fixture), the rules engine, two-phone sync over SSE, the story pipeline with safety and fallback, and the graduation score, all in the backend and covered by tests. `tools/demo_trip.py` runs them end to end with two live streams. **Scripted:** the phone screens in the demo video run on events that mirror the API's event shape, so the video plays the same every time. **Real, offline:** the dual-encoder recommender behind Picked for you (trained on synthetic users). **Mocked:** Teen and Campus offers and vouchers, sign-up checks and personas, on illustrative program.json numbers. Concept only: no real Cathay integration. Stories are English only.
