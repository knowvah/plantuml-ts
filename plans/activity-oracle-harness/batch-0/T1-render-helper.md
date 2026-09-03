# T1 — The activity render helper

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. vitest; tests never colocate with source.
Every SVG-conformance suite in this repo renders through a **type-scoped
low-level helper**, never through `renderSync` — so production's own measurer
default cannot leak into a conformance measurement.

## Task
Write `renderFixtureActivity(markup, measurer)`, mirroring
`render-fixture-sequence.ts` procedurally.

The contract every one of these helpers shares: **ONE measurer instance
injected into BOTH the layout and the render stage**, and the low-level
pipeline (`parseActivity` → `layoutActivity` → `renderActivity`) rather than
`renderSync`.

Read `render-fixture-sequence.ts`'s doc comment first. It enumerates three
deltas from the state sibling, each justified by a structural difference in
the AST. **Do the same analysis for activity and write down what you find**
— specifically:
- Does `ActivityDiagramAST` have a `.pages` field (multi-page stripping)?
- Does `renderActivity`'s `RenderFragment` ever set `preChromeWidth` (which
  is what gates `applyClassDocumentMargin`)? Check the literal it returns at
  `src/diagrams/activity/renderer.ts:221-226`.
- Does `parseActivity` take a `UmlSource`-shaped block or `readonly string[]`?
  Check what `activityPlugin.parse` actually passes through.

Each answer is a documented no-op or a real step — do not copy sequence's
conclusions, derive activity's. State each with the `file:line` that proves
it.

**Note for T5's benefit:** this helper is written against the CURRENT
renderer. After T5 routes activity through the document shell, the helper
must still return the full document. If T5's change moves shell assembly
inside `renderActivity`, this helper simplifies; if it does not, the helper
may need to assemble. Do not pre-build for that — write it for today and let
T5 adjust it if needed (`plans/.../decisions.md` D6).

## Write-set
- `tests/oracle/svg-conformance/render-fixture-activity.ts`

Nothing else. No `src/`. No ratchet test — that is T2.

## Read-set
- `tests/oracle/svg-conformance/render-fixture-sequence.ts` — the template,
  read its full doc comment
- `tests/oracle/svg-conformance/render-fixture-state.ts` — the rationale
  common to all of them
- `src/diagrams/activity/index.ts` — what `activityPlugin` actually calls
- `src/diagrams/activity/renderer.ts:196-227` — the fragment it returns
- `src/core/measurer-deterministic.ts` — the measurer under test

## Architecture decisions
[D6] the shell move is T5's, not yours — write against today's renderer.

## Interface contracts
```ts
export function renderFixtureActivity(
  markup: string,
  measurer: Measurer,
): string;   // a complete SVG document
```
Consumed by T2 and T6.

## Acceptance criteria
- Given a fixture and a `DeterministicMeasurer`, when rendered, then a
  complete SVG document is returned and **one** measurer instance is shared
  across the layout and render stages.
- Given the same input rendered twice, then the two outputs are
  byte-identical.
- Given each of the three structural questions above, then the module's doc
  comment answers it with a `file:line`, not by analogy to sequence.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** One new test-helper file; deleting it reverts the task.

## Quality bar
All four gates green. The file must satisfy the complexity hook (500-line
file / 30-NLOC function / 10 CCN / 5 params).

## Commit
`test(aoh-T1): add the activity conformance render helper`
