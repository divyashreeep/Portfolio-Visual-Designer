# Front display system — 24 November 2026

## Asset inspection and implementation

The actual GLB has separate `RY8_Front_Eye_Left/Right` meshes, nested white oval highlights (`Pupil`) and catchlights. They are curved surface artwork, not an eye image baked into the pearl. The front substrate is `RY8_Front_Face_Glass`, radius 0.02439 m, with planar UVs. The optical cover is a separate curved glass mesh. The front is viewed from local negative Z, so video sampling reverses exported U and V to establish an upright viewer-facing basis.

Original GLB SHA-256 remains `4569cd13f2c304340d3fb79322411a87c54f457bd2a0200e9764c5bdd31d62a8`. No Blender export or geometry replacement was needed. The original asset remains the backup and runtime source.

Only the front eye transforms/material instances and front substrate material instance are owned by the controller. Rear transforms/materials, embedded source textures, optical cover and housing are untouched. Existing front eye and white-reflection geometry/UVs are retained. A vertex-shader curvature delta, fitted from the actual substrate's interior vertices, keeps blinking/gazing artwork on the curved surface. This fixes clipping caused by scaling Y while retaining baked Z curvature. Owned material clones are restored/disposed on unmount; shared original textures are retained.

The source pearlescent PBR shader runs normally in eyes mode. Video is composited into its outgoing light before the existing tone/color conversion, within that same circular geometry and beneath the original glass. Contain fitting leaves pearl around the image; cover crops without stretching. One VideoTexture is reused while loaded. No flat white CanvasTexture, extra screen rectangle, replacement eye design, new lighting or bloom was introduced.

## Browser checks

In-app Chromium, development port 5174 and production preview port 4174:

- Observed natural blinking, including the original black outlines and white highlights. Captured a closed blink; mobile images document smooth partial closure after the curvature correction.
- Native mouse movement produced cursor awareness. Endpoint hover produced thread attention. Native pulling recorded play/recovery/idle attention transitions and retained axle attachment (`play-and-recovery.json`).
- Visually reviewed the original rear display during interaction. It retains the original appearance. During a video-enabled turn, front playback reported `suspended` on the rear-facing interval and resumed `playing` on return (`video-rotation.json`).
- Generated a local 640 × 360 WebM with labelled TOP/BOTTOM/LEFT/RIGHT, a circle, grid and animated frame counter. Video was upright/unmirrored inside the circular face. Cover, contain, pause, replay and return-to-eyes were exercised. Paused current time remained 0.53 seconds across a subsequent action.
- Four repeated eyes/video cycles completed with stable geometry and texture counts: 39 geometries and 10 textures with media retained. One of these textures is the single-pixel fallback; eight are the original embedded model textures. The bounded renderer sample reported median 16.7 ms and p95 17.1 ms at DPR 1; this is a mixed-state frame-interval sample, not isolated GPU timing or a universal FPS guarantee.
- A deliberately missing video returned to eyes, with `ready=false` and `video-unavailable`, rather than a black screen (`missing-video.json`). The expected failed test request is separate from default operation.
- The default production route loaded with no video source, no display controls, no missing-media request and no console errors. The test generator/MediaRecorder code is excluded from the production build.
- Reviewed an actual 390 × 844 viewport after framing settled. Reduced-motion mode uses neutral open eyes without automatic blinking/gaze; normal accessible interaction remains available. Temporary viewport overrides were reset.

## Checks and limits

`npm run build`, `node scripts/check-display.mjs`, `node scripts/check-hero-idle.mjs` and `node scripts/check-hero-physics.mjs` pass. The display checks exercise irregular/double-blink timing, movement bounds, aspect fitting, lazy media creation, unavailable media, autoplay rejection and resource cleanup, plus front-only material ownership and original source integrity. The protected loading and interactive physics sources remain unchanged.

The final user video has not been supplied. Browser video mapping was verified with generated WebM; the eventual MP4/WebM must use codecs supported by its visitors' browsers and provide CORS headers when hosted on another origin. Actual autoplay rejection was simulated in the controller test; the browser test used muted inline playback successfully. Physical touch hardware and other browser engines were not tested. The existing Vite chunk-size advisory remains.
