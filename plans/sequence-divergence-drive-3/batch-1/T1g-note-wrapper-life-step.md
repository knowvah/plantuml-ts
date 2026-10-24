# T1g — a message's own `--` step sits below its note-right wrapper

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1g`. Commit:
`fix(sequence): record own life steps below the note wrapper`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `note-wrapper-life-step`; Java re-read)
A message's own `++`/`--`/`!!` are `LifeEventTile`s chained right after the
message tile (`teoz/LifeEventTile.java:64-71` `onGaugeResolved` ->
`livingSpace.addStepForLivebox(event, gauge.min)`; gauge built at `:95`).
When a `note right` wraps the message, `CommunicationTileNoteRight` exposes
`new YGauge(inner.min, inner.min.addAtLeast(getPreferredHeight()), ...)`
(`teoz/CommunicationTileNoteRight.java:96-99`) with `getPreferredHeight =
max(tile, note)` (`:144-148`), so the own life event's y is the WRAPPER's max.
`LiveBoxes#addStep` nudges a deactivate that lands on an occupied y by `+5`
(`teoz/LiveBoxes.java:79-86`). Ours records those steps at the BARE message
max: `recordMessageStep(ctx, event, arrow, cursor.y)` is called from
`sequence-layout-message.ts:468` before the notes are laid out, and
`settle` uses `pending.tileMax` (`sequence-layout-activation.ts:268-271`).
The wrapped max (`outer.max`) exists only after `layoutNotesOnMessage` in
`placeContactTile` (`sequence-layout-events.ts:345-366`). Fix: after the
wrappers, update the walk's pending own-event `tileMax` to the wrapped
chain's max (a small exported setter in `sequence-layout-activation.ts`),
called from `placeContactTile`. `sequence-live-boxes.ts` (the file the task
text named) is the `+5` consumer and stays read-only.
`sequence-layout-events.ts` is 499 lines: a pure-move split of an unrelated
helper is allowed (journal it); do not add logic to it beyond the call.

## Targets
TeozTimelineIssues_0002_Test, bexoce-95-vibe195, mapeji-83-sebu002 to 0
(1 unit each; slug confirmed in the TSV and `tests/corpus/sequence/`).

## Write-set
`src/diagrams/sequence/sequence-layout-activation.ts`,
`sequence-layout-events.ts` and their tests.

## Read-set
`sequence-layout-activation.ts:55-70,215-282`; `sequence-layout-events.ts:
335-366,395-420`; `sequence-layout-message.ts:455-475` (read-only);
`sequence-live-boxes.ts:125-140` (read-only); Java: `LifeEventTile.java:60-100`,
`CommunicationTileNoteRight.java:90-100,140-150`, `LiveBoxes.java:75-90`.

## Acceptance
- Given `A -> B ++--` style own steps under a `note right` taller than the
  message, when laid out, then the own step y equals the wrapper's max and
  the `+5` nudge fires only when `eventsStep` already holds that y (unit test
  citing `LiveBoxes.java:79-86`, `CommunicationTileNoteRight.java:96-99`).
- Given the three targets, then each diffs to 0; messages with no note wrapper
  record exactly where they did.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
