"""Narrated end-to-end demo of the backend: one trip, two phones, six events.

Plays three roles against a running backend:
  PARENT  creates the trip and presses "Simulate trip" (POST requests)
  CHILD / PARENT phones  each hold an open SSE stream and print what arrives

Run (backend must be running first, from backend/):
  python -m uvicorn app.main:app --port 8000
  python tools/demo_trip.py            # from the repo root, in the Cathay-Hack env
"""

import json
import sys
import threading
import time

import httpx

BASE = "http://127.0.0.1:8000"  # not "localhost": on Windows that tries IPv6 first and adds ~2 s per call
PAUSE = 0.6  # seconds between steps, so the stream output lands next to its step
lock = threading.Lock()
sys.stdout.reconfigure(encoding="utf-8")


def say(text: str = "") -> None:
    with lock:
        print(text, flush=True)


def step(title: str, files: str) -> None:
    say()
    say("=" * 78)
    say(title)
    say(f"  code path: {files}")
    say("-" * 78)


def phone(name: str, trip_id: str, after: int, ready: threading.Event) -> None:
    """One phone: open the stream and print every event it receives (like EventSource does)."""
    url = f"{BASE}/api/trips/{trip_id}/stream"
    with httpx.Client(timeout=None) as client, client.stream("GET", url, params={"after": after}) as r:
        ready.set()
        event_id = None
        for line in r.iter_lines():
            if line.startswith("id: "):
                event_id = line[4:]
            elif line.startswith("data: "):
                e = json.loads(line[6:])
                text = e["childMessage"] if name == "CHILD" else e["parentMessage"]
                miles = f" +{e['mission']['miles']} miles" if e["mission"] else ""
                say(f"  📱 {name:<6} got event #{event_id} ({e['type']}): \"{text}\"{miles}")
            elif line.startswith(":"):
                say(f"  📱 {name:<6} keep-alive ping")


def post_event(trip_id: str, body: dict) -> dict:
    r = httpx.post(f"{BASE}/api/trips/{trip_id}/events", json=body)
    r.raise_for_status()
    return r.json()


def show_rules(e: dict) -> None:
    say(f"  backend rules (systemLines): {e['systemLines'] or ['(nothing changed)']}")
    say(f"  cap now {e['cap']['used']:,} / {e['cap']['limit']:,} · branch {e['branch']} · at {e['at']}")


