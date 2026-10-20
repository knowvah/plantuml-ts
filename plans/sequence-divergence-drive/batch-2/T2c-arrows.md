# T2c — messages: normal, self, exo, dotted

Agent: `typescript-pro`, worktree `sdd1-T2c`. Commit:
`fix(sequence): stroke messages from the merged arrow style`.
**Read [family-contract.md](family-contract.md) first — it is part of this
prompt.**

## The family
Every message arrow: shaft, head, self-arrow, exo arrows, and the dotted
(`-->`) dash. Planning measurement: message `<line>` dash `5,5` where the jar
draws `2,2` (439 elements, 190 fixtures) — `ArrowConfiguration.java:241-263`
(`new UStroke(2, 2, thickness)` for dotted), thickness from
`style.getStroke()` (`:245`). The arrow's style is merged in the message
constructor (`AbstractMessage.java:68-80`, signature `root, element,
sequenceDiagram, arrow`). Arrow colour from `[#color]` and `skinparam
sequenceArrowColor` must keep working through the Style path
(`sequence-arrow-color.ts` today).

Java: `sequencediagram/AbstractMessage.java:60-100`;
`skin/ArrowConfiguration.java` (whole); `skin/rose/AbstractComponentRoseArrow
.java`, `ComponentRoseArrow.java`, `ComponentRoseSelfArrow.java`;
`skin/rose/Rose.java` (arrow creation).

## Write-set
`src/diagrams/sequence/{renderer-message,renderer-arrowhead,renderer-
arrowhead-glyph,sequence-layout-message,sequence-layout-exo}.ts`, every
`src/diagrams/sequence/sequence-arrow-*.ts`, their tests under
`tests/unit/sequence/`.

## Read-set
`family-contract.md`; `decisions.md#d1`, `#d2`, `#d5`; the write-set files;
`geo-message.ts:1-85`; `sequence-skin-param.ts` (`messageStyle`, `paintOf`).

## Acceptance
- Given `A --> B`, when rendered, then the shaft dash is `2,2` and the
  thickness is the merged arrow style's (unit test cites
  `ArrowConfiguration.java:24x`).
- Given `A -[#red]> B` and `skinparam sequenceArrowThickness 2`, then both
  arrive through the Style path with the jar's output.
- Given a self message and an exo message, then they stroke from the same
  merged style.
- Given the message rows at b1b, then no row rises without a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A — no new
observable operations. Rollback: Reversible.
