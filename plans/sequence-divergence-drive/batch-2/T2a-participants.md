# T2a — participant heads/tails and the actor-family symbols

Agent: `typescript-pro`, worktree `sdd1-T2a`. Commit:
`fix(sequence): paint participants from the merged style`.
**Read [family-contract.md](family-contract.md) first — it is part of this
prompt.**

## The family
Head and tail boxes of every participant kind, and the symbols drawn for
`actor` / `boundary` / `control` / `entity` / `queue` / `database` /
`collections`. Planning measurement (`measurements/plan-classify.json`): the
participant `<rect>` misses `rx="2.5" ry="2.5"` and `stroke-width:0.5` in
~1090 fixtures — `participant { RoundCorner 5 }` (`plantuml.skin:193-195`),
`element { LineThickness 0.5 }` (`:91-93`); `Padding 7` and the grey-blue
fill (`:197-201`) are already honoured through `theme.sequence
.participantPadding` / `theme.colors.participantBackground` and move to the
Style path here.

Java: `sequencediagram/Participant.java:82-96` (signature, stereotype,
`stereo` style), `ParticipantType.java:54-82`, `skin/rose/Rose.java`
(`createComponent` for the head/tail types),
`ComponentRoseParticipant.java` (whole), `ComponentRoseActor.java`,
`ComponentRoseBoundary.java`, `ComponentRoseControl.java`,
`ComponentRoseEntity.java`, `ComponentRoseQueue.java`,
`ComponentRoseDatabase.java`, and `klimt/drawing/svg/SvgGraphics.java`
(rect `rx`/`ry` emission).

## Write-set
`src/diagrams/sequence/{renderer-participant-shapes,renderer-participant-
symbol,sequence-layout-participant-sizing,sequence-layout-participant-label,
sequence-layout-participants}.ts`, their tests under `tests/unit/sequence/`.

## Read-set
`family-contract.md`; `decisions.md#d1`, `#d2`, `#d5`; the five write-set
files (whole); `sequence-skin-param.ts` (`participantStyle`, `paintOf`);
`geo-participant.ts`; `src/core/theme-sequence-fields.ts:1-60`;
`.agent-notes/sequence-participant-background.md` (root-override finding).

## Acceptance
- Given `dulaca-47-neta380`, when classified, then zero diffs remain on its
  two participant `<rect>`s (`rx`, `ry`, `stroke-width`).
- Given `skinparam participantBorderThickness 2` / `participantRoundCorner
  0` / `participantBackgroundColor<<X>>`, then each arrives through the
  Style path with the jar's value (unit tests, each citing the
  `FromSkinparamToStyle.java` row).
- Given an `actor`, then the stickman's stroke and thickness come from the
  `actor` signature (`ParticipantType.java`), incl. `ActorBorderColor`.
- Given the participant rows at b1b, then no row rises without a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no new
observable operations. Rollback: Reversible.
