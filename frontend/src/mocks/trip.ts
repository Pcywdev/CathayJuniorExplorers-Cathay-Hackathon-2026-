import { missionById, program } from '../program'

// Mock of GET /api/trips/{id} after check-in (docs/api.md). Numbers derive from program.json.
// Flight facts follow the CX 500 OAG fixture (HKG T1 15:25 → NRT T2 20:20); gate and seat are synthetic.
export type MissionState = 'locked' | 'available' | 'done'

const checkin = missionById('checkin')

export const mockTrip = {
  childName: program.demoMember.name,
  flight: {
    carrier: 'CX',
    number: '500',
    from: 'HKG',
    to: 'NRT',
    fromCity: 'Hong Kong',
    toCity: 'Tokyo',
    departs: '15:25',
    arrives: '20:20',
    duration: '3h 55m',
    aircraft: 'Airbus A330-300',
    gate: '23',
    seat: '34K',
  },
  // Synthetic ticket serial, printed on the stub.
  serial: 'LE0500-34K',
  // 0 at the gate, 1 landed. Checked in, not yet boarded.
  progress: 0,
  missions: program.missions.map((m) => ({
    ...m,
    state: (m.id === 'checkin' ? 'done' : m.id === 'boarding' ? 'available' : 'locked') as MissionState,
  })),
  cap: { used: program.demoMember.startingBalance + checkin.miles, limit: program.annualEarnCap },
  chaptersUnlocked: 1,
}

// Synthetic stamps from Mei's earlier trips, for the passport page.
export const mockPastStamps = [
  { city: 'Singapore', date: '2026-04-03', shape: 'circle', rotate: -8, opacity: 0.9 },
  { city: 'Taipei', date: '2025-12-21', shape: 'rect', rotate: 6, opacity: 0.86 },
] as const
