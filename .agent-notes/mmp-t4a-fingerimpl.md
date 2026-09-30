# mmp-T4a: Idea styles, FingerImpl, MindMap drawing

## Observation: LayoutProbe row order is FingerImpl.drawU call order
- **Context**: pinning node translations against `LayoutProbe`.
- **Finding**: the probe prints nodes depth-first, regular branch then reverse
  (reverse root included, 0 x 0). `FingerImpl.drawU` recurses into each child
  before drawing its link, and `MindMap.drawU` draws regular then reverse, so a
  pass-through `vi.spyOn(FingerImpl.prototype, 'drawU')` (read `mock.contexts`
  and `ug.getTranslate()`) yields the probe's rows in the same order.
- **Impact**: no test-only accessors are needed on `FingerImpl` to compare
  per-node geometry; `tests/unit/mindmap/mindmap-layout.test.ts` does this.
- **Confidence**: High

## Observation: `[#color]` ideas carry a ResolvedColor, not an HColorSimple
- **Context**: `FingerImpl.getPhalanx` BOX branch -> `SkinParamColors` ->
  `FtileBoxOld` (`paintOf` requires `HColorSimple`).
- **Finding**: `CommandMindMapPlus/Orgmode/OrgmodeMultiline.ts` build
  `backColor` with `parseSimpleColor` (`{r,g,b,a}`); upstream uses
  `diagram.getSkinParam().getIHtmlColorSet().getColor(stringColor)`
  (CommandMindMapOrgmode.java:107) -> `HColorSimple`. Drawing a `[#color]`
  node therefore throws `ClassCastException: box colour is not an HColorSimple`.
  `parse-stereotype-color.test.ts:36` pins the `{r,g,b,a}` shape.
- **Impact**: fix at the commands (and that test) before any `[#color]`
  fixture renders; not in T4a's write-set.
- **Confidence**: High (read both sides; not exercised by a render yet)

## Observation: a merged style's snames are the storage union, not the query
- **Context**: asserting boxless signatures via `dumpStyle(idea.getStyle())`.
- **Finding**: `DumpProbe ideas` on muleji-62-gevo561 prints
  `[boxless, element, mindmapDiagram, node, root]` for the boxless ROOT and
  LEAF ideas — no `rootNode`/`leafNode`: `Style.mergeWith` merges the matched
  storage signatures, so query-only SNames never appear.
- **Impact**: do not infer the query signature from a merged style's snames.
- **Confidence**: High
