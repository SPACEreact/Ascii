# ASCII Studio · Scene Workshop

Live: https://spacereact.github.io/Ascii/

One HTML file for ASCII image choreography and lightweight perspective scenes. GitHub Pages deploys `index.html` without a build step.

## Studio and performance

24 asset families × five colour/scale/motion profiles = 120 recipes, not 120 independent simulation systems. Up to 64 asset layers support name, X/Z, altitude, scale, rotation, colour, still/pulse/sway/float/spin, duplicate/hide/delete and undo/redo. Camera paths: still, orbit, drone flyover and dolly. Day/dusk/night are palettes with simple face shading.

Image A/B retains eight character transitions, ASCII ramps, contour modes, colours, dithering, shader-style finishes, visual motion recipes. Map import, map picker, elevation data, Matter controls, cloth physics, rubber and liquid simulation have been removed. Heavy per-character extrusion, audio, brushes and magnets remain removed. Glyphs are sprites over projected low-poly geometry.

Full HD starts **off on every page load**, even after restoring a project. FHD toggles a 1920 × 1080 canvas at 16:9. Preview defaults to 20 fps and at most 960 pixels wide; exports have independent resolution. Full HD does not increase character count. Static scenes are cached and hidden tabs do not draw; device performance varies.

## Projects and export

Schema 5 saves assets, camera and studio settings. Schemas 1–4 remain readable; legacy map and material fields are discarded. Scene data/settings autosave locally, migrating versions 7 and 8. Explicit projects embed image A/B at up to 1280 px; video/camera must be reattached.

PNG, plain text, coloured HTML, project JSON, and MP4 are available. Supporting HTTPS browsers render every scene/image frame at 30 fps using WebCodecs baseline AVC and the embedded MP4 writer. Slow machines may take longer without omitting frames. Video/camera or unavailable AVC encoding falls back to native live recording; Record video may save WebM. Live capture requires a visible tab and sufficient playback performance. Maximum export 120 seconds / 220 MB; Stop cancels an incomplete frame export.

## Validation

Real Canvas tests cover 24 mesh families, scene history, cache behavior, duplicate/delete, Full HD dimensions and image transitions. Removal and migration tests verify no map/material runtime or saved state remains. The MP4 writer is checked with actual AVC packets, FFprobe timing/frame counts and a full FFmpeg decode.
