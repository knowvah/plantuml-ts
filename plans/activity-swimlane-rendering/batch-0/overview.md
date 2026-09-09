# Batch 0 — pin the floor

One task. **Nothing may change source until this lands.** Five sequenced
changes (skinparams, resolvers, threading, geometry, chrome) land on the
same ~22 swimlane fixtures; `diff-baseline.json` records only how wrong each
fixture is and `style-baseline.json` only per-attribute histograms. Neither
says how many dividers were drawn or where a title sat, so T5's placement
and T6's chrome would be individually unattributable.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Pin the pre-change swimlane census | orchestrator | `oracle/goldens/svg-activity/swimlane-baseline.json`, `tests/oracle/svg-conformance/activity.swimlane-baseline.test.ts`, `.agent-notes/asr-T0.md` | — | [x] |

**Orchestrator-executed.** `scripts/repin-sequence-baselines.ts:3-8`
reserves baseline JSON writes to the orchestrator: *"Task agents never write
a baseline JSON."*
