# Little Explorers — Design System

## Direction

Clean, modern, friendly travel documents. The app feels like a child's own boarding pass and passport: crisp paper surfaces on a light sky background, flight details set like a real ticket, and stamps that look inked. Approachable, not luxury. Playful only in celebration moments.

**Audience:** children aged 6–12, with a parent beside them.
**Primary job:** make a family trip feel like an adventure the child earns from.

---

## Palette (use only these)

| Token | Hex | Use |
|---|---|---|
| Sky | `#EAF1F3` | App background |
| Paper | `#FBFCFA` | Document surfaces only: boarding pass, passport page, story page |
| Jade | `#0E5E4E` | Structure: primary buttons, active states, Pip's outline, toggle on |
| Ink | `#1D2B33` | Headings and body text |
| Ink soft | `#56666D` | Secondary text. Never lighter than this. |
| Miles | `#F2A033` | Miles and rewards **only** |
| Stamp | `#2E4C9E` | Passport stamp ink **only** |
| Line | `#D3DEE1` | Dividers, tear lines, empty-stamp outlines |

- Orange appears only where a number of miles or a reward is shown.
- Stamp blue appears only on stamps.
- Tints of a colour (10–20% opacity) are allowed only as backgrounds for that same category, e.g. a pale Miles tint behind a reward.
- Text on Miles is always Ink, never white.
- No gradients. No new colours.

---

## Typography

The Red Hat superfamily, self-hosted from `shared/fonts/` (SIL Open Font License):

- **Red Hat Display:** headings and large numbers
- **Red Hat Text:** body copy and buttons
- **Red Hat Mono:** flight data only: airport codes, mission codes, gate, seat, stamp dates. Never for general labels.

| Role | Size / line height | Weight | Family |
|---|---|---|---|
| Display | 34 / 40 | 800 | Display (max one per screen) |
| Title | 24 / 30 | 700 | Display |
| Heading | 19 / 26 | 700 | Display |
| Body | 16 / 24 | 400 (500 for emphasis) | Text |
| Small | 13 / 18 | 500 | Text (captions and concept label only) |
| Flight data | 15 / 20 | 500, letter-spacing 0.04em | Mono |
| Airport code | 28 / 32 | 600 | Mono |

- Sentence case everywhere.
- ALL CAPS only for airport codes and text inside stamps.
- No letter-spaced capital labels above headings.
- Never bold or colour a single word inside a headline.
- Numbers use `font-variant-numeric: tabular-nums` so the miles counter doesn't jitter.

---

## Layout

- 393px viewport, 20px side padding, spacing from 8 / 12 / 16 / 24 / 32 / 48.
- Left-aligned text. Centre alignment only on the mission-complete celebration.
- **One hero per screen.** Everything else is quieter: smaller, lower contrast, no container.
- No screen leaves more than about 30% blank. When content is short, compose around the hero and pin the main action to the bottom.
- Primary button: full width, pill-shaped, Jade, 56px tall, pinned to the bottom safe area.

---

## Shape and surfaces

- **Two radii only:** 16px for documents, 999px for pills (buttons, toggle, badges).
- A container means "this is a document." Lists, rows and labels are not cards. Separate them with spacing and Line dividers.
- **One shadow, documents only:** `0 1px 2px rgba(29,43,51,.08), 0 8px 24px rgba(29,43,51,.08)`. Nothing else gets a shadow.

---

## Signature elements

### Boarding pass (missions)

```
┌──────────────────────────────┬─────────┐
│ Boarding Badge               │         │
│                              │   +50   │
│ HKG    ✈    TYO              │  miles  │
│ Gate 23    Seat 34K          │         │
│ [ Start mission ]            │         │
└──────────────(  ┄┄┄┄┄┄┄┄  )──┴─────────┘
```

- Paper surface, 16px radius, the document shadow.
- A dashed Line tear line separates the main section from the stub, with semicircle notches cut into both edges.
- The stub holds the reward in Miles.
- Airport codes, gate, seat and mission code in Mono.

### Passport stamps

- Shapes vary: circle, rounded rectangle, oval. Each stamp rotated between −10° and +8°.
- Stamp ink, double outline, city in capitals, date in Mono, small line icon.
- Slight ink texture: uneven opacity between 0.85 and 0.95, or a subtle SVG noise mask.
- Arranged like a passport page: staggered, slightly overlapping. Not a centred row of identical circles.
- Not yet collected: dashed Line outline with "Next stop" in Ink soft.

