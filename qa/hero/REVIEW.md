# Interactive hero verification — 24 November 2026

Implemented the requested hero only. The six loading hand/choreography source hashes in `intro-baseline.json` remain unchanged. The source GLB is untouched; `source-glb-audit.json` records its hierarchy, material extensions and SHA-256. Local Clash Display WOFF2 files come from the supplied font bundle.

## Browser checks

Production preview on port 4173 was reviewed in the in-app Chromium browser. Screenshots and event records in this folder document:

- Desktop resting layout, thread hover, actual mouse thread drag, momentum, rear-display reveal and recovery.
- Up/down/left/right/diagonal, circular, fast and slow gestures through the isolated browser test UI. These are simulated input traces processed by the same runtime solver, not physical mouse/touch recordings.
- Keyboard grab/pull/release and reduced-motion bounded interaction. Clicking the instruction produces a short tug and automatically releases.
- Responsive 390 × 844 and 768 × 1024 compositions. An actual mouse drag in the mobile-sized viewport was tested with pointer capture, alongside the circular test trace.
- Normal page entry starts at `rgb(248,247,243)` and reaches timeline time 8, with one canvas and matching projected axle/rope-end coordinates. The same model instance remains mounted across the handoff.
- Projects/contact development panels and the About panel. Production console error check returned no entries.

Final previews: `hero-desktop.png`, `hero-mobile.png`, `hero-tablet.png`. Intermediate captures include `native-pointer-drag.png`, `rear-display.png`, `reduced-motion-play.png` and the directional cases.

## Numerical and rendering evidence

`npm run build` passed. Vite retains a large JavaScript chunk advisory (approximately 403 KB gzipped). No runtime dependencies were added.

`node scripts/check-hero-physics.mjs` passed directional, repeated interaction, 30/60/120 Hz input, reduced-motion and responsive cases, including protected intro hashes. `physics-checks.json` contains results. Maximum segment extension in those stress scenarios was approximately 4.64%; this is a controlled near-inextensible approximation, not exact physical calibration.

`production-performance.json` records 230 active render intervals: median 16.7 ms, p95 17.1 ms and mean 16.66 ms at DPR 1, with 39 geometries and eight textures. Wake-up idle gaps and the first 15 samples were excluded. This is browser frame-interval evidence on the current machine, not a GPU timing or universal 60 FPS claim. The older `desktop-performance.json` includes idle pauses and is not the acceptance measurement.

## Asset fidelity and limits

The pearlescent screen is the LED display, per the user's clarification. Both sides use the original embedded pearl/eye artwork and materials. Directional and circular pulls can reveal the opposite display; no separate invented LED graphics, shader replacement or bloom was added. Exact equality with the offline product render is not claimed.

The runtime cord is planar with a 3D axle-plane exit near the model, rather than a complete 3D collision engine. Controlled winding links released length to local-Z spin using the source axle radius. Recovery deliberately restores the editorial composition.

Physical mobile touch hardware, other browser engines and GPU context-loss stress testing remain untested. Touch PointerEvent handling is implemented, but mobile-sized mouse tests are not presented as hardware touch validation. PROJECTS and CONTACT remain explicit placeholders as requested. Nothing was deployed.
