import { useEffect, useState } from 'react'
import { getHealth } from '../api/health'
import { API_BASE_URL } from '../api/client'
import type { Health } from '../api/types'

type State = { kind: 'loading' } | { kind: 'ok'; health: Health } | { kind: 'error'; message: string }

// Dev-only status: shows the /api/health response. Remove before the demo.
export function HealthCard() {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    getHealth()
      .then((health) => setState({ kind: 'ok', health }))
      .catch((e: Error) => setState({ kind: 'error', message: e.message }))
  }, [])

  return (
    <section className="rounded-doc border border-line px-4 py-3" aria-live="polite" data-testid="health-card">
      <p className="text-small text-ink-soft">Backend status</p>
      {state.kind === 'loading' && <p className="text-body">Checking {API_BASE_URL}</p>}
      {state.kind === 'ok' && (
        <p className="text-body">
          <span className="font-medium text-jade">{state.health.status}</span> from {state.health.service}
        </p>
      )}
      {state.kind === 'error' && <p className="text-body">Can't reach the backend ({state.message})</p>}
    </section>
  )
}
