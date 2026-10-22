# T7e — skinparam deprecation banner

Agent: `typescript-pro` (sonnet), worktree `sdd2-T7e`. Commit:
`feat(sequence): draw skinparam deprecation warnings`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (research D cluster D)
The jar collects deprecation warnings (`command/CommandSkinParam.java:
92-99`) and draws a banner (`<rect fill=#FFC>` + text, e.g. "Please use
CSS style instead of skinparam ParticipantPadding"):
`TitledDiagram.java:321-334`, `core/DiagramChromeFactory.java:128,
176-200`. Activity has it (`diagrams/activity/activity-warnings.ts`:
`withSkinParamWarnings`, `withWarningBanner`); salt uses
`core/annotations/WarningBannerBlock.ts:143`. Lift activity's helpers to a
new core module (activity re-imports them; byte-identical), then wire
sequence. `render-fixture-sequence.ts` mirrors `index.ts` chrome — change
both (memory `conformance-harness-mirrors-index-ts`).

## Targets
lokavu, zogane, lugika, kumovo, gabisi, baxuxa, vekami (+ zajova with
T6c).

## Write-set
New `src/core/skinparam-warnings.ts`, `src/diagrams/activity/activity-
warnings.ts`, `src/diagrams/sequence/index.ts`,
`tests/oracle/svg-conformance/render-fixture-sequence.ts`, tests.

## Read-set
`research/research-d-structure.md` D; `activity-warnings.ts` (whole);
`sequence/index.ts`; `render-fixture-sequence.ts`; the Java above.

## Acceptance
- Given `skinparam ParticipantPadding 10`, then the jar's banner is drawn
  (test).
- Given activity's pins, then none changes after the lift.
- Given the targets, then structural sites are gone.

## Added at T5b hand-back (journal row 73)
W1 rows confirmed by probe: baxuxa, vekami, gabisi (+ lokavu, lugika with the divider fix); kumovo, zajova, zogane fall. Origin `src/diagrams/sequence/index.ts:36-48`, harness `render-fixture-sequence.ts:118`.

## Added at T5h hand-back (journal row 88)
A top/bottom note after a `ref` makes the jar print a warning banner `This position is ignored: BOTTOM` (`Reference.java:166-171` returns a Warning; canvas +20). The ignored note is currently known only inside `notesOnMessages` (`sequence-note-folding.ts`); give warnings a home the banner can read.
