# Mission: the namespace box IS the cluster polygon

## Gate status: LIFTED — executable end to end

Batch 4 needs `ClusterGeometry.label` from `@knowvah/dot-engine`. It did not
exist when this brief was drafted; **`1.5.0` shipped it on 2026-08-15** and
is verified to carry the field:

```ts
label?: { x: number; y: number; width: number; height: number };
// x/y are the CENTRE of the label space, not the box corner
```

The ask was `docs/graphviz-issues/14-cluster-label-position-not-in-getlayout.md`
(committed `6726ddec`); its RESOLVED note records the two ways the shipped
API differs from what was requested, both upstream's call and both correct.
T7 bumps the dependency from `^1.4.0`.

Nothing blocks. Start at Batch 1.

## Objective

A class or object package's box is currently guessed: `buildNamespaceGeos`
takes min/max over member node positions and pads by two invented
constants. Upstream does not guess — `DotStringFactory#solve:425-433` reads
the graphviz cluster polygon and `Cluster#setPosition` (`Cluster.java:511-512`)
stores it verbatim, with no padding, and `ClusterDecoration` draws exactly
that. This mission makes our box the cluster polygon too, which requires
first fixing the DOT that produces the polygon: our class clusters reach
graphviz with neither the protection wrappers nor the HTML title table jar
emits.

## Branch

`feat/composite-state-dot` (43 commits ahead of `main` at brief time, tree
clean). Do NOT create a new branch. Agents share this worktree — **no agent
may run any git command**; the orchestrator commits after each batch.

## Quality gates

Run all four before any commit lands. NEVER pipe `npm test` — `tail`'s exit
code masks vitest failures.

```
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the declared write-set only
  on_fail: stop
```

## The measurement that matters

Both standing gates are BLIND to this work, which is why Batch 1 builds a
harness before anything changes:

- the class DOT-parity comparator checks cluster **membership** only and
  deliberately normalizes `clusterNp0`/`clusterN`/`clusterNp1` to `clusterN`
  (`tests/oracle/svek-dot.ts` file doc comment), so it sees neither the
  missing wrappers nor the missing title table — and reports 712/712 today;
- `scripts/svg-conformance-census.ts` was byte-identical across the last two
  real fixes on this branch, because `compareSvg` stops recursion at a
  `childCount` mismatch.

| Signal | Baseline | Direction |
|---|---|---|
| Fixtures matching jar's document size exactly | 691 / 1069 | must rise |
| Rigid-aligned matching shapes | 20685 | must rise |
| Class DOT-parity ratchet | 712/712 conformant | must hold |
| The 11 named residual fixtures | 0 fully exact | should reach exact |

**One planned exception:** after T4 alone the numbers DIP — layouts shift
while `buildNamespaceGeos` still applies the old padding. That is expected,
is recorded in T4's spec, and is not a stop condition. Every other fall is.

## Scope

126 fixtures carry a cluster in jar's cached DOT: **123 class + 3 object**.
Object diagrams are in scope; they share `src/diagrams/class/`.

## Batches

| # | What | Depends on | Done |
|---|---|---|---|
| 0 | File dot-engine issue 14 | — | [x] `6726ddec` |
| [1](batch-1/overview.md) | Measurement harness, wrapper-level derivation, shared title helper | — | [ ] |
| [2](batch-2/overview.md) | Emit wrappers + title table in the class DOT | B1 | [ ] |
| [3](batch-3/overview.md) | Read the box from the cluster; retire the constants | B2 | [ ] |
| [4](batch-4/overview.md) | Title position (needs dot-engine 1.5.0) | B3 | [ ] |
| [5](batch-5/overview.md) | Record the outcome | B4 | [ ] |

## Stop conditions

Stop and wait for a human when:

- A task needs to modify a file outside its declared write-set, and that
  file is in no other task's write-set either.
- Two consecutive quality-gate failures on the same check. The 2-try cap
  bounds **edits, not investigation** — keep diagnosing until you can state
  the mechanism, then STOP and log the full artifact from
  `~/.claude/rules/diagnosis.md` (mechanism, `file:line` origin, causal
  chain, what was ruled out). "Two attempts failed" is not a diagnosis.
- The same location or approach has been changed 3 times consecutively
  without resolving the same failing check.
- Either headline measurement number falls, outside T4's documented dip.
- A class DOT-parity fixture leaves conformant.
- T2's derived wrapper level disagrees with ANY of the 126 cached DOTs —
  the oracle is exhaustive, so a disagreement means the predicate is wrong,
  not that the fixture is odd.
- T6's empty-package proof fails (see `decisions.md` decision 3).
- A task turns out to be mis-scoped and needs splitting — **T5 is the
  expected case**; splitting it is fine, doing it badly in one commit is
  not.
- An architecture decision in `decisions.md` would have to be contradicted.

## Push forward without asking when:

- The choice is purely stylistic and does not change behaviour.
- A task is simpler than estimated (log why in the decision journal).
- An error message is self-explanatory and the fix is obvious.
- A test expectation moves and the ORACLE demonstrably decided it — record
  the oracle value in the commit message.

## Index

- [decisions.md](decisions.md) — the five confirmed architecture decisions
- [diagrams/component-map.md](diagrams/component-map.md) — what is touched
- [diagrams/data-flow.md](diagrams/data-flow.md) — how the box is produced
- [decision-journal.md](decision-journal.md) — appended during execution
- `.agent-notes/class-ink-shared-offset-groups.md` — the measured evidence
  this mission is built on. Read it before Batch 1.
