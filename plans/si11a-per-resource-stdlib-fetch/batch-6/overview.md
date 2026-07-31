# Batch 6 — Close the mission

One task. T1–T8 are done; this records what happened where a future reader will
actually look.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T9 | Flip SI11a to done; register SI11b; write the mission summary | typescript-pro | `planning/mission-index.md`, `plans/si11a-per-resource-stdlib-fetch/README.md` | T8 | [ ] |

## Batch exit criteria

- `planning/mission-index.md` § SI11a reads `done`, names what shipped, and
  carries T8's measured numbers
- **SI11b exists as its own tracked row** with its dependency on SI11a's
  manifest shape recorded — not a sentence buried in SI11a's prose
- The brief's README carries a mission summary: tasks completed, decisions
  flagged for review, gate results, known issues, deviations
- All four gates still exit 0 — documentation changes should move nothing

## The SI11 row needs replacing, not just flipping

`planning/mission-index.md` currently carries a single **SI11** row written
before the split. T9 must replace it with SI11a (done) and SI11b (todo), and say
plainly that the original SI11 was split on 2026-07-31 — so a reader who
remembers "SI11" can find both halves.

## Never retro-edit a dated measurement

SI9's ADR-4 established it and SI8 followed it: a dated number in
`mission-index.md` was true when taken. Correct framing **in place with the
correction labelled**; never silently overwrite history.
