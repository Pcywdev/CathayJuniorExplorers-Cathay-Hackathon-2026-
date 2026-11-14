import { program } from '../program'
import mappingJson from './data/mapping.json'

// "Picked for you", served from a toy dual encoder (tools/xplorers_mapping, synthetic data).
// The item tower ran offline: each promo carries its embedding. The user tower runs here, online:
// u = sum of the rows for the member's age bucket, age band and ticked traits. Score = u·v + bias.
// Stage 1 rules (age range, required traits, affordability) filter first, exactly as in the Python module;
// then each eligible promo gets a draw weight exp(score / T), and a weighted draw without replacement picks the grid.
// Regenerate the mapping with: python -m tools.xplorers_mapping

export type DiscoverKind = 'activity' | 'event' | 'discount' | 'game'

export interface DiscoverItem {
  id: string
  kind: DiscoverKind
  title: string
  where: string
  /** Games earn these miles; everything else costs them. Absent = free. */
  miles?: number
  /** Who it was designed for (soft: shown on the offer, learnt by the model, not a rule). */
  minAge: number
  maxAge: number
  peakAge: number
  /** Real restrictions (rules), e.g. 18+ for a hostel. */
  hardMinAge: number
  hardMaxAge: number
  tags: string[]
  /** Traits the member must have (e.g. student deals need "studying"). */
  requires: string[]
  embedding: number[]
  bias: number
}

export interface Trait {
  id: string
  label: string
  group: 'style' | 'situation'
  minAge: number
  requires: string[]
  reason: string
}

interface Mapping {
  meta: { temperature: number; minAge: number; maxAge: number }
  ageBands: { id: string; minAge: number; maxAge: number }[]
  ageBuckets: { id: string; minAge: number; maxAge: number }[]
  traits: Trait[]
  userTower: Record<string, number[]>
  promos: DiscoverItem[]
}

const mapping = mappingJson as unknown as Mapping

export const DISCOVER_ITEMS = mapping.promos
export const TRAITS = mapping.traits
export const DISCOVER_COUNT = program.xplorers.discover.count
export const DEFAULT_AGE = program.xplorers.discover.defaultAge
export const MIN_AGE = mapping.meta.minAge
export const MAX_AGE = mapping.meta.maxAge

// A trait shows a reason line only when it lifts the item's score at least this much (same as analyse.REASON_MIN; matching items score ~1.3-3.5, others ~0).
const REASON_MIN = 1.0

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0)

/** Tier for an age; past the last tier counts as the last tier (exit is shown elsewhere). */
export function tierForAge(age: number) {
  const tiers = program.xplorers.tiers
  return tiers.find((t) => age >= t.minAge && age <= t.maxAge) ?? tiers[tiers.length - 1]
}

/** A trait can be ticked at this age if the age is old enough and any trait it builds on is ticked too. */
export function traitAllowed(trait: Trait, age: number, traits: string[]) {
  return age >= trait.minAge && trait.requires.every((r) => traits.includes(r))
}

/** Keep only traits that make sense together at this age (e.g. "Studying abroad" needs 18+ and "University student"). */
export function validTraits(age: number, traits: string[]): string[] {
  let kept = traits.filter((id) => TRAITS.some((t) => t.id === id && age >= t.minAge))
  // Drop traits whose prerequisite was dropped, until stable.
  for (let changed = true; changed; ) {
    const next = kept.filter((id) => traitAllowed(TRAITS.find((t) => t.id === id)!, age, kept))
    changed = next.length !== kept.length
    kept = next
  }
  return kept
}

// Mei's balance at that age (program.json personas.mei.balanceByAge), for the affordability rule.
function balanceForAge(age: number) {
  const steps = Object.entries(program.xplorers.personas.mei.balanceByAge)
    .map(([a, m]) => [Number(a), m] as const)
    .sort((x, y) => x[0] - y[0])
  return [...steps].reverse().find(([a]) => age >= a)?.[1] ?? steps[0][1]
}

/** Stage 1, deterministic: hard age limits (not the designed range: the model weighs that), required traits
 *  ticked, and affordable (games earn miles, so always fine). */
export function eligible(item: DiscoverItem, age: number, traits: string[] = []) {
  if (age < item.hardMinAge || age > item.hardMaxAge) return false
  if (!item.requires.every((r) => traits.includes(r))) return false
  if (item.kind !== 'game' && (item.miles ?? 0) > balanceForAge(age)) return false
  return true
}

/** User tower, online: sum of the age bucket, age band and trait rows. */
export function userVector(age: number, traits: string[]): number[] {
  const bucket = mapping.ageBuckets.find((b) => age >= b.minAge && age <= b.maxAge) ?? mapping.ageBuckets[mapping.ageBuckets.length - 1]
  const band = mapping.ageBands.find((b) => age >= b.minAge && age <= b.maxAge) ?? mapping.ageBands[mapping.ageBands.length - 1]
  const keys = [`bucket:${bucket.id}`, `band:${band.id}`, ...traits.map((t) => `trait:${t}`)]
  const dim = DISCOVER_ITEMS[0].embedding.length
  const u = new Array<number>(dim).fill(0)
  for (const key of keys) {
    const row = mapping.userTower[key]
    if (row) for (let k = 0; k < dim; k++) u[k] += row[k]
  }
  return u
}

export const score = (item: DiscoverItem, u: number[]) => dot(u, item.embedding) + item.bias

/** Draw weight for one promo: 0 if a rule fails, else exp(score / T). */
export function weight(item: DiscoverItem, age: number, traits: string[] = [], u = userVector(age, traits)): number {
  if (!eligible(item, age, traits)) return 0
  return Math.exp(score(item, u) / mapping.meta.temperature)
}

/** Weighted sampling without replacement (Efraimidis–Spirakis): key = u^(1/w), keep the top `count`. */
export function pickForAge(age: number, traits: string[] = [], count = DISCOVER_COUNT, rand: () => number = Math.random): DiscoverItem[] {
  const u = userVector(age, traits)
  return DISCOVER_ITEMS.map((item) => ({ item, w: weight(item, age, traits, u) }))
    .filter((x) => x.w > 0)
    .map((x) => ({ item: x.item, key: rand() ** (1 / x.w) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((x) => x.item)
}

/** The ticked trait that lifts this promo most (E_user[trait]·v), as a short reason; undefined if none clearly does. */
export function reasonFor(item: DiscoverItem, traits: string[]): string | undefined {
  let best: { trait: Trait; value: number } | undefined
  for (const id of traits) {
    const row = mapping.userTower[`trait:${id}`]
    const trait = TRAITS.find((t) => t.id === id)
    if (!row || !trait) continue
    const value = dot(row, item.embedding)
    if (!best || value > best.value) best = { trait, value }
  }
  return best && best.value >= REASON_MIN ? best.trait.reason : undefined
}

/** Age from `?age=`, clamped to the slider's range; falls back to Mei at 7. */
export function ageFromQuery(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('age'))
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_AGE
  return Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(raw)))
}

/** Traits from `?traits=a,b` (set by the demo panel's tick boxes), unknown ids dropped. */
export function traitsFromQuery(): string[] {
  const raw = new URLSearchParams(window.location.search).get('traits') ?? ''
  return raw.split(',').filter((id) => TRAITS.some((t) => t.id === id))
}
