# Live trip mode: plan

Submission readiness item 1 (progress.md). Goal: in `/demo?live`, both phones run through the real backend (rules engine + SSE) instead of the `?at=` mocks. **Mocks stay the default**, for screenshots, /screen-check and as the offline fallback on stage.

Branch: `feat/live-trip` from main. The backend part is Earth's. The frontend part is the teammate's area, so it starts only after the checks at the bottom.

## Why
Every trip screen reads `useTrip()` (`frontend/src/trip/useTrip.ts`), which builds the trip from `mocks/events.ts` through `applyEvents.ts`. That mirrors the backend rules, but nothing on screen proves the backend works. Live mode swaps **only the source** of `useTrip()`. The return shape `{ trip, step, has, progress, latest }` stays the same, so screens don't change.

## Backend: demo clock (Earth)
**Problem:** the parent timeline prints `hhmm(e.at)` (`ParentScreen.tsx`), and "Departed 16:07, landing about…" uses `at`. The backend stamps events with the wall clock (`routers/events.py`, `routers/trips.py` → `trip_view.local_time`). Filmed at 23:00, the timeline would read 23:41 for a 15:25 flight.

**Fix:** setting `DEMO_CLOCK` (`app/config.py`, default `false`; `true` in `.env` for the demo).
- Pure `demo_time(event_type, flight, total_delay, previous_at)` in `app/logic/trip_view.py`, **tests written first**. Times are relative to the scheduled flight and match `mocks/events.ts`:

| Event | Time | Demo flight |
|---|---|---|
| `junior_mode_on` | departure − 235 min | 11:30 |
| `checkin` | departure − 135 | 13:10 |
| `delayed` | departure − 65 | 14:20 |
| `boarded` | departure + delay − 40 | 15:25 |
| `departed` | departure + delay + 2 | 16:07 |
| `landed` | arrival + delay − 3, destination time | 20:57 +09:00 |
| `mission_completed` | previous event + 1 min | |

- `trip_service.py` (two call sites) and `trips.py` use `demo_time` when the setting is on, `local_time` otherwise. Messages follow automatically (`event_messages` takes `at`).
- `docs/api.md` Event shape: one line noting that with `DEMO_CLOCK` on, `at` follows the demo script. No shape change. Add `DEMO_CLOCK=false` to `backend/.env.example`.

## Frontend: live mode (teammate's area)
1. **`src/api/client.ts`**: add `postJson<T>(path, body?)`.
   **`src/api/types.ts`**:
   - add `Trip` (`id`, `childName`, `flight`, `lastEventId`, `missions`, `cap`, `branch`, `chapters`, `events`)
   - add `'mission_completed'` to `EventType` and `'child'` to `source` (both already in api.md)
2. **`src/api/trips.ts`** (new): `getCurrentTrip`, `getTrip(id)`, `createTrip(body)`, `postEvent(id, type, extra?)`, `completeMission(id, missionId)`, `openTripStream(id, after, onEvent)`. The stream is an `EventSource` listening for `trip-event`.
3. **`src/trip/liveTrip.ts`** (new): a small external store.
   - `start()`: `GET /api/trips/current`, polling every 2 s on 404.
   - Then it opens the stream at `?after=lastEventId`. On every `trip-event` it refetches `GET /api/trips/{id}`, so the backend stays the only source of truth and no rules are re-implemented on the phone.
   - Exposes `subscribe` / `getSnapshot`.
4. **`src/trip/useTrip.ts`**:
   - `isLive()` checks `?live`.
   - Live: `useSyncExternalStore` on the store. `step` = the latest event whose type is a trip step (skipping `mission_completed`); `has`, `progress` and `latest` are derived as now.
   - Mock path unchanged.
5. **`src/App.tsx`**: in live mode, the trip routes (`/welcome /child /story /complete /parent /family`) show the Sky background until the first trip arrives. Xplorers routes are untouched.
6. **`src/nav.ts`**: carry `live` like `at`, `age` and `name`.
7. **`src/screens/MissionCompleteScreen.tsx`**:
   - Freeze the trip at mount (`useState(() => trip)`), or the SSE refresh after the press double-counts the miles.
   - Live: `completeMission()` instead of `markDone()` (201 or 200 are both fine; 409 means not open yet).
8. **`src/screens/DemoScreen.tsx`**: in `/demo?live`, it passes `live` into both frames, without `at`.
   - **On mount:** if there's no trip, `createTrip({ childName: program.demoMember.name, ageBand: '6-8', CX 500 2026-11-14, language: 'en' })`.
   - **Trip moment, forward:** POST the missing events in `TRIP_STEPS` order (`delayed` with `delayMinutes: DELAY_MINUTES`). Both phones update over SSE with no reload.
   - **Trip moment, backward:** a new trip, then replay up to that step, then reload the frames.
   - **Reset trip:** a new trip and reload the frames.
   - Events go in as `source: 'simulated'`.
9. **Later, not in this step:** `trip.flight` instead of `mockFlight` (same values today), then `GET /chapters` instead of `mocks/story.ts`.

## Check with the teammate before starting
1. **Who edits their files.** The files are `api/client.ts`, `api/types.ts`, `trip/useTrip.ts`, `App.tsx`, `nav.ts`, `MissionCompleteScreen.tsx`, `DemoScreen.tsx`, plus new `api/trips.ts` and `trip/liveTrip.ts`. Do they build it, or does Earth, with them reviewing the PR?
2. **Freeze.** No edits to `DemoScreen.tsx`, `useTrip.ts`, `MissionCompleteScreen.tsx` or `App.tsx` until the PR merges.
3. **Screens re-render live.** Until now each screen read the trip once per mount. Ask what breaks if `/child`, `/parent`, `/story` or `/family` re-render when an event arrives: the Welcome cover opening, Pip's delay line, the Picked-for-you random draw, globe progress.
4. **Mocks stay default.** Are they OK with `?at=` and /screen-check staying on mocks, the tech beat filmed from `/demo?live`, and the Xplorers screens staying on mocks?
5. **Name and age.** The live trip's `childName` comes from the backend ("Mei"). Should sign-up's `?name=` be sent into `createTrip` instead? Ages 12+ keep ignoring trip missions.
6. **Parent timeline times.** These come from the demo clock and match today's mock times. Confirm `hhmm(e.at)` stays.
7. **Their notes to Earth.**
   - `exitBalance` (29,280) is in program.json: will ExitScreen use it, and call `POST /api/graduation/score`?
   - Renaming `personas.leo.startingBalance` needs their one-line SignUpScreen change: who does it?
8. **Order of later swaps:** `trip.flight`, then `/chapters`.

## Done when
- Backend: `python -m pytest -q` green, including the new `demo_time` tests. A real run with `DEMO_CLOCK=true` (create a trip, then checkin, delayed 40, boarded, departed, landed) returns 11:30 / 13:10 / 14:20 / 15:25 / 16:07 / 20:57 +09:00.
- Frontend: `npm run build`. On `/demo?live`:
  - all six moments update both phones with no reload (Network → `stream` shows `trip-event`)
  - a stamp press shows on the parent timeline and pays once
  - stepping back starts a new trip
  - restarting the backend mid-run recovers via `Last-Event-ID`
- `/demo` without `?live` behaves exactly as before; /screen-check passes on mocks.
