import type { TripEvent } from '../api/types'

// Mock data matching docs/api.md. Use until the real endpoint exists.
export const mockBoardedEvent: TripEvent = {
  type: 'boarded',
  at: '2026-11-14T10:05:00+08:00',
  source: 'simulated',
  mission: { id: 'boarding', title: 'Boarding Badge', miles: 50 },
  cap: { used: 1330, limit: 2000 },
  chapterUnlocked: 2,
  branch: 'on_time',
  childMessage: 'Boarding Badge collected!',
  parentMessage: 'Mei has boarded CX 500',
  systemLines: ['Mission rule passed: Boarding Badge', 'Cap check 1,330 / 2,000 ✓', 'Chapter 2 unlocked'],
}
