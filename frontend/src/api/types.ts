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
