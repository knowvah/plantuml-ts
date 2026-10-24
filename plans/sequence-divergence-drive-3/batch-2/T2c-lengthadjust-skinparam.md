# T2c — `skinparam lengthAdjust` reaches the root group and `textLength`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2c`. Commit:
`feat(svg): honour skinparam lengthAdjust on root and text length`.
Read [../task-contract.md](../task-contract.md) first. Core task: every
engine is surveyed after the commit (stops 4, 13).

## Mechanism (sdd2: `skinparam-lengthadjust-unported`; Java re-read)
`SkinParam#getlengthAdjust` maps `spacingAndGlyphs` / `spacing` / `none`
(case-insensitive) to `LengthAdjust`, else the default
(`SkinParam.java:1258-1269`; sdd2 cited `:1258-1270`, a line long). `SvgGraphics` writes
`lengthAdjust="spacing"` on the root `<g>` only for SPACING, `spacingAndGlyphs`
for that value, and NOTHING for `none` (`SvgGraphics.java:155-158`), and each
`<text>` gets `textLength` only when `text.length() > 1` AND the option is
SPACING or SPACING_AND_GLYPHS (`:703-705`; sdd2 cited `:703-704`). Ours hard-
codes `ROOT_LENGTH_ADJUST = 'spacing'` in the one shared `ROOT_GROUP_OPEN`
string (`svg.ts:277,290`; consumed by `klimt/document-shell.ts:139`) and the
sequence text path always sets `textLength: spec.width`
(`sequence-text.ts:235`). klimt's own `SvgGraphicsCore` already honours
`option.lengthAdjust` (`svg-graphics-core.ts:178-181`, `svg-graphics-elements
.ts:242-250`); the string path does not.
Plan: add `lengthAdjust` through the skinparam chain exactly like `topurl`
(`skinparam-accumulator.ts:52,305`, `skinparam-key-handlers-table-a.ts:324-
329`, `skinparam-theme-builder.ts`, `theme.ts`, `theme-merge.ts:50`), turn
`ROOT_GROUP_OPEN` into a builder keyed by the value (default output
byte-identical), carry the value on `RenderFragment` (`dispatcher.ts`), let
`withRootGroupAttributes` (`document-shell.ts:136-139`) use it, set it from
`sequence/renderer.ts`, and drop `textLength` in `sequence-text.ts` for
`none`. The optional `Theme.lengthAdjust` field is an approved addition
(user, 2026-10-22; `decisions.md` D10) — not a stop.
Other engines' per-text emitters (`svg-shapes*`, T2a's files) are NOT edited
here: list the engines still emitting `textLength` under `none` as a
follow-on in the hand-back.

## Targets
vucomo-53-gicu658 (63), vuniba-19-repo187 (16), peduzi-80-giki495 (1).

## Write-set
`src/core/skinparam-accumulator.ts`, `skinparam-key-handlers-table-a.ts` (or
`-b`: wherever the sibling raw-value keys live), `skinparam-theme-builder.ts`,
`theme.ts`, `theme-merge.ts`, `svg.ts`, `klimt/document-shell.ts`,
`dispatcher.ts`, `src/diagrams/sequence/renderer.ts`, `sequence-text.ts` and
tests. No file of T2a (`svg-shapes*`), T2d (`document-margin.ts`,
`assemble-svg-sequence.ts`, `renderer-document.ts`) is touched.

## Read-set
`svg.ts:270-295,450-462`; `klimt/document-shell.ts:86-140`;
`skinparam-key-handlers-table-a.ts:320-332`; `skinparam-accumulator.ts:45-55,
300-310`; `sequence-text.ts:225-240`; Java: `SkinParam.java:1255-1272`,
`SvgGraphics.java:150-160,695-707`, `klimt/LengthAdjust.java`.

## Acceptance
- Given `skinparam lengthAdjust none`, when sequence renders, then the root
  `<g>` has no `lengthAdjust` and no `<text>` has `textLength`;
  `spacingAndGlyphs` writes that value on the root; unset is byte-identical.
- Given the three targets, then each diffs to 0.
- Given the all-engine survey, then no conformant loss, and every non-sequence
  mover is explained row by row (expected: none).
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
