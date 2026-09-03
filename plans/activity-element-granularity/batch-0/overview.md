# Batch 0 — pin the floor

One task. **Nothing may change source until this lands** ([D6]).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Pin the pre-swap element census | orchestrator | `oracle/goldens/svg-activity/element-baseline.json`, `.agent-notes/aeg-T0.md` | — | [x] |

**Orchestrator-executed.** `scripts/repin-sequence-baselines.ts:3-8` reserves
baseline JSON writes to the orchestrator: *"Task agents never write a
baseline JSON."*

The existing `diff-baseline.json` records `weightedScore` and `diffCount`
only — neither says WHICH element moved. Three sequenced swaps against that
pin alone would be individually unattributable.
