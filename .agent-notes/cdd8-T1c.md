## Observation: the DOT geo builder drops `stereotypeSprite`
- **Context**: cdd8-T1c, making `archimate ... <<icon>>` carry the
  `<<$archimate/icon>>` sprite stereotype (`CommandArchimate.java:146-154`).
- **Finding**: `layout-helpers.ts:251` (single-leaf path) copies
  `node.stereotypeSprite` onto the geo; `layout-dot-tree.ts#buildGeoNode`'s
  leaf branch (`:388-406`) does not. With two or more leaves the sizer
  (`measureLeafNode`, given the registry) reserves the sprite box, while the
  renderer (`renderer-entity.ts#spriteLabel`, reading the geo) finds no sprite
  and draws the «label» text at the label's width. The boxes then overlap:
  `archimate #MOTIVATION "Transparency" <<motivation-principle>> as T` plus a
  second leaf `I` puts `I` at x=147.89 while `T` is drawn 158.238 wide from x=7.
  This applies to any multi-node description diagram with a `<<$sprite>>`
  stereotype, e.g. component/turasu-73-zoni468 (3/24, 0/0 once the field is
  copied).
- **Impact**: any `<<$sprite>>` stereotype work in the description engine
  needs the one-line copy in `buildGeoNode`, or it only works for one-leaf
  diagrams.
- **Confidence**: High (measured with and without the copy; render-diff
  table in the T1c hand-back).
- **Resolution**: fixed in cdd8-T1c by copying the field in `buildGeoNode`
  (orchestrator-approved write-set extension).
