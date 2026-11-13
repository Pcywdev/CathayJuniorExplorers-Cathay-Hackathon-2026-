import { useMemo } from 'react'
import type { EventType } from '../api/types'
import { mockEvents } from '../mocks/events'
import { applyEvents } from './applyEvents'
import { localDone } from './localMissions'

// Mock trip source until the screens use GET /api/trips/current + the stream.
// `?at=` picks how far through the trip to be, so every moment can be shown and screenshotted.
export const TRIP_STEPS = ['welcome', 'checkin', 'delayed', 'boarded', 'departed', 'landed'] as const
export type TripStep = (typeof TRIP_STEPS)[number]

const STEP_EVENT: Record<TripStep, EventType> = {
  welcome: 'junior_mode_on',
  checkin: 'checkin',
  delayed: 'delayed',
  boarded: 'boarded',
  departed: 'departed',
  landed: 'landed',
}

export function currentStep(): TripStep {
  const at = new URLSearchParams(window.location.search).get('at') ?? ''
  return (TRIP_STEPS as readonly string[]).includes(at) ? (at as TripStep) : 'checkin'
}

// Read once per screen mount (screens remount on every navigation), so finished missions show on return.
export function useTrip() {
  const step = currentStep()
  return useMemo(() => {
    const upTo = mockEvents.findIndex((e) => e.type === STEP_EVENT[step])
    const trip = applyEvents(mockEvents.slice(0, upTo + 1), localDone())
    const has = (t: EventType) => trip.events.some((e) => e.type === t)
    // 0 at the gate, 0.5 in the air, 1 landed.
    const progress = has('landed') ? 1 : has('departed') ? 0.5 : 0
    return { trip, step, has, progress, latest: trip.events[trip.events.length - 1] }
  }, [step])
}
