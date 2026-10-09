# ASCII Studio · Motion & Paint

Live: https://spacereact.github.io/Ascii/

A self-contained browser image/video ASCII editor. Open `index.html` directly, or use the live site. No build or dependencies required. Uploaded media stays on your device.

## Motion workflow

1. Import a picture, or choose Spiral disc, Tree & petals, Flame, or Flow field from the demo selector.
2. Select Glow pulse, Rotating disc, Fire rise, Tree sway, Falling petals, Liquid wave, Glyph drift, or Scatter / return.
3. Adjust amount and speed. Motion also works on still images; use the timeline to scrub it.
4. Choose Paint motion and draw the affected region. Pin freezes an area. Set pivot lets you choose a rotation centre or sway anchor.
5. Use Smear to drag glyph positions, Stretch for directional deformation, and Pixelate for coarse block patches. Erase, Undo and Clear paint recover edits.
6. PNG and real-time recording capture motion and brush deformation. Text/HTML export the static sampled character grid.

## Source-guided suggestions

Suggest motion analyses border contrast, alpha, foreground bounds and colour distribution. Green suggests sway; warm colours suggest heat-rise; pink accents suggest falling petals; round bounds suggest rotation. This is a local visual heuristic, not semantic AI recognition. Use painted masks when colours or background contrast do not identify the intended subject. Particles are stylized glyphs seeded from sampled picture locations and colours; this is not generative image-to-video synthesis.

## Rendering and existing tools

- Six rendering modes, eight tonal presets, custom ramp and font-based brightness calibration
- Density, contrast, gamma, brightness, edge strength and ordered dithering
- Source, mono or gradient colours with colour intensity
- Glow, glitch, code rain, scanlines, trails and bypass
- Uploaded music or video audio with frequency-band modulation
- Image, video and camera sources, contain/cover, mirror, aspect controls and compare
- PNG with transparency, text, coloured HTML and JSON project exports
- Saved projects include normalized brush fields and pivot, but media must be reattached
- Undo/redo and device-local autosave; prior V1 settings migrate

## Recording and limitations

Real-time browser recording at 1280px and up to 30fps includes selected audio. Output codec is detected: WebM or supported MP4. Keep the tab visible; slower devices may drop frames. Camera requires HTTPS or localhost.

No deterministic offline video encoder, video trimming, BPM estimation, object segmentation model, editable effect ordering, error-diffusion dithering, or custom preset management is included.

## Validation

V2 checks used a real Canvas implementation with a DOM test harness: all eight motion recipes changed rendered frames; tree colour suggestions, brush fields, undo/redo, project round-trip and export handlers passed. Rendered images were inspected. Full browser layout and native camera/video capture were not validated in that environment.

## Local server

Optional: `python3 -m http.server 8000`, then open http://localhost:8000.
