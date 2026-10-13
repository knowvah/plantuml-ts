# T3a: `CommandWBSItemNew` + `CommandWBSItemOld` (D1)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Transcribe the two single-line item commands (`wbs/CommandWBSItemNew.java`,
`wbs/CommandWBSItemOld.java`) as regex + apply functions in the shape of
`src/diagrams/mindmap/CommandMindMapPlus.ts`:
1. Each class has two modes (`WBSDiagramFactory.java:8-12` registers `New(1)`, `New(0)`,
   `Old(1)`, `Old(0)`). Mode 0 (java New:7-26 / Old:7-26): `^([ \t]*[*+-]+)` type, then
   New: `(_)?([<>])?` OR `([<>])?(_)?`, then `[#color]`/`(code)` in either order; Old: the
   colour/code pair FIRST, then shape/direction; then an optional ` label`. Mode 1 (java
   New:27-43 / Old:27-43): the `"label" as code` form (`%g` = `"`). Expand `%pLN` (Unicode
   letters+digits), `%g`, `%s` exactly as the mindmap commands do; keep the alternation order
   so the same input binds the same groups as Java's `RegexResult.getLazzy("BACKCOLOR"/"CODE"/
   "SHAPE", 0)` — read `regex/RegexResult.java#getLazzy` (first non-null of the `_1`/`_2`
   suffixed groups) and mirror it with a small helper.
2. `executeArg` (New:52-67, Old:51-68): colour through `getIHtmlColorSet().getColor`
   (`NoSuchColorException` → `badColor()`), direction via `getWBSDirection(type, dir1, dir2)` (corrected contract, journal row 4: default from a `-` in TYPE, `<`/`>` override)
   (T0c), shape `IdeaShape.fromDesc(shape)`; no label and shape NONE → PSEUDO; no label
   otherwise → "Missing label for WBS node."; Old additionally `diagram.addWarning(new
   Warning("Please define Direction/Shape before Color/Id."))` (Old:66); then
   `diagram.addIdea(code, backColor, diagram.getSmartLevel(type), label ?? '', dir, shape)`.
3. Tests, one per alternation arm and mode: `++[#red](c1)_< Label`, `++(c1)[#red]> Label`,
   `+_< Label` (New) vs `+[#red]_ Label` (Old), marker-only `+++` (PSEUDO), `+_` (missing
   label), `+ "Two words" as c2` (mode 1, both classes), tab-indented markers, a label
   starting with `<` that must NOT be read as a direction.

## Write-set
`src/diagrams/wbs/{CommandWBSItemNew,CommandWBSItemOld}.ts`,
`tests/unit/wbs/{CommandWBSItemNew,CommandWBSItemOld}.test.ts`, `docs/catalog.md`,
`.agent-notes/wep-T3a.md`. Any OTHER file is a stop.

## Interface contract (→ T3c)
`WBS_ITEM_NEW_RE_1`, `WBS_ITEM_NEW_RE_0`, `applyWbsItemNew(diagram, match, mode: 0 | 1)`;
`WBS_ITEM_OLD_RE_1`, `WBS_ITEM_OLD_RE_0`, `applyWbsItemOld(diagram, match, mode: 0 | 1)`.

## Acceptance
- Given each listed input, then level/colour/code/shape/direction/label bind as the Java's
  `RegexResult` would (quote the group order per case).
- Given a marker-only line, then shape PSEUDO and label ''; given `_` alone, then the error.
- Given the Old form, then the warning is added once per line.

**Observability:** N/A. **Rollback:** Reversible.
