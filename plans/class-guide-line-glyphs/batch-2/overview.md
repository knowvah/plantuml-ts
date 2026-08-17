# Batch 2 — geometry: per-line glyphs + resolved arrow font

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | `EdgeGeo.labelLines[i].glyph`, per-line placement (D4), `FontSpec` threading (D2), ink-box + translate | `typescript-pro` (sonnet) | `src/diagrams/class/class-geo-types.ts`, `class-edge-geo.ts`, `class-edge-label-anchor.ts`, `layout.ts`, `class-ink-box.ts`, `tests/unit/class/class-geo-builders.test.ts`, `tests/unit/class/class-edge-labels.test.ts` | T1 | [x] |

**Batch exit:** four gates; class DOT EQUAL 705/711 unchanged (geometry only);
no override fixture moves away from jar; SVG for non-override fixtures
byte-identical (glyph data has no renderer yet — T3).
