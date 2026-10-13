# wep-T5-cov: authored wbs fixtures

## Observation: jar error-page oracles depend on the wall-clock minute
- **Context**: three `scripts/oracle-render.sh` runs of every `tests/fixtures/wbs/*.puml`.
- **Finding**: every non-error oracle re-rendered byte-identical; 9 error pages differed between runs. `PSystemError#getTextBlock` (error/PSystemError.java:221-229) reads `System.currentTimeMillis() / 60000 % 60` and adds a Patreon (minute 1/8/13/55), Liberapay (15) or dedication (30/39/48) banner — two extra `<image>` blocks and +126 px of canvas height. The first capture landed on a banner minute for 7 cov- error rows and the T4a `syntax-error` probe; the committed oracles are the banner-free re-renders (score 5-7 against ours instead of 65-94).
- **Impact**: a re-captured error oracle can move `svg/@height` and the element count with no port change; check the minute (or count `<image>`) before trusting a score change on an error row.- **Confidence**: High

## Observation: ProtectedCommand is unported; a throwing command renders a different error page
- **Context**: `cov-error-smart-level` (`++ Root` then ` -+ child`, `WBSDiagram.java:207` UnsupportedOperationException).
- **Finding**: the jar wraps every command in `ProtectedCommand` (core/AbstractDiagram.java:173-180, command/ProtectedCommand.java:54-78), so a Throwable becomes a line-3 `CommandExecutionResult.error("You should send a mail to plantuml@gmail.com with this log (V<version>) " + t.toString())`. No `ProtectedCommand` exists in `src/`; `WBSDiagram.ts#getSmartLevel`'s throw escapes `WBSDiagramFactory.ts#executeCommands` to `renderSync`'s catch (`src/index.ts:418-419`, `errorSvg`), which names line 4 and prints the bare message. Both error (conformant under the 2026-10-10 rule).
- **Impact**: every engine whose command throws (mindmap `getSmartLevel` has the same precedent) shows the wrong line and message on the error page; the fix belongs in `src/core/command/`, not per engine.
- **Confidence**: High

## Observation: direction-then-shape (`<_`) never parses, by upstream's RegexOr grouping
- **Context**: `cov-dir-then-shape-error` (`**<_ "x" as C`), first drafted as a `cov-as-code-*` line.
- **Finding**: in all four item regexes the second alternative is `new RegexConcat(DIRECTION_2)` and `SHAPE_2` is a THIRD alternative of the `RegexOr` (CommandWBSItemNew.java:70-71, :91-92; CommandWBSItemOld.java:78-79, :93-94; CommandWBSItemMultilineNew.java:79-80), so `<_` cannot match and the jar says "Syntax Error?". The port mirrors it (0 structural diffs beyond the version/source label). Corpus row `WBS-monoline-def-0-6` (`***<_[#green]`) is the same jar error.
- **Impact**: write fixtures with `_<`, never `<_`; a `<_` line is an error probe, not a boxless-left node.
- **Confidence**: High

## Observation: PSEUDO is `**_` with no label; a bare `**` is an error
- **Context**: `cov-pseudo-children` first draft used a bare `**`.
- **Finding**: `label == null && shape == IdeaShape.NONE` (shape `_`) gives PSEUDO; `label == null` with the default box shape returns "Missing label for WBS node." (CommandWBSItemNew.java:122-125, CommandWBSItemOld.java:123-126). Kept as `cov-error-missing-label`.
- **Confidence**: High

## Observation: an embedded `{{wbs}}` is conformant inside the data URI, not just by compareSvg
- **Context**: `cov-embed-class-legend`, `cov-embed-activity-action`.
- **Finding**: `compareSvg` exempts image href bytes, so a 0 score alone says nothing about the nested diagram. Decoding both base64 SVGs: the class-legend inner SVG is byte-identical to the jar's (1107 bytes), the activity one compareSvg-equal (1488 bytes, 4 rects / 4 texts each).
- **Confidence**: High
