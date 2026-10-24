# T2a — activity: fragment field and both klimt sheets

Agent: `typescript-pro` (sonnet), worktree `lad-T2a`. Commit:
`fix(activity): honour skinparam lengthAdjust on the root and text sheets`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d3--both-carriers-on-klimt-shaped-engines](../decisions.md).

## Task
1. `src/diagrams/activity/renderer.ts:447` builds the fragment with
   `diagramType: DIAGRAM_TYPE_ACTIVITY` (`:41`): spread `lengthAdjust` from the
   theme (D4).
2. Activity text is drawn through klimt: `activity-text-sheet.ts:210` and
   `activity-creole-sheet.ts:274` build `basicSvgOption(...)` with only
   `linkTarget`. Add `lengthAdjust` mapped from `theme.lengthAdjust` to the
   klimt enum (`spacing` → `LengthAdjust.SPACING`, `spacingAndGlyphs` →
   `SPACING_AND_GLYPHS`, `none` → `NONE`; `undefined` → leave the default),
   so `applyTextLengthAdjust` (`svg-graphics-elements.ts:242-252`) omits
   `textLength` under `none` as `SvgGraphics.java:703-705` does. Put the
   mapping in ONE small helper next to the two sheets (both import it); if
   T2b–T2e need the same mapping they write their own local copy (disjoint
   write-sets) and the exit batch dedupes.
3. If `diagnosis/mirrors.md` names a line in `render-fixture-activity.ts`
   that drops the field, fix that line here (D6).

## Write-set
`src/diagrams/activity/renderer.ts`, `activity-text-sheet.ts`,
`activity-creole-sheet.ts`, a new `src/diagrams/activity/activity-length-
adjust.ts` (helper), `tests/unit/activity/lengthadjust-lad-t2a.test.ts`, and
only if T0d named it: `tests/oracle/svg-conformance/render-fixture-activity.ts`.

## Read-set
`src/diagrams/activity/renderer.ts:430-455`; `activity-text-sheet.ts:195-215`;
`activity-creole-sheet.ts:260-280`; `src/core/klimt/drawing/svg/svg-option.ts:
25-60`; `svg-graphics-elements.ts:238-258`; `src/core/klimt/LengthAdjust*`
(the enum module — find it with `find_symbol LengthAdjust`);
`diagnosis/mirrors.md` row 2; Java `TextBlockExporter.java:306-307`,
`SvgGraphics.java:155-158,699-705`.

## Acceptance
- Given `skinparam lengthAdjust none` on `:hello;`, then the root `<g>` has
  no `lengthAdjust` and no `<text>` has `textLength` (and the sheet itself
  emitted none — assert on the sheet's string before the shell).
- Given `spacingAndGlyphs`, then the root `<g>` carries that value and
  multi-char text keeps `textLength`.
- Given no skinparam, then the output is byte-identical to the pre-change
  render.
- Given the authored rows `activity-*`, then all four are `rootExact` and
  `textLengthMatch`; `activity.golden.ratchet.test.ts` and
  `activity.diff-baseline.ratchet.test.ts` green; activity survey vs b0 shows
  0 movers.

Observability: N/A. Rollback: Reversible.
