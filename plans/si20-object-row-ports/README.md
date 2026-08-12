# Mission: si20-object-row-ports

**Port the `RECTANGLE_HTML_FOR_PORTS` row-port emission to the OBJECT
corpus** — the object-corpus twin of SI17. Upstream anchors an `A::member`
edge to that member's own ROW; this port still anchors object edges to the
whole node through the retired `:P` shield. SI17 fixed this for class and
deliberately left object alone, because closing it from SI17's change would
have been a result without a mechanism.

**Authorization.** Follow-on to SI17 (merged `cae48bd4`). Register as
`planning/mission-index.md` row **SI20** — no row exists yet; T4 creates it.

## Objective and exit bar

`oracle/goldens/object/port-backlog.json` is **empty and deleted**, and every
remaining object miss carries a named mechanism — never "still diverges".

Object DOT is measured today at **77/80** with exactly one `portOk` failure,
`rozuxo-44-fudi093`. Closing it reaches **78/80**.

**78/80 is the honest ceiling, not a shortfall.** The other two are 2
`no-candidate` plus 1 oracle-blind (`!pragma layout`, the jar dumps no DOT to
disagree with). `besepi-37-rori892` fails `directionOk`, not `portOk`, and
belongs to object-close B33's remainder. **Do not redefine the bar to make it
look met.**

## Branch

`feat/si20-object-row-ports` off `main`. Merge back with a **merge commit,
not squash** — per-task commit IDs get cited in the journal and ledger.

Baseline: TypeScript **6.0.3** (landed `147ef23b`). Built and measured on TS 6.

## Start here

1. This file.
2. [decisions.md](decisions.md) — seven ADRs. **ADR-1 and ADR-2 are
   unresolved by design** and Batch 0's T0 resolves them.
3. [batch-0/overview.md](batch-0/overview.md).

Then read each batch's `overview.md` on arrival, and each task file when you
reach it. Do **not** load the whole plan directory at once.

## Batches

| Batch | Description | Tasks | Status |
|---|---|---|---|
| [batch-0](batch-0/overview.md) | Go/no-go measurement ∥ first split | T0 ∥ S1 | [ ] |
| [batch-1](batch-1/overview.md) | Second split | S2 | [ ] |
| [batch-2](batch-2/overview.md) | The mechanism | T1 → T2 → T3 | [ ] |
| [batch-3](batch-3/overview.md) | Close-out | T4 | [ ] |

Batch 0 is the only parallelism: T0 writes the journal, S1 writes source, so
their write-sets are disjoint. Everything after is sequential — one mechanism
through one path, where the intermediate states are the hazard.

## Quality gates — all four, every task, before any commit

```sh
npm test         # vitest + 90/90/90 coverage
npm run typecheck
npm run lint
npm run build
```

**Never pipe a gate.** `npm test | tail` reports `tail`'s exit code and masks
vitest failures.

## Frozen counts — ANY movement, in EITHER direction, is a stop condition

| Gate | Frozen at | Command |
|---|---|---|
| object DOT | **77/80** → only `portOk` may shrink | `npx tsx scripts/dot-sync-report.ts object` |
| class DOT | **710/711, `portOk` 0** | `npx tsx scripts/dot-sync-report.ts class` |
| component DOT | 262/262 | `npx tsx scripts/dot-sync-report.ts component` |
| usecase DOT | 93/93 | `npx tsx scripts/dot-sync-report.ts usecase` |
| state DOT | 267/267 | `npx tsx scripts/dot-sync-report.ts state` |
| object SVG census | 35/80, non-dropping | `npx tsx scripts/svg-conformance-census.ts object` |
| class SVG census | 343/722, non-dropping | `npx tsx scripts/svg-conformance-census.ts class` |
| description SVG census | 26/358, non-dropping | `npx tsx scripts/svg-conformance-census.ts component usecase` |

**Read a census from its `DeterministicMeasurer` section, never with `tail`.**
The script prints a second `jarMeasurer` block that reports `0 diffs: 0` by
design; `tail` lands in it and reads as a total wipeout.

The shared emitters (`edgeRef`, `rowPortTable`) are IN scope again, so any
task touching them is cross-type: it runs **all five DOT gates and all three
censuses in its own pass**, not at close-out.

## Stop conditions

- **T0 finds neither `(H, margin)` pair reproduces the oracle.** Journal both
  and stop. Picking the closer one is fitting.
- **Class DOT moves off 710/711, or `portOk` rises above 0.** Highest-priority
  stop — that undoes SI17.
- Any other frozen count moves, in either direction, except object `portOk`
  shrinking.
- **A split task (S1/S2) changes any measured number.** They are pure
  relocations by definition; if a count moves, the seam is wrong.
- **`class-dot-graph.ts` turns out to need modification.** It has 1 line of
  headroom to the 500-line cap — stop and add a split task rather than let an
  agent hit the blocking hook mid-edit.
- **`map` or `json` behavior changes at all** — ADR-4 puts them out of scope.
- A backlog slug starts failing a check **other than** `portOk`.
- Two consecutive quality-gate failures on the same check.
- A task needs to write a file outside its declared write-set.
- An ADR in `decisions.md` turns out to be contradicted by the code.

## Push forward with judgment

- Equivalent TypeScript spellings with identical behavior.
- The exact new filename or seam boundary *within* ADR-7's approved shape.
- A task proving simpler than estimated (journal why, then proceed).
- Adding a unit test not named in the acceptance criteria.
- A residual fixture needing its own mechanism: file it as a batch-2 B-item
  rather than stopping.

## Conventions that bind every task

- **Read the Java first.** Open the method body and the constructor that
  built its inputs — not a filename, not this summary. Every constant cites
  its upstream `file:line`.
- **Never fit a value.** Especially not one that shrinks the error.
- **An observation that holds only because of the thing you are about to
  remove is not a ruling-out.** Measure the removal in isolation before
  believing the diagnosis. SI17's B2 nearly shipped a wrong fix on exactly
  this error.
- Render oracles with `scripts/oracle-render.sh <out-dir> <puml>` — never a
  hand-typed `java -jar`. **The out-dir must be ABSOLUTE**; PlantUML resolves
  a relative `-o` against the input file's directory and silently writes
  nowhere useful, exiting 0.
- One commit per task, message per `~/.claude/rules/commits.md`, referencing
  the task ID.
- Parallel agents share the worktree: **no state-mutating git in an agent.**
  The orchestrator commits.

## Links

- [decisions.md](decisions.md)
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)
