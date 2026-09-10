# Batch 2 — delete the floor

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Replace `ACTION_MIN_WIDTH` with `activityMinimumWidth`; diagnose the two risers | typescript-pro | `src/diagrams/activity/tiles/gtile-action.ts`, `tests/unit/activity/activity-box-derivation.test.ts`, `tests/unit/activity/tile-sizing.test.ts`, and only where an assertion pins the 120 floor: `tests/diagrams/activity/tiles/*.test.ts`, `tests/diagrams/activity/layout/*.test.ts` | T1 | [x] |

**Stop condition 7 applies here.** The orchestrator measured the floor's
removal alone: 48291 → 47638, 207 fall, and `simuti-16-lece058` (217 → 228)
and `xenofo-81-rame803` (157 → 167) RISE with their `svg/g[][childCount]`
term growing (138 → 152, 68 → 82). A width change cannot move an element
count without a structural cause. The mechanism must be in the journal
before the commit; if it is a real fork/split tile defect, it is filed as
its own mission and T2 lands with the rise adopted, not fixed here.
