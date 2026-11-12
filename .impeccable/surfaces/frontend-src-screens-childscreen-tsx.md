---
version: 1
slug: "frontend-src-screens-childscreen-tsx"
primary_target: "frontend/src/screens/ChildScreen.tsx"
related_targets: ["frontend/src/screens/ParentScreen.tsx"]
---

Scope: Little Explorers child screens (home, story, mission complete) and the parent screen. Mode: Operate (child home, parent), with Experience moments on story and mission complete. Audience: children aged 6–12 with a parent beside them, and judges watching a two-phone demo.

## Direction contract

THESIS: The child holds a real ticket from a premium Hong Kong carrier, issued to her. It refuses the category default of a gamified kids' app: bubbly cards, confetti and a points dashboard.

OWN-WORLD: The cabin-jade sky band carries a slowly turnable line-art route globe, drawn in Paper strokes. Paper documents carry printed security detail:
- guilloche hairlines in Line
- perforation rows
- a barcode stub
- a Mono serial number

Miles orange appears only on rewards, and stamp blue only on stamps. Red Hat throughout: Mono only for flight data. One shadow, two radii.

STORY: Mei sees her flight (HKG → NRT) on a globe she can spin, holds her boarding pass, and presses and holds to tear the stub and start the mission. A stamp then thumps onto her passport and the miles land.

FIRST VIEWPORT: The top ~38% is a Jade band with Pip waving, "Mei's trip" in Paper, and the 3D globe with its arc and plane at trip progress. The boarding pass overlaps the band's lower edge and is the dominant element. Its stub has the +50 miles, a barcode and the serial. Press and hold "Start mission" inside the pass. Below: the runway miles track.

FORM: Airline ticket and in-flight route map. Pinned by the user, not rolled. seed: none (pinned): "use the basic same color palette and layout but make it less AI and more stylised for Cathay design. Make it more interactive and maybe also include more threejs as animation or interactive"

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: press and hold to tear the stub (home), then the stamp press on mission complete. Motion grammar:
- response-driven only: drag, tilt, hold
- one authored moment per screen
- three.js loads lazily, with static SVG fallbacks for reduced motion and when WebGL is missing

Constraints:
- No Cathay logo, brushwing, wordmark or livery.
- Every number comes from program.json.
- Concept label on every screen.
