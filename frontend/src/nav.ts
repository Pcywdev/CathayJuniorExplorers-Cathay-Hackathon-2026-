import { useSyncExternalStore } from 'react'

// Tiny pushState navigation (no router dependency, see docs/decisions.md).
export type Route =
  | '/home'
  | '/xplorers'
  | '/signup'
  | '/welcome'
  | '/child'
  | '/story'
  | '/complete'
  | '/exit'
  | '/ahead'
  | '/graduation'
  | '/parent'
  | '/family'
  | '/demo'

const ROUTES: Route[] = ['/home', '/xplorers', '/signup', '/welcome', '/child', '/story', '/complete', '/exit', '/ahead', '/graduation', '/parent', '/family', '/demo']
const EVENT = 'little-explorers:navigate'

function current(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') as Route
  return ROUTES.includes(path) ? path : '/child'
}

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(EVENT, cb)
  }
}

// The mock trip step (`?at=`), member age (`?age=`) and name from sign-up (`?name=`) travel with every navigation; other params are per screen.
export function navigate(to: Route, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params)
  const current = new URLSearchParams(window.location.search)
  for (const key of ['at', 'age', 'name']) {
    const value = current.get(key)
    if (value && !query.has(key)) query.set(key, value)
  }
  const qs = query.toString()
  const url = qs ? `${to}?${qs}` : to
  if (window.location.pathname + window.location.search === url) return
  window.history.pushState(null, '', url)
  window.scrollTo(0, 0)
  window.dispatchEvent(new Event(EVENT))
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, current)
}

export const searchParam = (key: string) => new URLSearchParams(window.location.search).get(key)

// Order used to pick the slide direction between screens.
export const routeDepth: Record<Route, number> = {
  '/home': -4,
  '/xplorers': -3,
  '/signup': -2,
  '/welcome': -1,
  '/child': 0,
  '/story': 1,
  '/complete': 1,
  '/exit': 1,
  '/ahead': 1,
  '/graduation': 1,
  '/parent': 0,
  '/family': 1,
  '/demo': 0,
}
