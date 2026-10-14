# ASCII Studio · Sea Glass Pro

Live: https://spacereact.github.io/Ascii/

A focused image/video ASCII editor. The interface has three tabs:

- **Effects:** 20 Sea Glass engines, adjustable dynamics, and 32 print/dithering effects.
- **Settings:** characters, 16 ramps, glyph fonts/weight, density, cell aspect, rotation, scatter, brick rows, exposure, colour grading, levels and optical/CRT finishes.
- **Export:** PNG, MP4 where browser codecs support it, live video recording, text and coloured HTML.

Load an image or video at the top, choose an effect, adjust its settings and export. Effects run on the shared timeline; Pause freezes the animation and source video. Preview and image/video exports use the same character renderer. Text and HTML export the static source glyph grid.

Sea Glass replaces the previous multi-workflow interface. Motion recipes, A/B transitions, split masks, saved previews, projects and suggestion/share tools are no longer exposed. Existing settings are migrated with choreography and masking disabled. Source media is kept when adjustments are reset. No server processes the media.

The app is buildless. `index.html` contains the base renderer; `sea-glass.js` adds the focused UI and engines. The darkroom and print scripts provide grading, CRT and printing. Legacy extension scripts remain internal for backwards-compatible state; their removed workflows stay disabled.

## Effects

Clean Studio, Ocean Wave, Matrix Rain, Vortex Swirl, Black Hole, Cyber Glitch, Ripple Pond, Liquid Drift, Kaleidoscope, Sobel Neon, Thermal Vision, Halftone Pulse, Error Diffusion, Pixel Sort Melt, VHS Tracking, Wind Shear, Seismic Quake, Cursor Magnet, Bio Heartbeat and Quantum Tunnel.

Kaleidoscope and Tunnel resample the character grid. Pixel Sort sorts source-colour luminance runs per column without mutating the source. Error Diffusion uses the existing Floyd–Steinberg implementation. Other engines move or recolour characters. Pointer effects respond over the artboard. Intensity zero restores the neutral mapping, while typography controls remain independent.

## Preview and export

Auto preview stays capped at 960 px / 20 fps; full HD is opt-in in Settings. PNG can export up to 2560 px. Image MP4 export uses WebCodecs at 30 fps with native recording fallback; video sources use live recording. Some browsers support only WebM live capture. Exports have no audio. Web fonts fall back to local fonts when offline.

## Checks

`node tests/sea-effects.cjs` checks finite transforms across portrait/landscape, pointer force, neutral intensity and immutable pixel sorting. `node tests/print-effects.cjs` checks print/dither output. `node tests/mobile-smoke.cjs` with Playwright and Chrome checks the three-tab interface, engines, pause, controls, state migration, image upload and full-size PNG export at phone and desktop dimensions. GitHub Actions runs the browser checks and publishes all referenced scripts to Pages.
