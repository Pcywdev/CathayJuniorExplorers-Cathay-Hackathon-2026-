import { program } from '../program'

// "Picked for you": hardcoded catalog in shared/program.json (xplorers.discover), drawn at random
// with each item's chance shaped by the member's age.

export type DiscoverKind = 'activity' | 'event' | 'discount' | 'game'

export interface DiscoverItem {
  id: string
  kind: DiscoverKind
  title: string
  where: string
  /** Games earn these miles; everything else costs them. Absent = free. */
  miles?: number
  minAge: number
  maxAge: number
  peakAge: number
  spread?: number
}

const config = program.xplorers.discover
export const DISCOVER_ITEMS = config.items as DiscoverItem[]
export const DISCOVER_COUNT = config.count
export const DEFAULT_AGE = config.defaultAge
export const MIN_AGE = config.minAge
export const MAX_AGE = config.maxAge

/** Bell curve around the item's peak age; zero outside its age range. */
export function weight(item: DiscoverItem, age: number): number {
  if (age < item.minAge || age > item.maxAge) return 0
  const spread = item.spread ?? config.defaultSpread
  return Math.exp(-0.5 * ((age - item.peakAge) / spread) ** 2)
}

/** Weighted sampling without replacement (Efraimidis–Spirakis): key = u^(1/w), keep the top `count`. */
export function pickForAge(age: number, count = DISCOVER_COUNT, rand: () => number = Math.random): DiscoverItem[] {
  return DISCOVER_ITEMS.map((item) => ({ item, w: weight(item, age) }))
    .filter((x) => x.w > 0)
    .map((x) => ({ item: x.item, key: rand() ** (1 / x.w) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((x) => x.item)
}

/** Tier for an age; past the last tier counts as the last tier (exit is shown elsewhere). */
export function tierForAge(age: number) {
  const tiers = program.xplorers.tiers
  return tiers.find((t) => age >= t.minAge && age <= t.maxAge) ?? tiers[tiers.length - 1]
}

/** Age from `?age=`, clamped to the slider's range; falls back to Mei at 7. */
export function ageFromQuery(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('age'))
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_AGE
  return Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(raw)))
}
