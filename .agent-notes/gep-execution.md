## Observation: gantt grammar depends on unported com.plantuml.ubrex
- **Context**: gep, preparing batch 2.
- **Finding**: 47 of 167 `gantt/` files import `com.plantuml.ubrex` (43 files, 3,380 lines, outside `net/sourceforge/plantuml/`), plus `command/UBrexSingleLineCommand2` and `url/UbrexUrlBuilder`. `src/` has no port; other engines (activity UBrexCommand*, ebnf, creole, UBrexColorParser, StereotypePattern) were reimplemented over JS regex. A dependency layering computed over one package misses edges into `com/plantuml/`.
- **Impact**: audit every non-`java.` import of a package (and check each against `src/`) before planning a port's batches.
- **Confidence**: High.

## Observation: TIM preprocessing runs in buildBlockUml(s), not prepareBlock
- **Context**: gep T1b clock seam.
- **Finding**: `src/index.ts` preprocesses at the `buildBlockUmls`/`buildBlockUml` call sites in render/renderPages/renderPagesSync/renderRawBlock; `prepareBlock` only sees the result. Plugin `ctx` (`src/core/dispatcher-types.ts`) carries no render options, so a per-render value (e.g. the clock) needs a ctx field.
- **Impact**: options that TIM or a plugin must read are threaded at those call sites / the ctx type, not in prepareBlock.
- **Confidence**: High.

## Observation: prettier on a directory reformats sibling files
- **Context**: gep T1e (ubrex chain, shared worktree).
- **Finding**: `npx prettier --write src/core/ubrex` reformatted T1d's committed `ChallengeResult.ts`; worktree commits can bypass the lint-staged hook, so committed files are not guaranteed prettier-clean.
- **Impact**: in a shared/chain worktree, run prettier on explicit file lists only; let the close's `npm run lint`/format gate catch the rest.
- **Confidence**: Medium (agent-reported).
