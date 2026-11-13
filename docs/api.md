# API contract

The contract between backend and frontend. **Any change is agreed by both of us first and updated here in the same commit.**

- Base URL: `http://localhost:8000` locally, the Cloud Run URL when deployed (frontend reads `VITE_API_BASE_URL`).
- JSON everywhere, **camelCase** keys. Times are ISO 8601 with offset (`2026-11-14T10:05:00+08:00`).
- Errors: `{ "detail": "human-readable message" }` with a 4xx/5xx status (FastAPI default).
- Status legend: **live** = implemented; **draft** = shape proposed from plan.md section 9, confirm before building.

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/health` | Liveness + program version | live |
| GET | `/api/flights/lookup` | OAG flight → boarding pass data | live |
| POST | `/api/trips` | Junior mode on → create trip (chapter text from Day 3) | live |
| GET | `/api/trips/current` | Newest trip, so the child phone finds it | live |
| GET | `/api/trips/{id}` | Trip, missions, miles, chapter lock states | live |
| GET | `/api/trips/{id}/chapters` | All chapters for offline storage | draft |
| POST | `/api/trips/{id}/events` | Fire a trip event | live |
| GET | `/api/trips/{id}/stream` | SSE stream of events (both screens) | live |
| POST | `/api/graduation/score` | History → score, breakdown, package | live |

---

## GET /api/health
```json
{ "status": "ok", "service": "little-explorers-api", "programNote": "illustrative, confirm with team" }
```

## GET /api/flights/lookup?carrier=CX&number=500&date=2026-11-14
Serves saved OAG responses (fixtures) first, so it works offline and spends no OAG quota. Only the backend calls OAG, and only when `OAG_LIVE=true` and no fixture exists (the response is then saved as a fixture).
```json
{
  "carrier": "CX", "number": "500", "date": "2026-11-14",
  "origin":      { "iata": "HKG", "city": "Hong Kong", "terminal": "1" },
  "destination": { "iata": "NRT", "city": "Tokyo",     "terminal": "2" },
  "departure": { "local": "2026-11-14T15:25:00+08:00", "utc": "2026-11-14T07:25:00Z" },
  "arrival":   { "local": "2026-11-14T20:20:00+09:00", "utc": "2026-11-14T11:20:00Z" },
  "durationMinutes": 235,
  "distanceKm": 2962,
  "aircraft": { "iata": "333", "name": "Airbus A330-300" },
  "gate": "23",
  "seat": "34K",
  "synthetic": ["gate", "seat"],
  "status": { "oagState": null, "departureDelayMinutes": null, "arrivalDelayMinutes": null },
  "source": "fixture"
}
```
- Params: `carrier` 2 letters/digits, `number` 1 to 9999, `date` = local departure date `YYYY-MM-DD`.
- `local` times carry the airport's own UTC offset (so the frontend can say "Tokyo is 1 hour ahead"); `utc` ends in `Z`. Final-chapter unlock uses `arrival.utc`.
- `gate`/`seat`: **`synthetic` lists which were invented, and the UI must label them.** OAG gives a real gate only once the flight operates (then `synthetic` is just `["seat"]`); passenger seats are never available from OAG. The demo flight is pinned to gate 23, seat 34K.
- `status` is filled only when OAG has operated-flight data (`oagState` is OAG's raw string, e.g. `InGate`); all `null` for a schedule-only flight. Delays are minutes, negative if early.
- `source`: `fixture` | `oag` (a live response is saved, so later calls say `fixture`).
- Errors: `404` no data for that flight; `422` bad params; `502` OAG itself failed (live mode only).

## POST /api/trips
Request (the only child data we take):
```json
{ "childName": "Mei", "ageBand": "6-8", "carrier": "CX", "number": "500", "date": "2026-11-14", "language": "en" }
```
`ageBand`: `6-8` | `9-12`. `language`: `en` | `zh-Hant` (both are generated; this is the default shown).
`childName` 1–30 characters. The flight is looked up as in `/api/flights/lookup` (same `404`/`502`); the trip starts at the demo member's balance (cap `used` 1,250) and emits one `junior_mode_on` event (`source: system`, chapter 1).
Response `201`: same body as `GET /api/trips/{id}`. Errors: `404` unknown flight, `422` bad body.

## GET /api/trips/current
The newest trip, same body as `GET /api/trips/{id}`; `404` if no trip exists yet. The child phone polls this (about every 2 s) until a trip exists, then switches to its stream. Creating a new trip makes it the current one, which is also how to reset the demo.

## GET /api/trips/{id}
```json
{
  "id": "trp_8f2c",
  "childName": "Mei",
  "ageBand": "6-8",
  "language": "en",
  "juniorMode": true,
  "flight": { "...": "same shape as /api/flights/lookup" },
  "missions": [
    { "id": "checkin", "title": "Check-in Champion", "miles": 30, "state": "done" },
    { "id": "boarding", "title": "Boarding Badge", "miles": 50, "state": "available" },
    { "id": "window", "title": "Window Watcher", "miles": 30, "state": "locked" },
    { "id": "arrival", "title": "Arrival Explorer", "miles": 40, "state": "locked" }
  ],
  "cap": { "used": 1280, "limit": 2000 },
  "branch": "on_time",
  "chapters": [ { "number": 1, "key": "checkin", "locked": false }, { "number": 2, "key": "boarding", "locked": true } ],
  "events": [ "...event objects, oldest first (see Event shape)" ],
  "lastEventId": 3,
  "dataUsed": ["ageBand", "destination", "flightLength", "tripEvents"]
}
```
Mission `state`: `locked` | `available` | `done`. `branch`: `on_time` | `delayed`. `404` for an unknown id.
- Mission states: Check-in available from the start; Boarding available once checked in; Window Watcher and Arrival Explorer available once departed. **Window Watcher never completes yet** (its trigger is an open question).
- `chapters`: always four, keys `checkin`, `boarding`, `inflight`, `landing`. Lock states only; the text comes from `/chapters` (Day 3).
- `flight.gate` follows the latest `newGate` from a `delayed` event.
- `lastEventId`: id of the newest event. Open the stream with `?after=<lastEventId>` so nothing is sent twice.

## GET /api/trips/{id}/chapters
Everything the phone stores for offline. Locked chapters are included (stored locked on the device); `unlockAt` lets the final chapter unlock offline at scheduled landing.
```json
{
  "tripId": "trp_8f2c",
  "generatedBy": "llm",
  "chapters": [
    {
      "number": 3, "key": "inflight", "branch": "on_time",
      "unlockOn": "departed", "unlockAt": null,
      "text": { "en": { "title": "...", "pages": ["...", "..."] }, "zh-Hant": { "title": "...", "pages": ["..."] } }
    }
  ]
}
```
`generatedBy`: `llm` | `fallback` (pre-written). `branch`: `both` for chapters with no delayed version. `unlockOn`: `junior_mode_on` | `checkin` | `boarded` | `departed` | `landed`.

## POST /api/trips/{id}/events
Request:
```json
{ "type": "boarded", "source": "simulated", "delayMinutes": null, "newGate": null }
```
`type`: `checkin` | `boarded` | `departed` | `delayed` | `landed` (`junior_mode_on` is emitted by `POST /api/trips`). `source`: `simulated` | `oag` | `system`. `delayMinutes`/`newGate` only for `delayed`.
`delayMinutes` 1–1440, `newGate` 1–4 letters/digits; sending either with another type is `422`. `source` defaults to `simulated`.
Response `201`: the Event (below). The same object is published once on the trip's stream. Errors: `404` unknown trip, `422` bad body (including `junior_mode_on`).
Repeat events are accepted but award nothing and unlock nothing. The delayed bonus mini-mission awards no miles yet (not in program.json).

## GET /api/trips/{id}/stream
`text/event-stream`. Each message is one Event:
```
id: 4
event: trip-event
data: {"type":"boarded", ...}

