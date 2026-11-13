// Shapes from docs/api.md. Keep in sync with the contract.

export interface Health {
  status: 'ok'
  service: string
  programNote: string
}

export type EventType = 'junior_mode_on' | 'checkin' | 'boarded' | 'departed' | 'delayed' | 'landed'

export interface TripEvent {
  type: EventType
  at: string
  source: 'simulated' | 'oag' | 'system'
  mission: { id: string; title: string; miles: number } | null
  cap: { used: number; limit: number }
  chapterUnlocked: number | null
  branch: 'on_time' | 'delayed'
  childMessage: string
  parentMessage: string
  /** Not shown on the phones: logging and the architecture slide only. */
  systemLines: string[]
}

export type MissionState = 'locked' | 'available' | 'done'

export interface TripMission {
  id: string
  title: string
  miles: number
  state: MissionState
}

export interface TripChapter {
  number: number
  key: 'checkin' | 'boarding' | 'inflight' | 'landing'
  locked: boolean
}

/** The parts of GET /api/trips/{id} the screens read. */
export interface TripState {
  childName: string
  missions: TripMission[]
  cap: { used: number; limit: number }
  branch: 'on_time' | 'delayed'
  chapters: TripChapter[]
  events: TripEvent[]
}
