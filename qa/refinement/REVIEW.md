# Choreography refinement verification

The homepage typography, content and CSS layout are unchanged. The animation score, string rig, camera framing and timeline lifecycle were refined in place.

## Corrected sequence

- Entry is explicitly half-white in the document, CSS and initial timeline state. Normal navigation and refresh during the trick were observed at t=0.064 with background `rgb(248, 247, 243)` and homepage opacity 0.
- Separate left/right proximal and distal finger tracks perform hook, cross, mount and unhook gestures. Shared sinusoidal finger flutter was removed.
- Crossed diagonals and a multi-anchor cradle resolve into a half-second mount at 3.35–3.85 seconds. The mount follows the actual articulated index-finger span.
- The same yo-yo body spins on its local Z axle, lifts onto the cradle, drops under tension and carries momentum into the outbound arc. Spin continues into the swing and decelerates to a whole number of turns.
- Right-side hooks release in sequence; the left middle-finger endpoint stays attached through launch. Hands translate out of the viewport during the swing rather than being hidden before it.
- The strand terminates at the actual GLB axle projected through the active camera every frame. Camera depth range is tightened for the closely layered glass/eye meshes.
- GSAP owns one paused master timeline advanced by the existing R3F render loop. Update order is playhead, model/projection, then hands/string. Completion switches to demand rendering. Replay resets the score without remounting the GLB.
- Final framing was calibrated against the supplied homeplacement image using viewport fractions and a long-lens perspective camera. Exact offline-render lighting and pixel identity are not claimed.

## Browser evidence

Actual live desktop and 390×844 mobile runs were captured through cross, mount, swing and arrival; these were not produced solely by seeking. `desktop-live-trace.json` and `mobile-live-trace.json` retain per-rendered-frame evidence. `live-checks.json` records frame counts, instance continuity, axle endpoint error, mounted-frame counts and scale increments.

The final desktop run reported 16.7 ms median, 16.9 ms p95 and 16.7 ms mean frame intervals over 135 post-warm-up intervals in the available browser. The fresh inspected run emitted no JavaScript console errors. This is a local measurement, not a real-mobile-hardware guarantee.

Additional browser checks: explicit replay retains the same model instance; refresh during the trick restarts on half-white; the reduced-motion preview arrives at the stable homepage and disables replay; the 390px viewport has no horizontal overflow. Desktop and mobile intermediate captures are retained alongside this report.

`node scripts/check-choreography.mjs` checks 901 time samples at each of 320×568, 390×844, 768×1024 and 1440×900. It verifies finite trajectories, string endpoint continuity, retention of the throwing-finger anchor, scale continuity, mounted hold, independent joints and continued spin. `npm run build` passes; Vite still reports its existing large-bundle advisory.

## Remaining verification limits

The two trick references are still photographs, so their movement cannot be measured against a source recording. The motion is an authored interpretation of their crossed-string and triangular formations. The strand remains an SVG projection with illustrated crossings rather than a 3D collision/cloth simulation. Actual mobile hardware and cross-browser GPU testing were not available.
