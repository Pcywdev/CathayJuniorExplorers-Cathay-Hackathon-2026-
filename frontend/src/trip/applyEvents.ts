import type { MissionState, TripChapter, TripEvent, TripState } from '../api/types'
import { program } from '../program'

// Events (oldest first) → the trip body GET /api/trips/{id} returns. Mirrors backend logic/trip_view.py:
// check-in available from the start, boarding after check-in, window and arrival after departed;
// the branch switches to delayed and stays there.
// `finished` = missions the child completed on the phone (mock only). Each mission pays once,
// whichever comes first, and the annual cap applies to the running total.
const KEYS: TripChapter['key'][] = ['checkin', 'boarding', 'inflight', 'landing']

export function applyEvents(events: TripEvent[], finished: string[] = []): TripState & { doneOrder: string[] } {
  const byEvent = events.flatMap((e) => (e.mission ? [e.mission.id] : []))
  const departed = events.some((e) => e.type === 'departed')
  // A mission finished on the phone counts only once the trip has reached the point where it opens,
  // so stepping the demo back in time doesn't show later missions as done.
  const opensAt = (id: string, done: string[]) =>
    ({ checkin: true, boarding: done.includes('checkin'), window: departed, arrival: departed })[id] ?? false

  const doneOrder: string[] = [...new Set(byEvent)]
  for (const id of finished) {
    if (!doneOrder.includes(id) && opensAt(id, doneOrder)) doneOrder.push(id)
  }
  // Event completions happen in event order; local ones come after, so recency = position.
  let used = program.demoMember.startingBalance
  for (const id of doneOrder) {
    const m = program.missions.find((x) => x.id === id)
    if (m) used += Math.min(m.miles, program.annualEarnCap - used)
  }

  const done = new Set(doneOrder)
  const unlocked = new Set(events.flatMap((e) => (e.chapterUnlocked ? [e.chapterUnlocked] : [])))
  const opens = (id: string) => opensAt(id, doneOrder)

  return {
    childName: program.demoMember.name,
    missions: program.missions.map((m) => ({
      ...m,
      state: (done.has(m.id) ? 'done' : opens(m.id) ? 'available' : 'locked') as MissionState,
    })),
    cap: { used, limit: program.annualEarnCap },
    branch: events.some((e) => e.branch === 'delayed') ? 'delayed' : 'on_time',
    chapters: KEYS.map((key, i) => ({ number: i + 1, key, locked: !unlocked.has(i + 1) })),
    events,
    doneOrder,
  }
}
