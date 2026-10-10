# ASCII Studio — Character Choreography

Live: https://spacereact.github.io/Ascii/

A self-contained local-first ASCII scene editor. Open `index.html` directly or use GitHub Pages. No runtime CDN, uploaded media, or build step. The Pages workflow deploys `index.html`.

## What is available

- Image/video/camera conversion with the existing type, colour, tone, motion and export controls.
- **Sequence:** choose image A and image B. Match sampled non-space glyphs by Morton spatial ordering, resample unequal counts, interpolate colour, and animate the characters between both arrangements. Eight transitions: cinematic travel, soft morph, orbital swirl, full-frame noise/reveal, shatter/assemble, cascading reveal, ribbon flight, colour dissolve. Loop holds and an optional return journey; shared timeline scrubbing. Try demo pair requires no files.
- **Fields:** up to 12 independently positioned magnets. Click to place, drag the centre, select a field from the list. Attract, repel, vortex, orbit or wind. Target all glyphs, high contrast/edges, highlights, shadows, warm or cool colours; adjust strength, radius and selection threshold. Image-based selectors are heuristics, not object recognition.
- **Materials:** rigid glyphs; cloth using a 24×15 connected Verlet mesh with distance/diagonal constraints, gravity, wind and top-edge/corner anchors; rubber spring-response styling; liquid flow styling. Cloth is a lightweight 2D deformation simulation, with no collision/self-collision. Material deformations also feed the 3D glyph renderer.
- **Look:** colour, glow, glitch, trails, scanlines, code rain and four shader-style finishes (spectral echo, holographic shimmer, heat ripple, film grain). These finishes use Canvas compositing/deformation; they are not a GPU postprocessing library.
- **3D inside Look:** cached, closed extruded glyph meshes, independent XYZ glyph and artwork rotation, optional spin. WebGL2 instancing when available; geometry-rendered software fallback otherwise.
- **Export:** PNG, native MP4 when browser-supported, WebM fallback, and 1920×1080 landscape / 1080×1920 portrait preview. MP4 remains real-time, silent, up to 30 fps; recording depends on device/browser performance. Video begins at the start of an enabled keyframe sequence. Text/HTML export the source grid, not moving particle positions.
- **Scene JSON v2:** embeds image keyframes at up to 1280px plus controls/fields. v1 settings remain loadable. Videos/camera need reattachment. Device autosave keeps settings and fields, not image bytes. Undo/redo covers controls and magnets, not media replacement.
- Audio and brushes have been removed. Existing depth/light editors remain removed.

## Quick workflow

1. Sequence → choose A and B, or Try demo pair.
2. Pick a transition; Show A/B to inspect endpoints, Play sequence or scrub the timeline.
3. Fields → place magnets, choose an image selector and force. Layer several fields for a composition.
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
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | Optional node editor linking sources, fields, materials and effects | MIT core. Editor UI only; implement execution/rendering yourself. |
| [theatre-js/theatre](https://github.com/theatre-js/theatre) | Visual keyframes and choreography of arbitrary JS/3D parameters | Core Apache-2.0; Studio AGPL-3.0. Embedding the visual editor needs license review. README says development temporarily moved to a private repo; confirm maintenance before committing. |

## The 100+ preset scene vision

Not implemented yet: a 100+ preset library, independent artwork layers, arbitrary object placement, per-layer timelines and a node compositor. The new magnets and A/B sequence are the first foundation.

Recommended next architecture: Three.js renderer + custom glyph/field engine, selective Postprocessing effects, Moveable placement handles, and an owned lightweight timeline. Add React Flow only if node composition improves the workflow; do not add every library at once. Keep a CPU/WebGL fallback for browsers without WebGPU.

Each preset should be serializable data: `id`, `category`, `seed`, `source`, `selector`, `transform`, `force`, `material`, `appearance`, `start`, `duration`, `blendMode`, `parameters`, `performanceTier`. Layers own transforms/timing and reference image assets. A staged evaluation order is source sampling → glyph matching → transition paths → forces → material deformation → glyph rendering → layer effects → compositing. Preserve glyph IDs for stable movement and cache source sampling/matches until relevant inputs change.

Build 100 meaningful recipes across travel/reveal, fields, cloth/rubber/liquid, fire/petals/embers, geometry, colour and finish families, with thumbnails and editable parameters. Shared settings and random seeds are variations; they should not be advertised as distinct motion algorithms. Lazy-load optional effects, budget particle counts per scene, and offer deterministic fixed-step offline encoding later for reliable high-quality exports.

## Validation

Real Canvas tests cover both endpoints, eight transitions, finite particle positions, image selector thresholds, visible magnet influence, field undo/redo/settings round-trip, cloth deformation and pinned anchors, rubber/liquid motion, 3D software fallback and Full HD dimensions. Browser QA covers visible controls, image selection, preview, recording and scene export. Hardware WebGL rendering still needs visual testing on a GPU-enabled browser.
