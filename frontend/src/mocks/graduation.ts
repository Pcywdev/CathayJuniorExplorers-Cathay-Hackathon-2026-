import { program } from '../program'

// Stand-in for POST /api/graduation/score (docs/api.md) until the backend ships it.
// Inputs are synthetic (the api.md example); every rule and limit comes from program.json, so the
// result matches the documented response. Swap for the API call; no screen computes a score itself.
export const graduationInputs = { membershipYears: 12, familyFlights: 20, juniorMiles: 48000 }

const LABELS = { membershipYears: 'Membership years', familyFlights: 'Family flights', juniorMiles: 'Junior miles' } as const
type Key = keyof typeof LABELS

const points = (key: Key) => {
  const rule = program.score[key]
  return Math.min(rule.max, Math.floor(graduationInputs[key] / rule.per) * rule.pointsPer)
}

const breakdown = (Object.keys(LABELS) as Key[]).map((id) => ({ id, label: LABELS[id], points: points(id), max: program.score[id].max }))
const score = breakdown.reduce((sum, b) => sum + b.points, 0)

export const mockGraduation = {
  score,
  maxScore: breakdown.reduce((sum, b) => sum + b.max, 0),
  breakdown,
  band: program.bands.find((b) => score >= b.min && score <= b.max)!,
  bandCount: program.bands.length,
  package: {
    milesCarriedOver: graduationInputs.juniorMiles,
    statusPointsHeadStart: program.graduation.topBandStatusPointsHeadStart,
    silverThreshold: program.graduation.silverThreshold,
    transferAllowance: program.graduation.transferAllowanceByYear,
  },
}
