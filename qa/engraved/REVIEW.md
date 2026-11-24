# Engraved-hand refinement review

## Supplied evidence

Reviewed hands.svg (eight compound paths, 443 subpaths), the original GLB and its embedded texture/material data, the original pearlescent render, the two photographic string formations and homeplacement.png. The supplied Screen Recording 2026-11-23 154740.mp4 was inspected at 2, 4, 6 and 8 seconds, including the rough hands, folded release loop and flat display appearance.

## Implemented correction

- Replaced the previous procedural outline illustrations with the actual supplied engraving. The untouched SVG and GLB hashes match their supplied files.
- Resolved relative SVG cubic/smooth-cubic/line commands without simplifying the artwork. All outline, cutout and hatch control points use one continuous two-joint weighted finger skin. Bind-pose coordinate error is below 2e-14 local units. Conservative Jacobian sampling remains positive (minimum 0.480), preventing folded artwork across the checked pose envelope.
- Active string knots are actual left-middle, right-thumb, right-middle, left-index, right-index and projected axle contacts. The wrist/finger pose tracks create the formation; no unrelated knot morphing drives the trick. Right-side hooks release in sequence while the throw-hand endpoint stays attached through launch.
- Original pearl and optical-cover materials are retained with no production material overrides. Audit confirms sRGB colour/emissive textures, non-colour thickness data, correct UV channels, iridescence 0.18, IOR 1.18, thickness 285–425 nm, clearcoat 0.32, pearl roughness 0.085 and optical transmission 1. Lighting was adjusted and compared in browser both with and without the optical cover. Source texture extraction is retained in qa/material-audit/.
- Master sequence is 7.8 seconds. Hands preload with the GLB. Entry stays #F8F7F3, colour inversion runs 5.1–6.5 seconds, and the hero settles with the existing homepage content. Camera framing and final composition remain continuously animated in one canvas.

## Live browser verification

1440×900 desktop: 468 recorded frames, one GLB instance, 30 frames in the mounted hold. Maximum actual rounded string-end error against the projected axle: 0.0068 px. Local frame sample: median 16.7 ms, p95 16.8 ms, mean 16.7 ms over 135 post-warm-up intervals. A fresh final test tab had no JavaScript errors; earlier development-tab logs contain temporary HMR import errors from the component replacement.

390×844 mobile: 470 recorded frames, one GLB instance, all eight supplied artwork paths, no horizontal overflow. Recorded axle error below 0.0068 px. Both are browser viewport checks; actual mobile hardware was not available.

Source-pose identity, continuous positive deformation orientation and all active named finger contacts pass `node scripts/check-engraved-rig.mjs`. `node scripts/check-choreography.mjs` checks 937 time samples at each of 320×568, 390×844, 768×1024 and 1440×900. The production build passes. The existing large-JavaScript-chunk advisory remains.

## Limits

The merged illustration supports subtle elegant curls, not unrestricted anatomical finger articulation. The SVG thread uses illustrated over/under crossings and GLB axle projection; it is not a fully colliding 3D knot. The photographic references do not define a complete source animation, and offline-render lighting cannot be reproduced pixel for pixel from the provided still. These limits are explicit rather than hidden by a static preview.

Final replay/resize recheck retained the same GLB instance and produced no JavaScript errors. Renderer-info memory metrics are saved separately; draw counters describe only the last renderer pass, not total GPU frame cost. GPU timing was not measured.
