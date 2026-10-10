# ASCII Studio · The Art Edition

Live: https://spacereact.github.io/Ascii/

A buildless, self-contained HTML studio for turning images and videos into ASCII artwork, animating characters, and choreographing transitions between two images. GitHub Pages serves `index.html` directly.

## Create

1. Import an image or video, or explore the four sample artworks in Source.
2. Choose a character preset, density and rendering mode in Characters. Character set, font, dithering and tone live in an expandable section.
3. Choose a movement recipe in Motion or an A/B transition in Transition. Suggestions use foreground contrast and colour heuristics, rather than semantic object recognition.
4. Refine colour and texture in Colour. Boreal, Ember, Silver and Paper are starting palettes; individual colours, gain, glow, trails and finish controls remain editable.
5. Export PNG, MP4, text, coloured HTML or an editable project.

Motion retains pulse, disc, heat rise, foliage sway, petals, waves, drift and scatter. A/B retains travel, morph, swirl, noise reveal, shatter, curtain, ribbon and colour dissolve. Images blend colours while characters rearrange. Subject-only or whole-picture motion remains available.

Scene building, procedural 3D assets, maps, terrain and Matter physics have been removed from the interface, runtime and project output. Audio, brushes and magnets remain removed.

## Rendering and performance

The renderer preserves character density and the existing glyph raster/colour pipeline. Eight bounded atlas pages replace separate canvases for thousands of coloured characters. Immutable character layers are reused for effects such as film grain; changing source, typography, dimensions or tone invalidates them. Animated glyphs, transitions and heat/hologram treatments regenerate the layer when required. Dead brush-field interpolation has been removed. Hidden tabs do not draw; still previews do not continuously redraw or advance the timeline.

A local real-Canvas benchmark at 960 px / 180 columns with a static sample and animated film grain measured approximately 24.1 ms/frame before and 2.3 ms/frame after this change. It is one workload, not a guarantee for all effects or devices. The same static frame compared pixel-identical before/after. Atlas storage is bounded to eight 832×672 pages (about 18 MB of raw pixels plus browser overhead).

Full HD preview starts **off every page load**, even when previously saved. Enable FHD when needed: 1920×1080 at 16:9, or 1080×1920 at 9:16. Default preview is capped at 960 px and 20 fps. Character density, preview resolution and export resolution are independent.

## Projects and export

Schema 6 embeds image A/B at up to 1280 px and saves all current studio settings. Schemas 1–5 load; removed scene/map/material fields are ignored. Device autosave migrates previous settings. Video and camera sources require reattachment. Saved projects can restore their chosen preview quality within a session; startup always resets it to Auto.

PNG supports transparency and widths up to 2560 px. Supporting HTTPS browsers render MP4 frames at 30 fps using WebCodecs baseline AVC and an embedded MP4 writer. Video/camera or unsupported AVC encoding uses live native recording; Record video may save WebM. Live capture requires sufficient playback speed and a visible tab. MP4 frame export is limited to 120 seconds / 220 MB; Stop cancels it. Exports have no audio.

## Validation

Real Canvas regression checks cover image rendering, all eight transitions, animated character motion, palette history, transparent output, Full HD dimensions, embedded projects and legacy-state removal. Static before/after frames are compared directly. The MP4 writer is checked with actual AVC packets, FFprobe timing/frame counts and a full FFmpeg decode. Live browser checks verify the published controls and output dimensions.
