# Final correction review — 23 November 2026

## Source observations and clarified target

The latest MP4 (171255) is 1102×834, duration 13.1333 seconds. It was inspected at 0.1, 4.6, 5.5 and 6.5 seconds. The recording begins on an arrived homepage before the shown intro; it alone does not establish a fresh-navigation flash. The hands are inverted, cramped and abruptly cut at the wrists. The user clarified that “star” meant the layered thread formation, not a literal star. No new star topology was invented.

The supplied three-panel instructional diagram remains the movement reference: retain the free-index guide, swing under it toward the throwing index, capture/circle that index, pass around the opposite index, rise over the front string and land in the mount. The intermediate arcs, depth and final release are authored interpretations of the still diagram. They are not asserted to be an exact physical Double or Nothing simulation.

## Corrections and matched review

- Hand pose: original SVG fingers point upward/inward, with approximately ±20° wrist rotation; the previous 180° rotation is removed. Contact separation is 42% of desktop viewport width (height bounded), 56% on mobile. Wrist closure is extended outside the viewport, retaining the original palm/finger proportions.
- Illustration: all original paper shapes are filled together over their combined blue outline; original internal detail is painted last. This removes outlines along hidden shape overlaps that previously created angular panels. The five static cyan string paths remain excluded.
- Articulation: independent index capture/release gestures, thumb clearance and middle-finger tether response share the exact weighted skinning used for the visible source paths. Maximum index curl is around eleven degrees, avoiding exaggerated distortion.
- Contacts: the routed path curves around finger radii, with approach/exit angles, wrap direction and near/far depth. Near contact arcs sit above the actual hand silhouette; far arcs are masked by it. A continuous tether loop surrounds the throwing middle finger. Contact radii resolve as the fingers release.
- Choreography: the yo-yo reaches each index before its contact is acquired. Existing spans remain connected; front-span mount and dismount blend neighbouring tangent directions. A crossing marker previously derived from unrounded node chords could look detached; markers now use the actual tangent spans.
- Visibility: the same 3D body passes in front of the illustration during close passes, avoiding the palm hiding the face. Wider-space trajectories remain in the viewport. Release, hand retreat, colour inversion and arrival share the same playhead.
- Material: original pearl and optical-cover definitions are unchanged. Studio lighting uses broad warm-white, pale-cyan and lavender reflections at neutral exposure. A darker reflection test was rejected because it made the chrome read black. Final finish remains silver, with soft cyan/lavender on the pearl. The offline reference has different reflection detail; pixel equality is not claimed.

## Evidence and validation

Eleven named desktop captures cover opening, initial tension, underhand sweep, first index wrap, opposite-index wrap, mount approach, held mount, release, swing, inversion and arrival. Live desktop/mobile captures were also taken as the animation played through those phases without seeking. The final build was served on port 4173; this avoids development HMR/module caching. Fixed-size iframe viewports provided an actual 1440×900 and 390×844 canvas independently of the host browser window.

`desktop-playback.json`, `mobile-playback.json` and `playback-checks.json` contain the committed-frame evidence. Each run retains one nonempty GLB UUID from asset readiness through arrival. One initial preloading record has no model yet. Rounded SVG endpoint/projected axle error stays below 0.0071 CSS px. Background remains paper through 6.3 seconds; homepage reveal remains zero through 7.5 seconds. Fresh standalone production navigation was separately observed at time zero with paper RGB(248,247,243) and home opacity zero.

Explicit replay was tested and retained the model instance. Resizing the same paused iframe from 1440×900 to 390×844 and back retained time 4.8 and the same model UUID; axle and string endpoint agreed in each size. Reduced-motion mode reached time 8 with a single canvas, exact blue background and replay disabled.

Active frame-interval samples after excluding fifteen warm-up samples: desktop median 16.7 ms, p95 16.8 ms; mobile viewport median 16.7 ms, p95 16.9 ms (135 intervals each, this in-app browser). These are frame intervals, not measured GPU time or a guarantee for physical mobile hardware.

`node scripts/check-double-or-nothing.mjs` passes at 1440×900, 1101×830, 390×844, 768×1024 and 320×568. Checks include finite poses, viewport containment, independent index timing, no sampled hand foldover (minimum Jacobian 0.7249), source-pose identity (maximum error 1.42e-14), offscreen cuff closure, ordered contact acquisition, actual tether surface attachment, axle connection, mount/release state, and velocity continuity. Largest measured contact-event route-length discontinuity is below 0.072 CSS px.

`npm run build` passes; final JavaScript is approximately 1.35 MB minified / 396 KB gzip, with Vite's existing large-chunk advisory. No additional runtime libraries were installed. Source SVG and GLB hashes still match the supplied assets.

## Limits

The string is a projected, choreographed route rather than a fixed-world-length rope/collision solver. Wide hand spacing prioritises a readable composition; projected length changes as wraps develop and the hero grows. Near/far layering is authored, not a volumetric hand simulation. Physical mobile hardware, other browser engines, GPU context-loss and extended mount/unmount stress testing were not available. Earlier QA folders describe superseded implementations.
