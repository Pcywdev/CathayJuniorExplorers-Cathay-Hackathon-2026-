# How Little Explorers works: the demo, start to end

A plain-language guide to the whole system as it stands on 14 Nov. It covers what each part does, how the parts talk to each other, and what happens on both phones at each moment of the demo. Technical details are kept to one short **Important technical bit** box per section, which points at the file to open if you want to go deeper.

---

## 1. The 30-second version

1. A parent flying with their child turns on **Junior Mode** in the Cathay app.
2. The server looks up the flight (CX 500, Hong Kong → Tokyo) and starts a **trip** for the child, Mei.
3. As the trip happens (check-in, delay, boarding, take-off, landing), each moment is sent to the server as an **event**.
4. For each event the server works out what Mei earns (miles, a stamp, a new story chapter) and saves it.
5. It then tells **both phones at the same moment**: Mei's phone shows "Boarding Badge collected!" and the parent's phone shows "Mei has boarded CX 500".

That's the whole product loop. Everything below explains one part of it.

---

## 2. The cast: who's who

| Who | Role in one line | What it knows | Talks to |
|---|---|---|---|
| **Parent phone** (`ParentScreen`) | Turns Junior Mode on and watches the trip timeline | Only what the server tells it | Backend |
| **Child phone** (`ChildScreen` and friends) | Shows missions, stamps, the story and miles | Only what the server tells it | Backend |
| **Backend server** (`backend/app/`) | The referee and the messenger: decides what each event is worth and tells both phones | The rules, every trip, every event | Phones, database, flight data |
| **Database** (SQLite file `backend/data/little-explorers.db`) | Memory: keeps trips and events so a refresh or restart loses nothing | Every trip and every event ever recorded | Backend only |
| **Flight data** (OAG, or a saved copy in `backend/fixtures/oag/`) | Real flight times and airports | Flight schedules | Backend only |
| **Program rules** (`shared/program.json`) | The numbers: miles per mission, the 2,000-a-year cap, graduation scoring | Numbers only | Read by backend *and* frontend |

```
   ┌──────────────┐                         ┌──────────────┐
   │ Parent phone │                         │ Child phone  │
   └──────┬───────┘                         └──────┬───────┘
          │  asks (HTTP requests)                  │
          │  ◄── live updates (stream) ──►         │
          ▼                                        ▼
   ┌─────────────────────────────────────────────────────┐
   │                   Backend server                    │
   │   referee (rules)  ·  messenger  ·  memory keeper   │
   └───────┬──────────────────┬──────────────────┬───────┘
           ▼                  ▼                  ▼
      Database          Flight data        program.json
     (trips, events)   (OAG / saved)     (miles, cap, scores)
```

The key idea is that **the phones never talk to each other.** They both talk to the server, and the server keeps them in sync. That's why both phones always agree.

---

## 3. The words you'll see

| Word | Plain meaning | Real example from the demo |
|---|---|---|
| **Trip** | One child on one flight. Created when Junior Mode is turned on | `trp_ee09e0f6`: Mei, CX 500, 14 Nov |
| **Event** | One thing that happened on the trip. The server stores it and sends it to both phones | "boarded", +50 miles, event #4 |
| **Event type** | Which moment it is: `junior_mode_on`, `checkin`, `delayed`, `boarded`, `departed`, `landed`, plus `mission_completed` when the child taps a stamp | `checkin` |
| **Mission** | A small task worth miles. There are four: Check-in Champion 30, Boarding Badge 50, Window Watcher 30, Arrival Explorer 40 | Boarding Badge |
| **Mission state** | `locked` (not yet), `available` (can do it now) or `done` | Boarding Badge stays locked until check-in |
| **Cap** | The most junior miles Mei can earn in a year (2,000). She starts at 1,250 already earned | "1,330 / 2,000" |
| **Chapter** | One of four story parts (check-in, boarding, in-flight, landing). Each unlocks at a trip moment | Chapter 2 unlocks on "boarded" |
| **Branch** | Which version of the story Mei gets: `on_time` or `delayed`. Once delayed, it stays delayed | A 40-minute delay switches to `delayed` |
| **Stream** | A connection that stays open so the server can push new events to a phone the instant they happen | Both phones hold one open per trip |
| **Event id** | A running number on every event, so a phone can say "the last one I saw was #3" | #1, #2, #3 … |
| **Source** | Where an event came from: `system` (the server), `simulated` (the demo button), `oag` (real flight data), `child` (a stamp tap) | `simulated` |
| **Synthetic** | Made-up fields we label as such, because flight data doesn't give them | Gate 23 and seat 34K |

