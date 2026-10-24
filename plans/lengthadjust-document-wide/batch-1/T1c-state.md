# T1c — state: fragment `lengthAdjust` from the theme

Agent: `typescript-pro` (sonnet), worktree `lad-T1c`. Commit:
`fix(state): honour skinparam lengthAdjust on the root group and textLength`.
Read [../task-contract.md](../task-contract.md) first.

## Task
`src/diagrams/state/renderer.ts:323` builds the state fragment with
`diagramType: DIAGRAM_TYPE_STATE` (`:33`). Spread `lengthAdjust` from the
theme as `sequence/renderer.ts:206-208` does (D4). State `<text>` emission
goes through `svg-shapes-text.ts#textLengthOf`; the shell strips
`textLength` under `none`. The per-element `lengthAdjust: 'spacing'`
literals in `renderer-box.ts`, `renderer-pseudostate.ts`,
`renderer-border-point.ts` are never emitted (rule 3) — leave them.

## Write-set
`src/diagrams/state/renderer.ts`, `tests/unit/state/lengthadjust-lad-t1c.test.ts`.

## Read-set
`src/diagrams/state/renderer.ts:300-335`; `src/diagrams/sequence/renderer.ts:
200-215`; `src/core/klimt/document-shell.ts:139-162`; Java
`TextBlockExporter.java:306-307`, `SvgGraphics.java:155-158,699-705`.

## Acceptance
- Given `skinparam lengthAdjust none` on `state S1`, then the root `<g>` has
  no `lengthAdjust` and no `<text>` has `textLength`.
- Given `spacingAndGlyphs`, then the root `<g>` carries that value.
- Given no skinparam, then the output is byte-identical to the pre-change
  render.
- Given the authored rows `state-*`, then all four are `rootExact` and
  `textLengthMatch`; the state golden ratchet is green; state survey vs b0
  shows 0 movers.

Observability: N/A. Rollback: Reversible.
