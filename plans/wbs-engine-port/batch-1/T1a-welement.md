# T1a: `WElement`

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Port `wbs/WElement.java` (120 non-comment lines) to `src/diagrams/wbs/WElement.ts`, upstream
names, the contract in `overview.md`:
1. The model: `backColor`, `label: Display`, `level`, `stereotype`, `parent`, `styleBuilder`,
   `childrenLeft`/`childrenRight` (ordered arrays), `shape: IdeaShape`, `position`/`dimension`
   set by `setGeometry` (java:105-114).
2. `createElement` (java:70-80) exactly: a `LEFT` child at `newLevel === 1` is PREPENDED to
   `childrenRight` AND appended to `childrenLeft`; any other `LEFT` child goes to
   `childrenLeft`; `RIGHT` to `childrenRight` (D9 — pin all three cases).
3. `getDefaultStyleDefinitionNode(level)` (java:14-35): the six signatures over
   (`level == 0`, `shape == NONE`, `isLeaf()`) with `addStereotype(stereotype).addLevel(level)`;
   `getStyle` (java:42-52): `getMergedStyleSpecial(signature, STEP_BY_PARENT * 1000)` then,
   for each ancestor, that ancestor's signature `.addStar()` at a priority lowered by
   `STEP_BY_PARENT`, merged with `OVERWRITE_EXISTING_VALUE` — mirror `src/diagrams/mindmap/
   Idea.ts`'s port of the same code (upstream `@DuplicateCode(reference = "Idea")`, D4); use
   the existing `StyleSignatureBasic`/`StyleBuilder` API (read `src/core/style/`).
4. `withBackColor` (java:36-40): `SkinParamColors(skinParam, Colors.empty().add(BACK, backColor))`
   when a back colour is set (`src/core/skin/SkinParamColors.ts`).
5. Tests: the six signature cases (compare the signature's names/level/stereotype), the
   three insertion cases, `getStyle` priority order (spy on `getMergedStyleSpecial` calls),
   `isLeaf`, geometry round-trip.

## Write-set
`src/diagrams/wbs/WElement.ts`, `tests/unit/wbs/WElement.test.ts`, `docs/catalog.md`,
`.agent-notes/wep-T1a.md`. Any OTHER file is a stop (a missing `StyleSignatureBasic` method
such as `addStar`/`addLevel` is stop 10 — report its Java line).

## Acceptance
- Given each (level, shape, leaf) combination, then the signature equals `WElement.java:14-35`.
- Given a LEFT child at level 1, then `getChildren(RIGHT)[0]` and `getChildren(LEFT)[last]` are it.
- Given a 3-deep parent chain, then `getStyle` merges root→…→self at priorities
  `STEP_BY_PARENT*1000`, `-STEP_BY_PARENT` per ancestor, `OVERWRITE_EXISTING_VALUE`.
- Given `withBackColor` with a colour, then the result's BACK colour is that colour.

**Observability:** N/A. **Rollback:** Reversible.
