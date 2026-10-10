# aepp-T1g report

## Commits
1. fix(class): qualify relationship FullIds after endpoint resolution
2. fix(class): throw when a grouped inheritance edge has no contact point

## Java -> ours
- Neighborhood.java:72-80 (unguarded null contact), :151 NPE; SvekEdge.java:618-626 solveLine idx==-1; :1314-1316
  -> class-edge-group-inheritance.ts groupInheritanceOverride throws MissingSametailContactError
  when normalizedPts[0] is undefined. A lost graphviz edge arrives from dot-engine as an
  edgeResult with points.length 0 (probed on zuduxu: rels 0,1 both 0 points), not as a missing entry.
- DotData.java:122-161 / :126 getEntity1() is the resolved Entity.
  -> class-command-relationships.ts requalifyFullIds: parser stamped idEntity1/2FullId from raw
  endpoint text (documented gap, class-relationship-ast.ts dotEdgeReversed comment); a bare
  `Dependency <|-- Abstraction` inside `package UML` never matched classifierUid "UML.Dependency",
  so sametail map was EMPTY for rubebe (ours drew ungrouped; jar grouped and lost 35 edges).
  This was the mechanism for rubebe; the orchestrator diagnosis alone (throw) did not move it.

## Hidden/invis (Link.isInvis)
Unreachable for extends links. Link.java:177-182 isInvis = type.isInvisible() || invis.
`[hidden]` -> WithLinkType.java:100,150 goHidden sets Link.hidden, not LinkStyle.INVISIBLE;
LinkStyle.INVISIBLE only from fromString2 (SkinParam.java:941,962; stroke only) and
setInvis(true) only AbstractClassOrObjectDiagram.java:336 (assoc couple, not extends-like).
Test pins that a [hidden] grouped extends still draws.

## Rows before -> after
- class/zuduxu-90-kosi876, unknown/rubebe-45-sura795: draw -> our error page (unit test asserts).
- Survey class/unknown/object/component/usecase/state vs b0-eng: movers=1, losses=0
  (unknown rubebe dotEqual False -> True; status still diverged until T1 comparator credits error rows;
  zuduxu status unchanged for the same reason).
- Gates green: class.golden.ratchet, object.golden.ratchet, routing-conformance, refusal-coverage
  (no new erroring reported), tests/unit/class (258 files), typecheck, eslint.

## Not done
- Full all-engine survey not run (no src/core edit). Only the six class-engine users were surveyed.
- edgeResult === undefined `continue` in class-edge-geo.ts left unguarded: not observed reachable.
