// Flight facts for the demo trip. They follow the CX 500 OAG fixture (HKG T1 15:25 → NRT T2 20:20); gate and seat are synthetic.
// Trip state (missions, cap, chapters) comes from useTrip(), built from mocks/events.ts.
export const mockFlight = {
  carrier: 'CX',
  number: '500',
  date: '2026-11-14',
  from: 'HKG',
  to: 'NRT',
  fromCity: 'Hong Kong',
  toCity: 'Tokyo',
  boards: '14:45',
  departs: '15:25',
  arrives: '20:20',
  duration: '3h 55m',
  aircraft: 'Airbus A330-300',
  fromTerminal: 'Terminal 1',
  toTerminal: 'Narita Terminal 2',
  gate: '23',
  seat: '34K',
}

// Synthetic ticket serial, printed on the stub.
export const mockSerial = 'LE0500-34K'

// Synthetic stamps from Mei's earlier trips, for the passport page.
export const mockPastStamps = [
  { city: 'Singapore', date: '2026-04-03', shape: 'circle', rotate: -8, opacity: 0.9 },
  { city: 'Taipei', date: '2025-12-21', shape: 'rect', rotate: 6, opacity: 0.86 },
] as const

// Every stamp Mei collects from Little Xplorers to exit (synthetic), for the exit passport.
// Years follow Mei at 7 in 2026; Tokyo is this demo trip.
export const mockAllStamps = [
  { city: 'Taipei', date: '2025-12-21', shape: 'rect', rotate: 6, opacity: 0.86 },
  { city: 'Singapore', date: '2026-04-03', shape: 'circle', rotate: -8, opacity: 0.9 },
  { city: 'Tokyo', date: '2026-11-14', shape: 'circle', rotate: 7, opacity: 0.92 },
  { city: 'Bangkok', date: '2029-07-18', shape: 'oval', rotate: -4, opacity: 0.88 },
  { city: 'Seoul', date: '2033-08-02', shape: 'rect', rotate: -9, opacity: 0.9 },
  { city: 'Osaka', date: '2035-03-27', shape: 'circle', rotate: 5, opacity: 0.87 },
  { city: 'London', date: '2039-09-14', shape: 'oval', rotate: 8, opacity: 0.91 },
  { city: 'Sydney', date: '2041-06-30', shape: 'rect', rotate: -6, opacity: 0.89 },
] as const
