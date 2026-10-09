# ASCII Studio · Solid Type

Live: https://spacereact.github.io/Ascii/

A self-contained browser image/video ASCII editor with brushes, procedural motion, audio response, and optional solid 3D characters. The depth-map and scene-lighting options have been removed. Media stays on your device; no model downloads or build step are needed.

## Studio layout

One canvas, one brush bar, and one inspector organized into Source, Type, Motion, Look, Audio, 3D, and Export. Desktop uses a scrolling inspector; smaller screens stack the controls below the canvas. Tone and advanced artwork rotation use disclosures. Undo/redo, reset, saved projects and exports remain available.

## Solid 3D

Select **3D** above the canvas. Each character's raster silhouette becomes a closed extruded pixel mesh with front, back, outer walls and hole walls. Adjust character thickness and rotate the glyphs around X, Y and Z. Animate rotation on one or all axes, with adjustable speed.

Rotate the whole artwork independently using its XYZ controls or the **Rotate artwork** tool. Drag to tilt/turn; Shift+drag rolls. Reset rotation returns a front view. Brushes still edit the artwork, with inverse projected coordinates in 3D.

WebGL 2 renders repeated glyph meshes using instancing, depth testing and shared buffers. Browsers without WebGL 2 use geometry-rendered software glyph sprites, with approximate inter-character occlusion and quantized brush rotation/aspect. Software rendering is slower, especially with animated rotation and high character counts. The glyph shape is pixel-based rather than a smooth font outline. Fixed face shading makes volume readable; there is no scene-lighting editor.

## Faster rendering

- Cache static source sampling, foreground analysis, tonal/character grids and glyph tiles.
- Cache sampled brush fields until brush edits or grid dimensions change.
- Generate static demos once; procedural movement happens in the renderer.
- Reuse GPU geometry and instance buffers by character.
- Avoid redraws when the canvas is idle; redraw on settings, media, mask, resize or animation changes.
- Preview resolution automatically fits the screen, with Fast/Balanced/Sharp/Full HD overrides and 20/30/60 fps controls. A canvas-side FHD toggle switches between Full HD and automatic preview.

Preview quality changes canvas resolution, not character density. PNG uses the selected export width. Real-time recording has separate 720p / 1080p resolution controls and a dedicated native MP4 button, with browser-supported codecs up to 30fps. Actual frame rate depends on device and effects.

## MP4 and Full HD

Select **FHD** above the canvas or **Full HD** in Preview performance. A 16:9 canvas renders at 1920×1080, and a 9:16 canvas at 1080×1920. Other aspect ratios retain their proportions. Preview quality is independent of export resolution.

In Export, choose the video resolution and duration, then **Export MP4**. This makes a real native MP4 recording; it does not rename a WebM file. The app prefers a supported H.264/AAC MP4 configuration, then a native MP4 configuration. Codec availability depends on the browser; unsupported browsers get an explicit message and can use Record video for a supported alternative. MP4 recording is real-time, not an offline frame-by-frame encoder.

## Customization retained

Six rendering modes, eight tonal presets, custom ramps, glyph font and brightness calibration, density and glyph scale, brightness/contrast/gamma, contours, dithering, source/mono/gradient colour, glow/glitch/rain/scanlines/trails and bypass remain available.

Motion recipes include pulse, rotating disc, fire rise, sway, falling petals, wave, drift and scatter/return. Motion suggestions use colour and foreground contrast, not semantic recognition. Smear, Stretch, Pixelate, Paint motion, Pin, Erase and Pivot remain available, with undo/redo. Particles, masks, pivot, amount, speed and loop controls are retained.

Images, video, camera, uploaded music, video audio, frequency-band modulation, contain/cover, mirror, aspect controls and source compare remain available. Camera requires HTTPS or localhost.

PNG and recording capture the active 2D/3D scene. Text/coloured HTML export the flat character grid. Saved projects include settings and brush fields; reattach media after loading. V4 autosave migrates V3/V2/V1 customization and ignores removed depth/lighting fields.

## Validation

Real Canvas checks verified all motion recipes, retained brushes, pointer strokes, undo/redo, project reloads, exports, closed extruded geometry, XYZ/inverse projection, rotation animation, cache reuse and brush invalidation. Software 3D frames were rendered and inspected.

A local repeated-frame benchmark at 1280px measured approximately 49 ms median for V2 versus 19 ms for V4. This is one native Canvas test case, not a guarantee for every device or effect combination. Live Chrome verification confirmed the organized inspector, software 3D rendering, character rotation, idle redraw behavior, a 1920×1080 preview canvas, and a downloaded one-second Full HD MP4. This browser disabled WebGL 2, so the GPU path could not be visually exercised there. Native mobile layout and recording with an audio track were not exercised in this pass.

## Local use

Open `index.html`, or run `python3 -m http.server 8000` and visit http://localhost:8000. GitHub Pages deploys the single HTML file on pushes to `main`.
