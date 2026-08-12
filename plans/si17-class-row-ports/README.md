# Mission: si17-class-row-ports

**Port the `RECTANGLE_HTML_FOR_PORTS` row-port node emission to the CLASS
corpus.** Upstream anchors a `A::member` edge to that member's own ROW; this
port anchors every such edge to the whole node. Fixing it is the last
`portOk` debt on the class DOT gate.

**Authorization.** `planning/mission-index.md` row SI17. Planned 2026-08-12;
blast radius, ADRs and decomposition confirmed by the maintainer in that
session (shared emitters ruled IN scope; ADR-1 kept as a blocking Batch 0;
T2 kept as one commit).

## Objective and exit bar

`oracle/goldens/class/port-backlog.json` is **empty and deleted**, and every
remaining miss carries a named mechanism — never "still diverges".

Today the gate reports **711 fixtures = 688 EQUAL + 23 non-EQUAL**, and the
23 are exactly **22 `portOk` + 1 `directionOk`**. The 7 oracle-blind are
already *inside* the 688 (the jar dumps no DOT to disagree with), so they
are not a debt.

**This mission's honest ceiling is therefore 710/711, not 711/711.** Closing
all 22 leaves `besepi-37-rori892`, which fails `directionOk` and belongs to
object-close B33's remainder (ADR-6). Close at 710/711 naming it as the
single outstanding cause, unless it lands elsewhere first. Do not redefine
the bar to make it look met.

## Branch

`feat/si17-class-row-ports` off `main`. Merge back with a **merge commit,
not squash** — per-task commit IDs get cited in the journal.

## Start here

1. This file.
2. [decisions.md](decisions.md) — six ADRs. **ADR-1 is unresolved by design**
   and Batch 0 resolves it. Do not start Batch 1 before it does.
3. [batch-0/overview.md](batch-0/overview.md) — the go/no-go.

Then read each batch's `overview.md` on arrival, and each task file when you
reach it. Do **not** load the whole plan directory at once.

## Batches

| Batch | Description | Tasks | Status |
|---|---|---|---|
| [batch-0](batch-0/overview.md) | Go/no-go: which source reproduces the oracle's bands | T0 | [x] |
| [batch-1](batch-1/overview.md) | The mechanism | T1 → T2 → T3 (sequential) | [ ] |
| [batch-2](batch-2/overview.md) | Governed remediation loop, only if T3 leaves residue | B0…Bn | [ ] |
| [batch-3](batch-3/overview.md) | Close-out | T4 | [ ] |

There is deliberately **almost no parallelism**: this is one mechanism
through one path, and the intermediate states are the hazard. Sequencing is
the point, not a scheduling failure.

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
| class DOT | **688/711** → only `portOk` may shrink | `npx tsx scripts/dot-sync-report.ts class` |
| object DOT | 74/80 | `npx tsx scripts/dot-sync-report.ts object` |
| component DOT | 262/262 | `npx tsx scripts/dot-sync-report.ts component` |
| usecase DOT | 93/93 | `npx tsx scripts/dot-sync-report.ts usecase` |
| state DOT | 267/267 | `npx tsx scripts/dot-sync-report.ts state` |
| class SVG census | 343/722, non-dropping | `npx tsx scripts/svg-conformance-census.ts class` |
| object SVG census | 35/80, non-dropping | `npx tsx scripts/svg-conformance-census.ts object` |
| description SVG census | 48-set intact | `npx tsx scripts/svg-conformance-census.ts component usecase` |

The maintainer ruled the **shared emitters IN scope** (`edgeRef`,
`rowPortTable`). That makes any task touching them cross-type: it must run
**all five DOT gates and all three censuses in the same pass**, not at
close-out.

## Stop conditions

- Batch 0 finds that **neither** band source reproduces the oracle. Do not
  pick the closer one — journal both and stop.
- Any frozen count above moves, in either direction.
- Two consecutive quality-gate failures on the same check.
- A task needs to write a file outside its declared write-set.
- An ADR in `decisions.md` turns out to be contradicted by the code.
- A backlog slug starts failing a check **other than** `portOk` — the pin
  asserts `portOk` is its only failure, so this means collateral damage.

## Push forward with judgment

- Choosing between equivalent TypeScript spellings with identical behavior.
- A task proving simpler than estimated (journal why, then proceed).
- Adding a unit test not named in the acceptance criteria.
- Discovering a residual fixture needs its own mechanism: file it as a
  batch-2 B-item rather than stopping.

## Conventions that bind every task

- **Read the Java first.** Open the method body and the constructor that
  built its inputs — not a filename, not this summary. Every constant cites
  its upstream `file:line`.
- **Never fit a value.** Especially not one that shrinks the error.
- Render oracles with `scripts/oracle-render.sh <out-dir> <puml>` — never a
  hand-typed `java -jar`. **The out-dir must be ABSOLUTE**; PlantUML
  resolves a relative `-o` against the input file's directory and will
  silently write nowhere useful (`.agent-notes/si16-oracle-cache-recapture.md`).
- One commit per task, message per `~/.claude/rules/commits.md`, referencing
  the task ID.
- Parallel agents share the worktree: **no state-mutating git in an agent**.
  The orchestrator commits.

## Links

- [decisions.md](decisions.md)
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)
