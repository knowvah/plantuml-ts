# T2 — Emit `<ellipse>` where the jar does

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-element-granularity`. A faithful TypeScript port of PlantUML;
the Java at `~/git/plantuml` is the spec. T1 has landed.

The jar draws activity's start / end / kill nodes as
`<ellipse cx cy rx ry>`; we draw `<circle cx cy r>` — 488 v 518 across the
corpus. Verified on `numalo-91-pole243`, whose jar output opens
`<ellipse cx="29" cy="25" rx="10" ry="10" …/>` where ours is
`<circle cx="26" cy="22" r="10" …/>`.

## Task
Change the five `circle(...)` call sites in
`src/diagrams/activity/activity-renderer-shapes.ts` (`:74`, `:84`, `:85`,
`:101`, and any sibling) to call `ellipse(cx, cy, r, r, …)`.

**`src/core/svg-shapes.ts` is NOT in your write-set, and this is the point of
the task.** Its `circle()` doc comment (`:269-278`) explicitly defends the
distinction: *"twelve call sites across the activity, sequence and json
engines already emit a real `<circle>`, and rewriting them as an equal-radii
`<ellipse>` would change the emitted element for no benefit."* That reasoning
holds for sequence and json — this mission has evidence it does **not** hold
for activity, where the jar demonstrably emits `<ellipse>`. Change activity's
call sites; leave the primitive and every other engine alone ([D2]).

Check `ellipse()`'s signature at `src/core/svg-shapes.ts:238` before calling
it — its styling parameter differs from `circle()`'s, and the two are not
drop-in interchangeable. Preserve fill, stroke and stroke-width exactly.

## Write-set
- `src/diagrams/activity/activity-renderer-shapes.ts`
- `tests/unit/activity/renderer.test.ts`, or a new
  `tests/unit/activity/renderer-shapes.test.ts` if you add one. **No test
  file currently references `activity-renderer-shapes.ts` by name** — the
  five call sites are covered only indirectly, through the conformance
  corpus. Adding direct coverage is in scope for this task.

**Not** `src/core/svg-shapes.ts`. **Not** `renderer.ts` (T1/T3).

## Read-set
- `plans/activity-element-granularity/decisions.md` — D2
- `src/diagrams/activity/activity-renderer-shapes.ts:70-110` — the call sites
- `src/core/svg-shapes.ts:238-300` — `ellipse()` and `circle()`, both signatures
- `test-results/dot-cache/activity/numalo-91-pole243/in.svg` — the jar's shape

## Architecture decisions
[D2] activity call sites only; the shared primitive and other engines do not
move.

## Interface contracts
None consumed downstream.

## Acceptance criteria
- Given a start, end or kill node, when rendered, then an `<ellipse>` with
  `rx == ry` is emitted and **zero** `<circle>`.
- Given fill, stroke and stroke-width on each node, then each is preserved
  byte-for-byte against the pre-change output.
- Given `src/core/svg-shapes.ts`, then `git diff` shows it **unchanged** —
  assert this explicitly, do not assume it.
- Given the sequence and json conformance suites, then neither moves. Name
  the suites you ran to prove it.
- Given the ratchet, then no fixture's `weightedScore` rises.

## Observability
N/A — no new observable operations.

## Rollback
**Reversible.** Five call sites in one file.

## Quality bar
All four gates green, `Test Files` **683**. Complexity hook enforced.

## Commit
`feat(aeg-T2): draw activity terminal nodes as ellipses`

Body: why the shared `circle()` primitive is deliberately untouched, and
which other engines were proven not to move.
