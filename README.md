# Divya — interactive yo-yo portfolio

An eight-second React/R3F introduction followed by an interactive thread-driven hero. The hero uses local Clash Display fonts and the original GLB. Loading-screen hand choreography is unchanged by the hero work. Nothing has been published.

## Interactive hero

Open `http://127.0.0.1:4173/?hero=1` after starting the built preview to go directly to the hero. The normal root URL plays the existing intro first.

- Grab the visible thread and pull; the selected rope particle becomes a temporary constraint. The body responds through the cord, then settles after release.
- Focus “Go ahead. Pull the string.” Press Space to grab, arrows to pull, Space to release, or Escape/Home to recover. Clicking the instruction gives a short tug. Reduced motion bounds travel and disables large turns.
- PROJECTS and CONTACT intentionally show development placeholders; ABOUT ME has the supplied portfolio positioning.
- `src/hero/HeroPhysics.js`: fixed-step constraints, gravity, damping, momentum, winding and interaction-driven turning. Coordinates are viewport-height units. `TOY` and `heroLayout` expose tuning.
- `src/hero/HeroThread.jsx`: persistent dynamic tube geometry, axle-plane routing, projected hit area, shared R3F loop and the short authored handoff before physics takes control.
- `src/hero/HomeHero.jsx` and `hero.css`: layered HTML typography, pointer capture, keyboard controls, panels and responsive composition.
- `?hero=1&prototype=1&heroDebug=1` opens the isolated gesture test interface. Debug traces and metrics are bounded and absent from the normal hero.

Run `node scripts/check-hero-physics.mjs` for solver scenarios and protected loading-animation hashes. Browser evidence and limitations are in `qa/hero/REVIEW.md`.

The pearlescent faces are the LED displays, as clarified by the user. Both original faces and their embedded artwork/materials remain intact; no new display graphics are introduced. The hero uses a controlled planar rope solver with an axle-plane exit, rather than full 3D rope/body collision simulation.

## Run and verify

```sh
npm install
npm run dev
npm run build
npm run preview
node scripts/check-double-or-nothing.mjs
```

Development: http://127.0.0.1:5173/. Built preview: http://127.0.0.1:4173/.

## Current authoring controls

- `src/sceneConfig.js`: phase labels, framing, upright hand scale/spacing, colour timing and unchanged final homepage transform.
- `src/choreography.js`: independent finger gestures, skinned contacts and wrist entry/exit. The original upward-facing hands tilt inward by 20 degrees; no 180-degree inversion.
- `src/DoubleOrNothing.js`: underhand approach, throwing-index wrap, opposite-index pass, front-span mount, hold and sequential release. Contact circles have explicit approach, exit, direction and depth. Mounted contact insertion blends the neighbouring tangent directions to prevent topology jumps.
- `src/FingerRig.js`: weighted source-specific finger deformation. Thumb/index/middle contact surfaces use the same deformed coordinates as the artwork.
- `src/SvgHands.jsx`: combined silhouette outline behind paper fills, followed by original internal detail. Overlapping source fills no longer create angular interior outline panels.
- `scripts/prepare-selected-hands.mjs`: preserves the original source, excludes its five static thread paths and extends only the original wrist closure below the viewport. Run it to regenerate `public/assets/selected-hands-rig.json`.
- `src/StringRig.js`: the single routed thread plus near-side contact arcs and crossing bridges derived from actual tangent spans. No unrelated floating overlay strokes.
- `src/YoyoModel.jsx`: original material loading, local-Z axle spin, projected axle attachment and studio reflections. Neutral tone mapping, sRGB output, exposure 1; all original GLB materials and maps retained.
- `src/PortfolioIntro.jsx`: one GSAP playhead, one R3F loop, ready gate, skip/replay, reduced motion and cleanup. Explicit file extensions keep development imports consistent.

`?time=4.8&inspect=1` freezes a key pose. `?capture=1&debug=1` records bounded committed-frame traces and active-animation frame intervals. `?motion=reduced` previews the stable accessible composition. OS reduced motion is respected. `?tone=aces`, `?tone=agx` and `?material=substrate` are diagnostic views only.

## Fidelity and known limits

The user clarified that “star” referred to the thread formation, not a literal star. The existing layered route is retained; no new star topology was invented. The instructional diagram guides the underhand sweep, alternating index contacts and mount. Intermediate travel and the release into the hero are authored interpretations of still images.

The source SVG and GLB remain byte-identical copies. The selected SVG contains flat artwork, not engraving. Its original palms/fingers and internal details are retained; only the cuff closure is extended. No generic replacement hands or invented hatching are used.

Pearl colour/emissive textures, iridescence thickness, UV sets, clearcoat, roughness, IOR and optical cover remain intact. Studio lighting was compared against the supplied render; exact equality to an offline render is not claimed. No replacement shader, gradient or bloom is used.

The thread is a continuous screen-space route, attached to skinned finger surfaces and the projected GLB axle. Its near/far contact layering is authored; it is not an invariant-length 3D rope/collision solver. Wide hand spacing and readable motion are prioritised over exact physical string-length conservation.

Current evidence: `qa/final-correction/REVIEW.md`, named desktop states, desktop/mobile live phase captures and playback traces. Older QA folders and engraved-rig scripts refer to superseded implementations. Physical mobile hardware, other browser engines and GPU context-loss stress testing remain untested. Vite retains its large JavaScript chunk advisory.
