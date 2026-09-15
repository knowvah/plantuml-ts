# T1 — diagnose the lane mechanisms (no `src/` edits)

**Agent:** `debugger` · **Depends on:** T0a

## Context

Faithful TypeScript port of PlantUML; the Java is the spec — read the method
body, and quote `file:line` for every claim. Read
[`../README.md`](../README.md), [`../decisions.md`](../decisions.md) D1, D2
and D6 (locked), and [`../fixtures.md`](../fixtures.md). Follow
`~/.claude/rules/diagnosis.md`: instrument before hypothesising; every answer
states **Mechanism**, **Origin** (`file:line`), **Causal chain** and
**Ruled out**. An empty "ruled out" means the cause was guessed.

The defect: every compound spreads `swimlaneSpread(ctx)` after its body
parses (`if-dispatch.ts:189`; `node-dispatch.ts:176,230,261,291`), and one
`swimlane` field feeds both `laneIn` and `laneOut`
(`layout/swimlane-placement.ts:84-102`). A throwaway capture-before-parse on
fork/split at `activity-parallel-connectors` T3 made `jevoce-05-mumi686`
rise 369 → 599 with the mechanism unread. **Those numbers predate
`activity-klimt-compress`; `jevoce` is pinned 439 now. Re-measure; never
carry the old number.**

Java root: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/`.

## Method

Throwaway edits happen only in a scratch worktree
(`git worktree add ../alc-t1-scratch HEAD`), removed at the end. Never commit
`src/`. Measure with `scripts/activity-probe.ts` (`--dump`, `--lanes`).

## Questions

**Q1 — `jevoce`.** In the scratch worktree, move the capture before the body
parse for split and fork only, keeping the single field. Dump `jevoce` ours vs
jar. Which edge or shape changed lane, why does that raise the score, and does
D1's separate `swimlaneOut` remove the rise? (Unverified planning hypothesis,
to confirm or rule out: the edge leaving the split now reads S1 where the jar
reads the lane at `end split`, S3.)

**Q2 — split top line.** Upstream draws it in `list99.get(0).getSwimlaneIn()`
(`ftile/vcompact/ParallelBuilderSplit.java:83`). Read
`AbstractParallelFtilesBuilder`'s constructor (how `list99` is built from
`all`), `InstructionList.java:82-150,204-218` and the Ftile the list creates,
then state what that call returns when the first branch opens with a lane
switch or is empty. Does ours (`laneIn(t.children[0]!, myLane)`,
`walk-fork-branches.ts:137`) return the same? The join line uses
`swimlaneOutForStep2()` (`AbstractParallelFtilesBuilder.java:208-210`): the
last list's `getSwimlaneOut()` — zero lanes gives `null`, one lane gives that
lane, otherwise the last instruction's out lane. Does ours (`:169`) agree?

**Q3 — which getter reaches a drawn connection.** Grep `getSwimlaneIn()` and
`getSwimlaneOut()` across `activitydiagram3/`. Separate Instruction-level
callers from Ftile/Gtile-level callers. State whether the parent-delegating
getters (`InstructionRepeat.java:236-242`, `InstructionWhile.java:175-181`,
`InstructionSplit.java:167`) ever reach a drawn connection, or whether only
Ftile lanes do (for example `FtileUtils.withSwimlaneIn`,
`InstructionRepeat.java:171`). Produce the call-site table below.

**Q4 — the fixture set.** Verify each row of `fixtures.md` (kinds and the `*`
flag) against how our parser actually nests the source. Amend the file if any
row is wrong, and journal the amendment.

**Q5 — base measurement.** Write
`probe --slugs-file plans/activity-lane-capture/fixtures.md --json` to
`plans/activity-lane-capture/measurements/base.json`, and `--lanes` for all 40
to `measurements/base-lanes.txt`.

## Write-set

`.agent-notes/alc-T1.md`; `plans/activity-lane-capture/measurements/base.json`;
`plans/activity-lane-capture/measurements/base-lanes.txt`;
`plans/activity-lane-capture/fixtures.md` (amend only);
`plans/activity-lane-capture/decision-journal.md` (rows).

## Interface contract (consumed by T4–T7)

The note has sections `## Q1` … `## Q5`, and Q3 ends with this table, one row
per `laneIn`/`laneOut` call site in `layout/tile-coordinates.ts` (`:176-177`,
`:208-221`, `:258-296`, `:336-349`), `layout/walk-while-branch.ts:48-61` and
`layout/walk-fork-branches.ts:79,92,137,153,169`:

```
| call site | compound | reads In or Out of which tile | upstream cite |
```

## Acceptance criteria

- Given the note, when Q1–Q3 are read, then each has Mechanism, Origin
  (`file:line`), Causal chain and a non-empty Ruled out
- Given the call-site table, then every listed call site appears exactly once
- Given a finding that contradicts D1 or D2, then `decisions.md` is amended
  and the executor halts (stop 3)
- Given `measurements/base.json`, then `aggregate` is 52954 and `subsetSum`
  equals the sum of the (possibly amended) `fixtures.md` pins
- Given the scratch worktree, then it is removed and `git status` shows no
  `src/` change

## Observability / Rollback

N/A — no new observable operations / **Reversible** (documents only).

## Quality bar

All four gates green; `git diff --name-only HEAD~1` lists only the write-set.

## Commit

`docs(alc-T1): diagnose the activity lane capture mechanisms`
