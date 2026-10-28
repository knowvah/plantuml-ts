# T1c — emoji store in separator titles and note sheets (D3)

Agent: `typescript-pro` (sonnet), worktree `gdd-T1c`. Commit:
`fix(gantt): draw emoji artwork in separator names and notes (T1c)`.
Read [../task-contract.md](../task-contract.md) first.

## Context
gep T8c (`plans/gantt-engine-port/decision-journal.md` row 90) threaded the
injected emoji store through the gantt plugin into `createLeftTextBlock` and
added `AbstractTaskDraw.ts:255` `getEmojiStore()` (= `emojiStoreOf(skinParam)`,
`draw/header/TimeHeader.ts`). Two sites were left: `TaskDrawSeparator.ts:124`
(`new SpriteContainerEmpty()` for the title) and `AbstractTaskDraw.ts:279`
(`new SpriteContainerEmpty().atomOps(fc)` for the note sheet). Java:
`TaskDrawSeparator.java:123-129` also uses `new SpriteContainerEmpty()` but
`Emoji.java:175-181` always draws from a static registry;
`AbstractTaskDraw.java:215-226` builds the note from `skinParam.sheet(...)`.
Ours drops an emoji without a store (`AtomEmoji.ts:113-127` null-colour
fallback → `driver-text-svg.ts:142`). `SpriteContainerEmpty` takes
`(internal?, emoji?)` (`src/core/…/SpriteContainerEmpty.ts:70`).

## Task
Pass the diagram's emoji store at both sites: the separator through its
`#skinParam` (`emojiStoreOf(this.#skinParam)`, the same accessor the task
draws use), the note through `this.getEmojiStore()`. No text fallback (Java
has none). Header/day/load numbers untouched (gep row 90).

## Tests (first)
`tests/unit/gantt/draw/TaskDrawSeparator.test.ts`, `tests/unit/gantt/draw/AbstractTaskDraw.test.ts`:
with a store containing `1f607`, a separator named `<:innocent:> Phase` records
one image draw (use `tests/helpers/recording-ugraphic.ts`); a note body with
`<:innocent:>` records one image draw; without a store the recorded events are
unchanged from today. Cite `Emoji.java:175-181`.

## Write-set
`src/diagrams/gantt/draw/TaskDrawSeparator.ts`, `src/diagrams/gantt/draw/AbstractTaskDraw.ts`,
`tests/unit/gantt/draw/TaskDrawSeparator.test.ts`, `tests/unit/gantt/draw/AbstractTaskDraw.test.ts`.

## Acceptance
- Given `emoji-separator` and `emoji-note` (T0c) through `npx tsx $T/diff-one.mts <slug>`, then 0 diffs each (report before/after).
- Given no emoji store, when a separator or note draws, then output is byte-identical to today (`npx vitest run tests/oracle/svg-conformance/gantt.golden.ratchet.test.ts tests/oracle/svg-conformance/gantt.diff-baseline.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false` green).
- Given `tests/unit/gantt`, then green; typecheck, eslint, prettier clean.

Observability: N/A. Rollback: Reversible.
