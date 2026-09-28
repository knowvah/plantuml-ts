## Observation: a header visibility block is a TOP margin, not a right margin
- **Context**: cdd5-T4b entity-visibility-icon-dropped (`+class A`).
- **Finding**: `TextBlockUtils.withMargin(tb, x1, x2, y1, y2)` builds `TextBlockMarged(tb, y1, x2, y2, x1)` (TextBlockUtils.java:75-78), so `EntityImageClassHeader`'s `withMargin(getUBlock(size), 0, 0, 4, 0)` is 11 wide and 15 TALL, not 15 wide. The box widens by `classAttributeIconSize + 1` (11), which is what every Class-visibility golden shows.
- **Impact**: any other `withMargin` 4-arg call site reads the same way; do not assume (left, right, top, bottom).
- **Confidence**: High (jar goldens + an oracle-rendered 8pt case in tests/unit/class/class-entity-visibility-modifier-cdd5.test.ts)

## Observation: the header geo path has no theme, so a non-default classAttributeIconSize is not reserved in layout
- **Context**: cdd5-T4b, `class-layout-header-geo.ts#computeHeaderNameGeo`.
- **Finding**: `computeHeaderNameGeo` receives no `classAttributeIconSize`; the caller `class-layout-generic-classifier.ts#buildHeaderAndStereoGeo` has `options.classAttributeIconSize` but does not pass it (file outside T4b's write-set). Layout reserves the default 11px; the renderer draws at the themed size.
- **Impact**: `skinparam classAttributeIconSize N` + `+class A` mis-sizes the header by N-10. One-line fix: thread `options.classAttributeIconSize` into `computeHeaderNameGeo` and on to `headerVisibilityBlock(classifier, size)`.
- **Confidence**: High (read)

## Observation: a multi-line command's execution error is attributed to the block's LAST line
- **Context**: cdd5-T4b class-redeclare-mute-guard (`petiku-70-fogu777`).
- **Finding**: `PSystemError#getLineLocation` is `getLastLine().getLocation()` (PSystemError.java:102-104) and the trace includes every line of the multi-line BlocLines, so `struct bar {` ... `}` errors at the `}` line and lists through it. `executeFewLines`' ErrorUml carries `blocLines.getFirst()` (PSystemCommandFactory.java:182) but that is not what the page prints. The port's refusal fires at the opener because `parser.ts#handlePendingBodyLine` consumes the `}`.
- **Impact**: any class-body-opening command that can refuse (mute guard, json/map duplicates) lists one block short. Fix needs a deferred refusal raised on the body close in parser.ts.
- **Confidence**: High (Java read; jar page shows "(line 9)" on the `}`)

## Observation: `CucaDiagram#cleanId` strips brackets/parens/colons for class commands too
- **Context**: cdd5-T4b descriptive-leaf-code-bracket strip.
- **Finding**: `net/atmp/CucaDiagram.java:196-200` `cleanId` is `eventuallyRemoveStartingAndEndingDoubleQuote(id)` (format `"([:`), and `CommandCreateClass` runs `diagram.cleanId(CODE)`, whose NameAndCodeParser CODE admits `[`. So `class [Foo]` is id `Foo` upstream; the port keeps `[Foo]`. Not fixed (class commands were outside the family).
- **Impact**: a separate small fix in the class-command path.
- **Confidence**: Medium (read, not jar-rendered)
