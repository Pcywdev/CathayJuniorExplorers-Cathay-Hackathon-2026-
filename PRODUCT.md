# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile web at a 393px viewport, installable as a PWA. Shown on two physical phones side by side.

## Users

- **Primary: children aged 6–12** on a family flight, with a parent beside them. Their job is to enjoy the trip as an adventure they earn from: complete missions, collect stamps, unlock story chapters.
- **Secondary: the parent**, on their own phone. They want trip notifications that matter (boarded, departed, delayed, landed), a calm timeline, the miles earned and a clear view of what data is used.
- **Evaluation context: hackathon judges** watching a 2-minute live demo of both phones reacting to one real flight. Kids come first; the demo is how judges see the product working.

## Product Purpose

A concept junior mode for a family travel app. One real flight (OAG data) drives two synced screens. Trip events (check-in, boarding, delay, landing) award missions and stamps, and unlock an AI-written story chapter by chapter. Success means the child feels the trip is theirs, and the parent trusts what the app does with their child's data.

## Positioning

The story and rewards are tied to the child's actual flight as it happens, not to generic games. Every rule (missions, the annual earn cap, graduation at 18) runs live and visibly on both phones at once.

## Operating Context

- Used on a phone, at the airport and in the air, often offline. Chapters are downloaded before departure and unlock on trip events.
- In the demo, a "Simulate trip" control fires the six events in sequence. Simulated events are labelled.
- Both screens subscribe to one event channel per trip (SSE, with a polling fallback).

## Capabilities and Constraints

- Screens: child home (boarding pass, missions, miles with the cap, passport stamps), story, mission complete, graduation; parent notifications, timeline, junior mode switch, data used.
- Every displayed number comes from `shared/program.json` (illustrative values, not yet confirmed).
- Synthetic data only, except OAG flight data. Only the backend calls OAG.
- Children's data is limited to age band, destination, flight length and trip events. Never photos, location or health data. No GPS.
- No pooling of miles.
- Stack: Vite, React, TypeScript, Tailwind v4, Framer Motion. three.js was added for lazy-loaded interactive moments with static fallbacks (user-approved, 2026-11-12).

## Brand Commitments

- Product name: Little Explorers. Mascot: Pip.
- "Cathay style" means **mood only**: the feel of a premium Hong Kong carrier. No logo, brushwing, wordmark, livery or anything else that implies a real Cathay integration.
- Concept label on every screen: "Concept screen, synthetic data".
- Voice: the app speaks to a child in sentence case, with plain verbs and warm, short sentences. Never frightening.

## Evidence on Hand

- Demo flight CX 500, HKG → NRT, as cached OAG fixtures in `backend/`.
- Demo member Mei, starting balance 1,250 miles (`shared/program.json`).
- No testimonials, users or metrics exist. Do not invent any.

## Product Principles

1. The child earns it: every reward is tied to a real trip event.
2. One event, two views: the child and parent screens tell the same moment in their own language.
3. Never fail in front of the child: fallbacks everywhere (pre-written chapters, static visuals, offline mode).
4. Collect the minimum: data use is visible to the parent and limited to four fields.

## Accessibility & Inclusion

- Young readers: short sentences, large type, high contrast (Ink soft is the lightest text colour).
- Respect `prefers-reduced-motion`: every animated or 3D moment has a static final state.
- English and Traditional Chinese for story content.
