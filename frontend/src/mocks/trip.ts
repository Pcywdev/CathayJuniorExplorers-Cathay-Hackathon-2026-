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
