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

## Observation: three Java `Double.toString` ports in src/
- **Context**: gep T4d (`real/` port) review, 2026-10-26.
- **Finding**: `javaDoubleToString` exists in `src/core/decoration/LinkStyle.ts:39` (N.0 / plain fractions only), `src/core/klimt/sprite/sax/sax-text-image-use.ts:210` (private), and `src/core/real/AbstractReal.ts` (full: NaN, ±Infinity, ±0.0, `E` notation outside [1e-3, 1e7)). No shared module; agents grep, miss, and write another.
- **Impact**: A cleanup PR should move the full version to one `src/core` module and point the others at it (check the LinkStyle callers' outputs stay byte-equal). Same for Java exception classes, which now live in `AbstractReal.ts`.
- **Confidence**: High

## Observation: creole text has a 10px minimum height
- **Context**: gep T5c (gantt task-draw port), 2026-10-26; note heights in `AbstractTaskDraw`.
- **Finding**: `klimt/creole/atom/AtomText.java:180` clamps a text atom's height to at least 10px, so a 9pt note measures 10 high; `klimt/creole/Sea.java:143-150` repeats the rule. The TS creole atoms mirror it (the gantt note tests depend on it).
- **Impact**: any engine measuring small-font text against a jar oracle must expect the 10px floor, not the font metric.
- **Confidence**: High

## Observation: RectangleTask paints the last segment background one pixel wider
- **Context**: gep T5c, `draw/RectangleTask.java` (ported in batch 3).
- **Finding**: `RectangleTask.java:190-192` draws every segment's background at its width, then `widthBack++` for the LAST segment only — the jar's task bars are 1px wider at the end than the geometry says.
- **Impact**: a gantt bar-width divergence of exactly +1 on the final segment is upstream behaviour, not a port bug; mirror, never "fix".
- **Confidence**: High

## Observation: `Integer.parseInt` has no shared port
- **Context**: gep batches 6–7 (gantt grammar), 2026-10-26.
- **Finding**: at least seven gantt files carry a private `parseInt32`/`parseDouble` copy (`lang/DayPattern.ts`, `ComplementDate.ts`, `ComplementTimePoint.ts`, `SubjectDayAsDate.ts`, `SubjectDaysAsDates.ts`, `command/CommandPrintScale.ts`, `CommandTaskCompleteDefault.ts`, `CommandWeekNumberStrategy.ts`), each throwing `NumberFormatException` like Java's.
- **Impact**: a cleanup PR should move one `javaParseInt`/`javaParseDouble` into `src/core` and point the copies at it (behaviour identical; the per-file tests already pin the throw cases).
- **Confidence**: High
