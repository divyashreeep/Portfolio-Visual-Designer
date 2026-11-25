# Fixed typography sizing and anchors

This review supersedes the earlier travelling-pivot refinement. Only typography code/CSS changed.

- Both faces inherit the same Clash Display font size, weight, line height and spacing from their slot. Removed the larger initial 10vw / 17vw sizing and its independent placement offsets.
- Top faces align to the same top-left corner; lower faces align to the same bottom-right corner. Transform origins AND perspective origins use those corners.
- Removed all translation/depth routing, measurement callbacks, resize observation and initial settling movement. GSAP animates rotationX only, from 0 to -180 degrees on the outgoing face and 180 to 0 on the incoming face. No scale or layout-property animation.
- The final heading still defines each stationary container's dimensions. Both face layers exist before playback. Initial PORTF/LIO wording and the two-line final upper heading remain unchanged.
- Retained the 1.15-second turn, 100 ms stagger, 1.5-second readable initial hold, single scoped timeline, font readiness, reduced-motion path and original arrival-completion trigger.

Actual browser verification:

Five states captured at 1.0 s (initial), 1.6 s (start), 2.125 s (handoff midpoint), 2.75 s (completed rotation), 2.95 s (rest). The top-left slot anchor was (154.140625, 165.46875) and bottom-right anchor (998.234375, 777) throughout the default 1078×840 desktop viewport. Front-facing text bounding-box corners matched those anchors at every sample, including the midpoint. Maximum anchor movement: **0 CSS px**. Both faces had matching computed sizes: upper 64.68 px and lower 63.063 px, weight 600.

Repeated all five coordinate checks at 768×1024, 390×844 and 320×568. Maximum slot anchor movement: **0 CSS px** at each size; computed font sizes matched within each outgoing/incoming pair; no horizontal overflow. `checks.json` records all measurements. Screenshots capture all five states on desktop and mobile.

Normal playback from the complete loading sequence reviewed. Thread keyboard pull entered play before the flip and remained active through it; release/recovery returned to idle with the final headline still visible. Reduced motion rendered unrotated final faces. Browser errors: none. Build and existing display checks passed. Viewport override reset after QA.

The perspective rotation naturally foreshortens the visible face; its hinge corner and font metrics remain fixed. Physical mobile hardware and other browser engines were not tested; no FPS measurement is claimed.
