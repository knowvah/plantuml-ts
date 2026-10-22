# T1a — note command gaps

Agent: `typescript-pro` (sonnet), worktree `sdd2-T1a`. Commit:
`fix(sequence): url group on note commands, notes after exo arrows`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research D §2 error rows, cluster G1, cluster U)
1. **URL group.** The note regexes lack upstream's optional URL group:
   `command/note/sequence/FactorySequenceNoteOnArrowCommand.java:86`
   (`UrlBuilder.OPTIONAL`), `FactorySequenceNoteCommand.java:89,106,
   244-246`. `note left [[url]]` and `note left of A [[url]]` are refused
   today. Mirror the regex and the url's effect on the drawn note (an `<a>`
   wrap — compare the golden).
2. **Note after an exo arrow** is silently dropped: `MessageExo` is an
   `EventWithNote` (`AbstractMessage.java:58`; `teoz/TileBuilder.java:
   122-134`), but `command-exo-arrow.ts:439-448` never calls
   `setLastEventWithNoteSpan`, so `command-note-factory.ts:271-279`
   returns `[]`.

## Targets
ladiro-50 (would pin), dolice-60, nidozi-08 (render; residual is
geometry), pucini (note-header url drawn as literal text), nunuji, recani
(note drawn).

## Write-set
`src/diagrams/sequence/command-note-factory.ts`, `command-exo-arrow.ts`,
their tests under `tests/unit/sequence/`.

## Read-set
`research/research-d-structure.md` (rows dolice/ladiro/nidozi, G1, U);
`command-note-factory.ts:1-120,240-300`; `command-exo-arrow.ts:420-451`;
the Java above.

## Acceptance
- Given `note left of Alice [[http://x]]` with a body, when parsed, then a
  note event with url `http://x` exists and ladiro renders zero-diff.
- Given `[-> A : hi` then `note right : n`, when rendered, then the note is
  drawn (nunuji, recani structural sites for the note gone).
- Given dolice and nidozi, then they no longer error; residual diffs are
  listed with their family.
