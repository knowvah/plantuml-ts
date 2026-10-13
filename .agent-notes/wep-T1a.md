## Observation: WElement contract vs the ≤5-parameter complexity hook
- **Context**: Porting `wbs/WElement.java` (wep T1a) against the batch-1 contract, which lists `createElement(backColor, newLevel, newLabel, stereotype, direction, shape, styleBuilder)` (7 params).
- **Finding**: The global `check-complexity.py` hook blocks functions with more than 5 parameters (`MAX_PARAMS = 5`), so the 7-parameter `createElement` and upstream's 7-parameter private constructor (`WElement.java:129-130`, `:144-145`) cannot be written as-is. The port follows `mindmap/Idea.ts#IdeaDecoration`: `createElement(decoration: WElementDecoration, newLevel, direction)`, where `WElementDecoration = { backColor, label, stereotype, shape, styleBuilder }`. The 5-parameter root constructor matches the contract. `level`/`parent` are private write-once fields set by a private static `child` factory.
- **Impact**: Callers (T2b `WBSDiagram.addIdea`, T3 commands) pass a decoration object instead of positional args.
- **Confidence**: High

## Observation: withBackColor takes ISkinParamWithSimple, not ISkinParam
- **Context**: Same task, `WElement.withBackColor` (`WElement.java:103-108`).
- **Finding**: The port's `SkinParamColors` constructor requires `ISkinParamWithSimple` (`src/core/skin/SkinParamColors.ts:26`), and `FtileBoxOld.createWbs` takes the same type (`FtileBoxOld.ts:90`). So `withBackColor(skinParam: ISkinParamWithSimple): ISkinParamWithSimple`, not the `ISkinParam` the contract names.
- **Impact**: T1b/T2a need to pass an `ISkinParamWithSimple` (what `createWbs` needs anyway).
- **Confidence**: High

## Observation: Idea.ts / WElement signature branch order differs, result identical
- **Context**: Comparing `getDefaultStyleDefinitionNode` between `Idea.java` and `WElement.java`.
- **Finding**: `WElement.java:86-97` tests `NONE && leaf`, then `leaf`, then `NONE`. The `Idea.ts` port tests `NONE && leaf`, then `NONE`, then `leaf`. The mapping from (shape, leaf) to a signature comes out the same either way. `WElement.ts` follows WElement.java's order.
- **Impact**: None on output. Do not "unify" the two orders.
- **Confidence**: High
