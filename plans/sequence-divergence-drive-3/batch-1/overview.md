# Batch 1 — small sequence fixes

Eight file-disjoint sequence tasks in parallel worktrees, after the batch 0
close; every write-set below is under `src/diagrams/sequence/` and no file
appears twice (T1g's `sequence-layout-events.ts` and T1d's
`sequence-layout-frame.ts` are different files; T1b owns the note files, T1g
does not touch them). Mechanisms: `measurements/planning-open-rows.tsv`
(sdd2's filed mechanisms, each re-read against the Java first). Then the
standard close as `b1` — pin round 1; every row that reaches zero is pinned,
every riser needs its own mechanism line (stop 5).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-par2-not-parallel.md) | a `par2` group opener is parallel (`isPar2GroupStart`) | typescript-pro (sonnet) | `command-grouping.ts` + tests | B0 | [x] |
| [T1b](T1b-self-note-left-anchor.md) | self-message `note left` anchors at `tile.getMinX() - noteWidth` | typescript-pro (sonnet) | `sequence-note-anchor.ts`, `sequence-note-tile.ts`, `sequence-layout-note.ts` + tests | B0 | [x] |
| [T1c](T1c-participant-topurl.md) | participant `[[url]]` honours `skinparam topurl` | typescript-pro (sonnet) | `sequence-participant-declaration.ts`, `command-participant.ts` + tests | B0 | [x] |
| [T1d](T1d-group-header-comment-height.md) | group header height adds `getSuppHeightForComment` | typescript-pro (sonnet) | `sequence-frame-metrics.ts`, `sequence-layout-frame.ts` + tests | B0 | [x] |
| [T1e](T1e-participant-underline.md) | `sequenceParticipant underline` underlines head and lifeline title | typescript-pro (sonnet) | `ast.ts`, `sequence-parse-helpers.ts`, `sequence-layout-participants.ts`, `sequence-layout-participant-label.ts`, `sequence-layout-lifeline.ts` + tests | B0 | [x] |
| [T1f](T1f-natural-align.md) | `\r`/`\l` inside a label sets the Display's natural alignment | typescript-pro (sonnet) | `sequence-creole-sheet.ts`, `text-block-geo.ts` + tests | B0 | [x] |
| [T1g](T1g-note-wrapper-life-step.md) | a message's own `--` step sits below its note-right wrapper | typescript-pro (sonnet) | `sequence-layout-activation.ts`, `sequence-layout-events.ts` + tests | B0 | [x] |
| [T1h](T1h-monochrome-mapper.md) | `skinparam monochrome` maps every sequence paint colour | typescript-pro (sonnet) | `renderer.ts` + tests | B0 | [x] |
| close | standard close, pin round 1 | orchestrator | per close-procedure | T1a–T1h | [x] |

Paths under `src/diagrams/sequence/`.
