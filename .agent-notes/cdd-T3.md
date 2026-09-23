# cdd-T3 — phantom uid slots: couples, package endpoints, removed entities

## Observation: SB4's counter tick is real, but the phantom ROW is what upstream lacks
- **Context**: instrumenting `state.creationCounter` transitions for
  `mujopi-30-zadi566` / `nijeli-04-ponu844` before writing the SB4 fix.
- **Finding**: CONFIRMED. `p1 -> p2` (both declared packages) stamps two
  phantom `Classifier` rows at `parser.ts:128` (mujopi: ci 5 and 6 between
  namespace `p3`=4 and the first relationship=7; nijeli: ci 33 and 34 before
  `REL[9]`=35 where jar has 33). Upstream never reaches the tick at all:
  `CommandLinkClass.java:326-334` reads `quark.getData()` and only calls
  `reallyCreateLeaf` when it is null, and `quarkInContextSafe`
  (`CucaDiagram.java:249-286`) returns the existing group quark.
- **Impact**: the fix is not "suppress the tick" but "do not materialise the
  row" — the rows DO reach `ClassGeometry` (mujopi's `data-entity-1` was
  `ent0005`, the phantom, where jar names the cluster `ent0001`), so a
  suppressed tick alone would have left a uid-less classifier in geo and
  flipped `isExact` to the fallback path.
- **Confidence**: High (counter dump + both SVGs' id tables read).

## Observation: SB5's stated mechanism is already implemented — the loss is at `filterRemovedEntities`
- **Context**: instrumenting `cejili-77-gepe377` slot-by-slot before the fix.
- **Finding**: DISPROVED as written. The `GMN` name tick and the note<->host
  connector are BOTH already burned (`class-notes.ts:213-230`, G2 N15/N68),
  and the parse-time counter is jar-EXACT: a=1, z=2, TIPS=3, TIPS-link=4,
  GMN=5, note=6, connector=7, b=8, lnk9. The `-3` appears only after
  `class-directives-removal.ts#filterRemovedEntities` drops `z` (rank 2) and
  the purged member-tip note (ranks 3+4); dense re-numbering then closes the
  holes. `remove`/`restore` is an EXPORT-time skip upstream
  (`GraphvizImageBuilder#printEntities:350`), long after `abel/Entity.java:171`
  and `abel/Link.java:135` burned their ranks.
- **Impact**: any future "our uids are N low" on a fixture containing
  `remove`/`restore` should look at the removal filter first, not at the
  command that created the entity.
- **Confidence**: High (AST dump before/after the filter; three fixtures
  reproduce and all three are now conformant).

## Observation: the DOUBLE couple burns in a different order from the single one
- **Context**: SB3.
- **Finding**: `applyDoubleCouple` passed NO counter at all, so every
  double-couple fixture failed `isExact` and fell to `assignFallback` —
  the "+2 apoint names" arithmetic in the report is the coincidental
  difference between the fallback count and jar. The real order is
  `AbstractClassOrObjectDiagram.java:120-138`: BOTH `getUniqueSequence
  ("apoint")` names, THEN both point entities, THEN two `insertPointBetween`
  calls, THEN the joining link — which the single-couple `Association` ctor
  (`:226-231`, name and entity adjacent) cannot express, hence
  `Classifier.apointNameCreationIndex`.
- **Impact**: reusing `makeCoupleCircle(counter)` on the double path would
  have produced name/entity/link/link per circle and been wrong.
- **Confidence**: High (jar `apoint6`/`apoint7` -> `lnk10..lnk14` on pibifa,
  `apoint12`/`apoint13` -> `lnk16..lnk20` on begico; both now exact).

## Observation: `besepi-37-rori892` is NOT an SB3 fixture
- **Context**: SB3 verification; the diagnosis lists besepi in SB3's reach 3.
- **Finding**: besepi has no double couple (`(ia_123, ia_1000042) .
  ia_1000042_ia125_has_father_123` is the SINGLE-couple form, already stamped
  by G2 N19) and did not move at all (32/624 before and after). Its residual
  `+1` starts at `ia_125` (jar `ent0028`, ours `ent0027`) and originates at
  `in.puml:32`, `ia_1000042 -up-> ia_123`: a direction-inverted link burns
  TWO ranks (`Link` ctor + `Link#getInv()`, `abel/Link.java:135,145-146`),
  which this port models as `Relationship.phantomSlot` + `creationIndex`.
  The couple at `:97` then SUBSUMES that link, and `SubsumedLink
  .creationIndex` (`class-assoc-subsume.ts:57`) preserves only the second of
  the two ranks — the discarded pre-`getInv()` rank is lost with the row.
- **Impact**: a named, separate defect (subsumption of an inverted link),
  not SB3. Every other inverted link in besepi is correct, which is why the
  drift is exactly 1 and starts at that line.
- **Confidence**: High (rank-by-rank reconstruction of the jar's gaps for
  every `-up->`/`-left->` line in the fixture).
