# ASCII Studio — Character Choreography

Live: https://spacereact.github.io/Ascii/

A self-contained local-first ASCII scene editor. Open `index.html` directly or use GitHub Pages. No runtime CDN, uploaded media, or build step. The Pages workflow deploys `index.html`.

## What is available

- Image/video/camera conversion with the existing type, colour, tone, motion and export controls.
- **Sequence:** choose image A and image B. Match sampled non-space glyphs by Morton spatial ordering, resample unequal counts, interpolate colour, and animate the characters between both arrangements. Eight transitions: cinematic travel, soft morph, orbital swirl, full-frame noise/reveal, shatter/assemble, cascading reveal, ribbon flight, colour dissolve. Loop holds and an optional return journey; shared timeline scrubbing. Try demo pair requires no files.
- **Materials:** rigid glyphs; cloth using a 24×15 connected Verlet mesh with distance/diagonal constraints, gravity, wind and top-edge/corner anchors; rubber spring pulse styling; liquid flow styling. Cloth is a lightweight 2D deformation simulation, with no collision/self-collision. Material deformations also feed the 3D glyph renderer.
- **Look:** colour, glow, glitch, trails, scanlines, code rain and four shader-style finishes (spectral echo, holographic shimmer, heat ripple, film grain). These finishes use Canvas compositing/deformation; they are not a GPU postprocessing library.
- **3D inside Look:** cached, closed extruded glyph meshes, independent XYZ glyph and artwork rotation, optional spin. WebGL2 instancing when available; geometry-rendered software fallback otherwise.
- **Export:** PNG, native MP4 when browser-supported, WebM fallback, and 1920×1080 landscape / 1080×1920 portrait preview. MP4 remains real-time, silent, up to 30 fps; recording depends on device/browser performance. Video begins at the start of an enabled keyframe sequence. Text/HTML export the source grid, not moving particle positions.
- **Scene JSON v2:** embeds image keyframes at up to 1280px plus controls/materials. v1 settings remain loadable. Videos/camera need reattachment. Device autosave keeps settings and materials, not image bytes. Undo/redo covers controls and materials, not media replacement.
- Audio, brushes and magnets have been removed. Older project magnet settings are ignored; they do not affect rendering. Existing depth/light editors remain removed.

## Quick workflow

1. Sequence → choose A and B, or Try demo pair.
2. Pick a transition; Show A/B to inspect endpoints, Play sequence or scrub the timeline.
3. Matter → choose a material, its amount and simulation settings.
4. Choose a material. Cloth plays while the timeline runs; Reset simulation starts it again.
5. Look → open 3D to rotate glyphs; canvas tool → Rotate 3D artwork to drag the scene.
6. Export → choose duration and resolution → Export MP4. Save project retains image keyframes.

## Technology shortlist for the larger scene composer

Research checked against repository READMEs/licenses on 2026-10-10. The current app uses its own implementation; these are candidates for a future modular engine, not dependencies already integrated.

