# Batch 3 — `BoxSizingOpts` thread + three parallel prerequisites

**Running total: 340 (+4 from F3-fix; the other three book 0 fixtures each).**

Four tasks, four disjoint write-sets, all four launch in parallel — **not
despite being unequal in shape, but because of it.** F3-seam, F3-diag and
F3-lic write **zero** `src/` files between them: two produce exactly one
findings document each (F3-diag, F3-lic) and one produces a small additive
public-API seam nothing yet consumes (F3-seam). None of the three touches a
file F3-fix touches, and none of the three touches a file any *other* task in
this batch touches. There is no write-set argument for serializing any pair of
them — only F3-fix carries `src/` risk, and it does not overlap the other
three at all.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|------------|------|
| F3-fix | G4 + G5 `BoxSizingOpts` thread — per-element stereotype font size + line thickness, tiers 1 and 2 together (ADR-5) | typescript-pro | `src/diagrams/description/{layout,layout-dot-tree,leaf-sizing-consts,leaf-sizing-entity,leaf-sizing}.ts`; `src/core/{preprocessor,skinparam-stereo-keys,style-map-element,theme-graph-colors,theme-element-resolve}.ts`; `src/diagrams/description/renderer-symbol.ts` | F1-a, F2-b | [x] |
| F3-seam | ADR-2 asset store seam — sync-fillable channel for vendored sprite/emoji assets | typescript-pro | `src/index.ts`, NEW `src/core/asset-store.ts` | — | [x] |
| F3-diag | `fariba-82` residual sub-diagnosis — the +2px `sh0006` (`$User`) gap E1+E2 don't explain | debugger | `plans/s1l-tail-fix/findings/fariba-82-residual.md` (new dir) | — | [x] |
| F3-lic | Sprite licence review — provenance/verdict per vendored icon set, gates F4-a | legal-advisor | `plans/s1l-tail-fix/findings/sprite-licence-review.md` (new dir) | — | [x] |

## Why F3-fix depends on F1-a and F2-b

- **F1-a** rebuilds `measureNote` (`leaf-sizing.ts:215-226`) and is the reason
  F3-fix must not touch that function's font-collapse trap blind — ADR-4's
  `opts?.fontSize ?? NOTE_FONT_SIZE` pattern is the shape F3-fix's own
  `BoxSizingOpts` reads must follow for the NEW `stereotypeFontSize` /
  `lineThickness` fields, or F3-fix reintroduces the identical 1px-regression
  class of bug ADR-4 was written to prevent. F1-a and F3-fix also share
  `leaf-sizing.ts` as a write target — sequencing avoids a merge race, not
  just a lesson.
- **F2-b** owns `leaf-sizing-entity.ts` (`extractNodeStereotype` +
  `buildStereo` M1, G3/G7) — the SAME file F3-fix's tier 1 (G4/G5) writes.
  `leaf-sizing-entity.ts` is SYNTHESIS §8's second ownership hub (in G3, G4,
  G5 **and** G10's write-sets); F2-b must land first or F3-fix's diff has no
  stable base.

## Why F3-seam, F3-diag and F3-lic have no dependencies

- **F3-seam** is pure `RenderOptions` plumbing — it reads nothing F1/F2
  produced and is consumed by nobody until Batch 4 (F4-a, F4-b). Built now so
  those two tasks don't both try to add the same option field.
- **F3-diag** re-measures `fariba-82` against the current tree; nothing in
  Batch 1/2 changes `sh0006`'s geometry (F1-b's E1 fix touches the
  *stereotype* row, not the sprite+label stack). It must finish before
  **Batch 4's F4-c**, which is conditional on this task's verdict — that is
  why it runs now rather than in Batch 4 itself (SYNTHESIS §8, "Sequencing
  notes for the planner").
- **F3-lic** reads only `~/git/plantuml`'s vendored resources and this repo's
  own `LICENSES.md`/dependency policy — no code dependency at all. It must
  finish before **Batch 4's F4-a** (ADR-9(a): the review blocks landing, it
  does not merely advise).

## Cross-engine obligation

F3-fix's tier 2 touches the shared theme/skinparam layer (`preprocessor.ts`,
`skinparam-stereo-keys.ts`, `style-map-element.ts`, `theme-graph-colors.ts`,
`theme-element-resolve.ts`) that class, state and object diagrams also read.
Per the mission README and stop condition 5, F3-fix — and only F3-fix in this
batch — must re-run the class and state size ratchets (`scripts/
measure-class-size-deltas.ts`, `scripts/measure-state-size-deltas.ts`), plus
verify object conformance by hand: **no `scripts/measure-object-size-deltas.ts`
exists**, verified against the tree — only `oracle/goldens/object/
size-backlog.json` does, with no committed harness pointed at it. F3-fix's own
task file spells out the local, uncommitted workaround. Do not let this gap
excuse skipping the object check.

## Quality gates (batch close)

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count rises to 340
npx tsx scripts/audit-size-metric-identity.ts
```

Plus, for F3-fix specifically: the class and state size ratchets (`widened 0`
on each) and the object check described above. For F3-diag and F3-lic:
`git diff --name-only` shows no `src/` path (see their own task files — their
quality bar is not the code gates above).

No task in this batch writes `oracle/goldens/description/size-backlog.json`
(ADR-1). F3-fix reports its four closed pins (`loroto-06-fano471`,
`toxine-81-xofo986`, `kofuca-08-pafi749`, `revusu-28-pexi248`) in its
completion summary; the orchestrator deletes them after this batch's gates
pass, in the batch commit.
