# Double or Nothing review — 23 November 2026

## Source and interpretation

The supplied three-panel diagram is the mechanics target. Its first panel already shows a trapeze-like guide. The implementation retains that free-index guide, swings under it to capture the throwing index, circles that index, captures the opposite index again, then rises over and lands on the front span. The source does not define camera depth, velocities or a continuous movie; those intermediate trajectories are authored interpretations. The release drops the throwing index, merges the remaining bight back into a trapeze, and releases the retained guide. YoYoExpert's primary instruction was also checked: https://yoyoexpert.com/pages/022-intermediate-double-or-nothing-classic.

The latest supplied recording was inspected at 2, 5, 8 and 12 seconds. It shows the blue homepage before the demonstrated replay, and preformed taut layers without the required contact-acquisition arcs. Those frames are problem evidence, not target motion. Current entry was refreshed and observed at time 0: paper RGB(248,247,243), homepage opacity 0.

## Comparison by stage

| Stage | Current evidence | Comparison |
| --- | --- | --- |
| Initial guide / first swing | desktop-first-wrap.png | Yo-yo goes below the first index with a connected tether. Radius reduces only at the next captured contact. |
| Throwing index wrap | desktop-second-wrap.png | Yo-yo circles over the opposite side of the hands; a new route node is acquired at 2.2 seconds. |
| Second free-index pass | desktop-third-pass.png | Opposite-index contact is acquired at 3.2 seconds; existing layers remain connected. |
| Front-string mount | desktop-mount.png | Yo-yo rises above the front span then lands below it. Multiple inter-hand layers remain visible. Landing depth was increased after mobile review to prevent the body obscuring the formation. |
| Dismount | desktop-release.png | Throwing-index contact becomes a released bight and merges into the retained guide. No line opacity deletion. |
| Outgoing swing | desktop-outward-swing.png | Same body/axle moves outward while the hands withdraw. |
| Inversion | desktop-colour.png | Background and string interpolate together. Blue underlay maintains string contrast near the colour midpoint. |
| Arrival | desktop-arrival.png / mobile-final.png | Original final transform retained; hands outside viewport; one curved white outgoing thread. |

The view is a planar choreography with projected 3D axle attachment. It is not a physically exact 3D knot reconstruction. Contact arcs use explicit clockwise tangent routes; depth is represented by the hand masks and continuous GLB occlusion. The landing bight and full final swing are authored, with no full rope collision or invariant-world-length solver.

## Asset and material checks

- Original GLB SHA-256: 4569CD13F2C304340D3FB79322411A87C54F457BD2A0200E9764C5BDD31D62A8 (matches supplied file).
- Selected hand source SHA-256: DD5D3A30D6F6967A16C3F86592D70BF015EE426F07EFBBCBEBF85186FA24D64C (matches supplied file).
- The user explicitly selected hands 01.svg, recoloured blue with paper interiors. It contains flat artwork, not engraving. Two nine-path source hands and 510 control points are preserved; five static cyan string paths are excluded from the derivative.
- Source-pose maximum coordinate error: 1.42e-14. Minimum sampled deformation Jacobian: 0.819, positive throughout tested gestures (no sampled foldovers).
- Original pearl material: iridescence 0.18, IOR 1.18, thickness 285–425, clearcoat 0.32, roughness 0.085. Base/emissive textures sRGB; thickness map linear; original UV mapping loaded. Optical cover transmission 1, roughness 0.018 retained.
- ACES, AgX and Neutral outputs were compared in the browser. Neutral at exposure 1 retains the visible lavender/cyan better. The source render has richer environment reflections; exact offline-render equality is not claimed. No new material or colour gradient was substituted.

## Tests and actual playback

`node scripts/check-double-or-nothing.mjs` passes at 1440×900, 390×844, 768×1024 and 320×568. It checks finite poses, actual skinned tether contacts, axle endpoints, contact insertion order, no premature wraps, mount presence, sequential release, velocity continuity at orbit handoffs and topology-event length continuity. Projected wrap-length variation is respectively 6.04%, 9.85%, 8.50%, 11.92%; it is tracked as an authored screen-space budget, not a claim of exact rope-length conservation.

Desktop and mobile were played through continuously in the browser; bounded committed-frame traces are saved in desktop-playback.json and mobile-playback.json. Each run retains one GLB UUID. Maximum rounded path-end versus projected axle error is below 0.0071 CSS px. Desktop named states and mobile mount/final states were visually inspected. Explicit replay, resize between desktop/mobile and refresh were exercised. Reduced-motion query mode was checked: time 8, exact blue background, one canvas, replay disabled. No console warnings/errors were returned by the browser log check.

Active desktop frame intervals are recorded in performance.json after excluding the first 15 active samples: median 16.7 ms, p95 16.8 ms, mean 16.7 ms over 135 intervals in this in-app browser. This is a browser frame-interval sample, not proof of a hardware-wide FPS target or total GPU cost. Render metrics explicitly describe only the last renderer pass.

`npm run build` passes. Vite still reports the existing 1.35 MB minified JavaScript chunk (395 KB gzip). Physical mobile hardware, other browser engines, GPU context-loss and repeated component mount/unmount stress testing were not performed. Previous QA folders refer to superseded implementations.
