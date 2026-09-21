# T19 — rows, fonts and icon colours

**Agent:** typescript-pro (sonnet) · **Depends on:** T18 · parallel with
T20/T21/T22/T23 (disjoint write-sets).

## Context

Four HIGH-confidence gaps share one consumption seam
(`renderer-classifier-rows.ts:142-163,251`, `fontColor ?? … ??
fallbackFontColor = '#000000'`): (1) `text:` in a classifier's inline
decoration is captured into `geo.color` but never extracted (A3 M1's text
half; T20 owns the border/dash half of the same mechanism and exposes the
extractor's `text` field here). (2) `classFontColor`/`AttributeFontColor`
have no skinparam-key-handler entry at all (exhaustive grep negative, A3
M2) — Java registers them via `FromSkinparamToStyle.java`'s `class_`
style signature, the same bridge this port implements for
`classBorderColor` (`-table-b.ts:67-71`). (3) `icon*Color` skinparam
values bypass `resolveColorToSvgHex` entirely (`class-visibility-
icon.ts:127-226`, A3 M5) — jar canonicalises every colour before SVG
emission, this port doesn't for icons. (4) monospace (`""text""`)
font-family is two separate, both-incomplete call sites (A3 M8a/M8b).
Stereotype-scoped `skinparam class { <<S>> { … } }` blocks and the `<w>`
wave filter (M7) are additional, separately-caused gaps. The report is a
lead: re-read the cited bodies before editing.

## Task

1. Tests first, one per mechanism, using the named fixtures below.
2. M1 text half: read the `text?` field T18 added to
   `extractDecorations` (do not edit the extractor). Insert `text` as a
   per-classifier tier in `renderer-classifier-rows.ts:142-163`'s
   `fontColor` chain, ahead of the cascade/default.
3. M2: add `classfontcolor`/`attributefontcolor` entries to
   `skinparam-key-handlers-table-a.ts` or `-table-b.ts`, writing
   `classCascadeFontColor` (name row) and a new
   `classCascadeAttributeFontColor` (member rows) — both consumed at
   `renderer-classifier-rows.ts:142-163`. Leave `classFontColor automatic`
   (contrast-computed, `nisune-86-faji869`) as a documented follow-up, not
   in scope.
4. M5: route `class-visibility-icon.ts`'s `colorsFor()` return value
   (`:127-139`) and `styleAttr`/`polygonTag`/`drawSquare`/`drawCircle`/
   `drawDiamond`/`drawTriangle`'s `fill`/`stroke` params through
   `resolveColorToSvgHex` before interpolation, replacing the
   `shortenColor`-only path (`:161-226`).
5. M8a: add a `defaultMonospacedFontName` skinparam-key handler (same
   missing-handler shape as M2 — confirm absence with
   `grep -rn defaultmonospacedfontname src/`); thread
   `theme.colors.graph.defaultMonospacedFontName ?? 'monospace'` into the
   body-text creole-monospace emitter (`grep -n monospace src/diagrams/
   class/class-member-creole*.ts`). M8b: instrument first — `grep -n
   monospace src/diagrams/class/class-declaration*.ts` for the title/name
   call site. If it lives in `class-declaration-extractors.ts` (T20's
   file this batch), do NOT edit it: journal the `file:line` and file a
   `next-missions.md` follow-up (write-set boundary, stop-1 spirit).
6. Stereotype-scoped blocks: `nagega-30-poso418`'s
   `BackgroundColor<<alias>>` (suffix form) and `tabaxa-70-pomu341`'s
   `<<Foo1>> { FontSize 8; BackgroundColor LightBlue }` (nested-block
   form) are two distinct grammars. Find upstream's `SkinParam#getValue`
   stereotype-suffix handling and extend the skinparam-block parser to
   feed the existing `style-cascade-class.ts#resolveClassTagCascadeEntry`
   (already used by `classifierFill`/`classBorder`) — no second cascade.
7. Icon style selectors (`tuguku-78-zega630`, `filoxo-23-fafi328`,
   `fijali-69-pina030`) — instrument first (LOW confidence): trace
   `colorsFor()`'s caller for a member row under a `.. label ..`
   separator vs. a bare row, and whether a `<style> visibilityIcon {
   protected { … } }` selector reaches it. If the fix needs a file
   outside this batch's collective write-set, stop and journal the
   mechanism instead of implementing (stop 1).
8. M7 `<w>` wave filter — read `SvgGraphics.java`'s wave/filter emission
   FIRST (primitive unverified: turbulence filter vs. a squiggle path).
   Port the `<filter>` def and `text/@filter="url(#…)"` for
   `beruje-75-jimu270`.
9. `.agent-notes/cdd-T19.md`: M8b's located/deferred call site; the
   icon-selector mechanism or the stop-1 journal entry; the
   stereotype-suffix vs. nested-block grammar distinction.

## Read-set

`src/diagrams/class/renderer-classifier-rows.ts:142-163,246-338`;
`src/diagrams/class/class-visibility-icon.ts:104-343`;
`src/diagrams/class/class-declaration-extractors.ts:72-107` (read-only —
T20 owns edits); `src/core/skinparam-key-handlers-table-a.ts`,
`-table-b.ts:67-71`; `src/core/style-cascade-class.ts` (whole). Java:
`klimt/color/Colors.java:95-124`; `decoration/LinkStyle.java:97-108`;
`FromSkinparamToStyle.java` (`class_` signature); `skin/SkinParam.java
getValue(key, stereotype)`; `SvgGraphics.java` (wave/filter, locate via
grep). Diagnosis: `diagnosis/A3-style.md` M1 (text half), M2, M5, M7, M8,
Flagged.

## Write-set

`src/diagrams/class/renderer-classifier-rows.ts`,
`src/diagrams/class/class-visibility-icon.ts`,
`src/core/skinparam-key-handlers-table-a.ts`,
`src/core/skinparam-key-handlers-table-b.ts`,
`src/diagrams/class/class-member-creole.ts` (M8a only),
their `*.test.ts` files,
`.agent-notes/cdd-T19.md`, `decision-journal.md` (append-only),
`planning/next-missions.md` (M8b/icon-selector re-filings, append-only).

## Interface in (from T18)

`ThemeGraphColors.iconPrivateColor` etc. as `Paint` (T18). Extractor
field `text?: string` from `class-declaration-extractors.ts` (T18).

## Acceptance criteria

- Given `remanu-84-sega129`/`picija-82-jebu272`, then name-row fill is
  `#F00` and both `FontColor Yellow`/`AttributeFontColor gold` resolve
- Given `tabaxa-70-pomu341`'s `<<Foo1>>` block, then `A`'s fill is `#ADD8E6`
- Given `tagofo-84-nuti362`, then all 36 icon fill/stroke values are hex
- Given `beruje-75-jimu270`, then `<w>` text carries `filter=url(#…)`
  with a matching `<defs>` entry
- Given `curupe-50-kibu120`/`nesivu-99-cexu403`, then font-family is
  `Forte`/present; given `nagega-30-poso418`, `fijali-69-pina030`,
  `tuguku-78-zega630`, `filoxo-23-fafi328`, then each ends conformant or
  carries a journaled mechanism

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

Four gates green. `npx tsx tools/render-diff.mts remanu-84-sega129
picija-82-jebu272 tabaxa-70-pomu341 tagofo-84-nuti362 beruje-75-jimu270
curupe-50-kibu120 nesivu-99-cexu403` before/after. Files ≤500 lines,
functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: instrument before fixing anything tagged LOW/MEDIUM confidence.
Ask first: any stop condition in `../README.md`. Never: edit
`class-declaration-extractors.ts` (T18's, already landed); edit
`renderer-classifier-box.ts`/`class-member-rows.ts` (T20's files); fit a
value without a citation.

## Commit

`feat(cdd-T19): wire classifier font/icon colour and stereotype cascades`

Body: why — four independently-caused colour/font gaps shared one
consumption seam that never received their values; this wires each,
naming the two deferred items (M8b's location, icon-selector LOW-conf
mechanism) as follow-ups rather than guesses.
