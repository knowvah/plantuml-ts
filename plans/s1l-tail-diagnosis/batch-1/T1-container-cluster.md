# T1 — Diagnose the `container-cluster` bucket (9 fixtures)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java) that renders
diagram source to SVG synchronously — no DOM, no canvas, no Java. The Java at
`~/git/plantuml` is the canonical spec; the pinned jar under `oracle/` is the
numeric oracle. Description-diagram size-conformance is measured by
`scripts/measure-description-size-deltas.ts` against a 0.01in bar and is
currently **321/351 (91.5%)**.

Your nine fixtures are the largest remaining bucket. **The bucket label is not
a diagnosis.** `container-cluster` is assigned by a first-match classifier that
tags any fixture carrying a container keyword plus `{`. In mission S1L-e this
exact label collected six unrelated bugs — note `\n` resolution, link-endpoint
`\n` resolution, a multi-line bracket-open colour regex, the
USymbolSimpleAbstract family, and two separate empty-`[ ]`-body bugs — and NONE
of the six was cluster geometry. Expect the same here.

On 2026-08-06 three fixtures sharing one label and one identical delta were
proven to be two different mechanisms in two different engines, and a prior
mission's "algebraically derived" one-character fix for them would have
regressed an already-ratcheted golden. That is the failure mode this task
exists to prevent.

## Task

Diagnose each of the nine to a `file:line` mechanism and record it on the
schema. **Write no source code and propose no fix** (ADR-2, ADR-5).

| Fixture | delta (in) |
|---|---|
| `fariba-82-xolu802` | 0.3889 |
| `junoxu-15-gori632` | 0.2477 |
| `kokebo-27-vafi688` | 0.0346 |
| **`kovaxi-11-reti348`** | **0.7720** |
| *`lesori-32-zeve057`* | *0.2429* |
| *`ravodu-50-siso430`* | *0.2429* |
| `tuliba-37-liza126` | 0.5210 |
| `vixeni-34-nici683` | 0.2033 |
| **`zidebi-71-nocu387`** | **0.7720** |

**Start with the two identical-delta pairs.** `kovaxi-11`/`zidebi-71` both
carry 0.7720 and `lesori-32`/`ravodu-50` both carry 0.2429. `CLAUDE.md`: "An
IDENTICAL delta across fixtures = ONE shared cause" — this has held every time
it has been tested. Resolving a pair resolves two fixtures at once and is the
cheapest available entry point. If you conclude a pair does NOT share a cause,
that conclusion needs evidence, not assertion.

Two fixtures carry known prior context you must **re-verify, not inherit**
(ADR-4): `fariba-82` is recorded in `plans/s1l-leaf-sizing/ledger.md` as a
compound residual (an out-of-scope awslib sprite plus a jar `file`-body
word-wrap gap) rather than a leaf-width bug; `tuliba-37` shrank 6.7359 →
0.5210 during creole-lexer unification. Confirm both against current code and
current numbers before carrying either forward.

## Write-set

- `plans/s1l-tail-diagnosis/findings/container-cluster.md` — **this file only**

Temporary probes may live in `scripts_scratch/` and MUST be deleted before you
finish. Nothing under `src/` may change (ADR-2).

## Read-set

Required before any fixture (`CLAUDE.md` marks both mandatory for any sizing
bug in any engine):
- `planning/usymbol-composition.md`
- `planning/sizer-renderer-parity.md`

Mission context:
- `plans/s1l-tail-diagnosis/decisions.md` — all six ADRs
- `plans/s1l-tail-diagnosis/findings/SCHEMA.md` — the record format you must
  produce
- `~/.claude/rules/diagnosis.md` — **read this file**; you are in diagnosis
  mode and its stop conditions bind you
- `oracle/goldens/description/size-backlog.json` — the `_doc` field carries
  the historical triage (a hypothesis, per ADR-3)

Candidate code (starting points, NOT conclusions — the label may be wrong):
- `src/diagrams/description/frontier-cluster-bbox.ts` — `computeContainerBbox`
- `src/diagrams/description/layout-helpers.ts`
- `src/diagrams/description/layout-dot-tree.ts`
- `src/diagrams/description/leaf-sizing.ts`, `leaf-sizing-text.ts`

Per-fixture oracle: `test-results/dot-cache/{component,usecase}/<slug>/`
(`in.puml` + the jar's `in.svg`).

## Architecture decisions that bind this task

ADR-2 (no source changes), ADR-3 (labels are provenance, not partitions),
ADR-4 (re-verify recorded mechanisms), ADR-5 (estimate, never prototype),
ADR-6 (a divergence is proposed, never declared). Full text in
[decisions.md](../decisions.md). These are locked — if you find a conflicting
constraint, STOP and log it.

## Interface contract

Produce one record per fixture on
[findings/SCHEMA.md](../findings/SCHEMA.md), field names and order unchanged.
T8 parses these mechanically across all seven findings files. The
`sharedCauseWith` field is what T8 re-partitions on — fill it carefully, and
across bucket boundaries where you see a match (the historical triage claims
4 of these 9 are actually sprite-caused).

## Acceptance criteria

- **Given** each of the nine fixtures, **when** diagnosed, **then**
  `findings/container-cluster.md` holds a record whose `originFileLine` is a
  real file and line — never a restated bucket label.
- **Given** a non-trivial fixture, **when** its record is written, **then**
  `ruledOut` is non-empty and each entry names the evidence that eliminated it.
- **Given** the pairs `kovaxi-11`/`zidebi-71` and `lesori-32`/`ravodu-50`,
  **when** both are diagnosed, **then** each pair either names the other in
  `sharedCauseWith` or states with evidence why an identical delta does not
  imply a shared cause.
- **Given** a fixture you cannot resolve within the effort bound, **when** you
  record it, **then** `status: unresolved` with a populated `ruledOut` and
  `nextStep` — never a fabricated mechanism.
- **Given** the task completes, **when** `git diff --name-only` runs, **then**
  no `src/` path appears and `scripts_scratch/` is empty.

## Quality bar

```sh
npm test                                             # must stay green
npx tsx scripts/measure-description-size-deltas.ts   # 321/351, widened 0
git diff --name-only                                 # no src/ path
```

Capture `$?` directly — never pipe a gate, because `tail`'s exit code masks
the real one.

## Observability

N/A — no new observable operations. This task produces documentation.

## Rollback

Reversible. No source changes; revert = delete the findings file.

## Boundaries

**Always:** reach a `file:line` before claiming a mechanism; read the two
required tables first; use Serena MCP tools (`find_symbol`,
`find_referencing_symbols`, `search_for_pattern`) for symbol navigation.
**Ask first:** anything implying an oracle regeneration or jar patch.
**Never:** modify `src/`; run a state-mutating git command (parallel agents
share this worktree); delete or edit a backlog pin; ship a fitted constant;
declare a divergence.

## Commit

One commit, message `docs(T1): container-cluster mechanism table`. Do not
commit yourself if the orchestrator is batching commits — follow the
orchestrator's instruction.
