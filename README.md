# ASCII Studio · Depth & Light

Live: https://spacereact.github.io/Ascii/

A self-contained browser image/video ASCII editor. Classic rendering and motion tools remain available alongside a new depth playground. No build step is needed. Uploaded media stays on your device.

## Depth workflow

1. Import a photo or select a generated demo.
2. Choose **3D ASCII glyphs** or **Parallax photo** in Scene view. Quick relief creates a smooth heuristic foreground relief; it is not AI geometry.
3. Choose **AI depth** for local Depth Anything V2 Small inference, or import an aligned grayscale depth image. Bright pixels are near; Invert depth reverses this convention.
4. Drag the camera, adjust yaw/pitch/zoom, or animate a subtle orbit. Raise depth / Lower depth sculpt the surface; Smooth depth smooths the base map. Save depth exports the edited, inverted map as a PNG.
5. Switch to Depth map to inspect the geometry. Camera, lighting, normalized depth and brush fields are included in undo/redo and saved projects.

The renderer projects a single depth surface or camera-facing glyph cards positioned in 3D, using Canvas with depth sorting. This is 2.5D, not full object reconstruction or Gaussian splatting. Keep camera movements small: unseen surfaces are not generated, occlusion handling is approximate, and strong depth changes can fold the textured mesh. Glyphs remain camera-facing rather than extruded meshes.

AI depth is optional. It loads pinned Transformers.js 3.8.1 from jsDelivr and the quantized `onnx-community/depth-anything-v2-small` model from Hugging Face, running ONNX/WASM in a module worker. The first download is substantial, inference speed varies, and browser/network support is required. Cancellation terminates the worker; stale results cannot overwrite a changed source, composition, undone edit, or depth stroke. Video/camera depth describes one captured frame; it is not tracked over time. Quick relief, imported maps and manual brushes work without this model.

## Light lab

Depth-derived normals drive a movable sun, ambient illumination, day/night tint, source-colour or clay material, and depth fog. Paint light creates up to eight approximate local emitters, with adjustable colour and intensity. Day, Golden hour and Night presets provide starting points.

Lighting is an approximation on the estimated surface. Original shadows and illumination are baked into the source photo; the app does not regenerate materials, remove shadows, cast accurate new shadows, identify objects, or synthesize hidden scenery. Transparent photo mode preserves source alpha and skips lighting overlays. Classic ASCII retains its original flat rendering.

## Motion and paint

- Glow pulse, rotating disc, heat rise, tree sway, falling petals, liquid wave, individual drift, and scatter/return
- Source-guided suggestions based on colour and foreground contrast, with painted masks for exact selection
- Smear, directional stretch, pixelate, paint motion, pin/freeze, pivot, and erase brushes
- Generated disc, tree/petals, flame, and flow-field demos
- Motion on glyph scenes and the photo surface; stylized petal/ember particles

Suggestions are visual heuristics, not semantic AI recognition. Motion is procedural deformation rather than generative image-to-video synthesis.

## Rendering, media and export

Six ASCII modes, eight tonal presets, custom ramps, font brightness calibration, density/tone controls, source/mono/gradient colour, glow/glitch/rain/scanlines/trails, image/video/camera sources, audio frequency modulation, and compare remain available.

PNG and real-time recording capture the active scene. Text and coloured HTML export the static sampled character grid. Project JSON includes settings, depth and brush fields, but media must be reattached. Device-local V3 autosave reads older V2/V1 settings.

Recording uses browser-supported WebM or MP4 at 1280px and up to 30fps, with selected audio. Keep the tab visible; slower devices may drop frames. Camera requires HTTPS or localhost. No offline video encoder, BPM estimation, semantic segmentation, or generative relighting service is included.

## Validation

A real Canvas implementation with a DOM harness verified existing motion recipes, brush fields, pointer strokes, undo/redo, project startup/round-trip and exports. V3 checks covered depth-dependent projection, camera dragging, textured photo rendering, day/night changes, painted lights, raise/lower depth, projected brush selection, inference-result wiring and stale-job cancellation. Rendered images were inspected. CDN/module and model metadata endpoints were checked; full browser layout, actual AI model inference, camera access and native video recording were not exercised in this environment.

## Local use

Open `index.html`, or run `python3 -m http.server 8000` and visit http://localhost:8000. HTTPS/localhost is recommended for optional browser features. GitHub Pages deploys the single HTML file on every push to `main`.
