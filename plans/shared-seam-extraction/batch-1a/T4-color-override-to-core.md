# T4 — `resolveBareOrBackColor` → `core/color-override.ts`

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (`~/git/plantuml`
is the spec). Pure SVG, vitest, 500-line cap. `src/diagrams/state/state-
render-colors.ts:17` imports `resolveBareOrBackColor` from
`../class/class-color-override.js` — the one state→class edge. The function
(29 lines, `class-color-override.ts`) is the `ColorParser.simpleColor(
ColorType.BACK)` extraction that upstream applies identically to
classifiers, notes and states — shared, not class-owned.

## Task

1. Read `class-color-override.ts` (whole) and upstream `klimt/color/
   ColorParser.java` (`simpleColor`, `ColorType.BACK`) to write the `@see`
   with `file:line`.
2. `git mv src/diagrams/class/class-color-override.ts src/core/color-
   override.ts`; fix the doc so it names both callers' engines and the
   upstream lines. No shim.
3. Rewire: `class/renderer-classifier-{box,colors,rows}.ts`, `class/renderer-
   note.ts`, `state/state-render-colors.ts`. Move the colocated test.
4. Manifest: EMPTY.

## Write-set

`src/core/color-override.ts` (new, moved), `src/diagrams/class/class-color-
override.ts` (delete), `src/diagrams/class/{renderer-classifier-box,renderer-
classifier-colors,renderer-classifier-rows,renderer-note}.ts`,
`src/diagrams/state/state-render-colors.ts`, moved `*.test.ts`.

## Read-set

- `src/diagrams/class/class-color-override.ts` (whole)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/ColorParser.java`
- `decisions.md#d1`, `#d8`

## Architecture decisions

D1, D8.

## Interface contract

`core/color-override.js#resolveBareOrBackColor(color: string | undefined):
string | undefined` — unchanged signature.

## Acceptance criteria

- Given `state/state-render-colors.ts`, then it imports nothing from
  `../class/`.
- Given the baseline manifest (`--only class,state` acceptable per-task; full
  at batch end), then `0 fixtures differ`.
- Given the moved test, then all prior cases pass and one new case cites
  `ColorParser.java` for the `##red` (line-only) branch.

## Quality bar

4 gates + manifest green. Commit
`refactor(T4): move resolveBareOrBackColor to core/color-override`.

## Observability

N/A.

## Rollback

Reversible.
