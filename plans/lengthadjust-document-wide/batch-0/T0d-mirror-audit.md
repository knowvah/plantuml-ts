# T0d — harness-mirror and json text-path audit (artifact only)

Agent: `typescript-pro` (sonnet), worktree `lad-T0d`. Commit:
`docs(lad): T0d mirror audit artifact`. Read
[../task-contract.md](../task-contract.md) first. Writes ONLY the artifact;
no `src/` or `tests/` change (a fix belongs to the engine's task, D6).

## Task
Answer, with `file:line`, for each of the following: does
`RenderFragment.lengthAdjust` set by the engine survive to
`assembleDocumentShell`, and does any klimt `UGraphicSvg` on the path need
`option.lengthAdjust` too?

1. `tests/oracle/svg-conformance/render-fixture-class.ts` (`assembleSvg` at
   :159 and :169; `applyExportedChrome`): is the fragment the engine returned
   passed through unchanged, or rebuilt?
2. `tests/oracle/svg-conformance/render-fixture-activity.ts` (same
   question; note `inheritingRenderFn`).
3. `tests/oracle/svg-conformance/render-fixture-sequence.ts` (already
   honours it — confirm, as the control).
4. `src/diagrams/json/renderer.ts#renderJson` and `TextBlockJson.ts`: are
   json/yaml/hcl `<text>` nodes string-emitted (`svg-shapes-text.ts`) or
   drawn through a klimt `UGraphicSvg`? Name the emitter and whether
   `textLength` goes through `textLengthOf` (rule 5).
5. `src/core/annotations/chrome.ts#applyChrome` and
   `src/core/TextBlockExporter.ts#exportTo`: do they spread the fragment
   (field preserved) or construct a new object (field dropped)? Quote the
   return expression.

## Artifact (`plans/lengthadjust-document-wide/diagnosis/mirrors.md`)
A table `| path | composition call (file:line) | field survives? | klimt
option on the path? | action (task) |` plus one paragraph per row that does
not survive, naming the exact line to change and the task that owns it
(T1b class, T2a activity, T1d json). No fixes, no speculation: every cell is a
quoted line.

## Write-set
`plans/lengthadjust-document-wide/diagnosis/mirrors.md`.

## Read-set
The five files above; `src/core/dispatcher-types.ts:196-216`;
`src/core/assemble-svg.ts:296-362`; `src/diagrams/sequence/renderer.ts:200-215`.

## Acceptance
- Given each of the five paths, then the artifact states survives/drops with
  the quoted composition expression and `file:line`.
- Given a path that drops the field, then the artifact names the line and the
  owning task (stop 15 if any cell cannot be filled from the code).

Observability: N/A. Rollback: Reversible.