---

## 4. The demo, screen by screen

This is the core of the guide. For each moment you'll see what's on the screens, what triggers it, which **endpoint** (server address) is called, what the server does, and what both phones show next.

> **Honest status:** the screens are built, but today they run on **mock data** (`frontend/src/mocks/`). The only real server call they make is the health check. The `tools/demo_trip.py` script plays the role of both phones against the real server. So for each moment below, the *Call* line shows what the screens **will** call once they're wired up (see section 8), and what the script calls today.

### Moment 0: The app opens (is the server alive?)
- **On screen:** the small `HealthCard` at the bottom of both phones.
- **Trigger:** automatic, when the screen loads.
- **Call:** `GET /api/health` → `{"status": "ok", "service": "little-explorers-api", ...}`
- **Backend does:** answers right away, and nothing else.
- **Phones then:** show "Backend status: ok from little-explorers-api", or "Can't reach the backend". If it fails, you know before going on stage.

### Moment 1: Mei's phone asks "is there a trip for me?"
- **On screen:** Mei's phone, before the parent has done anything (`WelcomeScreen` / `ChildScreen`).
- **Trigger:** automatic on load, then the phone keeps asking every few seconds.
- **Call:** `GET /api/trips/current` → `404 No trip yet` (and later the full trip)
- **Backend does:** looks up the newest trip in the database.
- **Phones then:** keep waiting, or show the trip once one exists.

### Moment 2: Parent turns Junior Mode on
- **On screen:** the parent's `ParentScreen`, with the `JuniorModeToggle` switch in the header.
- **Trigger:** the parent flips the switch.
- **Call:** `POST /api/trips`
  ```json
  sends:   { "childName": "Mei", "ageBand": "6-8", "carrier": "CX", "number": "500", "date": "2026-11-14", "language": "en" }
  returns: { "id": "trp_ee09e0f6", "flight": {...gate 23, seat 34K...}, "cap": {"used": 1250, "limit": 2000},
             "missions": [Check-in available, the rest locked], "chapters": [1 open, 2–4 locked],
             "events": [junior_mode_on], "lastEventId": 1 }
  ```