def main() -> None:
    step("0. Is the server up?", "routers/health.py health() -> program.py get_program()")
    try:
        say(f"  GET /api/health -> {httpx.get(f'{BASE}/api/health').json()}")
    except httpx.ConnectError:
        say("  Server not running. Start it from backend/: python -m uvicorn app.main:app --port 8000")
        return

    step("1. Child phone opens the app: is there a trip yet?",
         "routers/trips.py current_trip() -> store.latest_trip()")
    r = httpx.get(f"{BASE}/api/trips/current")
    say(f"  GET /api/trips/current -> {r.status_code}"
        + (f" (an older trip exists: {r.json()['id']})" if r.status_code == 200 else " (no trip yet, child keeps asking)"))

    step("2. Parent switches junior mode ON",
         "routers/trips.py create_trip() -> services/oag.py lookup_flight() -> logic/flights.py build_flight()\n"
         "             -> store.create_trip() -> trip_service.fire_event('junior_mode_on') -> trip_service.build_trip()")
    body = {"childName": "Mei", "ageBand": "6-8", "carrier": "CX", "number": "500", "date": "2026-11-14", "language": "en"}
    say(f"  POST /api/trips {body}")
    trip = httpx.post(f"{BASE}/api/trips", json=body).json()
    f = trip["flight"]
    say(f"  -> 201 trip {trip['id']}")
    say(f"     flight {f['carrier']} {f['number']}: {f['origin']['iata']} {f['departure']['local']} -> "
        f"{f['destination']['iata']} {f['arrival']['local']} · gate {f['gate']} seat {f['seat']} "
        f"(synthetic: {f['synthetic']}) · source {f['source']}")
    say(f"     cap {trip['cap']['used']:,} / {trip['cap']['limit']:,} · branch {trip['branch']}")
    say(f"     missions {[(m['title'], m['state']) for m in trip['missions']]}")
    say(f"     chapters locked {[c['locked'] for c in trip['chapters']]}")
    say(f"     events so far: {[e['type'] for e in trip['events']]} · lastEventId {trip['lastEventId']}")

    step("3. Both phones find the trip and open a live stream",
         "routers/trips.py current_trip() then routers/events.py stream() -> broker.subscribe()\n"
         "             -> store.events_after() (backlog) -> trip_event_stream() (stays open)")
    current = httpx.get(f"{BASE}/api/trips/current").json()
    say(f"  GET /api/trips/current -> {current['id']} (same trip, so the child found it)")
    say(f"  GET /api/trips/{trip['id']}/stream?after={trip['lastEventId']}  x2 (child + parent)")
    for name in ("CHILD", "PARENT"):
        ready = threading.Event()
        threading.Thread(target=phone, args=(name, trip["id"], trip["lastEventId"], ready), daemon=True).start()
        ready.wait(5)
    time.sleep(PAUSE)
    say(f"  (both streams open, nothing sent yet: they already have event #{trip['lastEventId']} from step 2)")
    say("  (event ids are the database's running number across ALL trips, so they don't restart at 1)")

    sequence = [
        # Same order as the frontend demo (decisions.md 2026-11-13): the delay comes before boarding.
        ("4. Simulate: check-in", {"type": "checkin", "source": "simulated"}),
        ("5. Simulate: delayed 40 min at the gate", {"type": "delayed", "source": "simulated", "delayMinutes": 40}),
        ("6. Simulate: boarded (gate scan)", {"type": "boarded", "source": "simulated"}),
        ("7. Simulate: departed", {"type": "departed", "source": "simulated"}),
        ("8. Simulate: boarded AGAIN (repeat: should award nothing)", {"type": "boarded", "source": "simulated"}),
        ("9. Simulate: landed", {"type": "landed", "source": "simulated"}),
    ]
    for title, body in sequence:
        if body["type"] == "boarded" and title.startswith("8."):
            step("7b. Mei presses the Window Watcher stamp on her phone (no trip event exists for it)",
                 "routers/events.py post_mission_complete() -> trip_service.complete_mission()\n"
                 "             -> logic/rules.py complete_mission() (mission_unlocked + _award, same cap) -> _record() -> both streams")
            r = httpx.post(f"{BASE}/api/trips/{trip['id']}/missions/window/complete")
            say(f"  POST /api/trips/{trip['id']}/missions/window/complete -> {r.status_code}")
            show_rules(r.json())
            time.sleep(PAUSE)
            r = httpx.post(f"{BASE}/api/trips/{trip['id']}/missions/window/complete")
            say(f"  pressed again -> {r.status_code} (already done: nothing recorded, nothing sent)")
        step(title,
             "routers/events.py post_event() -> trip_service.fire_event() -> store.load_state()\n"
             "             -> logic/rules.py apply_event() -> logic/trip_view.py local_time() + event_messages()\n"
             "             -> store.save_trip() + store.append_event() -> broker.publish() -> both streams")
        say(f"  POST /api/trips/{trip['id']}/events {body}")
        show_rules(post_event(trip["id"], body))
        time.sleep(PAUSE)

    step("10. Bad request: junior_mode_on can't be posted (only POST /api/trips makes it)",
         "models/trip.py EventRequest (Literal type) -> FastAPI returns 422 before our code runs")
    r = httpx.post(f"{BASE}/api/trips/{trip['id']}/events", json={"type": "junior_mode_on"})
    say(f"  -> {r.status_code} {r.json()['detail'][0]['msg']}")

    newest = httpx.get(f"{BASE}/api/trips/{trip['id']}").json()["lastEventId"]
    seen = trip["lastEventId"] + 2  # pretend this phone saw check-in and the delay, then lost Wi-Fi
    step(f"11. A phone drops off and reconnects, saying 'last event I saw was #{seen}'",
         f"routers/events.py stream() reads the Last-Event-ID header -> store.events_after({seen})")
    got = []
    with httpx.Client(timeout=3) as client:
        try:
            with client.stream("GET", f"{BASE}/api/trips/{trip['id']}/stream",
                               headers={"Last-Event-ID": str(seen)}) as r:
                for line in r.iter_lines():
                    if line.startswith("id: "):
                        got.append(int(line[4:]))
                        if got[-1] == newest:
                            break
        except httpx.ReadTimeout:
            pass
    say(f"  replayed event ids: {got} (everything after #{seen} up to the newest #{newest}, nothing twice)")

    step("12. End state: what a phone loads on refresh (also the polling fallback)",
         "routers/trips.py get_trip() -> trip_service.build_trip() -> trip_view.mission_states() + chapter_states()")
    final = httpx.get(f"{BASE}/api/trips/{trip['id']}").json()
    say(f"  cap {final['cap']['used']:,} / {final['cap']['limit']:,} · branch {final['branch']} · gate {final['flight']['gate']}")
    say(f"  missions {[(m['title'], m['state']) for m in final['missions']]}")
    say(f"  chapters locked {[c['locked'] for c in final['chapters']]}")
    say("  timeline (what the parent screen lists):")
    for e in final["events"]:
        miles = f" · +{e['mission']['miles']} miles" if e["mission"] else ""
        say(f"    {e['at'][11:16]}  {e['type']:<15} {e['parentMessage']}{miles} · {e['cap']['used']:,} of {e['cap']['limit']:,}")
    say()


if __name__ == "__main__":
    main()