### Pip

- Jade 3px outline, Paper body, Miles cheeks at 40% opacity. Same proportions everywhere.
- A different pose on every screen:
  - Home: waving from the header
  - Story: flying, with a dotted trail
  - Mission complete: pressing a stamp down, eyes closed and smiling
- At most one Pip per screen. Never pasted unchanged from another screen.

### Icons

- Inline SVG, 2px rounded strokes on a 24px grid, in Ink or Jade.
- No emoji as interface icons.

---

## Motion

- **One orchestrated moment per screen, at most.** Mission complete: the stamp thumps in (scale 1.3 → 1, rotation −14° → −8°, 220ms ease-out), then the miles counter runs for about 1 second and lands **exactly** on the final value. Home and story: no load animation.
- Response motion only otherwise: pressed state = scale 0.97 plus slightly darker, 100ms; screen change = 200ms horizontal slide.
- No staggered fade-ins, no hover effects, no looping animation (one slow cloud drift at most).
- Respect `prefers-reduced-motion`: skip animation and show final states.

---

## Copy

- Sentence case, plain verbs, the app speaking to a child.
- Buttons say what happens, and keep the same name through the flow: "Start mission", "Read my trip story", "Back to my trip", "Next page".
- No arrows in button text. Route notation (HKG → TYO) is fine.
- No middle-dot strings joining labels.
- Concept label on every screen, small, Ink soft, at the bottom: "Concept screen, synthetic data".

---

## Screen blueprints

### Home — hero: the boarding pass

```
Mei's trip                         [ Junior mode ◉ ]
Pip waving          HKG → TYO

┌ Boarding pass: Boarding Badge ─────────┬─ +50 ┐   ← HERO
│ HKG ✈ TYO   Gate 23  Seat 34K          │ miles│
│ [ Start mission ]                      │      │
└────────────────────────────────────────┴──────┘

1,250 of 2,000 miles this year   ▓▓▓▓▓▓░░░░

Read my trip story                              >
────────────────────────────────────────────────
✓ Check-in Champion                         +30
  Window Watcher (locked)                   +30
  Arrival Explorer (locked)                 +40

Passport page: staggered stamps + "Next stop: Tokyo"

Concept screen, synthetic data
```

### Story — hero: the illustration

```
< Back to my trip

┌ Story page ───────────────────────────┐
│ Illustration, ~55% of screen height   │
│ Pip's pose changes per page           │
│ Title (page 1 only)                   │
│ One or two sentences                  │
└───────────────────────────────────────┘
● ○ ○                         [ Next page ]
Concept screen, synthetic data
```

### Mission complete — hero: the stamp

```
           Pip pressing the stamp
   ┌ Passport page ────────────────────┐
   │   [ BOARDING BADGE stamp thumps ] │
   └───────────────────────────────────┘
         Boarding mission complete!
               +50 miles
   1,300 of 2,000 miles this year ▓▓▓▓▓▓▓░░░

[ Back to my trip ]                (pinned to bottom)
Concept screen, synthetic data
```

---

## Banned patterns

- Every element in a rounded card with the same radius and shadow
- Orange on anything that isn't miles or a reward
- Decoration unrelated to the moment: night skylines, moons, sparkles, blobs
- The generic success template: check icon in a circle, pill, card, button
- Centred body text, or a screen more than about 30% empty
- Light grey text on a tinted background
- Letter-spaced capital labels; a single highlighted word in a headline
- Monospace for anything other than flight data
- Emoji used as interface icons, or mixed icon styles
- Gradient washes, or more than one shadow style
- Entrance animations on every element

---

## Self-check before calling a screen done

1. What's the hero? Is it obviously the most prominent thing on screen?
2. Is orange only on miles and rewards? Is stamp blue only on stamps?
3. Could this screen belong to a banking or fitness app? If yes, the travel-document character is missing.
4. Remove one element. If the screen improves, leave it out.
5. Screenshot at 393×852 and check contrast, cut-off text and empty space.

---

## Note for overlays (Builder B)

Notifications and text messages imitate the phone's own interface, so they follow native styling. Use Jade only for the app icon, and the same Red Hat fonts only where the design shows app content rather than system UI.