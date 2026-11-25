# Typography motion refinement

Changed only typography motion/CSS and its development inspection controls. The PORTF + existing yo-yo as O + LIO concept and both endpoint compositions are preserved.

The previous independent face centres caused a positional discontinuity at the edge-on handoff. Both faces now travel through the same interpolated centre, with one eased progress controlling X-axis rotation, XY travel and a shallow depth arc. Their rotations remain 180 degrees apart; reverse faces are hidden. A common perspective on each stable slot replaces the separate, shallow perspectives on each mask. The masks preserve the 3D hierarchy and allow projected glyphs to extend without clipping.

Each turn is 1.15 seconds, with a 100 ms lower-block stagger. The initial hold still runs until 1.5 seconds; the sequence completes at 2.95 seconds. CustomEase `.5,0,.5,1` provides zero endpoint velocity and continuous motion through the edge-on handoff, without a midpoint stop. No scaleY, font-size, line-height or layout properties are animated.

Font-ready measurements use untransformed mask boxes. ResizeObserver updates the anchors on viewport changes without reading layout every animation frame. Only the existing GSAP timeline drives transforms; no new RAF or Three.js hook. Cleanup cancels font work, disconnects the observer and reverts the GSAP context. Explicit initial timeline transforms fix stale quick-setter poses when replaying in the development lab.

Actual in-app browser checks:

- Normal and 0.35× slow playback reviewed, including outgoing trapezoidal perspective, edge-on handoff and incoming settling.
- Full fresh loading sequence: typography inactive before arrival, PORTF/LIO first, then flip, then final headline.
- Thread keyboard pull entered play during the typography sequence; flip continued. Release and recovery returned to idle without replaying typography. No yo-yo reset was introduced.
- 768×1024, 390×844 and 320×568: no horizontal overflow; final heading x/y/width/height differ by **0 CSS pixels** from the approved headline baseline. Captures include initial, midpoint and final states.
- Reduced-motion mode shows the unrotated final headline immediately; outgoing layers hidden.
- Browser error log empty on final clean playback.
- Production build and existing display/asset checks passed.

Evidence: `checks.json`, responsive state captures, `fresh-arrival.png`, `interactive-flip.png`, `final-preview.png`. Early desktop samples were captured before the development replay reset correction; normal fresh-entry playback did not have that issue. Replay was verified again after correction.

No new motion reference video was supplied for this refinement; movement was tuned to the written direction and approved endpoint references. Physical phone hardware and other browser engines were not tested. No numeric FPS claim is made.
