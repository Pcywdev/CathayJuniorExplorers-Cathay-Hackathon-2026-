// Missions the child finished on this phone (press the stamp), in the order they were finished.
// Kept for the browser tab session so the demo's frames share them; the trip events still award
// their own missions. When the API is wired, finishing a mission becomes a POST and this goes away.
const KEY = 'little-explorers:missions-done'

export function localDone(): string[] {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function markDone(id: string) {
  const done = localDone()
  if (done.includes(id)) return
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify([...done, id]))
  } catch {
    /* storage blocked: the mission still shows complete on this screen */
  }
}

export function resetLocalMissions() {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    /* nothing stored */
  }
}
