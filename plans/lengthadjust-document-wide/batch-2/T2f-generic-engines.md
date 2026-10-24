# T2f — board, files, packetdiag, chart: `diagramType` and the field

Agent: `typescript-pro` (sonnet), worktree `lad-T2f`. Commit:
`fix(core): route board, files, packet and chart through the document shell`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d2--the-four-generic-root-engines](../decisions.md).
Depends on T1a (merged at the batch-1 close). The one task whose survey
verdicts are expected to move — explain every mover by the route (stop 8).

## Task
Each renderer returns a `RenderFragment` without `diagramType`, so
`assembleDocument` (`assemble-svg.ts:355-362`) falls to the generic `svgRoot`
(no `data-diagram-type`, no `lengthAdjust` handling). The jar writes
`data-diagram-type="BOARD" | "FILES" | "PACKET" | "CHART"`
(`TextBlockExporter.java:292-293`; see each engine's `in.svg` in the dot
cache). In each renderer:
- `src/diagrams/board/renderer.ts:70 renderBoard(geo, theme)`: add
  `diagramType: 'BOARD'` (per-file constant, the json/state convention) and
  spread `lengthAdjust` from the theme (D4).
- `src/diagrams/files/renderer.ts:60 renderFiles`: `'FILES'`, same.
- `src/diagrams/packetdiag/renderer.ts:48 renderPacket`: `'PACKET'`, same.
- `src/diagrams/chart/renderer.ts:260 renderChart`: `'CHART'`, same, on the
  fragment arm only (the error arm's `completeSvg` at `:266` stays).
T1a's arms wrap an unwrapped body in a bare `<g>`; do not wrap in the
renderer. If a renderer already emits its own `<g>` wrapper, note it in the
hand-back (T1a's `bodyWrapped` contract decides).

## Interface inputs (from T1a)
Literals `'BOARD' | 'FILES' | 'PACKET' | 'CHART'`; "unwrapped body is wrapped
by the shell arm; `bodyWrapped` body passes through".

## Write-set
`src/diagrams/board/renderer.ts`, `src/diagrams/files/renderer.ts`,
`src/diagrams/packetdiag/renderer.ts`, `src/diagrams/chart/renderer.ts`,
`tests/unit/{board,files,packetdiag,chart}/lengthadjust-lad-t2f.test.ts`.

## Read-set
The four renderers' return sites; `src/core/assemble-svg.ts:296-362` (after
T1a); `src/core/klimt/document-shell.ts:139-162,290-310`; the first 600 bytes
of one `in.svg` per engine under `test-results/dot-cache/{board,files,packet,
chart}/`; Java `TextBlockExporter.java:290-293,306-307`.

## Acceptance
- Given each engine's smallest corpus fixture with no skinparam, then the
  document root carries `data-diagram-type="<TYPE>"` and one root `<g
  font-family="sans-serif" lengthAdjust="spacing">`, and every attribute of
  the root `<svg>` other than the lengthAdjust family equals the oracle's
  (stop 7 otherwise).
- Given `skinparam lengthAdjust none`, then the root `<g>` has no
  `lengthAdjust`; given `spacingAndGlyphs`, it carries that value.
- Given the authored rows of the four engines (jar-compatible mode, D5),
  then all 16 are `rootExact`; board/packet/chart `none` rows are
  `textLengthMatch`; the 13 `baseline` rows (incl. all four files rows,
  Amendment 1) did not get worse.
- Given files in the extended mode (extension, Amendment 1) with
  `skinparam lengthAdjust none` / `spacingAndGlyphs`, then the root `<g>`
  follows the skinparam (T1e's files cut keeps the jar-compatible mode at
  SPACING).
- Given `npm run svg:survey -- <engine>` for each of the four vs b0, then
  every verdict change is listed in the hand-back with "route change: root
  attributes now the shell's" as the mechanism, and no other engine moves.

Observability: N/A. Rollback: Reversible (the four engines' `parity-*.json`
are re-pinned at the close; a revert re-pins them back).
