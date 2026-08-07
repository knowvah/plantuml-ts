# T6 — Diagnose the `other` bucket (2 fixtures)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) rendering
diagram source to SVG synchronously. `~/git/plantuml` is the canonical spec;
the pinned jar under `oracle/` is the numeric oracle. Description
size-conformance sits at **321/351 (91.5%)**, measured by
`scripts/measure-description-size-deltas.ts` against a 0.01in bar.

`other` is the classifier's fallthrough — it means **no pattern matched**, not
that the cause is exotic. These two fixtures have the least prior work of the
26 and correspondingly the most open field. There is no recorded mechanism to
verify and no bucket hypothesis to refute; start from the measurement.

## Task

Diagnose both to a `file:line` mechanism and record on the schema. **No source
changes, no fixes** (ADR-2, ADR-5).

| Fixture | delta (in) |
|---|---|
| `dopova-50-digo290` | 0.8827 |
| `pivudu-29-pele178` | 0.0694 |

The two deltas are an order of magnitude apart and share no label, so treat
them as independent until evidence says otherwise.

Because there is no prior hypothesis, work from the measurement outward:
1. Reproduce the delta and identify WHICH svek-N graph and which node carries
   the max delta (the measure script reports max across a fixture's graphs).
2. Diff our DOT/SVG against the jar's cached oracle for that node specifically.
3. Only then read code, and only the path that node's measurement flows
   through.

Instrument before hypothesizing — `~/.claude/rules/diagnosis.md` requires the
mechanism be confirmed against evidence before any cause is proposed.

## Write-set

- `plans/s1l-tail-diagnosis/findings/other.md` — **this file only**

Probes go in `scripts_scratch/` and MUST be deleted before you finish.

## Read-set

Required first (mandatory for any sizing bug, any engine, per `CLAUDE.md`):
`planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md`.

Mission: `../decisions.md`, `../findings/SCHEMA.md`,
`~/.claude/rules/diagnosis.md` (**read it**).

Context: `oracle/goldens/description/size-backlog.json` (the `_doc` field),
`plans/s1l-leaf-sizing/ledger.md` — check whether either slug appears; if it
does, that record is a hypothesis to verify (ADR-4), not a finding.

Code: no candidate list — deriving it is the task. Entry points are
`scripts/measure-description-size-deltas.ts` (how the delta is computed) and
`tests/oracle/svg-conformance/render-fixture.ts` (`renderFixtureDescription`,
the seam the goldens were captured through).

Oracle: `test-results/dot-cache/{component,usecase}/<slug>/`.

## Architecture decisions

ADR-2, ADR-3, ADR-4, ADR-5, ADR-6 — [decisions.md](../decisions.md). Locked.

## Interface contract

One record per fixture on [findings/SCHEMA.md](../findings/SCHEMA.md). Fill
`sharedCauseWith` across bucket boundaries — a fallthrough fixture is a strong
candidate to belong to one of the other six buckets' mechanisms, and T8 needs
that link.

## Acceptance criteria

- **Given** each fixture, **when** diagnosed, **then** `originFileLine` is a
  real file and line.
- **Given** the max-delta node, **when** identified, **then** the record names
  which svek graph and node it is, with our value and the jar's.
- **Given** a mechanism claim, **when** recorded, **then** `ruledOut` is
  non-empty with the evidence that eliminated each entry.
- **Given** an unresolvable fixture, **when** recorded, **then**
  `status: unresolved` with `ruledOut` and `nextStep` — never a fabricated
  mechanism. With no prior hypothesis to lean on, this bucket is the most
  likely to legitimately end here, and that is an acceptable outcome.
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

`docs(T6): other-bucket mechanism table` — or defer to the orchestrator.
