import type { EventType, TripEvent } from '../api/types'
import { missionById, program } from '../program'
import { mockFlight } from './trip'

// One synthetic Event per trip moment, in demo order, matching docs/api.md and the wording in backend logic/trip_view.py.
// Miles and the cap come from program.json. Replaced by GET /api/trips/current + the stream.

// The flight lookup carries status delays; the mock keeps the demo delay here (plan.md: delayed 40 min).
export const DELAY_MINUTES = 40

export const addMinutes = (hhmm: string, mins: number) => {
  const [h, m] = hhmm.split(':').map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export const delayedDeparts = addMinutes(mockFlight.departs, DELAY_MINUTES)
export const delayedArrives = addMinutes(mockFlight.arrives, DELAY_MINUTES)

const name = program.demoMember.name
const code = `${mockFlight.carrier} ${mockFlight.number}`
const city = mockFlight.toCity
const day = mockFlight.date
const takeOff = addMinutes(delayedDeparts, 2)

interface Step {
  type: EventType
  at: string
  mission?: string
  chapter?: number
  childMessage: string
  parentMessage: string
}

const STEPS: Step[] = [
  {
    type: 'junior_mode_on',
    at: `${day}T11:30:00+08:00`,
    chapter: 1,
    childMessage: `Hi ${name}! Chapter 1 of your story is ready.`,
    parentMessage: `Junior mode is on for ${name} on ${code}`,
  },
  {
    type: 'checkin',
    at: `${day}T13:10:00+08:00`,
    mission: 'checkin',
    childMessage: `${missionById('checkin').title} collected!`,
    parentMessage: `${name} is checked in for ${code}`,
  },
  {
    type: 'delayed',
    at: `${day}T14:20:00+08:00`,
    childMessage: 'We have extra time!',
    parentMessage: `Delayed ${DELAY_MINUTES} min`,
  },
  {
    type: 'boarded',
    at: `${day}T${addMinutes(delayedDeparts, -40)}:00+08:00`,
    mission: 'boarding',
    chapter: 2,
    childMessage: `${missionById('boarding').title} collected!`,
    parentMessage: `${name} has boarded ${code}`,
  },
  {
    type: 'departed',
    at: `${day}T${takeOff}:00+08:00`,
    chapter: 3,
    childMessage: "We're flying! Chapter 3 is ready.",
    parentMessage: `Departed ${takeOff}, landing about ${delayedArrives}`,
  },
  {
    type: 'landed',
    at: `${day}T${addMinutes(delayedArrives, -3)}:00+09:00`,
    mission: 'arrival',
    chapter: 4,
    childMessage: `${missionById('arrival').title} collected! Welcome to ${city}.`,
    parentMessage: `${name} has landed in ${city}`,
  },
]

function build(): TripEvent[] {
  let used = program.demoMember.startingBalance
  let branch: TripEvent['branch'] = 'on_time'
  return STEPS.map((s) => {
    const m = s.mission ? missionById(s.mission) : null
    const awarded = m ? Math.min(m.miles, program.annualEarnCap - used) : 0
    used += awarded
    if (s.type === 'delayed') branch = 'delayed'
    return {
      type: s.type,
      at: s.at,
      source: s.type === 'junior_mode_on' ? 'system' : 'simulated',
      mission: m ? { id: m.id, title: m.title, miles: awarded } : null,
      cap: { used, limit: program.annualEarnCap },
      chapterUnlocked: s.chapter ?? null,
      branch,
      childMessage: s.childMessage,
      parentMessage: s.parentMessage,
      systemLines: [],
    }
  })
}

export const mockEvents = build()
