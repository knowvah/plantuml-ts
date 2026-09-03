# Mission: `linetype-ortho-routing`

**Branch:** `feat/linetype-ortho-routing` · **Planned:** 2026-09-03 ·
**Baseline commit:** `76312623` (main, clean tree, all four gates green)

## Objective

`skinparam linetype ortho|polyline` is **half ported**. The per-edge
label→xlabel switch is wired; the graph-level `splines=ortho;
forcelabels=true;` is **never emitted at all** — not by the DOT emitter, not
by the layout builder, and `DotInputGraph` has no field to carry it. Every
ortho/polyline layout therefore runs on graphviz's **default curved routing**
where the jar runs ortho. Wire the routing half, and make the DOT-parity
harness able to see it.

Upstream: `DotStringFactory.java:161-169`, between `searchsize=500;` (`:154`)
and `rankdir=LR;` (`:171`) — exactly the gap in our own `graphAttrLines`.

## The proof this rests on

Replaying `pavuzo-79-zodu430`'s real captured `DotInputGraph` through the
identical build path, toggling **only** those two attributes:

| quantity | ours today | + `splines=ortho`,`forcelabels` | native 15.1.1 |
|---|---|---|---|
| bb width | **106.581238** | **108.164568** | `108.16` |
| node centre x | **60.7500** | **62.3333** | `62.333` |
| edge 2 `xlabel.x` | **40.5000** | **43.6667** | `43.667` |

The left column reproduces graphviz-issue 17's original filing's three
"engine" numbers **to the digit**. Those measurements were always real — they
were measurements of *our own graph*, misattributed to dot-engine.

Full artifact: `.agent-notes/gvi17-splines-never-emitted.md`. Closes
`docs/graphviz-issues` **17** (downstream symptom) and **03** (the
un-consumed fix, un-checked in `TRACKER.md`); unblocks **16**'s
`pavuzo-79-zodu430` row.

## Scope — 8 fixtures, verified on 1, inferred on 7

| type | fixtures |
|---|---|
| class (5) | `bujedi-30-cize673`, `dimisi-54-dula946`, `gamevo-26-runo973`, `jakapi-64-tine258`, `kuxato-79-muno809` |
| component (1) | `zosaxo-93-nici652` |
| state (2) | `kejabo-83-vinu490`, `pavuzo-79-zodu430` |

Plus 21 unclassified corpus fixtures (class 18, sequence 3).
**json/yaml/hcl are OUT** — Smetana path, no svek DOT, no DOT-parity gate,
zero `linetype` references.

**The mission's whole risk profile is "verified one, inferred seven."** That
is why every fixture is pinned individually (T0) and why the two stop
conditions with teeth are about movement outside the expected set.

## Exit bar

- `splines`/`forcelabels` emitted by both the layout builder and the DOT
  emitter, from one shared helper
- All three engines (state, class, description) forward `linetype`
- `pavuzo-79-zodu430` scope 2 width idx 2: `−1.579968 px` → **0 px**
  (T4, measured; all 12 declarations exact). The `~0.002 px` this brief
  originally predicted was never a residual in the port — it was the
  deviation of the *standalone replay* that produced the prediction from
  the real pipeline. See the decision journal's T4 rows for the arithmetic.
- `splinesOk` gates `dotEqual`, and is **proven** to go false when the
  emitter is reverted
