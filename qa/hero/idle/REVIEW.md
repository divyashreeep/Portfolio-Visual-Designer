# Reusable hero idle — 24 November 2026

## Diagnosis and scope

The prior render loop stopped requesting frames after the solver reached `rest`. The initial arrival and one-time demonstration were finite; there was no recurring idle system. The endpoint cue used a 20-second reminder rather than recovery completion.

The existing fixed-step owner now handles rest through `idleStep`. The body moves around the approved rest pose by at most a few viewport-height thousandths, with small yaw and tilt. Thread offsets derive only from those body movements and follow with damped lag toward the free endpoint. A 1.8-second envelope eases into the same idle treatment on initial arrival and after every recovery; the underlying phase is retained. A grab preserves the current particle positions, old positions (velocity) and orientation. Interactive forces, winding, release and recovery coefficients remain unchanged by this polishing task.

`HomeHero` subscribes to idle-state transitions, once per transition rather than every frame. It hides the cue during play/recovery and restores the existing cue/ring after the solver settles. The fixed reminder was removed. The initial demonstration is still one-time, not replayed after interaction. The same R3F frame continues to own model and tube updates; no new RAF loop, GSAP idle timeline, dependency or GPU geometry was introduced.

Typography, navigation, background, model, materials, lighting, thread length/thickness and loading choreography are unchanged by this idle task. Source assets are untouched.

## Browser evidence

Production preview: port 4173, in-app Chromium. `browser-cycles.json` records ten consecutive native mouse play/recovery cycles, with additional rapid keyboard re-grabs during release on cycles seven and nine. Each cycle confirmed cue hiding during play, restoration at idle, and equality of axle/rope-end coordinates. `browser-events.json` records the source and interrupted phase.

After the tenth cycle, the page was left without interaction for 51.894 seconds. `idle-hold.json` records idle phase advancing from 67.758 to 119.658 seconds, changing body positions and thread geometry, a visible cue, and matching axle/end coordinates. The two post-play screenshots document its composition; motion was observed through the live browser and DOM changes, not inferred from still frames alone.

The 390 × 844 viewport was visually reviewed, with keyboard play followed by automatic idle/cue recovery (`mobile-idle.png`). Browser viewport overrides were reset. Reduced-motion mode was reviewed and played with keyboard controls: idle phase remained zero, body/orientation returned to identical stable values, pulse animation was `none`, and the cue returned (`reduced-motion.json` and screenshot). Physical touch hardware was not tested.

## Checks

- `npm run build`: passed; the existing large JavaScript chunk advisory remains.
- `node scripts/check-hero-physics.mjs`: passed, including protected loading-source hashes.
- `node scripts/check-hero-usability.mjs`: passed existing directional/re-grab and responsive checks.
- `node scripts/check-hero-idle.mjs`: passed ten recurring cycles, four rapid re-grabs, 32-second sustained idle and reduced-motion stability at desktop/mobile sizes. Idle stays within 0.006 viewport heights of the approved axle position; cord length remains unchanged.

This is a controlled visual idle, not a new physical simulation or full 3D cord collision system. No universal FPS or GPU-time claim is made. These refinements remain local until explicitly pushed.
