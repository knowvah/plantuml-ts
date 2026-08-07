# T5 — Verify the S1L-j mechanism (multi-line quoted display, 2 fixtures)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) rendering
diagram source to SVG synchronously. `~/git/plantuml` is the canonical spec;
the pinned jar under `oracle/` is the numeric oracle. Description
size-conformance sits at **321/351 (91.5%)**, measured by
`scripts/measure-description-size-deltas.ts` against a 0.01in bar.

This bucket **already has a recorded mechanism** in `planning/mission-index.md`
(sub-mission S1L-j):

> A quoted display left OPEN at end of line continues onto the following
> source lines — upstream's `CommandCreateElementMultilines`. We stop at the
> first line, so the id becomes the literal `foo2 as "This artifact`.

**Verify it; do not inherit it** (ADR-4). On 2026-08-06 two prior missions'
recorded mechanisms for a single symptom were each half-right, and the
"obvious" fix derived from one of them would have regressed a ratcheted
golden. Good provenance still means hypothesis.

Note this is the one bucket whose recorded mechanism is a **parser** bug, not
a sizing bug — the size delta is downstream of the id/display being wrong.
That matters for `proposedWriteSet`: a parser fix has a different blast radius
than a sizer fix, and it will change parse output for any fixture using the
same construct, not just these two.

## Task

For each fixture: reproduce the current delta, confirm or correct the recorded
mechanism against current code and current numbers, and record it on the
schema. **No source changes, no fixes** (ADR-2, ADR-5).

| Fixture | delta (in) |
|---|---|
| `pecupa-75-zote612` | 0.6196 |
| `tajadu-40-juro990` | 0.3585 |

Specific things to establish:
1. Does the parse actually break as recorded — is the id literally
   `foo2 as "This artifact` today? Print the parsed AST rather than reasoning
   about the grammar.
2. Which upstream command is authoritative: read
   `CommandCreateElementMultilines` in `~/git/plantuml` and record how it
   decides a quoted display continues, including its terminator rule.
3. How many OTHER corpus fixtures use the same open-quote construct? A parser
   change reaches all of them, and the fix mission needs that number to size
   the risk. `grep` the corpus; report the count.

## Write-set

- `plans/s1l-tail-diagnosis/findings/multiline-display.md` — **this file only**

Probes go in `scripts_scratch/` and MUST be deleted before you finish.

## Read-set

Required first (mandatory for any sizing bug, any engine, per `CLAUDE.md`):
`planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md`.

Mission: `../decisions.md` (ADR-4 especially), `../findings/SCHEMA.md`,
`~/.claude/rules/diagnosis.md` (**read it**).

Prior record to verify: `planning/mission-index.md` (the S1L-j row).

Candidate code:
- `src/diagrams/description/element-grammar.ts`
- `src/diagrams/description/command-table-containers.ts` —
  `parseBracketDeclaration`, `KEYWORD_RE`
- `src/diagrams/description/parser.ts`
- Upstream: `~/git/plantuml/.../descdiagram/command/` —
  `CommandCreateElementMultilines`

Oracle: `test-results/dot-cache/{component,usecase}/<slug>/`.

## Architecture decisions

ADR-2, ADR-3, **ADR-4 (governing)**, ADR-5, ADR-6 —
[decisions.md](../decisions.md). Locked.

## Interface contract

One record per fixture on [findings/SCHEMA.md](../findings/SCHEMA.md).
`proposedWriteSet` must reflect that this is a parser change, and
`sizeEstimate` must include the corpus-wide count from step 3 above.

## Acceptance criteria

- **Given** each fixture, **when** diagnosed, **then** `originFileLine` is a
  real file and line, and the record marks the S1L-j mechanism **confirmed**,
  **corrected**, or **refuted**.
- **Given** the recorded broken-id claim, **when** checked, **then** the record
  quotes the ACTUAL parsed id/display observed today, not the recorded one.
- **Given** the upstream command, **when** read, **then** the record states its
  continuation and terminator rule with a `file:line` citation into
  `~/git/plantuml`.
- **Given** step 3, **when** complete, **then** `sizeEstimate` names how many
  corpus fixtures use the same construct.
- **Given** an unresolvable fixture, **when** recorded, **then**
  `status: unresolved` with `ruledOut` and `nextStep`.
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

**Always:** reach `file:line`; read the two required tables first; Serena MCP
tools. **Ask first:** oracle regeneration or jar patch. **Never:** modify
`src/`; state-mutating git; touch a backlog pin; ship a fitted constant;
declare a divergence.

## Commit

`docs(T5): multiline display mechanism table` — or defer to the orchestrator.
