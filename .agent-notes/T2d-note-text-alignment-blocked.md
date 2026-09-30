## Observation: `skinparam noteTextAlignment` has no landing field anywhere
  in the skinparam/theme pipeline — blocks fukegu-14-zona532/logavi-03-mita108
- **Context**: T2d (mission cdd6, batch 2) — item 2 of the task spec, class
  note text alignment (`skinparam noteTextAlignment center|right`). Rows:
  `unknown/fukegu-14-zona532`, `unknown/logavi-03-mita108`.
- **Finding**: upstream maps this flat skinparam to `PName.HorizontalAlignment`
  on `SName.note` (`FromSkinparamToStyle.java:178`), read by `EntityImageNote
  .java:112` (`style.getHorizontalAlignment()`) and applied per-line by
  `BodyFactory.create3`. This port has NO equivalent path at all:
  `resolveSkinparam` (`src/core/skinparam.ts:55`) routes every unrecognized
  flat key through `applyNormalKey` into `acc.unknown` (a diagnostic name
  list only, `src/core/skinparam-key-handlers.ts:130`) — the VALUE is
  discarded, never reaching any `SkinparamAccumulator`/`Theme`/`ElementColors`
  field. Confirmed by grep: no `notetextalignment` handler exists in
  `skinparam-key-handlers-table-a.ts`/`-table-b.ts`/`-shared.ts`, and
  `ElementColors` (`theme-graph-colors.ts`) has no `horizontalAlignment`
  field. `parseStyleBlock` (`skinparam-style-block.ts`) only parses `<style>`
  blocks, not flat `skinparam` statements, so a `<style> note {
  HorizontalAlignment X }` form wouldn't reach the class engine generically
  either — `collectElementStyleBuckets`/`matchElementColorKey`-family
  matchers in `skinparam-element-buckets.ts` are a fixed per-property
  allowlist (background/border/font/fontSize/stereotypeFontSize/shadowing),
  no alignment role.
- **Impact**: T2d's write-set (`renderer-note.ts`, `renderer-note-lines.ts`,
  `note-layout-measure.ts`, `note-layout-measure-rows.ts`) is entirely
  downstream of Theme/skinparam plumbing — none of those files can produce a
  correct fix without new fields/handlers in `skinparam-accumulator.ts` +
  `skinparam-key-handlers-table-a.ts` (or `-b.ts`) + `theme-graph-colors.ts`
  (+ likely `skinparam-theme-builder.ts` or `style-cascade-class.ts` to
  thread it into a `theme.colors.elements['note']`/cascade field), all
  outside this task's write-set and not a pure type/file-cap move. Stopped
  per the task's boundaries rather than editing those files.
- **Render formula, verified against both fixtures' oracle SVG** (so a
  follow-on can implement without re-deriving): let `maxW =
  Math.max(...note.lineWidths)`. Per line `i`, x-offset from the existing
  `note.x + marginX1` anchor is `0` for `left` (unchanged default),
  `(maxW - note.lineWidths[i]) / 2` for `center`, `maxW -
  note.lineWidths[i]` for `right`. Cross-checked exactly against fukegu
  (center: deltas 9.466/3.616/23.156/0 on line widths 49.075/60.775/
  21.694/68.006) and logavi (right: deltas 22.506/0/39.081/1.381 on widths
  38.269/60.775/21.694/59.394) — every delta matches to 3 decimal places.
  Note box WIDTH itself is unaffected by alignment (still sized from the
  widest line); only the per-line render x shifts.
- **Confidence**: High (grep-verified absence of the handler + exact
  numeric match of the derived formula against both fixtures' cached jar
  SVG).
