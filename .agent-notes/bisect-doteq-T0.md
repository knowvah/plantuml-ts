# T0 — the bisect window has no `src/` flip to find (stop condition 1)

Written 2026-09-03 by mission `doteq-regression-bisect` T0. **Outcome: STOP.**
All three fixtures are `dotEqual=false` at the good end under the pinned
predicate (D1), so the mission's premise — a `src/` regression inside the
2026-08-12 window — is wrong. The mechanism is named below; it is a
comparator change, not a layout change.

## Contract

```json
{ "goodCommit": "0346753222c0fdb6fd62c4b46ad4b2495d73b48e",
  "badCommit": "763126230d9377e6e3aa7cfed55e2326e01ec7a6",
  "predicateCmd": "git checkout -q 763126230d9377e6e3aa7cfed55e2326e01ec7a6 -- scripts/svg-parity-survey.ts tests/oracle && node_modules/.bin/jiti scripts/svg-parity-survey.ts --render-one /Users/scottseely/git/knowvah/plantuml-ts/test-results/dot-cache/<type>/<slug>; git reset -q --hard HEAD; git clean -qfd -- scripts tests/oracle",
  "worktrees": { "lurage-50-kobo763": ".claude/worktrees/dqb-lurage-50-kobo763",
                 "xetase-70-zaza808": ".claude/worktrees/dqb-xetase-70-zaza808",
                 "tunelu-64-xica833": ".claude/worktrees/dqb-tunelu-64-xica833" },
  "skipRanges": [],
  "verdictAtGood": { "lurage-50-kobo763": false, "xetase-70-zaza808": false, "tunelu-64-xica833": false },
  "stop": "condition 1" }
```

`goodCommit` is the SI19 merge that introduced the pin (`generatedAt`
2026-08-12T13:04:24Z; pin file last touched by `766ef641` inside it). The
brief's literal choice, the last commit of 2026-08-12 (`4758f08a`), was
measured too and gives the same verdicts. Oracle inputs for all three
fixtures (`in.puml`, `in.svg`, `svek-1.dot`) are tracked in git and last
changed in `d42b9687` (07:39 that morning, before the pin) — fixed data over
the whole window, as the brief assumed. The predicate was run from the
main tree's cache by absolute path so no bisect step could read a different
oracle.

## Measurements (raw, every run `rc=0`, `oracleBlind=false`)

Pinned predicate = HEAD's `scripts/svg-parity-survey.ts` + `tests/oracle/`
(D1). "Native" = the checked-out commit's own predicate stack.

| `src/` at | predicate from | lurage | xetase | tunelu |
|---|---|---|---|---|
| `76312623` (bad, main) | `76312623` (pinned) | false | false | false |
| `4758f08a` (last of 08-12) | `76312623` (pinned) | false | false | false |
| `03467532` (pin merge) | `76312623` (pinned) | **false** | **false** | **false** |
| `03467532` (pin merge) | `03467532` (native) | true | true | true |
| `76312623` (bad, main) | `03467532` (old stack) | **true** | **true** | **true** |
| `76312623` (bad, main) | `225107c0` (= `d3ff29be^`) | true | true | true |
| `76312623` (bad, main) | `d3ff29be` | false | false | false |

Raw `--render-one` JSON at bad, pinned (svg elided to length):
`{"dotEqual":false,"oracleBlind":false,"svgLen":1559}`,
`{"dotEqual":false,"oracleBlind":false,"svgLen":1944}`,
`{"dotEqual":false,"oracleBlind":false,"svgLen":4645}`.

The 2×2 in rows 1, 3, 4 and 5 is the finding: **under either fixed
definition of `dotEqual`, the verdict is the same at both ends of the
window.** There is no `src/` commit at which any of the three flips.

## Mechanism

- **Cause.** `tests/oracle/svek-dot.ts#compareStructural` gained a
  `labelSizeOk` gate in `d3ff29be` (2026-08-15, mission
  `edge-label-box-and-class-ports` T10): the FIXEDSIZE `WIDTHxHEIGHT` of every
  edge-label `<TABLE>` is now compared as a multiset, where before only label
  *presence* was. The `parity-*.json` pins were generated three days earlier
  (`766ef641`) by the presence-only comparator.
