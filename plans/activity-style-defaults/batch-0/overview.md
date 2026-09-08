# Batch 0 — pin the floor

One task. **Nothing may change source until this lands** ([D6] makes two
independent geometric moves land in one mission; without an attributable
pin neither is measurable on its own).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Pin the pre-change activity style census | orchestrator | `oracle/goldens/svg-activity/style-baseline.json`, `tests/oracle/svg-conformance/activity.style-baseline.test.ts`, `.agent-notes/asd-T0.md` | — | [x] |

**Orchestrator-executed.** `scripts/repin-sequence-baselines.ts:3-8`
reserves baseline JSON writes to the orchestrator: *"Task agents never
write a baseline JSON."*

`diff-baseline.json` records `weightedScore` and `diffCount` only —
neither says WHICH attribute moved. Two sequenced changes (font size, line
height) against that pin alone would be individually unattributable, which
is the exact failure `activity-element-granularity` T0 was created to
prevent.