| Repository | Useful role | License / integration note |
| --- | --- | --- |
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | Instanced extruded glyph rendering, WebGL and WebGPU/TSL foundations | MIT. Best core renderer candidate; GPU morph buffers need custom ASCII sampling/matching. |
| [chrismaldona2/tsl-morphing-particles](https://github.com/chrismaldona2/tsl-morphing-particles) | Small concrete example: 16k particles, GPU position/colour morphs, texture-array targets | No license identified in the inspected repository page. Study architecture; obtain permission or verify a license before copying. It morphs 3D model surfaces, not arbitrary ASCII images directly. |
| [subprotocol/verlet-js](https://github.com/subprotocol/verlet-js) | Simple particles + distance/angular constraints; browser cloth example | MIT. Suitable CPU fallback reference; mature/simple code, not a modern GPU cloth engine. |
| [jspdown/cloth](https://github.com/jspdown/cloth) | WebGPU XPBD cloth, compliance, small steps, constraint graph colouring | MIT. Research/prototype reference; README has old experimental-browser instructions, so integration needs compatibility work. |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | Bloom, chromatic aberration, glitch, noise, god rays, LUT grading, shock waves | Zlib (upstream portions MIT). Good Three.js effect stack; import selected effects and manage render-target costs. |
| [gl-transitions/gl-transitions](https://github.com/gl-transitions/gl-transitions) | GLSL image-transition recipes for reveal/dissolve/warp layers | Check the license of each transition. Texture transitions complement glyph paths; they do not match/travel individual glyphs. |
| [tsparticles/tsparticles](https://github.com/tsparticles/tsparticles) | Configurable emitters, character particles, masks and effect presets | MIT. Useful secondary effect layers; contrast-selective glyph magnets still require custom image masks/forces. |
| [daybrush/moveable](https://github.com/daybrush/moveable) | Canvas/DOM layer placement, drag, scale, rotate, group and snap handles | MIT. Strong fit for preset placement handles; does not provide a particle renderer or timeline. |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | Optional node editor linking sources, assets, materials and effects | MIT core. Editor UI only; implement execution/rendering yourself. |
| [theatre-js/theatre](https://github.com/theatre-js/theatre) | Visual keyframes and choreography of arbitrary JS/3D parameters | Core Apache-2.0; Studio AGPL-3.0. Embedding the visual editor needs license review. README says development temporarily moved to a private repo; confirm maintenance before committing. |

## The 100+ preset scene vision

Not implemented yet: a 100+ preset library, independent artwork layers, arbitrary object placement, per-layer timelines and a node compositor. The A/B sequence and material engine are the current foundation.

Recommended next architecture: Three.js renderer + custom glyph/asset engine, selective Postprocessing effects, Moveable placement handles, and an owned lightweight timeline. Add React Flow only if node composition improves the workflow; do not add every library at once. Keep a CPU/WebGL fallback for browsers without WebGPU.

Each preset should be serializable data: `id`, `category`, `seed`, `source`, `selector`, `transform`, `motion`, `material`, `appearance`, `start`, `duration`, `blendMode`, `parameters`, `performanceTier`. Layers own transforms/timing and reference image assets. A staged evaluation order is source sampling → glyph matching → transition paths → asset motion → material deformation → glyph rendering → layer effects → compositing. Preserve glyph IDs for stable movement and cache source sampling/matches until relevant inputs change.

Build 100 meaningful recipes across travel/reveal, asset motion, cloth/rubber/liquid, fire/petals/embers, geometry, colour and finish families, with thumbnails and editable parameters. Shared settings and random seeds are variations; they should not be advertised as distinct motion algorithms. Lazy-load optional effects, budget particle counts per scene, and offer deterministic fixed-step offline encoding later for reliable high-quality exports.

## Validation

Real Canvas tests cover both endpoints, eight transitions, finite particle positions, legacy project field settings ignored after removal, cloth deformation and pinned anchors, rubber/liquid motion, 3D software fallback and Full HD dimensions. Browser QA covers visible controls, image selection, preview, recording and scene export. Hardware WebGL rendering still needs visual testing on a GPU-enabled browser.

## Planned map scene source and performance direction

A selected map area can become an ASCII drone scene: geographic coordinates + roads, water/land cover and building footprints + elevation data → compact scene meshes → virtual flight camera → ASCII rendering. Building heights should use available height/level metadata; fallback estimates and procedural vegetation are artistic approximations. This feature is not implemented yet.

Candidate map stack: [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) for area selection, with MapTiler vector/terrain services or appropriately licensed OSM-derived data. MapLibre is a renderer, not a free global data API. Check provider coverage, pricing, caching/derivative/export permissions and attribution. OSM's public standard raster server prohibits bulk/offline tile downloads; use a provider that permits the intended scene pipeline or self-host permitted data.

For an asset scene builder on low-end PCs, prioritise a bounded area, reusable low-poly geometry, a cached glyph atlas, instancing, static layer baking, culled/offscreen layers and a small coarse cloth mesh. Load presets as data and lazy-load their optional assets. Proposed fast mode uses billboard/sprite glyphs over a 3D/2.5D scene rather than extruding and independently rotating every glyph. This changes true glyph volume and should be disclosed, not advertised as identical geometry.

Proposed cuts: software per-glyph 3D animation, per-object dynamic shadows/reflections, dense live cloth/liquid simulation, excessive full-screen effects and simultaneous full-HD map rendering plus CPU ASCII sampling. Camera/video inputs can become an optional module. Keep image import, A/B morphs, asset placement, camera paths, colours, glyph density, lightweight glow and full-resolution export.

A lower-resolution adaptive preview and deterministic frame-by-frame export can preserve final output settings while taking longer on weak hardware. The current real-time MediaRecorder exporter is not an offline encoder; a future WebCodecs encoder with a compatible MP4 muxer needs codec support detection and a fallback. Equal output quality, identical features and identical real-time speed cannot be promised on arbitrary hardware. These performance cuts are recommendations, not changes applied in this release.
