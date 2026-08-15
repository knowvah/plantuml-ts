# T3 — Fold `classifiers` + `notes` into `ClassGeometry.leaves`, byte-identically

## Context

plantuml-ts, class engine (`src/diagrams/class/`). Mission note-leaf-model
already made a note geo self-contained (draw-time TIPS resolution in
`note-tips-resolve.ts`, `NoteGeo.leafType: 'NOTE' | 'TIPS'`,
`NoteGeo.target`); what remains is that `ClassGeometry` still carries
`classifiers: ClassifierGeo[]` and `notes: NoteGeo[]` as two arrays.
Upstream has ONE leaf collection dispatched by leaf type
(`GeneralImageBuilder#createEntityImageBlock`); the state engine mirrors it
(`state/layout.ts#buildFlatStateGeos`, `StateNodeGeo.kind: ... | 'note'`).

This task is the TYPE fold only. `leaves` is built as
`[...classifiers, ...notes]` — today's order — and every consumer keeps
today's logic reading through views. Output must be BYTE-IDENTICAL; T4 lands
the order.

## Task

1. `class-geo-types.ts`: `export type ClassLeafGeo = ClassifierGeo | NoteGeo;`
   `ClassGeometry.leaves: ClassLeafGeo[]` REPLACES `classifiers` and `notes`.
   Export type guards `isNoteGeo(l): l is NoteGeo` /
   `isClassifierGeo(l): l is ClassifierGeo` and view helpers
   `classifierLeaves(leaves): ClassifierGeo[]`, `noteLeaves(leaves): NoteGeo[]`
   (D4). Doc: `leaves` is jar's `bibliotekon.allNodes()`; ORDER IS THE DRAW
   ORDER from T4 on — say so, and that T3 leaves it in concatenation order.
2. `note-layout-types.ts`: `leafType: NoteLeafType` → `kind: 'note' | 'tips'`
   (the union discriminant, mirroring `ClassifierGeo.kind` and state's
   `kind: 'note'`; keep the LeafType.java citations). Update
   `note-layout-tip.ts`, `note-opale.ts`, `note-tips-resolve.ts`,
   `renderer.ts`, `class-ink-box.ts` and the tests that set/assert it.
3. `layout.ts`: `layoutSinglePage` builds `leaves = [...classifiers, ...notes]`;
   `assembleShiftedGeometry`, `layoutMultiPage`, the empty sentinel, and
   `class-geo-builders.ts#degenerateSingleClassifier` produce `leaves`;
   ink/dims calls pass `classifierLeaves(leaves)` / `noteLeaves(leaves)`
   (helper signatures unchanged, D4).
4. `renderer.ts`: read `classifierLeaves(geo.leaves)` / `noteLeaves(geo.leaves)`
   at the top and keep every loop (steps 1–4, `notesByHost`, trailing pass)
   EXACTLY as is — T4 replaces them. `buildClassUidPlan({ ...geo, classifiers,
   notes })` (its `ClassUidPlanInput` is structural; keep declaration order).
   `renderer-uid.ts` reads only its own input type — verify no `geo.leaves`
   is needed there; `layout-ink-extent.ts` likewise.
5. Tests: migrate every `ClassGeometry` literal (`classifiers:`/`notes:` →
   `leaves:`), every `geo.classifiers`/`geo.notes` read (~152 + 10 sites in
   ~13 files under `tests/unit/class/`) to `classifierLeaves(geo.leaves)` /
   `noteLeaves(geo.leaves)` — mechanical, no assertion changes.

## Write-set

- `src/diagrams/class/`: `class-geo-types.ts`, `note-layout-types.ts`,
  `note-layout.ts` (barrel re-exports), `note-layout-tip.ts`, `note-opale.ts`,
  `note-tips-resolve.ts`, `layout.ts`, `class-geo-builders.ts`,
  `class-ink-box.ts`, `layout-ink-extent.ts`, `renderer.ts`,
  `renderer-uid.ts`, `renderer-note.ts`
- `tests/unit/class/*.test.ts` (mechanical migration only)

## Read-set

- `src/diagrams/class/class-geo-types.ts:19-30, 426-470`
- `src/diagrams/class/note-layout-types.ts:1-60` (`NoteLeafType`, `leafType`)
- `src/diagrams/class/layout.ts:207-303` (`layoutSinglePage`), `:317-400`
  (`assembleShiftedGeometry`, `layoutMultiPage`)
- `src/diagrams/class/renderer.ts:150-175` (`renderOneNote`), `:296-470`
  (`renderClass` steps)
- `src/diagrams/class/renderer-uid.ts:140-175` (`ClassUidPlanInput`), `:344`
- `src/diagrams/class/class-ink-box.ts:277-320`
- `src/diagrams/state/state-geo-types.ts:15-25` (`kind` discriminant precedent)

## Architecture decisions

D3 (leaves is the collection), D4 (helpers keep array params). Locked.

## Interface contracts

Consumed by T4:

```ts
type ClassLeafGeo = ClassifierGeo | NoteGeo;      // discriminant: `kind`
interface NoteGeo { kind: 'note' | 'tips'; ... }  // was leafType
interface ClassGeometry { leaves: ClassLeafGeo[]; /* classifiers, notes REMOVED */ }
function isNoteGeo(l: ClassLeafGeo): l is NoteGeo;
function classifierLeaves(leaves: readonly ClassLeafGeo[]): ClassifierGeo[];
function noteLeaves(leaves: readonly ClassLeafGeo[]): NoteGeo[];
```

## Acceptance criteria

- Given the corpus, when `npx tsx scripts/note-order-report.ts --check
  plans/leaf-draw-order/baseline/note-order.txt` runs, then "identical".
- Given the corpus, when shape-match and `dot-sync-report class` run, then
  diff-empty against `baseline/`.
- Given a hand-built `ClassGeometry` with one classifier leaf and one note
  leaf (any order), when rendered, then the SVG equals the pre-fold render
  of the equivalent two-array geometry byte-for-byte (write this as a test
  that captures the expected string from a fixture render, not from the
  old code path).
- Given `npm test`, then green with 90/90/90 and NO expectation moved.
- Given `grep -rn "\.notes\b\|\.classifiers\b" src/diagrams/class/` (geo
  reads, not `ast.`), then zero hits remain.

## Quality bar

All four gates + the two corpus reports + `--check` identical. Complexity
hook: keep `renderClass` under the caps — if the view extraction pushes it
over, split a helper. Do not pipe `npm test`.

## Observability requirements

N/A — no new observable operations.

## Rollback notes

Reversible (revert the commit).

## Boundaries

- Always: byte-identical output; keep every renderer loop's semantics.
- Never: reorder `leaves`; change uid numbering inputs' order; touch the
  state engine or `class-dot-graph.ts`.
- Ask first (log + STOP): if a consumer needs the leaf order to mean
  something already (it must not — that is T4).
- No git commands (the orchestrator commits: `refactor(T3): ...`).