- `dotEqual` stays `true` on all 8 — now actually meaning it
- **Zero fixtures outside the 8 move**
- All four gates green, `Test Files` == the figure in [the running
  total](#test-files-running-total) — it rises as tasks add test files and
  must never fall

## Quality gates — all four, before any commit lands

```
- command: npm test            # vitest + 90/90/90 coverage
  pass: exit 0 AND `Test Files` total == the running-total ledger's last row
  on_fail: fix_and_rerun
- command: npm run typecheck   # both tsconfigs
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

`rm -rf coverage/.tmp` before any `npm test` run following a killed,
timed-out or backgrounded one — an orphaned `.tmp` makes vitest silently
under-collect while exiting 0 (`.agent-notes/aoh-coverage-tmp-undercollect.md`).

## Batches

| Batch | Tasks | Sequenced | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | T0 pin the floor, all 8 individually | — | [x] |
| [1](batch-1/overview.md) | T1 types+helper · T2 layout · T3 emitter | yes — **all three INERT** | [x] |
| [2](batch-2/overview.md) | T4 state · T5 class · T6 description | yes | [x] |
| [3](batch-3/overview.md) | T7 `splinesOk` gates `dotEqual` | yes | [x] |
| [4](batch-4/overview.md) | T8 re-pin, name every mover | — | [x] |

**T0 gates everything** — without individual pins the inference on 7 fixtures
is unfalsifiable. **Batch 1 is inert**: nothing consumes `linetype` until an
engine forwards it, so zero fixture movement is those tasks' acceptance
criterion, not an aspiration.

## Stop conditions

1. **Any fixture outside the 8 moves** — the containment claim failed.
   Diagnose; never re-pin past it.
2. **Any of T1/T2/T3 moves a fixture** — they are inert by construction, so
   movement means the premise is wrong.
3. **`splinesOk` cannot be proven to discriminate** ([D6](decisions.md)) —
   an assertion that stays green with the emitter reverted is decoration.
4. A re-pin would **loosen** a shrink-only ratchet (`size-backlog.json`).
5. `pavuzo` misses its target and the deviation cannot be explained. Never
   fit a value. (Closed by T4 at **0 px**; the original `~0.002 px`
   target measured the replay harness, not the fix.)
6. A constant is needed and its upstream `file:line` cannot be located.
7. Files outside the write-set need changing and no other task owns them.
8. Two consecutive gate failures on the same check — the cap bounds **fix
   attempts, not investigation** (`~/.claude/rules/diagnosis.md`).
9. Any of [D1–D6](decisions.md) is contradicted — amend and halt.
10. `npm test` reports a `Test Files` total **below** the last row of
    [the running total](#test-files-running-total). A DROP is the real
    signal — it is the `coverage/.tmp` under-collection signature, where
    vitest silently skips files and still exits 0. A rise is expected
    whenever a task adds a test file.

## Push-forward conditions

1. One of the 8 moves jar-ward with a clear mechanism → proceed, log it.
2. `maxDelta` shifts in `parity-*.json` for one of the 8 → expected, routing
   changed. Re-pin with the mechanism named.
3. A task is simpler than estimated → do it, log why first.
4. Purely stylistic choices with no behavioral effect.
5. Self-explanatory error with an obvious fix.
6. `dotEqual` stays `true` while `splinesOk` is newly computed → that is
   success, not a no-op.

## `Test Files` running total

The gate exists to catch **silent under-collection** (`coverage/.tmp`
orphaned by a killed run makes vitest skip files and still exit 0), so the
invariant is *never falls*, not *equals one fixed number*. A single pinned
figure re-stales on every task that adds a test file — which is what the
original **684** did by T1.

| after | total | added |
|---|---|---|
| baseline `76312623` | 684 | — |
| T0 | 684 | none (pins only) |
| T1 | 685 | `tests/unit/core/dot-splines.test.ts` |
| T2 | 685 | none (extended an existing suite) |
| T3 | 685 | none (extended an existing suite) |
| T4 | 686 | `tests/unit/state/state-linetype-routing.test.ts` |
| T5 | 687 | `tests/unit/class/class-linetype-routing.test.ts` |
| T6 | 688 | `tests/unit/description/description-linetype-routing.test.ts` |
| T7 | 688 | none (extended existing suites) |
| T8 | 688 | none (pins + docs only) |

Update this row-by-row as tasks land; the count includes the 1 skipped file
vitest reports in its total.

## Index

- [decisions.md](decisions.md) — D1–D6
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)

---

## Mission summary — closed 2026-09-03

**9 of 9 tasks complete.** Branch `feat/linetype-ortho-routing`, cut from
`76312623`. Merge (never squash) — the journal cites per-task commit IDs.

### Exit bar, against the bar as written

| criterion | result |
|---|---|
| `splines`/`forcelabels` from one shared helper, both emitters | met — `core/dot-splines.ts`, consumed by `applyGraphAttrs` + `graphAttrLines` |
| All three engines forward `linetype` | met — state (3 sites), class, description |
| `pavuzo` `−1.579968 px` → `~0.002 px` | **exceeded: `0 px`**, 12/12 exact. The `~0.002` was never real (replay artifact) |
| `splinesOk` gates `dotEqual`, proven to fail on revert | met — **0/10 reverted, 10/10 restored**, verified twice |
| `dotEqual` true on all 8, now meaning it | met |
| Zero fixtures outside the 8 move | met — measured on all three corpora |
| Four gates green, `Test Files` per ledger | met — 688, no drop |

### Beyond the bar

- **Three fixtures reached `conformant`**: `bujedi-30-cize673`,
  `dimisi-54-dula946`, `kuxato-79-muno809`.
- `kejabo-83-vinu490` also went exact (`+0.749952 px` → `0`) — it had no
  prediction on record.
- `size-backlog.json` **tightened**: both state entries removed.
- graphviz-issues **03 checked** (its fix finally consumed) and **17
  resolved**.

### Decisions made

18 journal rows. **Three flagged for review**, all now closed except the
hand-off:

1. README's `~0.002 px` and `684` figures — both planning-stage numbers
   execution disproved. Corrected (`60080515`), with the pass-count ledger
   replacing the re-staling constant.
2. The diagnosis note's predicted residual — corrected by **appending**, not
   rewriting (`da6b7a3e`), so the original reasoning stays auditable.
3. **Open, needs an owner**: `.agent-notes/lor-parity-pins-are-stale.md` —
   the `parity-*.json` pins date from 2026-08-12 and carry **761** rows of
   unrelated drift including **three** `dotEqual` regressions. Not this
   mission's to adopt, and deliberately not adopted.

### Known issues / follow-ups

- `zosaxo-93-nici652`'s SVG delta rose 219.425 → 313.35. Its DOT is
  structurally equal including `splinesOk`; the residual is renderer-side
  (text metrics) on a corpus that is 2-conformant-of-358. **Weakest-evidence
  claim in the mission** — attribution, not a proven mechanism for the
  specific 94px.
- `jakapi-64-tine258`'s rise 17 → 108.007 is the comparator descending past
  a `childCount` short-circuit, not a render regression. Verified in
  `compare.ts:530-539`.
- 21 unclassified corpus fixtures carry `linetype` and were out of scope;
  they now route correctly but are unmeasured here.

### One process failure worth carrying forward

The orchestrator ran `git add -A` while a task agent was live and swept its
in-progress source edit into a docs commit. Tree was never wrong;
attribution was. Recovered via `git reset --soft` + two clean re-commits,
verified tree-identical. **The subagent caught it, from `git reflog`; the
orchestrator had no signal.** Recorded in
`.agent-notes/batch-parallelism-needs-worktrees.md`: disjoint write-sets do
not make concurrent `git` safe in one checkout, because the index is shared
state no write-set declaration governs.