```
A comment line `: ping` is sent every 15 s to keep the connection open. Listen with `source.addEventListener("trip-event", ...)` (not `onmessage`, because the event is named).
- `?after=N` sends events with id > N first (use the trip's `lastEventId`), then live ones. Without it, only live events.
- On reconnect the browser sends `Last-Event-ID` by itself; the stream replays what was missed. Each event reaches each connection once.
- `404` unknown trip.
Polling fallback: `GET /api/trips/{id}` every second and diff `events`.

## Event shape (one shape for both screens)
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
- `type`: `junior_mode_on` | `checkin` | `boarded` | `departed` | `delayed` | `landed`
- `source`: `simulated` | `oag` | `system`. Simulated events are labelled as such on screen.
- `mission`: `null` when the event awards nothing. `miles` is what was actually awarded after the cap.
- `chapterUnlocked`: chapter number or `null`.
- **`systemLines` is not shown on the phones.** It's for logging, debugging and the architecture slide wording.

## POST /api/graduation/score
Request:
```json
{ "membershipYears": 12, "familyFlights": 20, "juniorMiles": 48000 }
```
Response (numbers from `shared/program.json`):
```json
{
  "score": 158,
  "maxScore": 200,
  "breakdown": [
    { "id": "membershipYears", "label": "Membership years", "points": 60, "max": 75 },
    { "id": "familyFlights", "label": "Family flights", "points": 80, "max": 100 },
    { "id": "juniorMiles", "label": "Junior miles", "points": 18, "max": 25 }
  ],
  "band": { "index": 3, "min": 131, "max": 200 },
  "package": {
    "milesCarriedOver": 48000,
    "statusPointsHeadStart": 150,
    "silverThreshold": 300,
    "transferAllowance": [120000, 80000, 40000]
  }
}
```
- Inputs: whole numbers, `membershipYears` 0–100, `familyFlights` 0–10,000, `juniorMiles` 0–100,000,000, otherwise `422`. All three are required.
- `points` = `pointsPer` for every full `per` units, capped at `max` (program.json `score`). 4,999 junior miles score 0.
- `maxScore` = the sum of the three maxes (200), for "158 of 200".
- `band`: the program.json band containing `score`.
- `statusPointsHeadStart`: the top-band head start (150) **only when `band` is the top band**, otherwise `0`.
- `transferAllowance`: the family transfer **limit** per year for three years after graduating, not miles received.
- Synthetic inputs only; nothing here is stored.
