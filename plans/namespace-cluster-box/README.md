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
| Fixtures matching jar's document size exactly | 691 / 1073 | **769** ✅ |
| Rigid-aligned matching shapes | 20765 (re-pinned; see journal) | **25403** ✅ |
| Class DOT-parity ratchet | 712/712 conformant | **712/712** ✅ |
| The 11 named residual fixtures | 0 fully exact | **9 / 11 fully exact** |

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
| [1](batch-1/overview.md) | Measurement harness, wrapper-level derivation, shared title helper | — | [x] `492617a9` `1e450493` `f63afbed` |
| [2](batch-2/overview.md) | Emit wrappers + title table in the class DOT | B1 | [x] |
| [3](batch-3/overview.md) | Read the box from the cluster; retire the constants | B2 | [x] |
| [4](batch-4/overview.md) | Title position (needs dot-engine 1.5.0) | B3 | [x] `e5fa03cf` — decision 4 superseded |
| [5](batch-5/overview.md) | Record the outcome | B4 | [x] |

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

---

## Outcome (2026-08-14)

All five batches complete; eight tasks, one commit each plus five brief
commits. All four quality gates green at every batch boundary.

| Signal | Baseline | Final |
|---|---|---|
| Fixtures matching jar's document size exactly | 691 / 1073 | **769** |
| Rigid-aligned matching shapes | 20765 | **25403** |
| Class DOT-parity ratchet | 712/712 | **712/712** |
| The 11 named residual fixtures | 0 fully exact | **9 fully exact** |

No fixture regressed at any point, and no state fixture moved at all —
the change stayed inside the class engine, which is where it belonged.

### Three things the brief got wrong, and what they were

**The planned dip never happened.** T4 was expected to lower the numbers;
they rose 17.7% instead. A box is 1–3 shapes against ~29 members, so the
wrapper margins moving members into jar's real layout space swamped the
still-wrong box. Verified rather than assumed: 78 fixtures moved, 76 class
and 2 object, zero state, zero regressions.

**Decision 4 was superseded, with the owner's approval.** The title
position is not read from the cluster on the class path — `xyTitle` is
state/swimlane only (`Cluster.java:439,497`), and a package's title is
drawn at a fixed `UTranslate(4, 2)` by `USymbolFolder#asBig`. Implementing
the decision as written cost 333 matched shapes. The dependency bump and
the surfaced `label` field were kept for the state-side consumer that
genuinely needs them.

**`cocube-46-tusu692` was not a counter-example.** The brief flagged it as
contradicting the wrapper-level predicate. It does not: the parser turns a
dotted endpoint into a leaf classifier under its parent, so that namespace
never carries the edge. All 126 cached DOTs agree with the predicate.

### What is left, and where it is written down

**CLOSED after the mission, 2026-08-15.** `cidepu-54-bemo048` and
`kicolo-81-sidi387` now reach **28/28** — the follow-on mechanism was
fixed in `graph-layout.ts#cornerSize` (773 doc-size-exact / 25695 shapes,
34 fixtures improved, zero regressions). What follows is how it stood at
mission close:

`cidepu-54-bemo048` and `kicolo-81-sidi387` reach exact document size but
stay at 13/28 shapes, on a mechanism this mission does not own:
`.agent-notes/class-html-node-corner-vs-quantized-width.md`. It is ours,
not the engine's — graphviz sizes an HTML-table node from the table
quantized to whole points, and we convert centre→corner with the
unquantized width. Mission-sized: its blast radius is most class nodes.

That note also records a hypothesis that was WRONG and how it died —
the first reading blamed `@knowvah/dot-engine`, and the arithmetic fit.
Building the minimal repro in order to file the issue is what disproved
it: the engine returns the same 92/93 real graphviz does. No issue was
filed. A correct measurement sent to the wrong repository is still a bug
report someone has to close.
