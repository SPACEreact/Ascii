# ASCII Studio · Map Workshop

Live: https://spacereact.github.io/Ascii/

One HTML file for ASCII image choreography and lightweight perspective scenes. GitHub Pages deploys `index.html` without a build step.

## Map → scene

1. Open Scene → Map → ASCII drone scene → **Pick area on map**.
2. Drag to pan, click to centre the selection, scroll or use ± to zoom. Choose a 250 m, 500 m or 1 km square. Latitude/longitude and Go also work. Arrow keys pan and +/− zoom when the map canvas has focus.
3. Click **Use selected area**, then **Generate scene**. Include real terrain elevation is on by default; disable it to request buildings only.
4. Play the drone flyover, orbit manually, add assets, and customize Type/Look. Terrain relief offers natural 1×, enhanced 2× or dramatic 4×.

The picker reads OpenFreeMap's TileJSON and vector tiles using an embedded, bounded MVT decoder. It renders roads, buildings, water, green areas and labels in a 2D Canvas; no WebGL or external map engine is required. Tiles are overscaled above the source's maximum zoom. It uses at most three simultaneous requests, an in-memory 40-tile cache, and debounced loads. Closing the picker cancels outstanding requests and its timer. No map renderer runs underneath the ASCII scene.

### Geometry

The bounded Overpass request retrieves building ways, tagged building parts, building multipolygon relations and roads. Building parts replace overlapping overall outlines. Heights use `height`, then `building:levels × 3`, then an explicitly reported estimate. The importer reads `min_height`, `building:min_level`, roof heights/levels, roof shape and building/roof colours. It understands metre and feet heights and a small set of named colours.

Roofs are lightweight approximations: gabled, hipped, pyramidal, dome and skillion. Unsupported or untagged roofs stay flat. Gabled/hipped ridges use footprint edge order; roof orientation/direction is not reconstructed. Complex relation outer rings are treated as separate simplified footprints; courtyards/inner holes and fragmented ring assembly are not supported. It is not photogrammetry or an architectural survey.

Limits remain 220 building/part footprints, 120 road segments and 32 vertices per footprint. Parts are prioritized, followed by nearby buildings. Dense areas omit/simplify features. Display height is capped at 50 scene units: 125 m at a 250 m area setting. Data availability depends on local OSM mapping.

### Elevation

AWS Open Data hosts Mapzen Terrarium elevation tiles. The app fetches only the selected area's tiles (normally 1–4; hard limit 9), decodes RGB elevation, and stores a 17 × 17 sampled grid. Buildings and asset bases are placed at the sampled ground elevation; roads follow endpoint elevation. Absolute elevation range is shown, with the median used as the scene's vertical datum.

The grid is a simplified terrain surface, not fresh LiDAR. Source resolution/age varies. Heights are limited to ±30 scene units relative to the datum, before the explicitly chosen relief multiplier. Roads use straight segments; buildings use a flat base at their footprint centre. Terrain meshes and map geometry are cached for reuse.

If elevation fails, buildings still load and the app explicitly reports a flat-ground fallback. Cancel or an overall 45-second timeout preserves the previous scene. OSM failures also preserve it. Wait 15 seconds between generation requests. Coordinate selection still works if map tiles fail.

### Data and attribution

- Picker: OpenFreeMap · © OpenMapTiles · Data from OpenStreetMap. https://openfreemap.org/
- Imported map: © OpenStreetMap contributors, ODbL. https://www.openstreetmap.org/copyright
- Terrain: Mapzen and upstream elevation providers; full credits are embedded in projects and drawn in scene PNG/MP4/preview. Source requirements: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- Terrain dataset: https://registry.opendata.aws/terrain-tiles/

No API key, billing account, location permission, satellite textures, or private-media upload is used. Choosing a map area sends tile coordinates to OpenFreeMap; generation sends the public-area bounding box to Overpass and tile coordinates to AWS. Map-derived databases retain their data-license obligations. Third-party public services can be unavailable; procedural demos work offline.

## Studio and performance

24 asset families × five colour/scale/motion profiles = 120 recipes, not 120 independent simulation systems. Up to 64 asset layers support name, X/Z, altitude, scale, rotation, colour, still/pulse/sway/float/spin, duplicate/hide/delete and undo/redo. Camera paths: still, orbit, drone flyover and dolly. Day/dusk/night are palettes with simple face shading.

Image A/B retains eight character transitions, ASCII ramps, contour modes, colours, dithering, shader-style finishes, coarse cloth and stylized rubber/liquid. Heavy per-character extrusion, audio, brushes, magnets, dense collisions and live satellite terrain remain removed. Glyphs are sprites over projected low-poly geometry.

Full HD starts **off on every page load**, even after restoring a project. FHD toggles a 1920 × 1080 canvas at 16:9. Preview defaults to 20 fps and at most 960 pixels wide; exports have independent resolution. Full HD does not increase character count. Static scenes are cached and hidden tabs do not draw; device performance varies.

## Projects and export

Schema 4 saves assets, camera, OSM geometry, roof/part attributes, sampled elevation and credits. Schemas 1–3 remain readable. Scene data/settings autosave locally, migrating version 7 settings. Explicit projects embed image A/B at up to 1280 px; video/camera must be reattached.

PNG, plain text, coloured HTML, project JSON, and MP4 are available. Supporting HTTPS browsers render every scene/image frame at 30 fps using WebCodecs baseline AVC and the embedded MP4 writer. Slow machines may take longer without omitting frames. Video/camera or unavailable AVC encoding falls back to native live recording; Record video may save WebM. Live capture requires a visible tab and sufficient playback performance. Maximum export 120 seconds / 220 MB; Stop cancels an incomplete frame export.

## Validation

Real Canvas tests cover 24 mesh families, scene history, cache behavior, duplicate/delete, Full HD dimensions and image transitions. Geo tests cover Terrarium decoding, interpolation, terrain mesh, five roof shapes, part/outline deduplication, minimum heights, project validation, vector tile parsing and Mercator round trips. The MP4 writer is checked with actual AVC packets, FFprobe timing/frame counts and a full FFmpeg decode.
