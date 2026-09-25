# cdd3-T24 — SVG font-family stack + style LineThickness

## Observation: a skin's logical FontName never reached the shared text seam's getSvgFamily
- **Context**: C-5, filoxo/rakopi (`skin rose`, `root { FontName SansSerif }`).
- **Finding**: `core/svg-text-font.ts#toSvgFontFamily` only swapped `"`→`'`.
  Its klimt twin (`svg-graphics-elements.ts#getSvgFamily`) already had the
  `Serif/SansSerif/Monospaced` switch (`FontStack.java:178-187`). Two copies of
  one upstream method now exist, one per emission seam. The switch is
  case-sensitive (exact `fullDefinition`). Lowercase `monospaced` still goes
  through `renameLogicalMonospace` (`SvgGraphics.java:720-721`).
- **Impact**: any engine that emits through `svg-shapes.ts` with a logical
  family now drops `font-family` for SansSerif. The all-engine survey is
  the evidence for how far that reaches.
- **Confidence**: High (jar `ff-sans.svg`, unit test).

## Observation: skin rose's root LineThickness reaches class boxes, notes, and the block0 divider
- **Context**: C-6 / E3-8.
- **Finding**: `skin_loader` applies `rose.skin` as its own StyleMap pass
  through `applyStyleMap`, and that runs `computeClassStyleCascadeOverrides`.
  So a `resolveStyleCascade(CLASS_SNAMES|NOTE_SNAMES, 'linethickness')`
  field picks up rose's `root { LineThickness 1.0 }` automatically.
  plantuml.skin itself is NOT a StyleMap in this port, so "absent" = the
  plantuml.skin default (element 0.5, note 0.5), applied by the reader.
  Jar probes (authored, `scripts/oracle-render.sh`):
  - rose: the note body and fold are 1, and the tip note is 1.
  - `<style> classDiagram { LineColor red }`: the note border is red at 0.5.
  - `<style> note { LineThickness 2 }`: the member-tip outline and fold are
    both 2.
  - `<style> class { LineThickness 2 }` with `--`: block0 is 2 and `--`
    stays 1.
- **Impact**: the enhanced body's `'_'` sentinel divider now carries
  `strokeWidth: undefined` and resolves at render
  (`renderer-classifier-colors.ts#classStyleLineThickness`, the same tiers as
  the box minus the inline `#line.x` override). A layout-time consumer of
  `EnhancedDividerPart.strokeWidth` must handle `undefined`.
- **Confidence**: High.

## Observation: note stroke sites NOT ported (open)
- **Context**: E3-8 scope check.
- **Finding**: three sites were left as they were:
  - `note-layout-measure-rows.ts#separatorStrokeWidth` still hard-codes
    0.5 for a note body's `'_'` sentinel. Upstream it is the note style's
    LineThickness (`BodyEnhancedAbstract#getDefaultThickness` on the note
    style). Not probed.
  - `renderer-note-link-box.ts` (`note on link`, ComponentRoseNote) still
    uses `NOTE_STROKE_WIDTH` and `theme.colors.border`. Its style signature
    is `ComponentType.NOTE` = `{root,element,sequenceDiagram,note}`
    (`skin/ComponentType.java`), not the class note's, so it is a separate
    mechanism.
  - An inline note `#line:color` (`Colors.applyStroke`,
    `EntityImageNote.java:237,264`) is not consulted.
- **Impact**: follow-on candidates. No fixture in the current class
  divergence set needs them.
- **Confidence**: Medium (read, not probed).
