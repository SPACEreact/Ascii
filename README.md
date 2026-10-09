# ASCII Studio

A self-contained local image/video ASCII editor. Open `index.html` in a modern browser. No build or dependencies required; files are processed on your device.

## Features

- Image, video and webcam input; procedural demo
- Luminance, hybrid contours, contours, binary, blocks and stipple
- Eight presets, custom glyph ramp, column density and tone controls
- Monochrome, source colour and gradient colour
- Glow, glitch, code rain, scanlines and trails
- Uploaded music or video audio with bass/mid/treble modulation
- PNG with optional transparency, text, coloured HTML and project JSON exports
- Real-time browser video recording with selected audio
- Device-local autosaved settings, undo/redo and responsive controls

## Usage

Import media, choose a preset and adjust controls. For music reaction, import audio, increase Reaction amount and press Play. Save PNG for a high-resolution still or Record video for a timed real-time capture.

Webcam needs HTTPS or localhost. Browser codec support determines whether video recordings use WebM or MP4. Keep the recording tab visible. Exported text/HTML does not contain raster post-processing effects. Source media is not embedded in project JSON.

## Local serving

Optional: `python3 -m http.server 8000`, then open http://localhost:8000.

## Scope

This downloadable version implements the core editor. It does not yet include offline deterministic video encoding, trimming, BPM estimation, editable effect ordering, error-diffusion dithering, or custom preset management.
