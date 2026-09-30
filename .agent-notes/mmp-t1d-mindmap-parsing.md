## Observation: getSmartLevel's throw is upstream's "crash path", not a syntax refusal
- **Context**: Porting `MindMapDiagram.getSmartLevel` (T1d, D6) and deciding
  whether its `UnsupportedOperationException` should become a `ParseRefusal`.
- **Finding**: The exception is uncaught by every layer between
  `CommandMindMapOrgmode.executeArg` and `PSystemCommandFactory#createSystem`
  (only `NoSuchColorException` is caught in `SingleLineCommand2#execute`).
  It escapes all the way to `PSystemBuilder#createPSystem`'s outermost
  `catch (Throwable t)` (`PSystemBuilder.java:274-279`), which wraps it into
  an `ErrorUml(EXECUTION_ERROR, "Fatal crash error, you should send a mail
  to plantuml@gmail.com with: " + t, 0, ...)`. This is EXACTLY the spot
  `core/parse-refusal.ts`'s own file header calls "the crash path ... a
  different outcome from a syntax refusal" and reserves `throw` for.
  Confirmed against the real jar: an authored fixture (`#* root` then a
  tab-indented `*# child`) reliably reproduces it via T0c's `LayoutProbe`
  (`plans/mindmap-engine-port/tools/probe/run-probe.sh LayoutProbe
  <file.puml>`), printing `UnsupportedOperationException: type=< *#>[#*]`
  at `MindMapDiagram.getSmartLevel(MindMapDiagram.java:156)`. Running the
  SAME fixture through `scripts/oracle-render.sh` (the full render
  pipeline) produces a DIFFERENT, unrelated `IllegalArgumentException` at
  `XDimension2D.<init>` — the crash-report diagram itself (built from the
  "Fatal crash error..." text) then fails to RENDER for an apparently
  environment/font-metrics reason. Do not trust `oracle-render.sh`'s SVG
  output alone to identify which exception actually fired during parsing;
  use `LayoutProbe`'s stderr (it runs the same `SourceStringReader`
  pipeline but surfaces the raw stack trace before any fallback rendering
  swallows it).
- **Impact**: `MindMapDiagram.ts#getSmartLevel` throws a plain `Error`
  (matching upstream's exact message format `type=<...>[...]`), uncaught by
  `MindMapDiagramFactory.ts`'s dispatch loop — NOT a `refuse('execution',
  ...)`. Any future mindmap task adding more throwing paths should check
  whether the throw is reachable from `PSystemCommandFactory#executeFewLines`
  (a normal `CommandExecutionResult.error(...)`, use `refuse`) vs. a genuine
  uncaught `RuntimeException` (use `throw`, per D1 of `parse-refusal.ts`).
- **Confidence**: High (jar-verified with a citation-quality stack trace).

## Observation: Display.toString() is Java-List-style bracket-wrapped, not bare text
- **Context**: Writing tree-shape test assertions comparing `Idea.getLabel().toString()`.
- **Finding**: `core/klimt/creole/DisplayReaders.ts#toStringOf` ports
  `Display#toString` faithfully as `[elem1, elem2]` (mirroring Java's
  `List<CharSequence>.toString()`), not the plain concatenated text. A
  single-line label `"root"` therefore stringifies to `"[root]"`, and an
  empty label to `"[]"`. T0c's `LayoutProbe` output (`label=[...]`) already
  reflects this same convention.
- **Impact**: Any future test asserting on `Idea`/`Display` text must
  account for the bracket wrapping, or use `label.asList()` directly (each
  element as a raw string) instead of `.toString()` for readable
  comparisons — `parse-tree.test.ts`'s own `toTree` helper does the latter.
- **Confidence**: High (read the port's own source; also matches jar-probe output shape).

## Observation: MindMap always seeds root on BOTH regular and reverse branches
- **Context**: Testing that `left side`/`-` direction routes new ideas onto the reverse branch.
- **Finding**: `MindMap.addIdeaInternal`'s level-0 branch
  (`MindMap.java:123-127`) unconditionally calls BOTH
  `regular.initRoot(...)` and `reverse.initRoot(...)` regardless of
  `direction` — only non-root (`level > 0`) placement is direction-gated.
  So `branch.hasRoot()` is true on BOTH branches after any first idea;
  only `branch.getRoot()!.hasChildren()` distinguishes which branch actual
  content landed on.
- **Impact**: A test (or a future consumer) checking "did this fixture use
  the reverse branch" must check `hasChildren()`/tree contents, not
  `hasRoot()`, on the branch expected to be EMPTY.
- **Confidence**: High (matches upstream source exactly; jar-probe-confirmed
  branch assignment for kapoze-75-zati796/gaferi-23-mute427/majagu-52-lumi685).
