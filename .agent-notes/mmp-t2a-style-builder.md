# mmp T2a — Style, StyleStorage, StyleBuilder

## Observation: Idea.getStyle's starting delta overflows Java int
- **Context**: pinning `getMergedStyleSpecial` priorities against the jar.
- **Finding**: `STEP_BY_PARENT * 1000` (Idea.java:97, WElement.java:113) is
  `10001000 * 1000` in `int` arithmetic = 1411065408, not 10001000000. The
  jar's own priorities confirm it: a `:depth(2) *` value stored at 326 reads
  back from `Idea.getStyle()` at 1411065734. The T0c probe README's "--delta
  3000 (STEP_BY_PARENT * 1000)" is wrong about the value.
- **Impact**: T4a's `Idea.getStyle` must use `Math.imul(STEP_BY_PARENT, 1000)`.
  Relative order of the walk's deltas is unchanged, so value strings would
  often still match with the wrong delta — only priorities expose it.
- **Confidence**: High

## Observation: the parent walk queries ancestors at the CHILD's level
- **Context**: stereo fixture in `tests/unit/core/style/StyleBuilder.test.ts`.
- **Finding**: `up.getDefaultStyleDefinitionNode(level)` (Idea.java:100) uses
  the current node's `level`, so a `:depth(1)` rule on a level-1 parent does
  not reach its level-2 child through the walk (jar: `a1` LineColor stays
  `#181818` while its parent `a` is `green`).
- **Impact**: do not "fix" to `up.level` in T4a.
- **Confidence**: High

## Observation: absent FontSize gives a size-0 UFont, not 14
- **Context**: `Style.getUFont` tests.
- **Finding**: `ValueNull.asIntButMinusOneIfError()` is 0 (ValueNull.java:56-59),
  so the `size == -1 -> 14` fallback (Style.java:244-245) only fires for a
  FontSize with no digits. Every real signature merges `root { FontSize 14 }`.
- **Impact**: none on skin-backed styles; matters for hand-built test styles.
- **Confidence**: High

## Observation: jar StyleBuilder storage can be dumped by reflection
- **Context**: building storages "by hand from probe declarations".
- **Finding**: a scratch probe (reflection on `StyleBuilder.storage`,
  `Style.map`, `ValueImpl.value` -> DarkString value1/value2/priority, plus
  `Idea.getStyle()` via `MindMapDiagram.mindmaps` -> `MindMap.regular/reverse`
  -> `Branch.root` -> `Idea.getChildren`) prints exact priorities.
  Output lives in `tests/unit/core/style/fixtures/*.json` (plantuml.skin =
  126 stored styles, all plain). Stereotype styles carry +1000
  (StyleLoader.java:183); user `<style>` priorities start after the skin's.
- **Impact**: T3a can pin its parser against `plantuml-skin-storage.json`
  directly (order, keys, priorities).
- **Confidence**: High