- **Origin.** `tests/oracle/svek-dot.ts:393` (`labelSizeOk`) and the
  `structurallyEqual` conjunction below it; introduced at `d3ff29be`.
- **Causal chain.** Each fixture's emitted label box has differed from the
  jar's since before the pin. The old comparator could not see it, so the pin
  recorded `true`. The new comparator sees it, so `--render-one` today says
  `false`. Nothing in `src/` moved for these fixtures: with the old stack
  restored, current `src/` still scores `true`.
- **Which gate, per fixture** (only `labelSizeOk` fails; every other `*Ok`
  passes on all three):

  | fixture | oracle box | ours | source construct |
  |---|---|---|---|
  | `state/lurage-50-kobo763` | 125x54 | 472x15 | `skinparam maxMessageSize 150` word-wrap; we measure one line |
  | `state/xetase-70-zaza808` | 54x54 | 20x25 | `LexTop --> LexTop: {{` — embedded sub-diagram opener in an edge label |
  | `class/tunelu-64-xica833` | 253x33 | 224x15 | `note on link` on an `(A, B) . AssociationClass` couple |

## Already known — these are carried residuals, not regressions

All three are listed, with mechanisms, in the edge-label-box missions:
`plans/edge-label-box-backlog/README.md:194,217-218`,
`plans/edge-label-box-followups/README.md:175,182-183`, and the
`edge-label-box-and-class-ports` decision journal (2026-08-15, "51 pinned
goldens that were EQUAL with a wrong box"). They sit in the committed
shrink-only backlogs today: `oracle/goldens/state/label-size-backlog.json`
(lurage, xetase) and `oracle/goldens/class/label-size-backlog.json`
(tunelu). The DOT-parity *tests* have accounted for them since 2026-08-15;
only the survey pins never were.

## Ruled out

- **Oracle drift.** `git log` on the three cache dirs: unchanged since
  `d42b9687`, before the pin. `git diff 03467532 main` on them is empty.
- **Environment / non-determinism.** Same worktree, same `node_modules`,
  same node (v25.2.1); swapping only the predicate stack flips every verdict
  and swapping only `src/` flips none.
- **A `src/` regression masked by the comparator change.** Excluded by row 5:
  the old comparator scores current `src/` `true`, identical to the pin.
- **The linetype mission** — already disproven in
  `.agent-notes/lor-parity-pins-are-stale.md`; the bad end here is `main`,
  which does not contain it, and is `false` regardless.
- **`4758f08a` vs `03467532` as the good end.** Both `false` under the pinned
  stack; the choice does not matter.

## What this means for the brief

Stop condition 1 fires literally, and the brief's own reading of it ("do not
widen and continue") is the right one: widening would only re-find
`d3ff29be`, which is a *test* commit. D1 is what made this visible — a
moving-ruler bisect would have "found" `d3ff29be` as the culprit and
proposed reverting a gate.

The re-scope decision is the human's. The three candidate directions, none
taken here:

1. **Re-pin policy.** `parity-state.json` / `parity-class.json` /
   `parity.json` describe the presence-only comparator and will keep
   contradicting `--render-one` until regenerated. That is the "758 drifted
   rows" adoption question the brief already filed as out of scope.
2. **Fix the three boxes.** Each is a distinct, already-named mechanism in
   the edge-label-box follow-ups (`maxMessageSize` wrap; `EmbeddedDiagram`
   `NestedDiagramRenderer` unbuilt; `class-assoc-couple.ts` `.label`
   substitution bypassing `.linkNote`). None is a regression bisect.
3. **Nothing.** The DOT-parity tests already carry all three as backlog.

## Worktrees

Stood up per D4, `npm ci` exit 0 in each (470 packages), predicate verified
runnable. Left in place for a re-scoped mission; remove with
`git worktree remove .claude/worktrees/dqb-<slug>` ×3.
