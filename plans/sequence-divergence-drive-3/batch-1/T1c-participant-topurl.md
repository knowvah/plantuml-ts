# T1c — a participant `[[url]]` is prefixed with `skinparam topurl`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1c`. Commit:
`fix(sequence): apply topurl to participant declaration urls`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `participant-topurl-ignored`; Java re-read)
`CommandParticipant.executeArg` builds the url with
`new UrlBuilder(diagram.getSkinParam().getValue("topurl"), UrlMode.STRICT)`
(`sequencediagram/command/CommandParticipant.java:187-192`; sdd2 cited
`:189-190`), so a relative `[[/search]]` becomes `topurl + "/search"`.
Ours: `participantUrlOf` builds `new UrlBuilder(null, UrlMode.STRICT)`
(`sequence-participant-declaration.ts:235-239`) and
`parseParticipantDeclaration(rest)` takes no parse state
(`:216-224`), so the skinparam is unreachable. Thread the value in: both
callers hold `state` (`command-participant.ts:43,180`). Read it with
`state.style.params.getValue('topurl')` at the command's own line — the
legacy `getValue` caches its first answer per diagram (memory:
`sequence-skinparam-getvalue-cache`), exactly as upstream's read at that
line does. `command-misc.ts:328` (`CommandUrl`) calls `participantUrlOf` too
and is NOT in this write-set: keep `participantUrlOf`'s `topurl` parameter
optional so that caller is byte-unchanged (check `CommandUrl.java` for
whether it also passes `topurl`; if it does, report it, do not edit).

## Targets
modamu-43-juci519, mugidu-43-jizu986, xepoda-56-xema668, libipu-23-femo315
to 0 (8, 8, 8, 4 units).

## Write-set
`src/diagrams/sequence/sequence-participant-declaration.ts`,
`command-participant.ts` and their tests.

## Read-set
`sequence-participant-declaration.ts:210-240`; `command-participant.ts:25-60,
165-198`; `sequence-skin-param.ts:95-115` (`getValue`); `core/url/UrlBuilder.ts`
(the `topurl` constructor argument, `UrlBuilder.java:140-146`); Java:
`CommandParticipant.java:180-195`.

## Acceptance
- Given `skinparam topurl http://x` and `participant A [[/search]]`, when
  parsed, then `ParticipantUrl.url` is `http://x/search`; with no `topurl`
  the url is unchanged (unit test citing `:187-192`).
- Given the four targets, then each diffs to 0.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
