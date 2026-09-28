## Observation: freestanding-note-alias qualification requires a companion fix outside class-notes.ts

- **Context**: cdd5-T3c (batch-3/T3c-note-target-qualification.md), fixing
  `free-note-alias-not-quark-qualified` (pojeje-60-vata579,
  rexupa-61-nezi165, tamovu-79-fifo533, ticemi-41-laze086) by making
  `class-notes.ts#addFreestandingNote` resolve a freestanding note's alias
  via `class-namespace-resolve.ts#resolveReference` (mirroring upstream
  `CommandFactoryNote.java:192-197`'s `quarkInContext(false, cleanId(idShort))`),
  exactly as the task spec and S3-structure.md's diagnosis prescribed.
- **Finding**: Qualifying the note's OWN `id` this way is correct per the
  Java, but this port's relationship-endpoint resolver
  (`class-command-relationships.ts`, also `class-assoc-couple.ts`) matches a
  bare reference against a note by RAW STRING equality
  (`class-notes.ts#isNoteId`), not through `resolveReference`. Changing only
  the note's creation-side id desyncs the two: a same-scope reference right
  after the note (e.g. `note as N4` ... `N4 .> DrawableAdapter`, both inside
  the same package) no longer finds the note by its now-qualified id, so the
  relationship endpoint resolver falls through and auto-creates a phantom
  CLASSIFIER named `N4` instead. That phantom classifier consumes a
  `creationCounter` tick, which cascades into every later entity's uid.
  Measured: reverting ONLY the id-qualification (keeping the `addNote`
  target-qualification fix and the `note-freestanding.ts` group-endpoint
  fix) took the ratchet from 8 failing rows to 0/832 passing. All 8
  regressed rows had multiple freestanding notes with SAFE (non-colliding)
  bare aliases referenced by same-scope relationships — the common case, not
  an edge case.
- **Impact**: Closing `free-note-alias-not-quark-qualified` needs a
  companion change so a bare relationship-endpoint reference ALSO resolves
  via `resolveReference` (with `reuseExistingChild: true`) BEFORE the
  `isNoteId` check decides it isn't a note — i.e. `isNoteId` (or its call
  sites) must check membership against the RESOLVED id, not the raw
  endpoint string. This touches `class-command-relationships.ts` and
  `class-assoc-couple.ts`, both outside this task's write-set
  (`class-namespace-resolve.ts`, `class-notes.ts`, `note-freestanding.ts`).
  A future task closing these 4 rows must include those two files in its
  write-set, or it will reproduce the same regression.
- **Confidence**: High (isolated by reverting one change and re-running the
  full ratchet: 8 failures -> 0).
