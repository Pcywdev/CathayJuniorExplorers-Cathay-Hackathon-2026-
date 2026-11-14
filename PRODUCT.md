# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile web at a 393px viewport. Shown as phones side by side on `/demo` (child and parent), walked as a scripted run.

## Users

- **Primary: young members, from childhood to graduation**, in three tiers. **Little Xplorers** (under 12) are on a family flight with a parent beside them: they complete missions, collect stamps and unlock story chapters. **Teen Xplorers** (12–17) want small, tangible rewards for few miles. **Campus Xplorers** (18 to graduation or 25) want practical student travel deals.
- **Secondary: the parent**, on their own phone during a Little Xplorers trip. They want trip notifications that matter (boarded, departed, delayed, landed), a calm timeline, the miles earned and a clear view of what data is used.
- **Evaluation context: hackathon judges** watching a short demo of Mei growing up: one real flight at 7 on two phones, then Home at 15 and 20, then graduation.

## Product Purpose

Cathay Xplorers is a concept youth membership mode for a travel app. Young people explore what Cathay offers before adulthood, then graduate into full membership and keep their miles, years, trips and stamps. Little Xplorers turns one real flight (OAG data) into two synced screens: trip events award missions and stamps and unlock an AI-written story chapter by chapter. At 12+, Home grows up and "Picked for you" offers are ranked by a toy dual-encoder recommender. Success means the member feels the membership is theirs at every age, and parents trust what the app does with their child's data.

## Positioning

Rewards are tied to real trips and to what fits the member's age, not to generic games. One account grows up with the member, so nothing migrates at graduation. Every Little Xplorers rule (missions, the annual earn cap) runs visibly on both phones at once.

## Operating Context

- Used on a phone, at the airport and in the air. Story chapters unlock on trip events; the landing chapter unlocks by schedule, no GPS.
- In the demo, scripted trip events in the API's exact shape drive the phones (`?at=`); `tools/demo_trip.py` shows the backend doing the same run. Simulated events are labelled.
- The backend publishes each trip event once per trip channel (SSE, with a polling fallback).

## Capabilities and Constraints

- Screens: app home, Xplorers intro, sign-up, welcome; child home (boarding pass, missions, miles with the cap, story link, Picked for you, passport), story, mission complete; offer and voucher; exit and its projection; parent notifications, timeline, junior mode switch, data used; family miles.
- Every displayed number comes from `shared/program.json` (illustrative values, not yet confirmed).
- Synthetic data only, except OAG flight data. Only the backend calls OAG.
- Children's data is limited to age band, destination, flight length and trip events. Never photos, location or health data. No GPS. Recommender traits are interests and travel situation only.
- No pooling of miles.
- Stack: Vite, React, TypeScript, Tailwind v4, Framer Motion. three.js was added for lazy-loaded interactive moments with static fallbacks (user-approved, 2026-11-12).

## Brand Commitments

- Product name: Cathay Xplorers, with the tiers Little Xplorers, Teen Xplorers and Campus Xplorers. Mascot: Pip (Little Xplorers only).
- "Cathay style" means **mood only**: the feel of a premium Hong Kong carrier. No logo, brushwing, wordmark, livery or anything else that implies a real Cathay integration.
- Concept label on every screen: "Concept screen, synthetic data".
- Voice: sentence case, plain verbs. Little Xplorers: warm, short sentences to a child, never frightening. Teen: shorter and bolder. Campus: calm and independent.

## Evidence on Hand

- Demo flight CX 500, HKG → NRT, as cached OAG fixtures in `backend/`.
- Demo member Mei: 1,250 miles at 7, 9,800 at 15, 24,000 at 20, 29,280 at exit (`shared/program.json`).
- The recommender's users and interactions are synthetic. No testimonials, real users or metrics exist. Do not invent any.

## Product Principles

1. The member earns it: every reward is tied to a real trip or fits the member's age.
2. One event, two views: during a Little Xplorers trip, the child and parent screens tell the same moment in their own language.
3. Never fail in front of the child: fallbacks everywhere (pre-written story, static visuals, offline fixtures).
4. Collect the minimum: data use is visible to the parent and limited to four fields.
5. Grow up with the member: tone and density change by tier; the account and its history stay.

## Accessibility & Inclusion

- Young readers: short sentences, large type, high contrast (Ink soft is the lightest text colour).
- Respect `prefers-reduced-motion`: every animated or 3D moment has a static final state.
- Story content is English only for the submission; the story format is keyed by language, so Traditional Chinese can be added later.