- **Backend does:** (1) finds the flight (the saved copy, so the OAG quota isn't used), (2) creates the trip starting at 1,250 miles, (3) picks Mei's story (a reviewed story if one is saved for this flight, otherwise the pre-written fallback), (4) records the first event, `junior_mode_on`, which unlocks Chapter 1.
- **Phones then:** the parent sees "Junior mode is on for Mei on CX 500". Mei's phone, on its next "is there a trip?" check, finds it and shows "Hi Mei! Chapter 1 of your story is ready." on the `WelcomeScreen` passport.

> **Important technical bit:** bad input never reaches our code. If `ageBand` is `"3-5"`, FastAPI rejects the request with `422` automatically, because the allowed values are listed in `models/trip.py` (`CreateTripRequest`).

### Moment 3: Both phones "tune in" to the trip
- **On screen:** nothing visible, but this is what makes the rest feel live.
- **Trigger:** automatic, as soon as a phone knows the trip id.
- **Call:** `GET /api/trips/trp_ee09e0f6/stream?after=1`, one per phone. It **stays open**.
- **Backend does:** registers the phone as a listener for this trip. It first sends any events after #1 that the phone missed, then waits and pushes each new event as it happens. Every 15 seconds of quiet it sends a small "ping" so the connection isn't cut.
- **Phones then:** are ready. Each new event arrives within a fraction of a second.

> **Important technical bit:** the server adds the phone as a listener *before* reading the missed events. If it did it the other way round, an event arriving in between could be lost. See `stream()` in `routers/events.py`.

### Moment 4: Check-in
- **On screen:** on Mei's `ChildScreen`, the `BoardingPass` carries "Check-in Champion". The parent's timeline shows "Check-in" as upcoming.
- **Trigger:** in real life, airline flight status. In the demo, the presenter's **Simulate** control.
- **Call:** `POST /api/trips/{id}/events` with `{"type": "checkin", "source": "simulated"}`
- **Backend does:** the referee checks the rules. Check-in → Check-in Champion, worth 30 miles, and 1,250 + 30 = 1,280 fits under 2,000. It saves the result and pushes the event to both streams.
- **Phones then:** Mei sees "Check-in Champion collected!" and the miles bar (`MilesProgress`) moves to 1,280. The parent's timeline gets a new row: "Mei is checked in for CX 500 · +30 miles · 1,280 of 2,000". Boarding Badge goes from locked to available.

### Moment 5: The flight is delayed 40 minutes
- **On screen:** Pip, the mascot, changes to its "extra time" pose and says "We have extra time!". The parent's upcoming times shift by 40 minutes.
- **Trigger:** Simulate (or real flight status).
- **Call:** `POST /api/trips/{id}/events` with `{"type": "delayed", "source": "simulated", "delayMinutes": 40}` (optionally `"newGate": "27"`)
- **Backend does:** awards no miles. It switches the story **branch** to `delayed` for the rest of the trip and adds the 40 minutes to the running delay total. That total pushes back the landing chapter's unlock time.
- **Phones then:** Mei's later chapters are now the "delayed" versions (e.g. "Extra time at gate 23"). The parent sees "Delayed 40 min".

### Moment 6: Boarding
- **Call:** `POST /api/trips/{id}/events` with `{"type": "boarded"}`
- **Backend does:** Boarding Badge +50 (cap 1,330) and unlocks **Chapter 2**.
- **Phones then:** Mei: "Boarding Badge collected!", plus a new chapter in the `ChapterMap`. Parent: "Mei has boarded CX 500".

### Moment 7: Take-off
- **Call:** `POST /api/trips/{id}/events` with `{"type": "departed"}`
- **Backend does:** no miles. It unlocks **Chapter 3** and opens Window Watcher and Arrival Explorer.
- **Phones then:** Mei: "We're flying! Chapter 3 is ready." The globe (`RouteGlobe`) shows the plane halfway. Parent: "Departed 01:30, landing about 21:00". The landing time is the scheduled 20:20 plus the 40-minute delay. The departure time is the real clock when the button was pressed (see section 10).

### Moment 7b: Mei taps the Window Watcher stamp herself
This is the only moment the **child** causes an event. There's no airport signal for "looked out of the window", so Mei does it.
- **On screen:** Mei holds "Start mission" on her `BoardingPass`, which opens `MissionCompleteScreen`, and she presses the `Stamp`.
- **Call:** `POST /api/trips/{id}/missions/window/complete` (no body)
- **Backend does:** checks the mission is open (it is, after take-off) and awards 30 miles (cap 1,360). It records a `mission_completed` event and pushes it to both phones.
- **Phones then:** Mei: "Window Watcher collected!". Parent: "Mei completed Window Watcher · +30 miles".

> **Important technical bit:** the answer code carries meaning. `201` means "awarded just now". `200` means "already done", and the server sends back the original event without recording anything new. A double-tap is harmless. If Mei taps a mission that isn't open yet, the server answers `409`. See `post_mission_complete()` in `routers/events.py`.

### Moment 8: The same event arrives twice
Real flight feeds sometimes repeat themselves, so the demo sends "boarded" a second time on purpose.
- **Backend does:** records the event, but the referee sees Boarding Badge is already done and awards **0 miles**. The cap stays 1,360.
- **Why it matters:** a repeated or glitchy signal can never pay twice. This is a good point to make to judges.

### Moment 9: Landing
- **Call:** `POST /api/trips/{id}/events` with `{"type": "landed"}`
- **Backend does:** Arrival Explorer +40 (cap **1,400 / 2,000**) and unlocks **Chapter 4**. The event's time is shown in Tokyo time (+09:00), because that's where Mei now is.
- **Phones then:** Mei: "Arrival Explorer collected! Welcome to Tokyo.", plus a Tokyo stamp on her `PassportPage` and a new "See me at 18" link. Parent: "Mei has landed in Tokyo".

### Moment 10: Reading the story
- **On screen:** Mei taps "Read my trip story", which opens `StoryScreen` with the `ChapterMap`.
- **Call:** `GET /api/trips/{id}/chapters`
  ```json
  returns: { "generatedBy": "fallback", "title": {"en": "Pip and the jade sky"},
             "chapters": [ 7 versions: chapter 1 once, chapters 2–4 each as on_time + delayed,
                           each with title + pages, e.g. "Extra time at gate 23",
                           chapter 4 with "unlockAt": "2026-11-14T12:00:00Z" ] }
  ```
- **Backend does:** takes the saved story, fills in Mei's name, the city and the gate, and works out when the landing chapter opens.
- **Phones then:** the phone downloads **all** chapters at once, including locked ones, and saves them. On the plane, with no Wi-Fi, it can still open Chapter 4 by itself at `unlockAt` (scheduled landing + delay). The `chapters` list from `GET /api/trips/{id}` tells the phone which ones are unlocked, and the `branch` tells it which version to show.

> **Important technical bit:** the child's name is filled in only at this moment. It's never stored inside the story and never sent to an AI. See `prepare()` in `logic/story.py`.

### Moment 11: "See me at 18" (graduation)
- **On screen:** Mei taps "See me at 18", which opens `GraduationScreen`.
- **Call:** `POST /api/graduation/score`
  ```json
  sends:   { "membershipYears": 12, "familyFlights": 20, "juniorMiles": 48000 }
  returns: { "score": 158, "maxScore": 200, "breakdown": [60, 80, 18 points ...],
             "band": {"index": 3}, "package": { "milesCarriedOver": 48000, "statusPointsHeadStart": 150, ... } }
  ```
- **Backend does:** pure maths using the formulas in `program.json`. It saves nothing.
- **Phones then:** shows the score, which band Mei is in, and what she takes into adult membership.

### Moment 12: A phone drops off and comes back
- **Trigger:** Wi-Fi blips, or the screen is refreshed.
- **What happens:** the browser reconnects the stream by itself and says "the last event I saw was #3". The server replays only #4 to #8, with nothing missed and nothing doubled.
- **Backup plan:** if the stream fails completely on stage, the phones can call `GET /api/trips/{id}` every second instead. It returns the full trip, with all events, missions, chapters and the cap.

---

## 5. Endpoint cheat sheet (all 10)

| Endpoint | Plain purpose | Triggered by | Sends | Gets back |
|---|---|---|---|---|
| `GET /api/health` | Is the server up? | `HealthCard`, on load | nothing | status |
| `GET /api/flights/lookup?carrier=CX&number=500&date=…` | Look up a flight without making a trip | (preview a flight before Junior Mode; not used by any screen yet) | flight code + date | flight |
| `POST /api/trips` | Start a trip | Parent's `JuniorModeToggle` | child name, age band, flight | full trip |
| `GET /api/trips/current` | Is there a trip right now? | Both phones on open | nothing | full trip, or 404 |
| `GET /api/trips/{id}` | Full trip right now | Refresh, or the polling backup | nothing | full trip |
| `GET /api/trips/{id}/chapters` | All story text, for offline use | `StoryScreen` | nothing | title + 7 chapter versions |
| `POST /api/trips/{id}/events` | Something happened on the trip | Simulate control / real flight status | event type (+ delay, gate) | the new event |
| `POST /api/trips/{id}/missions/{missionId}/complete` | Child did a mission | `Stamp` on `MissionCompleteScreen` | nothing | the event (201 new, 200 already done) |
| `GET /api/trips/{id}/stream` | Live updates | Both phones, kept open | last event id seen | events, as they happen |
| `POST /api/graduation/score` | "See me at 18" score | `GraduationScreen` | years, flights, miles | score, band, package |

**The two shapes to know.** Almost everything returns one of two things:
- A **Trip**: who, which flight, missions with states, cap, branch, chapter locks, every event so far, and `lastEventId`.
- An **Event**: type, time, source, mission awarded (or none), cap after it, chapter unlocked (or none), branch, `childMessage`, `parentMessage`, and `systemLines`. `systemLines` holds the referee's reasoning, like "Cap check 1,330 / 2,000 ✓", and is meant for the architecture slide, not the phones.

The exact field lists are in [docs/api.md](api.md).

---

## 6. Inside the backend: how the files work together

Think of the backend as a small office where each folder has one job.

| Job | Folder / file | What it does |
|---|---|---|
| **Front desk** | [routers/](../backend/app/routers/) | Receives each request, checks it, hands it to the right person, and sends the answer back. One file per area: `trips`, `events`, `flights`, `graduation`, `health` |
| **Forms** | [models/](../backend/app/models/) | The shapes of everything in and out (Trip, Event, Flight, …). Anything that doesn't fit is rejected at the desk |
| **Conductor** | [trip_service.py](../backend/app/trip_service.py) | Runs one event start to finish, in order: load → referee → wording → save → announce |
| **Referee** | [logic/](../backend/app/logic/) | Pure rules, with no database, clock or internet: [rules.py](../backend/app/logic/rules.py) (miles, cap, chapters, branch), [trip_view.py](../backend/app/logic/trip_view.py) (mission states and the messages each phone sees), [story.py](../backend/app/logic/story.py) (story checks and fill-in), [graduation.py](../backend/app/logic/graduation.py) (score), [flights.py](../backend/app/logic/flights.py) (turns OAG's big answer into our small Flight) |
| **Filing cabinet** | [store.py](../backend/app/store.py) + [db.py](../backend/app/db.py) | Saves and loads trips, events and stories in SQLite |
| **Messenger** | [broker.py](../backend/app/broker.py) | Keeps a list of which phones are listening to which trip, and hands each new event to all of them |
| **Outside helpers** | [services/](../backend/app/services/) | [oag.py](../backend/app/services/oag.py) gets flight data (saved copy first, live OAG only if allowed), and [stories.py](../backend/app/services/stories.py) picks the story (saved reviewed story, or the fallback) |
| **Rulebook** | [shared/program.json](../shared/program.json) via [program.py](../backend/app/program.py) | Every number. Nothing is typed into the code |
| **Opening up** | [main.py](../backend/app/main.py) + [config.py](../backend/app/config.py) | Starts the app, creates the database tables, connects the front desks, and reads settings |

### Follow one "boarded" event through the office
1. **Front desk** (`routers/events.py`, `post_event`): "Is this a real trip? Is `boarded` an allowed type?" Yes, so it's passed on.
2. **Conductor** (`trip_service.py`, `fire_event`) takes over.
3. **Filing cabinet** (`store.py`): "Here's the trip as it was: cap 1,280, check-in done, chapter 1 open, branch delayed."
4. **Referee** (`logic/rules.py`, `apply_event`): "Boarded → Boarding Badge, not done yet, 50 fits under the cap → award 50. Boarded → unlock chapter 2." The result is a *new* state; the old one is never changed in place.
5. **Referee** (`logic/trip_view.py`): writes the two sentences, "Boarding Badge collected!" for Mei and "Mei has boarded CX 500" for the parent, plus the time in Hong Kong time.
6. **Conductor** builds one Event from all of that.
7. **Filing cabinet** saves the new state and the event, and the event gets its number (#4).
8. **Messenger** (`broker.py`) hands event #4 to every phone listening on this trip.
9. **Front desk** answers the Simulate button with the same event (`201`).

The mission-tap endpoint follows the same path, except step 4 is `complete_mission` instead of `apply_event`.

> **Important technical bit:** the referee (`logic/`) never touches the outside world. That's why it can be tested on its own (`tests/test_rules.py`) and why the rules are easy to trust. Everything that does touch the outside world goes through the conductor or a front desk.

### "If I want to change X, where do I go?"

| I want to… | Go to |
|---|---|
| Change miles, the cap, or graduation formulas | `shared/program.json` (no code change needed) |
| Change which event awards which mission or unlocks which chapter | `EVENT_MISSION` / `EVENT_CHAPTER` at the top of `logic/rules.py` |
| Change when a mission opens | `mission_unlocked()` in `logic/rules.py` |
| Change what the phones *say* | `event_messages()` in `logic/trip_view.py` |
| Change the story text | `backend/fixtures/stories/fallback.json` (rules for a valid story are in `logic/story.py`) |
| Add a field to the trip or event | `models/trip.py`, then `trip_service.py`, then update `docs/api.md` and `frontend/src/api/types.ts` |
| Add a new endpoint | a function in `routers/`, its shapes in `models/`, and the logic in `logic/` |

---

## 7. Live updates, explained

There are two ways a phone can find out something new:
- **Polling** is like texting "anything new?" every second. It's simple, but slow and wasteful.
- **Streaming** (SSE, "server-sent events") is like a phone call the server keeps open. When something happens, the server just says it. That's what `/stream` is.

In the browser, one line opens the call: `new EventSource(".../stream?after=" + lastEventId)`. Every message arrives labelled `trip-event`, with an `id` (the event number) and `data` (the Event).

**If the call drops**, the browser redials by itself and tells the server the last id it heard (`Last-Event-ID`). The server replays only what was missed. The `after=` value on the first connection does the same job, so a phone that just loaded the trip doesn't receive events it already has.

> **Important technical bit:** the messenger is in memory, so if the server restarts, the open calls drop. The phones redial and the database fills in anything missed, so no events are lost. Polling `GET /api/trips/{id}` is the stage backup.

---

## 8. Frontend: what's wired today, and the to-do list

**Today:** the screens look finished, but they read from `frontend/src/mocks/`. `useTrip()` in `src/trip/useTrip.ts` builds a pretend trip from mock events, and the `?at=checkin` / `?at=landed` part of the URL picks how far through the trip to be. The demo page (`/demo`, `DemoScreen`) shows both phones side by side, and its **Trip moment** buttons only change that `?at=`; they don't call the server yet. A stamp press is saved in the browser tab (`trip/localMissions.ts`), not on the server. The only real server call is `HealthCard` → `/api/health`.

**Rule from `frontend/CLAUDE.md`:** every server call lives in `frontend/src/api/` (`client.ts` has the base address). Screens never call `fetch` themselves.

**Wiring checklist** (what each screen should call):

| Screen / part | Replace mock with |
|---|---|
| `useTrip()` (feeds every trip screen) | `GET /api/trips/current` once, then `EventSource` on `/stream?after=lastEventId`, adding each `trip-event` to the trip. Backup: poll `GET /api/trips/{id}` |
| `ParentScreen` → `JuniorModeToggle` | `POST /api/trips` |
| `DemoScreen` → Trip moment buttons | `POST /api/trips/{id}/events` (this becomes the real **Simulate** control) |
| `MissionCompleteScreen` → `Stamp` | `POST /api/trips/{id}/missions/{id}/complete`, replacing `markDone()` |
| `StoryScreen` | `GET /api/trips/{id}/chapters` (replacing `mocks/story.ts`), saved for offline use |
| `GraduationScreen` | `POST /api/graduation/score` (replacing `mocks/graduation.ts`) |
| `src/api/types.ts` | add `mission_completed` to `EventType` and `'child'` to `source`, to match the backend |

Once `useTrip()` uses the stream, the two phones on `/demo` will stay in sync through the server, with no extra work.

---

## 9. See it yourself

1. Start the server: from `backend/`, run `python -m uvicorn app.main:app --port 8000` (Cathay-Hack env).
2. In a second terminal at the repo root, run `python tools/demo_trip.py`. It plays the parent, the Simulate control and both phones, and prints every event each phone receives. The moments above match its numbered steps.
3. Open `http://127.0.0.1:8000/docs`. FastAPI builds this page from the forms (`models/`), and you can try each endpoint from there.
4. **Be the phone:** run `curl -N http://127.0.0.1:8000/api/trips/<id>/stream` in one terminal, then post an event from `/docs` and watch it appear.
5. **Change a rule:** in `shared/program.json`, set Boarding Badge to 800 miles, restart, and rerun the demo. At 1,280 only 720 fit under 2,000, so boarding should award 720 ("Cap reached: 720 of 800 miles awarded") and later missions 0. Put it back afterwards.

**Tests as a second explanation:** each test is a small, named promise. `tests/test_rules.py` covers the referee, and `test_full_trip_with_delay` in `tests/test_trips_api.py` is the whole demo as a test.

---

## 10. Still open
- **Simulated times use the real clock**, so the demo can show "Departed 01:30" at night instead of the scheduled 15:25. Should simulated events show scheduled flight times?
- **Delay bonus:** the delay currently awards no miles. Should there be a mission for it (the "Count the planes at the gate" bonus shown on `ChildScreen`)?
- **AI-written stories:** today every trip gets a saved reviewed story or the fallback. Generating one live (with safety checks) is the next milestone in `services/stories.py`.
- **Chinese:** `language: "zh-Hant"` is accepted, but only English story text exists, so it falls back to English.

---

## 11. Say it out loud (self-check)

Try answering each one without looking. Answers are below.

1. Why do both phones always show the same thing?
2. The parent flips Junior Mode on. Name the four things the server does.
3. What's the difference between `POST /events` and `POST /missions/{id}/complete`? Who triggers each?
4. Mei is at 1,980 miles and boards. What does she get, and why?
5. "Boarded" arrives twice. What happens to the miles?
6. Mei's phone loses Wi-Fi at #3 and comes back. How does it catch up?
7. How does Chapter 4 open on the plane with no Wi-Fi?
8. You want check-in to be worth 50 miles. Which file do you change?

<details>
<summary>Answers</summary>

1. They never talk to each other. Both listen to the server's stream for the same trip, and the server sends each event to every listener at once.
2. Find the flight, create the trip at 1,250 miles, pick the story, and record `junior_mode_on` (which unlocks Chapter 1). Then it returns the whole trip.
3. `/events` is for trip moments (check-in, delay, boarding, take-off, landing), sent by the airline feed or the Simulate control. `/missions/{id}/complete` is the child pressing a stamp, and it's the only way Window Watcher gets done.
4. 20 miles. The cap is 2,000, so only 20 of the 50 fit. The event says "Cap reached: 20 of 50 miles awarded".
5. Nothing new. The mission is already done, so the referee awards 0 and the cap doesn't move.
6. The browser reconnects the stream with `Last-Event-ID: 3`, and the server replays #4 onwards from the database.
7. The phone downloaded every chapter earlier from `/chapters`. Chapter 4 carries an `unlockAt` time (scheduled landing + delay), so the phone opens it by itself.
8. `shared/program.json`. No code change.

</details>
