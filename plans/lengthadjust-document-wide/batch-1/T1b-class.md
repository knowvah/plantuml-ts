# T1b — class (and object): fragment `lengthAdjust` from the theme

Agent: `typescript-pro` (sonnet), worktree `lad-T1b`. Commit:
`fix(class): honour skinparam lengthAdjust on the root group and textLength`.
Read [../task-contract.md](../task-contract.md) first.

## Task
`src/diagrams/class/renderer-document.ts:155` builds the class fragment with
`diagramType: DIAGRAM_TYPE_CLASS`. Spread `lengthAdjust` from the theme the
way `sequence/renderer.ts:206-208` does (D4: only when defined). The object
engine is the class engine (`object` corpus rows route here), so no second
site. If `diagnosis/mirrors.md` names a line in `render-fixture-class.ts`
that drops the field, fix that line in this task (D6) and nothing else there.
Class `<text>` emission goes through `svg-shapes-text.ts#textLengthOf`; the
shell strips `textLength` under `none` — do not touch the emitters.

## Write-set
`src/diagrams/class/renderer-document.ts`,
`tests/unit/class/lengthadjust-lad-t1b.test.ts`, and only if T0d named it:
`tests/oracle/svg-conformance/render-fixture-class.ts`.

## Read-set
`src/diagrams/class/renderer-document.ts:140-165`; `src/diagrams/sequence/
renderer.ts:200-215`; `src/core/klimt/document-shell.ts:139-162`;
`plans/lengthadjust-document-wide/diagnosis/mirrors.md`; Java
`TextBlockExporter.java:306-307`, `SvgGraphics.java:155-158,699-705`.

## Acceptance
- Given `skinparam lengthAdjust none` on `class A { +m() }`, when rendered via
  `renderSync`, then the root `<g>` has no `lengthAdjust` and no `<text>` has
  `textLength`.
- Given `spacingAndGlyphs`, then the root `<g>` has
  `lengthAdjust="spacingAndGlyphs"` and `textLength` is present on multi-char
  text.
- Given no skinparam, then the output is byte-identical to the pre-change
  render (test compares against a string captured before the edit).
- Given the authored rows `class-*` and `object-*`, then all four of each
  are `rootExact` and `textLengthMatch`; `class.golden.ratchet.test.ts` green;
  class/object survey vs b0 shows 0 movers.

Observability: N/A. Rollback: Reversible.
