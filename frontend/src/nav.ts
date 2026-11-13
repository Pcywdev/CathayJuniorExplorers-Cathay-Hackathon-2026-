import { useSyncExternalStore } from 'react'

// Tiny pushState navigation (no router dependency, see docs/decisions.md).
export type Route = '/welcome' | '/child' | '/story' | '/complete' | '/graduation' | '/parent' | '/family' | '/demo'

const ROUTES: Route[] = ['/welcome', '/child', '/story', '/complete', '/graduation', '/parent', '/family', '/demo']
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

// The mock trip step (`?at=`) travels with every navigation; other params are per screen.
export function navigate(to: Route, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params)
  const at = new URLSearchParams(window.location.search).get('at')
  if (at) query.set('at', at)
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
  '/welcome': -1,
  '/child': 0,
  '/story': 1,
  '/complete': 1,
  '/graduation': 1,
  '/parent': 0,
  '/family': 1,
  '/demo': 0,
}
