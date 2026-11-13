// Family miles screen data.
// - Parent balance and child age are synthetic (age sits inside the trip's age band, 6-8).
// - Research figures are public, cited findings (searched 2026-11-13). They are not program numbers,
//   so they live here with their sources rather than in shared/program.json.
export const mockParentBalance = 86400
export const mockChildAge = 7
export const GRADUATION_AGE = 18

// Money view (illustrative, frontend only until the business team confirms; not program numbers).
export const moneyAssumptions = {
  /** HK$ per mile: low end of Money Hero's HK$0.10-0.16 for flight redemptions. */
  hkdPerMile: 0.1,
  hkdPerMileSource: { label: 'Money Hero, How much is 1 air mile worth', url: 'https://www.moneyhero.com.hk/blog/en/much-1-air-mile-worth' },
  /** Illustrative member discount on family fares once the child is an adult member. */
  memberDiscount: 0.05,
  /** Illustrative family spend on fares per year, HK$. */
  familyFaresPerYear: 30000,
  /** Last age shown on the projection. */
  projectToAge: 30,
}

export interface Finding {
  stat: string
  /** Three or four words for the tile. */
  short: string
  text: string
  source: string
  url: string
}

export const findings: Finding[] = [
  {
    stat: '43%',
    short: 'of families say kids shape trips',
    text: '43% of families say their children influence travel decisions.',
    source: 'Expedia Group and Northstar, Generation Alpha study, 2019',
    url: 'https://skift.com/2019/06/21/new-research-how-families-and-their-children-make-travel-decisions/',
  },
  {
    stat: '65%',
    short: 'of Gen Z join an airline programme',
    text: '65% of Gen Z belong to an airline programme, against 89% of Baby Boomers; 61% say they don’t fly one airline often enough.',
    source: 'OAG traveller survey, 2024',
    url: 'https://www.oag.com/pressroom/gen-z-travel-habits-usher-in-new-future-for-airline-rewards-programs-oag-survey-reveals',
  },
  {
    stat: 'Under 13',
    short: 'brand feelings last for life',
    text: 'Brands met before age 13 leave positive feelings that last into adulthood.',
    source: 'Connell, Brucks and Nielsen, Journal of Consumer Research, 2014',
    url: 'https://www.sciencedaily.com/releases/2014/03/140311123921.htm',
  },
]
