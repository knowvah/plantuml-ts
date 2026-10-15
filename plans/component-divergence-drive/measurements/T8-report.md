# T8 report (branch codd/T8, base ecdaea5b2)

Commits: ec8f6e127 (part 1), 2a1fccd58 (part 2 / M4b), 8e65531c6 (misube node order).

## Files
Part 1: NEW namespace-pack.ts; namespace-groups.ts (countQuarksByName); parse-state.ts (finalizePage, findReopenedGroup, endpointAlreadyKnown, intermediatePackages); parser.ts (init + finalizePage); command-table-containers.ts, command-table-directives.ts (`!pragma useIntermediatePackages`); docs/catalog.md; tests namespace-pack (12), container-classification (2), fixtures tests/fixtures/description-separator/*.
Part 2: renderer-uid.ts; tests phantom-group-uid.
Scope add: layout-classify.ts; tests dot-emission-order.
Write-set extensions (all description-local, none on the forbidden list): parse-state/parser (needed, as listed), command-table-containers.ts, command-table-directives.ts.

## Part 1 diagnosis
gerebe. Mechanism: `!pragma useIntermediatePackages false` ignored by description. Java DescriptionDiagram.java:93-94 -> AbstractEntityDiagram.java:85-106, Entity.java:717-733 (canBePacked): single group child with children => packed, child title = parent+sep+child; packed group emits no cluster. Port: namespace-pack.ts, run from parse-state.ts finalizePage (before magma, as in Java). Chain: ours 2 clusters, jar 1 titled "foo1.foo2" (width 58). Ruled out: separator default (null, correct), phantom groups (none involved).
jafexe. Mechanism: container reopen used global nodesById lookup. Java CucaDiagram.java:251-275 quarkInContextSafe: sep==null => firstWithName (global, unchanged); sep!=null, undotted => currentQuark.child(full) (scoped), and for link endpoints reuse by name only if Plasma.countByName==1 and != current group (:267-273; Plasma.java:57-67,103-108). Chain: `node physical1 {` in `second` reopened first.physical1, `second` became empty leaf: 2 clusters vs jar 3. Fix: findReopenedGroup / endpointAlreadyKnown / countQuarksByName. Ruled out: dot-engine (cluster tree equals the jar's after fix).
Note: the task's "foo1.foo2" is the packed TITLE, not a dotted declaration name.

## Part 2 (M4b) diagnosis
Mechanism: layout-time phantom groups carry no creationIndex, which made buildUidPlan fall to the legacy pre-order walk for ALL nodes. Java: CucaDiagram.java:325-336,464 (getTextBlock) creates them after parsing, in Plasma.quarks() registration order (Plasma.java:57-67). Fix in renderer-uid.ts: exact path tolerates index-less container nodes; they number after max(node,link index), ordered by (first declared descendant, depth). Verified against a fresh jar render (scripts/oracle-render.sh; a=6 b=7 d=8 e=9 g=10, NOT depth-first) and fidati jar (ent0121-0125). Caveat: counter base = highest parse-time uid; a burned value after the last entity/link would shift it (none known).
Ruled out: link @id pairing is not the uid; remaining diffs are edge path @id (below).

## Scope add (misube)
Mechanism: Java GraphvizImageBuilder.java:226-227 printGroups(root) before printEntities(unpackaged); empty group = entity (:416-418); group prints leaves before sub-groups (:431-433). Port: classifyAst (layout-classify.ts) inserted astNodeById in source order, which buildDotNodes iterates. Fix reorders in classifyAst (inDotEmissionOrder), buildDotNodes untouched.

## render-diff structural/numeric before -> after
gerebe 3/44 -> 0/0 (layoutParity equal; conformant)
jafexe 35/49 -> render-diff now THROWS (see residual 1); layoutParity clusterTree: counts equal (3 vs 3), first diff = bb 337 vs 319 (missing self link, residual 2)
fidati 213/2 -> 88/2 ; kofovu 213/2 -> 88/2 ; tojitu 213/0 -> 88/0 (all 88 = edge path @id)
misube 1/19 -> 1/0 ; layoutParity unequal(nodePositions) -> equal

## Surveys (before = codd-b3merge, after = this branch incl. all 3 commits)
component 127/53/86 -> 127/53/86; usecase 38/19/36 -> 39/18/36; unknown 450/40/335 -> 451/40/334; c4 2/0/9 unchanged. ZERO conformant losses.
Movers: gerebe diverged->conformant (pack). usecase saduja-80-goba120 structural-match->conformant (node order). layoutEqual false->true, verdict unchanged: bozoju-49, kanute-77, misube-65, vogefo-33 (component), cexoke-68, keceji-97, luzeti-08 (unknown): node order (misube commit). fidati/kofovu/tojitu: firstDiff moved from root @id to edge path @id (M4b), verdict diverged. jafexe: diverged -> diverged, compare now throws (residual 1).

## Tests
typecheck, eslint clean. tests/unit + tests/architecture + tests/oracle/svg-conformance: 1238 files collected, 25703 tests; only the 4 known npm-pack failures (sprite-package-files, stdlib-package-files x2, stdlib-packages). Targeted set (description unit + architecture + description ratchets + layout-parity ratchet) 65 files green before the last commit. Catalog regenerated.

## Residuals (not mine)
1. NUL in SVG comments (blocks jafexe compare): renderer-cluster.ts:208, renderer-entity.ts:154,248, renderer-note.ts:130 use node.id (the dotKeyFor scoped key, contains SCOPE_KEY_SEP U+0000) as EntityDecorationInfo name/qualifiedName -> `<!--cluster first^@physical1-->`, xmldom "comment is not well-formed". Jar prints the bare name (`<!--cluster physical1-->`). Fix: bareEntityName there (T7b). Pre-existing for any name collision; jafexe is the first fixture to hit it in survey.
2. layout-dot-tree.ts:~424 `if (fromRes.dotNodeId === toRes.dotNodeId) continue;` drops every self link; jar has sh0015->sh0015 (jafexe 3rd link) (T9 file).
3. Edge path @id uses qualified ids (`aaa.bbb1.ccc03-aaa.bbb1.ccc05`) where jar uses Quark.getName (`ccc03-ccc05`): renderer-edge.ts buildInput from/to via bareEntityName only strips SCOPE_KEY_SEP; needs leafDisplayName with ast.namespaceSeparator (T7a). Accounts for all 88 fidati/kofovu/tojitu structural rows.
4. fidati/kofovu g[47] label text x 13.5 / y 3.6 numeric (unexplained, not touched).
5. Ambiguous bare link endpoint when a name has >=2 quarks and the link resolves to the current-scope duplicate: link from/to remain bare ids; layout collision machinery picks the key (not exercised by a fixture).
6. Cluster/entity comment names for nested phantom groups print qualified (`a.b`) where jar prints `b` (comments not compared).
