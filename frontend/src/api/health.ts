import { getJson } from './client'
import type { Health } from './types'

export const getHealth = () => getJson<Health>('/api/health')
