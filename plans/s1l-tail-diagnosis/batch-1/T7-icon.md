# T7 — Diagnose the `icon` bucket (1 fixture)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) rendering
diagram source to SVG synchronously. `~/git/plantuml` is the canonical spec;
the pinned jar under `oracle/` is the numeric oracle. Description
size-conformance sits at **321/351 (91.5%)**, measured by
`scripts/measure-description-size-deltas.ts` against a 0.01in bar.

This is the smallest task in the batch: one fixture, `murava-69-tago286`, at
**0.1817in**. Its label (`icon`) is a classifier hypothesis, not a diagnosis
(ADR-3) — and with a single fixture there is no identical-delta pair to lean
on, so the label is the only prior and it is weak.

The neighbouring `sprite` bucket (T2) covers overlapping machinery — stdlib
sprite/icon atoms, `inlineFootprintBox`, raster dims. If your mechanism turns
out to be one of T2's, say so in `sharedCauseWith`; a one-fixture bucket
collapsing into a larger mechanism is a good outcome, not a failed task.

## Task

Diagnose `murava-69-tago286` to a `file:line` mechanism and record it on the
schema. **No source changes, no fixes** (ADR-2, ADR-5).

| Fixture | delta (in) |
|---|---|
| `murava-69-tago286` | 0.1817 |

Work from the measurement outward: identify which svek graph and node carries
the max delta, diff that node against the jar's cached oracle, and only then
read the code path that node's measurement flows through. Instrument before
hypothesizing (`~/.claude/rules/diagnosis.md`).

Because this task is small, spend the remaining effort on **quality of the
ruled-out list** rather than breadth. A single well-isolated mechanism with
solid negative evidence is worth more to the fix mission than a fast guess.

## Write-set

- `plans/s1l-tail-diagnosis/findings/icon.md` — **this file only**

Probes go in `scripts_scratch/` and MUST be deleted before you finish.

## Read-set

Required first (mandatory for any sizing bug, any engine, per `CLAUDE.md`):
`planning/usymbol-composition.md` — the 36-USymbol table is directly relevant
to an icon-shaped fixture — and `planning/sizer-renderer-parity.md`.

Mission: `../decisions.md`, `../findings/SCHEMA.md`,
`~/.claude/rules/diagnosis.md` (**read it**).

Context: `oracle/goldens/description/size-backlog.json` (the `_doc` field) —
check whether `murava-69` carries a recorded note; if so it is a hypothesis to
verify (ADR-4).

Candidate code (starting points, not conclusions):
- `src/diagrams/description/leaf-sizing-entity.ts`
- `src/core/creole-atoms.ts` — atom resolution, `inlineFootprintBox`
- `src/core/decoration/symbol/` — the ported USymbol classes

Oracle: `test-results/dot-cache/{component,usecase}/murava-69-tago286/`.

## Architecture decisions

ADR-2, ADR-3, ADR-4, ADR-5, ADR-6 — [decisions.md](../decisions.md). Locked.

## Interface contract

One record on [findings/SCHEMA.md](../findings/SCHEMA.md). Fill
`sharedCauseWith` across bucket boundaries, especially toward T2's sprite
fixtures.

## Acceptance criteria

- **Given** the fixture, **when** diagnosed, **then** `originFileLine` is a
  real file and line, not a restated label.
- **Given** the max-delta node, **when** identified, **then** the record names
  which svek graph and node it is, with our value and the jar's.
- **Given** the mechanism claim, **when** recorded, **then** `ruledOut` is
  non-empty with the evidence that eliminated each entry.
- **Given** the fixture is unresolvable, **when** recorded, **then**
  `status: unresolved` with `ruledOut` and `nextStep` — never a fabricated
  mechanism.
- **Given** completion, **when** `git diff --name-only` runs, **then** no
  `src/` path appears and `scripts_scratch/` is empty.

## Quality bar

```sh
npm test
npx tsx scripts/measure-description-size-deltas.ts   # 321/351, widened 0
git diff --name-only                                 # no src/ path
```

Capture `$?` directly; never pipe a gate.

## Observability

N/A — no new observable operations.

## Rollback

Reversible. Revert = delete the findings file.

## Boundaries

**Always:** instrument before hypothesizing; reach `file:line`; read the two
required tables first; Serena MCP tools. **Ask first:** oracle regeneration or
jar patch. **Never:** modify `src/`; state-mutating git; touch a backlog pin;
ship a fitted constant; declare a divergence.

## Commit

`docs(T7): icon mechanism table` — or defer to the orchestrator.
