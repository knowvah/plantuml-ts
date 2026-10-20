# T2f — lifeline, destroy cross, activation stereotype

Agent: `typescript-pro`, worktree `sdd1-T2f`. Added 2026-10-20 from T2b's
stop 1 (journal row 31). Commits (one per item, so the journal can cite
each): `fix(sequence): paint lifelines from the merged style`,
`feat(sequence): draw the destroy cross`,
`fix(sequence): merge the participant stereotype into activations`.
**Read [family-contract.md](family-contract.md) first — it is part of this
prompt.**

## Why
The lifeline `<line>` misses `stroke-width:0.5` in 1122 of 1143 fixtures
(`element { LineThickness 0.5 }`, `plantuml.skin:91-93`, merged into
`lifeLine { LineStyle 5 }`, `:141-143`). Until it lands almost no fixture can
reach zero-diff, so pin round 1 waits for this task. T2b migrated
activations and dividers but could not reach the lifeline: its segments are
built outside T2b's write-set.

## T2b's findings (verify each against the Java before relying on it)
1. **Lifeline.** `LifelineSegment`s are built in `layout.ts#assembleGeometry`
   and `sequence-delay.ts#lifelineSegmentsByParticipant`, with a fallback at
   `renderer.ts:~464`. Upstream: `MutingLine.java:69,105-106` merges
   `PARTICIPANT_LINE` (or `DELAY_LINE` for a delay segment) with the
   participant's stereotype, from the builder current at the END of the
   parse. Jar probe: `skinparam sequenceLifeLineBorderColor` and
   `<style> lifeLine { LineThickness 2 }` both reach the lifeline. Needs: an
   end-of-parse builder reachable from layout (T1b already runs every
   remaining declaration after the last line and gives `BoxGroup` that
   builder), a `Stereotype` per participant, segments that always exist and
   carry `paint`, and `renderer-lifeline.ts` reading `seg.paint` (scaled by
   `scaleK` at emission). Delete the `theme.colors.lifeline` reads you
   replace; journal-report the field if it is left with no reader.
2. **Destroy cross.** The port draws none; the jar draws one in 17 fixtures.
   Proposed: a new `DestroyGeo { kind, participantId, x, y, paint }` with
   `x = lifelineX − 9 + level offset`, `y = step − 9`, built in
   `sequence-layout-events.ts#handleDeactivateEvent` and from the message
   `!` spec (`sequence-layout-message.ts`); paint `componentStyle(
   endOfParseBuilder, 'DESTROY')` with no stereotype
   (`LiveBoxesDrawer.java:78-81`); drawn by `renderer-lifeline.ts` after
   that participant's bars (`LiveBoxes.java:375-385`) as two lines
   (`ComponentRoseDestroy.java:61-66`); jar probe `#A80036`, width 2. It
   needs the geo types, `scale-geo.ts`, `sequence-page.ts` (pagination) and
   the routing in `renderer.ts`. Check the element order against a golden
   `in.svg` from the 17 fixtures. `SequenceComponentType` in
   `sequence-skin-param.ts` has only `'ACTIVATION_BOX'`: adding `'DESTROY'`
   (and the lifeline types if you resolve through it) is yours, citing
   `ComponentType.java:78-105`.
3. **Activation stereotype.** `LiveBoxesDrawer.java:140`
   (`withTOBECHANGED(stereotype)`) merges the participant's stereotype into
   the activation style; the layout walk has no AST participants, so
   `layout.ts#runEventLayout` must pass them.

## Write-set
`src/diagrams/sequence/{renderer-lifeline,layout,sequence-delay,
sequence-layout-events,sequence-layout-activation,sequence-layout-message,
sequence-page,scale-geo,geo,geo-annotation,geo-message,ast,parser,
sequence-skin-param}.ts`; `renderer.ts` ONLY for the lifeline fallback and
the destroy routing; their tests under `tests/unit/sequence/`. New helper
files forced by the 500-line hook are yours (list them).

**Not yours (T2a is running in parallel):** `renderer-participant-shapes.ts`,
`renderer-participant-symbol.ts`, `sequence-layout-participant-sizing.ts`,
`sequence-layout-participant-label.ts`, `sequence-layout-participants.ts`.
Needing one is stop 1: report, do not edit.

## Acceptance
- Given `kugete-25-poba470`, when classified, its lifeline `stroke-width`
  diff is gone; across the corpus the lifeline `@stroke-width` key count
  falls by roughly the 1122-fixture planning figure (report the number).
- Given `skinparam sequenceLifeLineBorderColor red` and `<style> lifeLine {
  LineThickness 2 }` placed AFTER the last message, both still reach every
  lifeline (end-of-parse builder; jar-verified).
- Given a `destroy`, the cross is `#A80036`, width 2, positioned and ordered
  as the jar draws it in at least two of the 17 fixtures (name them).
- Given a stereotyped participant with a `<style>` on that stereotype's
  `activationBox`, the activation picks it up (jar-verified).
- Every riser vs the current branch tip is listed with its mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no
new observable operations. Rollback: Reversible.
