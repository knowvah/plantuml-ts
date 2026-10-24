# T1e — `skinparam sequenceParticipant underline` underlines the head

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1e`. Commit:
`feat(sequence): underline participant displays on sequenceParticipant`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `participant-underline-unported`; Java re-read)
`SkinParam.forceSequenceParticipantUnderlined()` is `valueIs
("sequenceParticipant", "underline")` (`SkinParam.java:991-993`). Both
`LivingSpace#drawHeadOrTail` (`teoz/LivingSpace.java:198`) and
`#getHeadPreferredDimension` (`:219`) pass it as `p.getDisplay(underlined)`,
which is `display.underlined()` when true (`Participant.java:125-126`);
`Display#underlined` prefixes every line with `<u>` (`Display.java:462-469`).
`MutingLine` (`teoz/MutingLine.java:107-108`) builds the lifeline's title
from the same call. Ours: `sequence-layout-lifeline.ts:73-74` records
"unported (for the head too)"; `headRowsOf` (`sequence-layout-participant-
label.ts:119-129`) splits `p.display` with no underline step.
`valueIs` already exists on the skin param (`sequence-skin-param.ts:99-103`),
so `sequence-skin-param.ts` (493 lines) is NOT edited and no split is needed
(the brief's anticipated new key is unnecessary). Mirror the precedent
`stereotypeBottom`: a participant field set at parse time
(`sequence-parse-helpers.ts:174-176`, `valueIs('stereotypePosition',
'bottom')`), or — if the Java's draw-time read differs observably from the
declaration-time read for a skinparam written after the participant — a
parse-end pass; decide from the fixture and say which.

## Targets
jeviru-31-gasi159 to 0 (6 units).

## Write-set
`src/diagrams/sequence/ast.ts` (Participant field), `sequence-parse-helpers.ts`,
`sequence-layout-participants.ts` (`headRowsOf` call `:135,313`),
`sequence-layout-participant-label.ts` (`headRowsOf` `:119`, call `:325`),
`sequence-layout-lifeline.ts` (`lifelineTitle`) and their tests. T1c writes
`sequence-participant-declaration.ts`/`command-participant.ts` and T1f
`sequence-creole-sheet.ts`: none of those here. `geo-participant.ts` only if
`ParticipantGeo` must carry the flag (add, report it).

## Read-set
`sequence-layout-participant-label.ts:100-130,318-335`;
`sequence-layout-participants.ts:125-145,305-320`; `sequence-layout-lifeline.ts:
60-85`; `sequence-parse-helpers.ts:165-180`; `ast.ts:50-65`; Java:
`Participant.java:120-135`, `Display.java:462-470`, `LivingSpace.java:192-222`,
`MutingLine.java:100-112`.

## Acceptance
- Given `skinparam sequenceParticipant underline`, when a head is sized and
  drawn, then every display line carries `<u>` (unit test citing
  `Display.java:462-469`); without the skinparam nothing changes.
- Given jeviru, then it diffs to 0, including the lifeline `title` text.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
