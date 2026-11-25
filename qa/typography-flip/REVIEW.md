# Hero typography flip review

Implemented a front/back X-axis turn on independent text faces, coordinated by one scoped GSAP timeline. Existing `HomeHero.active` comes from the loading timeline's completion event. No intro, model, lighting, materials, display or physics source was changed.

Timing after arrival/font readiness: 0–0.7 s initial settling; hold until 1.5 s; upper turn 1.5–2.5 s; lower turn 1.6–2.6 s; complete at 2.8 s. CustomEase `.65,0,.24,1` accelerates through the edge-on handoff and decelerates into the final face. Backface hiding prevents mirrored letters. Reduced motion goes straight to the approved final headline.

Browser verification in the in-app Chromium browser:

- Full loading sequence, then actual PORTF / LIO hold and flip playback. Heading remained inactive/waiting during the intro.
- Matched reference viewport 1020×634: initial composition, outgoing turn at 1.85 s, incoming handoff at 2.05 s and final face at 2.8 s captured.
- Responsive typography inspected at 768×1024, 390×844 and 320×568. No horizontal overflow. At tablet/mobile sizes, final text bounding boxes exactly match the previous `qa/headline/responsive-checks.json` measurements. Mobile was reloaded for correct settled Three.js framing, then actual playback reviewed.
- Keyboard thread pull started during the PORTF / LIO hold; physics entered play and continued through the flip. Release/recovery returned to idle while typography remained at headline/time 2.8; no repeat.
- All text faces have pointer-events:none and backface-visibility:hidden. No text-content swapping or layout-property tweens.
- Reduced-motion query verified initial faces hidden and final faces unrotated/readable.
- Browser error log empty on clean playback. Production build passed.

`?hero=1&typeLab=1` in the development server exposes a typography-only time input and replay button for deterministic captures. These controls are excluded from the production build. The controls never seek the yo-yo or physics. Screenshots with the controls are authoring evidence; `portfolio-preview.png` and `final-preview.png` show the normal UI.

No new animation dependency, requestAnimationFrame loop or per-frame React state. Timeline context is reverted on teardown and pending font callbacks are cancellation guarded. Transform hints are removed after completion.

Limitations: physical phone hardware and a cross-browser engine matrix were not tested. No frame-rate claim is made. Transient model framing in the early numbered mobile captures reflects resizing an already-running physics scene; `mobile-hold.png` / `mobile-final.png` are the reloaded mobile checks.
