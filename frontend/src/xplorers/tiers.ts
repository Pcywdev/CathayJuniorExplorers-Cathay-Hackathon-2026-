import { program } from '../program'

// Tier copy for the awareness and sign-up screens. Names and ages come from program.json (xplorers.tiers).
const ONE_LINE: Record<string, string> = {
  little: 'Family trips turn into stories, stamps and missions.',
  teen: 'Small rewards for a few miles: drinks, snacks, blind boxes.',
  campus: 'Student travel deals and packages, with a verified badge.',
}

const x = program.xplorers

export const tierAges = (t: (typeof x.tiers)[number]) =>
  t.minAge === 0 ? `Under ${t.maxAge + 1}` : t.id === 'campus' ? `${t.minAge} to graduation or ${x.exit.maxAge}` : `${t.minAge}–${t.maxAge}`

export const xplorerTiers = x.tiers.map((t) => ({ ...t, ages: tierAges(t), line: ONE_LINE[t.id] ?? '' }))

export const tierById = (id: string) => xplorerTiers.find((t) => t.id === id)!

export const exitLine = `At graduation or ${x.exit.maxAge}, you become a full member and keep your miles, years, trips and stamps.`
