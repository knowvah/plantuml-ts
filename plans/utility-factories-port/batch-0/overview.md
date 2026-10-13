# Batch 0: branch, b0, harness, core bases, colour core, generated data

T0a first (orchestrator); T0b ∥ T0c ∥ T0d ∥ T0e then run in parallel worktrees (disjoint write-sets).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-b0-ledger.md) | branch, b0 (gates, all engines, build size), ledger, record checks | orchestrator | `measurements/b0*`, `fixtures.md`, journal | — | [ ] |
| [T0b](T0b-utility-harness.md) | `svg-utility` harness: render helper, golden + diff-baseline ratchets, goldens tree, pin + re-pin tools | typescript-pro (sonnet) | `tests/oracle/svg-conformance/{render-fixture-utility.ts,utility.*.ratchet.test.ts}`, `oracle/goldens/svg-utility/**`, `measurements/{pin-utility,repin-utility-baseline,repin-utility-routing}.mts` (+ tests, `vitest.config.mts`) | T0a | [ ] |
| [T0c](T0c-core-bases.md) | `UgDiagram`, `UgSimpleDiagram`, `PlainStringsDiagram`, `PSystemSingleLineFactory` plugin helper, `PSystemDonors.getCols` | typescript-pro (opus) | `src/core/{UgDiagram,UgSimpleDiagram,PlainStringsDiagram}.ts`, `src/core/command/PSystemSingleLineFactory.ts`, `src/diagrams/donors/PSystemDonors.ts` (getCols only) + tests | T0a | [ ] |
| [T0d](T0d-colour-core.md) | `HColorSet.names()`, `HColorSimple.distanceTo`, `ColorUtils.distance` | typescript-pro (sonnet) | `src/core/klimt/color/{HColorSet,HColorSimple,ColorUtils}.ts` + tests | T0a | [ ] |
| [T0e](T0e-generated-data.md) | generated data: openiconic order, archimate names, skinparameter keys, stdlib catalog, donors list, charlie + dedication PNGs | typescript-pro (opus) | `scripts/generate-utility-data.mts`, generated modules (see spec) + tests | T0a | [ ] |

Close batch 0 with the four gates plus a journal row; no survey re-pin (b0 is the baseline).

## Interface contracts (T0c → batch 1, T2a)
```ts
// src/core/command/PSystemSingleLineFactory.ts  (PSystemSingleLineFactory.java:54-90)
export function singleLinePlugin<D>(spec: {
  type: DiagramType;                         // the @startuml candidate type ('sequence' hack, java:61)
  executeLine(source: UmlSource, line: string): D | undefined;   // undefined = refuse
  render(diagram: D, ctx: RenderContext): RenderFragment;        // via UgDiagram/PlainStringsDiagram
}): DiagramPlugin;
// src/diagrams/donors/PSystemDonors.ts
export function getCols(lines: readonly string[], nb: number, reserved: number): string[][]; // java:146-154
```
T0c records the exact signatures it lands in `batch-1a/overview.md` ("As landed").
