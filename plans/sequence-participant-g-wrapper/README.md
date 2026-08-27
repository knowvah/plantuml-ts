# Mission: sequence-participant-g-wrapper

**Branch**: `feat/sequence-participant-g-wrapper` (merge commit to `main`,
never squash — the decision journal references per-task commit IDs).

## Objective

Make the sequence comparator able to measure arrow fidelity at all.

Today it cannot. `compareSvg` aligns children **by index** and charges a
short-circuit at the first tag mismatch (`compare.ts:222-231`,
`// structural mismatch — stop here`). Under the root `<g>` the jar's first
child is `<g><title>A</title>…</g>` and ours is a bare `<line>`, so index 0
mismatches by tag; and because the port's draw order also diverges, every
later sibling index is misaligned too. The consequence measured by
`sequence-command-coverage` T15: **no arrow attribute is ever compared** —
correct arrow work moves `weightedScore` not at all, and neither does
incorrect arrow work.

This mission re-mirrors the child sequence under the root `<g>` so index
alignment holds. It is a **structural** repair, not an arrow-quality one: no
arrow geometry changes here. Falling scores are the instrument, not the goal.

### Scope — three divergences, all in `src/diagrams/sequence/renderer.ts`

Upstream draw order is `PlayingSpaceWithParticipants#drawU`
(`teoz/PlayingSpaceWithParticipants.java:196-228`):

| # | Upstream | Line | Port today |
|---|---|---|---|
| 1 | `playingSpace.drawBackground(ugBody)` | :218 | ✅ step 0, box backgrounds |
| 2 | `livingSpaces.drawLifeLines(ugBody, …)` | :221 | ⚠️ lifelines only — **activations are missing from this pass** and no `<g>` wrapper |
| 3 | `livingSpaces.drawHeads(ug, BOTTOM)` | :223 | ✅ step 2 |
| 4 | footbox `drawHeads(…, TOP)` | :224-225 | ❌ port draws it **last**, after the tiles |
| 5 | `playingSpace.drawForeground(ugBody)` | :227 | ⚠️ port's step 3 interleaves activations into this pass |

Verified against the jar golden for `celego-19-laji937`
(`test-results/dot-cache/sequence/celego-19-laji937/in.svg`), whose root-`<g>`
children are, in order: lifeline `<g>` A, lifeline `<g>` B, activation `<g>`,
head A rect+text, head B rect+text, tail A rect+text, tail B rect+text, then
the two messages.

**Out of scope**: arrow geometry, participant head/tail geometry, root
dimensions, and the `<g class="participant …">` head/tail wrappers of
`Participant#groupTypeHead`/`groupTypeTail`. Those two are reached only from
`sequencediagram/graphic/ParticipantBox.java:132,145` — the **dead** `graphic/`
package — and the golden confirms the jar emits head and tail boxes unwrapped.
See D3.

## Start here

1. Read this file.
2. Read [`decisions.md`](./decisions.md) — every decision there is locked.
3. Read [`prior-observations.md`](./prior-observations.md) — findings from
   earlier missions that bear on this write-set.
4. Read [`decision-journal.md`](./decision-journal.md) — it may carry entries
   from earlier in the session, before compaction.
5. Find the first unchecked batch below; read its `overview.md`.
6. Announce the batch and its tasks, then begin.

**After every compaction: re-read every file from disk.** The brief on disk is
the source of truth, never the compacted summary.

## Batches

| # | Batch | Tasks | Parallel | Done |
|---|---|---|---|---|
| 1 | [Re-mirror the child sequence](./batch-1/overview.md) | T1–T3 | sequential — one writer on `renderer.ts` | [ ] |
| 2 | [Adjudicate, re-pin, close out](./batch-2/overview.md) | T4–T5 | sequential | [ ] |

Batch 1 is **strictly sequential**: all three tasks write
`src/diagrams/sequence/renderer.ts`, so they are one write-set and cannot be
parallelised (`rules/parallelism.md` — collapse, do not collide).

## Baseline at mission start

`oracle/goldens/svg-sequence/diff-baseline.json`, measured 2026-08-25 against
`e9c44c11`:

- 1141 entries — **1124 numeric**, 17 `status: "error"`
- **Σ weightedScore = 1 291 577**
- 0 fixtures pinned in `ratchet.json` (zero are byte-exact)

`weightedScore` is monotone in alignment (D5 of `sequence-root-chrome`), so a
**rise is a regression with no benign reading**. `diffCount` may rise beside a
fallen `weightedScore` — that is the expected artefact of a subtree that used
to cost 1 as an unexamined short-circuit now being compared for real.

## Quality gates

Run all four at every batch close. All must be green before the batch is
marked done.

```
- command: npm test           # vitest + 90/90/90 coverage; includes the
  pass: exit 0                # sequence diff-baseline ratchet
  on_fail: fix_and_rerun
- command: npm run typecheck  # both tsconfigs
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only <batch-base>
  pass: output matches the declared write-set only
  on_fail: stop
```

## Stop conditions

Halt and wait for human input if any of these occur:

1. **Σ weightedScore rises** after any task, and the rise is not explained by
   a mechanism traced to a `file:line` in the jar. A rise means the change
   made alignment worse.
2. A task needs to change **arrow, head or tail geometry** to make a score
   fall. That is fitting, and it is forbidden — record the observation and
   stop.
3. The upstream method body contradicts a decision in `decisions.md`. Amend
   the decision in the journal; do not silently override it.
4. Two consecutive quality-gate failures on the same check.

## Push forward with judgment

- Naming, helper extraction, and comment wording inside the write-set.
- A fixture whose score does not move: record it, do not chase it. Not every
  fixture has an activation or a footbox.
