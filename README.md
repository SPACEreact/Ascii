# ASCII Studio · Scene Workshop

Live: https://spacereact.github.io/Ascii/

A self-contained browser studio for image ASCII, character choreography, and lightweight perspective scenes. No build step or external rendering engine. GitHub Pages deploys `index.html`.

## Scene workflow

- Scene opens a procedural city. Start empty or try Garden.
- Library: 24 geometric families × five recipes = 120 combinations of geometry, colour, scale, and movement. These are variations, not 120 independent simulation systems.
- Up to 64 editable asset layers: name, X/Z placement, altitude, scale, rotation, colour, still/pulse/sway/float/spin motion; duplicate, hide, delete, undo/redo.
- Orbit the canvas by dragging. Wheel changes camera distance. Select Place and click the ground to move the selected layer.
- Camera paths: still, orbit, drone flyover, dolly. Day/dusk/night are scene palettes with simple face shading, not physically simulated lighting.
- Type, Look, and Motion retain character ramps, contour modes, colour, dithering, post effects, and glyph choreography. Image A/B retains eight transition presets and coarse cloth/stylized rubber/liquid motion.

## Map areas

Scene → Map → ASCII drone scene. Enter latitude/longitude and choose 250 m, 500 m, or 1 km. Open centre in OpenStreetMap helps inspect the location. Generate makes one bounded Overpass request for building ways and roads, then closes the network workload and renders local geometry. No API key, satellite download, or constantly rendering map underneath the editor.

- Actual OSM building footprints and roads; flat terrain. Building height uses `height`, then `building:levels × 3`, else an explicitly reported estimate.
- Limits: 220 buildings, 120 road segments, at most 24 sampled vertices per imported way. Dense areas are simplified and may omit features. Relations, roof shapes, interiors, elevation and photogrammetry are not reconstructed.
- Public service availability varies. A 35-second timeout and Cancel preserve the previous scene on error. Wait at least 15 seconds between requests. Procedural demos work without internet.
- Map data © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright . Attribution is visible in preview/PNG/MP4 and stored in JSON projects. Map-derived databases retain ODbL obligations.

## Performance and Full HD

Full HD starts **off on every page load**, including restored projects. Click FHD when needed for a 1920 × 1080 16:9 canvas. Preview defaults to 20 fps and at most 960 pixels wide; exports have independent resolution. Static world geometry and glyph tiles are cached; hidden tabs do not draw.

Hard cuts: per-character extruded meshes, brush and magnet fields in the UI, audio, dense physical collisions, live satellite terrain, and a second map renderer. Characters stay lightweight raster glyphs over projected low-poly geometry. No promise of identical frame rate on every low-end device; turn off glow/animated finishes or reduce columns when needed. Full HD output does not automatically increase the character count.

## Export and projects

- PNG, plain text, coloured HTML, JSON project, and video.
- Export MP4: supporting HTTPS browsers use WebCodecs baseline AVC and an embedded MP4 muxer to render each frame at 30 fps for images/scenes. Export can take longer than playback. No CDN or encoder download. Cancel discards an incomplete export. Encoded data is capped at 220 MB; duration at 120 seconds.
- Video/camera inputs and unsupported WebCodecs AVC configurations fall back to native live MP4 recording. Record video provides native WebM/MP4 depending on browser. Live capture requires a visible tab and sufficient playback performance.
- JSON schema 3 embeds assets, camera, bounded OSM geometry and image A/B at up to 1280 px; schema 1/2 remain readable. Video/camera must be reattached. Scene geometry/settings autosave locally; images are embedded only in explicit project downloads.
- Local rendering; imported media is not uploaded. Map generation sends only the chosen public-area bounding box to Overpass.

## Validation

Real Canvas tests cover all 24 geometry families, recipe count, camera animation, static caching, scene history, duplicate/delete, validated project data, OSM footprints/height parsing/roads, Full HD dimensions and image transition regression. The MP4 writer was tested with actual AVC packets: FFprobe confirmed timing/frame count and FFmpeg decoded every frame.
