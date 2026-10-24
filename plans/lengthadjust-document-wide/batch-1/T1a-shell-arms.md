# T1a — `finalizeShellFragment` arms for BOARD, FILES, PACKET, CHART

Agent: `typescript-pro` (sonnet), worktree `lad-T1a`. Commit:
`feat(core): shell finalize arms for board, files, packet and chart`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d2--the-four-generic-root-engines](../decisions.md) first.
Core task: survey every engine after the commit (stops 4, 8; expected 0 movers,
because no fragment carries these types until T2f).

## Mechanism
`assembleDocument` (`src/core/assemble-svg.ts:355-362`) routes a fragment
with `diagramType` through `finalizeShellFragment` (`:309-331`) and
`assembleDocumentShell`. The shell decorates the root only when the body is a
bare `<g>…</g>` (`withRootGroupAttributes`, `document-shell.ts:139-142`); the
`default:` arm returns the fragment unchanged, so a body the engine did not
wrap would reach the document with NO root `<g>` at all. json's finalizer
(`:241-253`) is the shape: `group(fragment.body)` when `bodyWrapped !== true`,
`spliceIntoContentGroup` otherwise.

## Task
Add arms for the four literals `'BOARD'`, `'FILES'`, `'PACKET'`, `'CHART'`
(the jar's `UmlDiagramType.name()` values on their oracles,
`TextBlockExporter.java:292-293`) that wrap an unwrapped body in a bare `<g>`
and leave a `bodyWrapped` body untouched. No background rect (json's
`maybeJsonBackgroundRect` is json's own; the shell writes the root `style`
background). Keep the four as per-file constants in this file (the existing
convention, `:63`).

## Interface outputs (consumed by T2f)
Literals `'BOARD' | 'FILES' | 'PACKET' | 'CHART'`; contract: "an unwrapped
body is wrapped in a bare `<g>`; a `bodyWrapped` body is passed through".

## Write-set
`src/core/assemble-svg.ts`, `tests/unit/core/assemble-svg-lad-t1a.test.ts`.
If the file crosses 500 lines, split the new arms into
`src/core/assemble-svg-generic.ts` (journal it).

## Read-set
`src/core/assemble-svg.ts:232-262,296-362`; `src/core/klimt/document-shell.ts:
130-170,290-310`; `src/core/svg.ts:375-390` (`group`); one oracle root per
engine: `test-results/dot-cache/{board,files,packet,chart}/*/in.svg` (first
600 bytes).

## Acceptance
- Given a fragment `{ diagramType: 'BOARD', body: '<rect/>', width, height }`,
  when assembled, then the document has `data-diagram-type="BOARD"`, one root
  `<g font-family="sans-serif" lengthAdjust="spacing">` wrapping the rect.
- Given the same with `lengthAdjust: 'none'`, then the root `<g>` has no
  `lengthAdjust` and a `<text … textLength="…">` in the body loses it.
- Given `bodyWrapped: true` with a bare `<g>` body, then exactly one `<g>`
  wrapper results (no double wrap).
- Given the all-engine survey, then 0 movers (no producer sets these types yet).

Observability: N/A. Rollback: Reversible.
