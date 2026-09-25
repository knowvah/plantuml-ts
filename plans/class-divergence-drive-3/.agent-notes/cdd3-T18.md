# cdd3-T18 — `together { }` as `subgraph <clusterId>t<k>` (E1-6 = B-2)

## Observation: membership is set at CREATION, and only when a Together is the stack top
- **Context**: porting `CucaDiagram#gotoTogether`/`currentTogether`/`reallyCreateLeaf`/`gotoGroup`
  (`atmp/CucaDiagram.java:188-194,232,339-353`).
- **Finding**: `currentTogether()` reads only the LAST stack entry. A class declared inside
  `together { package p { ... } }` is not a member; `p` is. `gotoGroup` stamps a group only when it
  creates it, and a muted leaf keeps the together it was created with. Naming an existing entity
  inside the block does not join it: `sipigu-91-baku027` (`class Bar1` before and inside the block)
  has no `t` subgraph in the jar DOT. Links inside the block that auto-create endpoints do join
  (`jakapi-64-tine258`).
- **Impact**: class resolves leaves by `creationIndex` against a per-line record of
  `currentTogether()` (`class-together.ts`), because no command both changes the stack and creates a
  leaf. Description stamps in `emitNode`, its single creation chokepoint (`description/together.ts`).
- **Confidence**: High (jar DOTs of all 20 cached fixtures with a `t` subgraph match ours structurally).

## Observation: the together name counter repeats for a nested together
- **Context**: `Cluster#printTogether` (`svek/Cluster.java:528-547`).
- **Finding**: `togetherCounter++` runs after the nested `printTogether` calls, so a nested together
  prints with the SAME name as its parent, and the next top-level one skips a number (t0, t0, t2).
  No cached fixture has a nested together. The port keeps the numbering and adds an `n<k>` suffix to
  the repeat, because the id is also the cluster-tree key.
- **Impact**: the DOT-parity comparator ignores `t` names (`^cluster\d+$` only), so the suffix is
  invisible to it.
- **Confidence**: High for the Java reading; the graphviz behaviour for the duplicate name is not
  measured.

## Observation: jakapi-64-tine258 has two post-layout mechanisms behind E1-6
- **Context**: after the fix, jakapi's DOT equals the jar DOT (colors aside).
  `B-engine-cmp` (engine vs real dot on the jar DOT) and `B-api-vs-real` (our API graph vs real dot)
  both report 0 node and 0 edge mismatches. It still sits at S 0 / N 352.
- **Finding 1**: `skinparam groupInheritance 3` draws the `Neighborhood` triangles
  (`dot/Neighborhood.java:70-95`). The jar iterates `contactPoints`, a `HashSet<XPoint2D>`
  (hash = `Double.hashCode(x) + Double.hashCode(y)`, `klimt/geom/XPoint2D.java:30-31`). Ours
  iterates link order (`renderer-group.ts#uniqueSametailContacts`). The two triangle+line pairs
  come out swapped: jar polygon[1] = our polygon[2], at the same points once the global shift is
  removed.
- **Finding 2**: the `allButSametails` stub from Group toward User (`Neighborhood.java:97-113`)
  ends at x 182.219 in the jar and 194.221 in ours (shift removed), so it is 12.0 px shorter in ours.
  Not attributed.
- **Finding 3**: every other element differs by one uniform Δ3.763 x, plus canvas 475 vs 472. The
  lead is the ink extent of the two findings above (unverified).
- **Impact**: follow-on, separate from E1-6. Porting Java `HashMap` bucket order needs the exact
  doubles at `drawU` time.
- **Confidence**: Medium (order swap measured; HashSet cause read from the Java, not reproduced).

## Observation: description reach of the same port
- **Context**: `together` goes through the same Java methods in description: `CommandTogether` is
  registered at `DescriptionDiagramFactory.java:97`, and `Cluster#printCluster2` prints it. The
  core emitter/builder part was shared already, so only the parse-side membership was new
  (`description/together.ts`).
- **Finding**: all-engine survey vs pre-edit: 10 non-class rows moved, all together-bearing.
  Conformant: bibeja, lejenu, mocute, potefu. Lower maxDelta, same verdict: zosaxo, kekese,
  xagonu, berufi, jecici, seline. None rose, and no other engine moved.
- **Impact**: bobije, xoculo, cerobi, jimizu and xuloxo carry a `t` subgraph in the jar DOT, but
  their survey rows did not move. Their residuals are other mechanisms (not investigated here).
- **Confidence**: High (survey pre/post, same machine, same session).
