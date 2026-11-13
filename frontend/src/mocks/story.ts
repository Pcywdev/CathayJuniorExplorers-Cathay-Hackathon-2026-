// Pre-written fallback chapters (synthetic) until the story endpoint exists. Shape mirrors a chapter in docs/api.md loosely:
// one chapter per trip moment, unlocked by trip events (decisions.md: junior_mode_on→1, boarded→2, departed→3, landed→4).
export type ChapterArt = 'harbour' | 'gate' | 'clouds' | 'arrival'

export interface Chapter {
  number: number
  title: string
  text: string
  art: ChapterArt
  unlocksWhen: string
  /** Delayed-branch version (plan.md §4: later chapters come in on-time and delayed versions). */
  textDelayed?: string
}

export const mockStoryTitle = 'Pip and the jade sky'

export const mockChapters: Chapter[] = [
  {
    number: 1,
    title: 'A ticket with your name on it',
    text: 'Pip lands on the harbour rail and taps your ticket. “Tokyo,” Pip reads. “That’s a long way for a little bird. Can I come too?”',
    art: 'harbour',
    unlocksWhen: 'Ready now',
  },
  {
    number: 2,
    title: 'Through gate 23',
    text: 'The big plane waits by the window. Pip counts the wheels twice, just to be sure.',
    art: 'gate',
    unlocksWhen: 'Opens when you board',
  },
  {
    number: 3,
    title: 'Above the clouds',
    text: 'Down below, the clouds look like a soft white map. Pip draws a line across it with one wing.',
    textDelayed: 'We waited a little longer, so the clouds had time to puff up big and round. Pip says they look like sheep on a map.',
    art: 'clouds',
    unlocksWhen: 'Opens when the plane takes off',
  },
  {
    number: 4,
    title: 'Hello, Tokyo',
    text: 'Lights everywhere, and a mountain far away. Pip whispers, “We made it. Where shall we explore first?”',
    textDelayed: 'We came in after dark, and Tokyo had switched on every light to say hello. Pip whispers, “Worth the wait. Where first?”',
    art: 'arrival',
    unlocksWhen: 'Opens when you land',
  },
]
