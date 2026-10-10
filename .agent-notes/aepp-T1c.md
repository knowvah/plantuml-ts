# aepp-T1c report

## Commits
See `git log aepp/T1c` (one commit: swimlane gate + switch pre-case refusal + report).

## Java -> ours
- `ActivityDiagram3.java:80-83` manageSwimlaneStrategy -> `swimlane-strategy.ts#manageSwimlaneStrategy`, called from `node-dispatch.ts#dispatchLine` before any handler in INSTRUCTION_HANDLERS (reverted if the handler declines).
- `ActivityDiagram3.java:86-91` swimlane() -> `swimlane-strategy.ts#enterSwimlane`, called by `node-dispatch.ts#trySwimlane`; 'execution' refusal at the lane line.
- Callers of manageSwimlaneStrategy (ActivityDiagram3.java): addActivity 114, addSpot 136, start 154, stop 160, end 169, breakInstruction 195, fork 217, startSwitch 276, startIf 308, startRepeat 352, repeatWhile 363, backward 379, doWhile 396, startGroup 422. Not: split, kill, detach, notes, labels, arrows. Mapped: circle spot, action (single/multi), partition/group, backward, if, switch, while, repeat, fork, activity-list, and keywords start/stop/end/break.
- `InstructionSwitch.java:97-101` -> `switch-dispatch.ts#consumeSwitchCases` ('unexpected' non-blank line before first case => 'execution' refusal "No 'case' in this switch").

## kedozi diagnosis
- Mechanism: parse silently dropped `:Charged;` ('unexpected' arm, switch-dispatch.ts classifySwitchClauseLine fallthrough), producing a switch with zero cases; layout then indexes the missing first case.
- Origin: TypeError at `src/diagrams/activity/layout/swimlane-lanes.ts:61` (laneIn), via `walk-switch.ts:227` pushCaseInEdge <- :446 pushAt <- :466 walkSwitchCases. Root: `switch-dispatch.ts` 'unexpected' drop (fixed there, not downstream).
- Chain: no case -> cases=[] -> walkSwitchCases/pushCaseInEdges reads cases[0] -> undefined.kind -> renderSync catches -> error page.
- Ruled out: parse throwing (parseActivity returned an AST, no throw); theme/measurer (stack reproduced with defaultTheme).

## Rows before -> after (activity survey, b0-eng baseline vs now)
433 conformant / 1 structural / 17 diverged unchanged. Only 3 rows moved, all to our error page: nakavu, velodu (firstDiff svg/@background -> error-page text; were drawing), kedozi (crash page -> refusal page). They still read `diverged` pending the orchestrator's error-page verdict rule (T2).
Goldens/diff-baseline/swimlane-baseline/refusal-coverage/routing-conformance all green unchanged; tests/unit/activity all 42 files green; typecheck, eslint, prettier clean. No src/core edits -> all-engine survey not required.

## Pitfall found
First cut refused blank lines between `switch (x)` and the first `case` (demibe, pateca, rekuxa, duvole routed to NONE). Blank lines are now exempt (test pinned).

## Deviations
- New file `src/diagrams/activity/swimlane-strategy.ts` (outside the stated write-set): dispatch-support.ts (518) and node-dispatch.ts (474) had no room under the 500-line cap. Small, self-contained.
- Gate placement is in `dispatchLine` (set-before / revert-on-decline) rather than inside each handler, because if/fork/group handlers live outside the write-set and parse their bodies before returning.

## Not done
Verdict flip of the 3 rows to conformant/errorPage (orchestrator/compare.ts, per D-rule). No novel notes beyond the above.
