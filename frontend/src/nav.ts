import { useSyncExternalStore } from 'react'

// Tiny pushState navigation (no router dependency, see docs/decisions.md).
export type Route = '/child' | '/story' | '/complete' | '/parent'

const ROUTES: Route[] = ['/child', '/story', '/complete', '/parent']
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

export function navigate(to: Route) {
  if (current() === to) return
  window.history.pushState(null, '', to)
  window.scrollTo(0, 0)
  window.dispatchEvent(new Event(EVENT))
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, current)
}

// Order used to pick the slide direction between screens.
export const routeDepth: Record<Route, number> = { '/child': 0, '/story': 1, '/complete': 1, '/parent': 0 }
