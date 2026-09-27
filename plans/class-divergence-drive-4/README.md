# Mission: `class-divergence-drive-4`

**Branch:** `feat/class-divergence-drive-4`, cut from main AFTER cdd3 merges
(batch 0) · **Planned:** 2026-09-26 · **Task prefix:** `cdd4` · **Merge:**
merge commit.

Read `~/.claude/docs/reference/autonomous-execution.md` in full at mission
start and after every compaction. Then this file, then
[`decisions.md`](decisions.md). Everything else is linked from here.

## Objective

Take class SVG parity from **689 / 16 / 18** (HEAD `9a4503a2` + the
uncommitted `absorbLayoutEpsilon` deletion) to the most conformant state
reachable without a dot-engine release. That means:

- close every port-side row (gujigi, jakapi, lecelo, sokevu, mizupo, besepi)
- sign the four acceptances (luzive, sadamo, zuduxu, nugecu)
- fix the census harness so bidusa, ruliki and popesa can be pinned
- leave each of the 14 dot-engine rows with a current, re-verified entry in
  `docs/graphviz-issues/TRACKER.md`, for the maintainer to take to
  dot-engine

Batch 0 first finishes cdd3 (its T-exit and T-close-out). The Java at
`~/git/plantuml/src/main/java/net/` is the spec.

**Baseline after batch 0 (T0e, dot-engine 1.6.1): 701 / 6 / 16** — 12 dot-engine rows closed by the bump. Exit target is therefore ≥ 707 (701 + gujigi, jakapi, lecelo, sokevu, mizupo, besepi), plus ririlu if its B-6 residual gets a mechanism.

## Exit bar (D1)

- class conformant ≥ **695**; accepted divergences (class) = **17**
- each of the 14 dot-engine rows maps to a re-verified TRACKER entry
- bidusa, ruliki, popesa survey-conformant AND census 0-diff AND pinned
- zero conformant losses (any engine), zero unexplained rises at every close
- class DOT parity green; four gates green with collected = on-disk count

## Quality gates — all four before every commit

```sh
npm test              # vitest + 90/90/90 coverage; never a path filter
npm run typecheck
npm run lint
npm run build
```

Batch closes add survey, census, render-all, pin-diff and pins; see
[`close-procedure.md`](close-procedure.md). Render oracles only with
`scripts/oracle-render.sh`.

## Batches

| Batch | Group | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | close cdd3, cut branch, baseline | T0a · T0b · T0c · T0d · T0e | serial | [x] |
| [1](batch-1/overview.md) | acceptances, oracle, TRACKER, census, diagnosis, sokevu, theme port | T1–T7a | all ∥ | [x] |
| [2](batch-2/overview.md) | theme routing + fixes from T5 | T7b · T8–T10 | per overview | [x] |
| [3](batch-3/overview.md) | exit + close-out | T-exit · T-close-out | serial | [x] |

Inventory: [`fixtures.md`](fixtures.md). Journal:
[`decision-journal.md`](decision-journal.md). Diagrams:
[`diagrams/component-map.md`](diagrams/component-map.md),
[`diagrams/data-flow.md`](diagrams/data-flow.md).

## Stop conditions

1. A task needs a file that a concurrently running task owns
2. The same gate fails on two consecutive fix attempts, or the same code
   location changes 3 times without resolving the same failing check
3. A finding contradicts D0–D9: amend `decisions.md`, then halt
4. A conformant fixture (ANY engine) leaves conformant, or `dotEqual`
   flips true→false, without a stated mechanism
5. A diff-count rise with no mechanism (a structural fall with a numeric
   rise is a reveal, not a stop)
6. Class DOT parity goes red
7. Any survey timeout, or JSON-reporter collected ≠ on-disk count
8. Any oracle change except besepi (D5): jar, `pin.json`, cache
9. More than 20 new non-class verdict movers at a close. Waived for T6 and
   T7b (D3/D4), but every mover still needs a mechanism
10. Any edit under `~/git/knowvah/dot-engine`, or any push, publish or
    release of it

## Push-forward (decide, journal, continue)

- A pure type/file-cap move that extends a write-set
- Unit-pin updates explained by a measured mechanism
- Pinning goldens that are survey-conformant AND census 0-diff
- A TRACKER entry for any new dot-engine finding
- Collapsing two fix tasks that turn out to share a file
- `final = open -> <owner>` when diagnosis finds no mechanism

## Status

Exit evaluated 2026-09-27 from `measurements/final.json` (= `b2.json`; no
change after the batch-2 close, no residual with a fixable mechanism left).
Start → end: **689 / 16 / 18 → 707 / 3 / 13** (planning survey → final).

| Clause (D1) | Result | Met |
|---|---|---|
| class conformant ≥ 707 (701 after the dot-engine bump + 6 port rows; besepi excluded by the maintainer's ruling, journal 7) | **707** | met |
| accepted divergences (class) = 17 | 17 (luzive, sadamo, zuduxu, nugecu added, `b105814a`) | met |
| every dot-engine row fixed or mapped to a TRACKER entry | 13 conformant via dot-engine 1.6.1 (TRACKER 19/22/24/25/26 checked); nugecu accepted (TRACKER 23 = A3) | met |
| bidusa, ruliki, popesa pinned | pinned cdd4-b2 (T4 census fix) | met |
| zero conformant losses / unexplained rises (every engine) | 0 losses at b0 and b2; every rise journaled as a reveal with its mechanism | met |
| class DOT parity green; four gates, collected = on-disk | green; 875 = 875, coverage 96.4/91.87/97.46/97.41 | met |

Remaining class non-conformant (16): 15 accepted rows (11 older, including
7 ELK, plus luzive/sadamo/zuduxu/nugecu accepted this mission) and
**besepi**, the only unaccepted one. Two older accepted entries, moxobo-16
and zikabo-17, now render CONFORMANT, so their acceptances are stale;
retiring them is a maintainer act, flagged in next-missions. besepi is open on the oracle re-pin (the
pinned jar is 7beta11, the oracle symlink 8beta1, and our render equals
8beta1 exactly). Ratchet 686 → 706 (sokevu survey-conformant but not
census-pinnable: class-only census cannot auto-dispatch it).

Other engines, b0 → final: component, unknown, usecase +254 verdict
improvements, 0 regressions, 0 `dotEqual` flips.

