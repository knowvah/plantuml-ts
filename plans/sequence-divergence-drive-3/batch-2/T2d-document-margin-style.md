# T2d — `root { Margin }` reaches the sequence exporter margin

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2d`. Commit:
`fix(sequence): read the document margin from the merged style`.
Read [../task-contract.md](../task-contract.md) first. Core task: every
engine is surveyed after the commit (stops 4, 13).

## Mechanism (sdd2: `document-margin-style-ignored`; Java re-read)
`TextBlockExporter.Builder#calculateMargin` returns the merged `{root,
document}` style's `Margin` when present, else `diagram.getDefaultMargins()`
(`core/TextBlockExporter.java:510-516`; cerulean sets `root { Margin 10 }`).
The lookup ALREADY exists in the port: `Theme.diagramMargin`
(`build-theme.ts#withDocumentStyle`), `calculateMargin(theme, fallback)`
(`core/document-margin.ts:100-102`) and the optional
`RenderFragment.documentMargin` that `documentMarginOf` honours first
(`document-margin.ts:88-93`). It is never reached for sequence: the producer
does not set `documentMargin`, `documentMarginOf` falls back to the
per-type table (`SEQUENCE_DOCUMENT_MARGIN` = 5, `:62,79`), and
`preChromeDims` subtracts that constant (`sequence/renderer-document.ts:73-
81`). The task text named `document-margin.ts`; the producer side
(`renderer-document.ts`) is the missing half. Note the teoz block is
`body + 10` translated by `(5, 5)` INSIDE the margin-less block
(`teoz/SequenceDiagramFileMakerTeoz.java:134-168`), so the exporter margin
and the 5 baked into `totalWidth`/`totalHeight` are distinct: derive
`preChromeWidth/Height` from the same margin the exporter will add
(`TextBlockExporter.java:159-176,199-203`) rather than the constant, and
verify the body offset against vijito's golden before editing.

## Targets
vijito-33-mora824, vitusu-66-boxa381, xalafa-49-xere690 to 0 (68 each).

## Write-set
`src/core/document-margin.ts`, `src/diagrams/sequence/renderer-document.ts`,
`src/core/assemble-svg-sequence.ts` (only if the border/exported dimension
reads the constant) and tests. `sequence/renderer.ts` is T2c's: the new
fragment field is set from `documentChromeOf` (in `renderer-document.ts`),
not from `renderer.ts`.

## Read-set
`document-margin.ts:55-133`; `sequence/renderer-document.ts:50-136`;
`assemble-svg-sequence.ts:85-130`; `annotations/chrome-export.ts:35-60`;
`activity/activity-layout-constants.ts:225-260` (the activity precedent);
Java: `TextBlockExporter.java:155-210,505-518`, `SequenceDiagramFileMakerTeoz.
java:125-170`.

## Acceptance
- Given a sequence diagram with `root { Margin 10 }` (cerulean), when
  rendered, then the exporter margin is 10 on all sides and the canvas grows
  accordingly; without a style margin output is byte-identical (unit test
  citing `:510-516`).
- Given the three targets, then each diffs to 0.
- Given the all-engine survey, then no conformant loss and every non-sequence
  mover explained row by row (expected: none; class/state/description keep
  their tables).
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
