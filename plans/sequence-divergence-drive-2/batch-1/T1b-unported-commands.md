# T1b — unported commands

Agent: `typescript-pro` (sonnet), worktree `sdd2-T1b`. Commit:
`feat(sequence): port activate2, url and hide-stereotype-gender commands`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanisms (research D §2)
1. **`CommandActivate2`**: `IT++`, `IT1--` —
   `sequencediagram/command/CommandActivate2.java:58-66` (regex), `:91-100`
   (execute); registered `SequenceDiagramFactory.java:128` (order matters:
   register at the matching position). Reuse the activate/deactivate path
   in `command-lifeline.ts`.
2. **`CommandUrl`**: `url of APP is [[…]]` —
   `sequencediagram/command/CommandUrl.java:60-70,93`; registered
   `SequenceDiagramFactory.java:154`. `command-misc.ts:14-15` records it as
   unported. Sets the participant url; the head must then be wrapped in an
   `<a>` exactly as a participant declared with `[[url]]` already is (find
   that path in `renderer-participant-symbol.ts` and reuse it).
3. **`hide <<g>> stereotype`**: `classdiagram/command/CommandHideShowByGender
   .java:72-83` (GENDER, show/hide, portions), `:163-166` (sequence ignores
   the gender and hides the portion); via `CommonCommands.java:106-109`.
   `command-common.ts:82-87` matches only `/^hide\s+stereotype\s*$/`.

## Targets
jiliba-03 (render, 2 diffs expected), junide-55, vubato-50 (render; head
`<a>`), tegasu-93 (render, 4 diffs expected).

## Write-set
`src/diagrams/sequence/command-lifeline.ts`, `command-misc.ts`,
`command-common.ts`, `sequence-command-registry.ts`,
`renderer-participant-symbol.ts`, their tests.

## Read-set
`research/research-d-structure.md` §2; `sequence-command-registry.ts`
(whole); `command-lifeline.ts`; `command-common.ts:70-100`; the Java above
including `SequenceDiagramFactory.java:100-170` for registration order.

## Acceptance
- Given `IT++` after a message to IT, then an activation starts on IT as
  `CommandActivate2.java:91-100` does (unit test), and jiliba renders.
- Given `url of APP is [[http://x]]`, then APP's head is wrapped in an `<a
  href="http://x">` like a `[[url]]` participant, and junide/vubato render.
- Given `hide << new >> stereotype`, then tegasu renders and stereotypes are
  hidden for every participant (gender ignored, `:163-166`).
