# T3 — true baseline and per-fixture attribution

## Context

plantuml-ts measures SVG conformance per diagram type against pinned jar
goldens. Four types have already been driven to their exit bar; the json family
has not, and its only current depth assertion is "output contains `<svg`".

Every prior mission of this shape could lean on a **DOT-parity gate** to tell
"our layout is wrong" apart from "our SVG assembly is wrong": if the DOT was
already equal, a residual SVG diff had to be assembly. **That signal does not
exist here** — the jar emits no DOT for json (ADR-3). This task carries the
weight that gate carried. It is the reason the mission can attribute anything at
all, and it writes no production code.

## Task

Produce a true baseline for `json`, `yaml`, and `hcl`, and attribute every
non-conformant fixture to a **named mechanism**.

"Named mechanism" means what `~/.claude/rules/diagnosis.md` requires:
- **Mechanism** — the specific cause, one or two sentences.
- **Origin** — the `file:line` where it originates.
- **Causal chain** — why the observed diff follows from that cause.
- **Ruled out** — what you eliminated, and the evidence that did it.

A bucket label is a hypothesis, never a finding. An empty "ruled out" on a
non-trivial fixture means the cause was guessed.

## Read-set

- `scripts/svg-conformance-census.ts` — run it; read `renderFixtureFor` and the
  bucketing.
- `tests/oracle/svg-conformance/{compare.ts,normalize.ts}` — **read `compare.ts`
  around the `childCount` early-return before trusting any diff count.** It
  stops recursing on a structural mismatch, so a fixture reporting "12 diffs"
  with a root `childCount` diff may have an entirely uncompared interior. D14
  was misled by exactly this.
- `src/diagrams/json/{layout.ts,renderer.ts,json-layout-prep.ts}`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/` — the
  spec: `SmetanaForJson`, `TextBlockJson`, `JsonCurve`, `Mirror`, `Arrow`,
  `StyleExtractor`.
- `plans/g4-state-svg/ledger.md` — the per-fixture attribution standard set by
  G1-I10 and met by G2/G3/G4. Match its granularity.

## Write-set

- `plans/a5-json-family-conformance/baseline.md` (create)

**No production code.** If you find a one-line fix, do not apply it — record it
as a mechanism with its `file:line` and let T4 or Batch 3 own it. A fix here
would move the baseline this task is measuring.

## Architecture decisions (locked — see `decisions.md`)

- **ADR-1:** the layout will be re-mirrored to upstream's TB+swapped-dims+Mirror
  structure in Batch 3. When you attribute a geometry diff, state explicitly
  whether it is **plausibly explained by the LR-vs-mirrored graph difference**
  or is independent of it. Batch 3's go/no-go reads this. This is the single
  most valuable output of the task.
- **ADR-2:** for json, Smetana IS the target. Do not attribute a miss to "the
  jar uses old graphviz" and move on — that reasoning is not available here.
- **ADR-3:** no DOT gate exists; do not look for `svek-N.dot`.

## Interface contracts

`baseline.md` must contain, consumed by T4 and by Batch 3's go/no-go:

```
## <type> — <conformant>/<total>
| bucket | count |   (0 / 1-3 / 4-10 / 11-30 / 31+ / error)

## Mechanisms
| # | mechanism | origin (file:line) | fixtures | ADR-1-sensitive? | evidence |
```

`ADR-1-sensitive?` is `yes` / `no` / `unknown` — whether re-mirroring the graph
could plausibly change this diff. Every row needs a value; `unknown` is
acceptable and honest, a blank is not.

## Acceptance criteria

1. **Given** the widened cache, **when** the census runs for all three types,
   **then** `baseline.md` records conformant counts and bucket histograms for
   each.
2. **Given** any non-conformant fixture, **when** you look it up in
   `baseline.md`, **then** it maps to a numbered mechanism with all four
   diagnosis fields populated.
3. **Given** a fixture whose root `childCount` differs, **when** it is reported,
   **then** the entry states that its interior is UNCOMPARED and the diff count
   is a floor, not a total.
4. **Given** the mechanism table, **when** Batch 3 reads it, **then** every row
   carries an `ADR-1-sensitive?` verdict.
5. **Given** at least three mechanisms, **when** each is spot-verified against
   the Java, **then** the evidence column cites the upstream `file:line`.

## Observability requirements

N/A — offline measurement.

## Rollback

**Reversible.** One new markdown document; no code paths touched.

## Quality bar

- Four gates green (they should be untouched — you changed no code; if a gate
  moves, something is wrong with the premise).
- Do not report a mechanism you have not verified against either the Java or a
  controlled experiment. Three of this repo's past missions had to correct a
  subagent's load-bearing claim; the cost of an unverified mechanism here is a
  whole mis-scoped batch.

## Boundaries

- **Always:** state uncertainty explicitly. "Cause not yet isolated; ruled out
  X, Y; next instrument Z" is a valid and welcome entry.
- **Never:** apply a fix, however small.
- **Never:** run `git commit` or any state-mutating git command.
- **Never:** widen a tolerance or pin a fixture to make a number look better.
