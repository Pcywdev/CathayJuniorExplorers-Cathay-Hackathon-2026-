import { useSyncExternalStore } from 'react'
import { ageFromQuery, MAX_AGE, MIN_AGE } from './discover'

// Member age for Home's "Picked for you".
// The demo panel's age slider sends `{ type: 'xplorers:set-age', age }` into the phone frame (postMessage, same origin).
// That age overrides whatever came in the URL (e.g. the age typed at sign-up) for the rest of this page load,
// and only Home reacts: it remounts with the new age. Other screens and the frame itself stay as they are.

const MESSAGE = 'xplorers:set-age'
const EVENT = 'xplorers:age-changed'
let override: number | undefined

const clamp = (n: number) => Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(n)))

if (typeof window !== 'undefined') {
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return
    const data = e.data as { type?: string; age?: unknown } | null
    if (data?.type !== MESSAGE || typeof data.age !== 'number' || !Number.isFinite(data.age)) return
    override = clamp(data.age)
    window.dispatchEvent(new Event(EVENT))
  })
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('popstate', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('popstate', cb)
  }
}

const read = () => override ?? ageFromQuery()

/** The slider's age if it was moved, else `?age=` (sign-up), else Mei at 7. */
export function useMemberAge(): number {
  return useSyncExternalStore(subscribe, read)
}

/** Demo panel side: tell a phone frame the member's age. */
export function sendMemberAge(frame: HTMLIFrameElement | null, age: number) {
  frame?.contentWindow?.postMessage({ type: MESSAGE, age }, window.location.origin)
}
