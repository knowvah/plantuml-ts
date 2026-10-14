# Architecture decisions (pre-made, approved 2026-10-14)

Do not re-argue these. A Java reading that contradicts one is stop 3.

## D1 — Layout-parity compares order-free multisets, with no id map

Jar node ids (`sh0010…`) and ours (AST ids) differ, and a node-count mismatch is exactly the failure
being hunted, so an emission-order map would be brittle. Compare, in this order, and report the
**first** differing component with a one-line detail:

1. `clusterTree`: the nesting shape, i.e. for each cluster its depth and wrapper chain (`a/p0/base/i/p1`
   present flags, read from the subgraph names) plus its bb
2. `bb`: graph bounding box, exact
3. `nodeSizes`: sorted multiset of node `(w,h)`
4. `nodePositions`: sorted multiset of node `(x,y,w,h)`
5. `edgePos`: sorted multiset of edge `pos` strings

**Consequence:** a report names *what* differs, never *which* node. Drill-down uses
`.agent-notes/dot-engine-2.4.0-bump.md` ("dump our builder graph as DOT").

## D2 — Both sides are laid out in-process by dot-engine 2.4.0

- Jar side: `parse(svek-1.dot)` → `render(g,'dot')` → `getLayout(g)`.
- Our side: the captured `DotInputGraph` (`setLayoutInputObserver`, `src/core/graph-layout.ts:56-72`),
  built into a dot-engine graph by the same builder `layoutGraph` uses, then `render` → `getLayout`.
- 2.4.0 equals native `dot -Tdot` 16.1.0 on every re-measured issue fixture (TRACKER 2026-10-14 notes).
- Native graphviz (`/opt/homebrew/bin/dot`) is a **dev-box cross-check only**; the gate must run in CI
  without it. A disagreement with native is stop 8.

## D3 — Gate placement: a shrink-only ratchet plus a survey column

- New test `tests/oracle/svg-conformance/layout-parity.ratchet.test.ts` over
  `oracle/goldens/svg-conformance/layout-parity-baseline.json`. Every pinned row must stay layout-equal.
- Seeded at T2 from the b1-equal set (b1 renders identically to b0: batch 1 changes no rendering
  path). Expected to include rubebe, zuduxu, pavuzo and xenusu.
- **Pin population (planning clarification, 2026-10-14):** the description-family trees (`component`,
  `usecase`, `c4`, and `unknown` rows whose routing-baseline `ourType` is `DESCRIPTION`) plus the four
  controls. Class/object/state already have byte-exact SVG ratchets, which subsume layout equality;
  pinning them too would double the ratchet's runtime for no new signal. The survey column still
  covers every svek engine.
- The survey records `layoutEqual` + `layoutFirstDiff` per row.
- The dashboard shows a `layoutEqual` column (T5).

## D4 — `dotEqual` is tightened, not left alone

- `StructuralCluster` gains `wrapperChain: { a; p0; i; p1 }` and `titleTable?: { w; h }`.
- **Oracle side:** parsed from subgraph names and the cluster's `label=<TABLE … WIDTH HEIGHT>`.
- **Candidate side:** `wrapperLevels()` (`src/core/svek-dot-wrappers.ts:64`, the single definition)
  plus `labelWidth/labelHeight`; never a re-derivation.
- `dot-parity.json` and `docs/parity-report.md` are regenerated at T5. Every flipped row family is
  named in that commit body. A class/object/state flip is stop 5.

## D5 — Description's DOT-side `ClusterHeader` sizing gets its own module

- New `src/diagrams/description/description-cluster-header.ts`.
- **Reuses:**
  - `src/core/cluster-title-table.ts#computeTitleTableHeight`, which already subtracts the `-5` of
    `ClusterDotString.java:124` via `DOT_TITLE_TABLE_HEIGHT_OFFSET`, so the returned dims are TABLE
    dims in class's convention.
  - Core `USymbol.suppWidthBecauseOfShape()/suppHeightBecauseOfShape()`
    (`src/core/decoration/symbol/USymbol.ts:83-90`, `USymbolNode.ts:178-185`, `USymbolDatabase.ts:243`).
- **Title/stereo text:** the title and stereo block are the same ones the drawing side measures
  (`renderer-cluster.ts:99 buildHeader`): one header, two consumers.
- **No class refactor:** class keeps `class-namespace-title-table.ts`.

## D6 — Wrapper level, anchor and families for description

- **Plain family:**
  - `innerMarginLevels = 2` iff `edgeDotBuild.groupAnchorClusterIds` has the cluster (jar
    `isThereALinkFromOrToGroup`, `ClusterDotString.java:91-99`); otherwise `1`. Protection is
    unconditional outside swimlanes (`:299-314`).
  - The group anchor leaves `nodeIds` and becomes `unwrappedNodeId`: the jar emits the special
    point after the label, before `i`/`p1` (`:146-155`).
  - `labelWidth/labelHeight` and `titleTableWidth/titleTableHeight` come from D5.
- **Port (border-point) family** (`entityPositionsExceptNormal` non-empty): protection is forced false
  (`:109-112`), so `innerMarginLevels` stays unset. The jar has two sub-branches (`:132-137,175-181`):
  - **`hasPort()`** (PORTIN/PORTOUT, description's case): `ee` gets no label, and the title TABLE goes
    on the `empty()` rect anchor declared last inside `ee`. Mirror class's `applyPortBranch`
    (`src/diagrams/class/class-dot-clusters.ts:88-107`): `portRanks` + `portAnchorId`, plus the D5
    dims on the anchor node as `titleLabelWidth/titleLabelHeight`. Description already sets
    `portRanks`/`portAnchorId` (`layout-dot-tree.ts:256-262`); what is missing is the anchor's
    title dims.
  - **Entry/exitpoint without a port:** the label goes on `ee` (`portRanksLabelOnEe`, the state
    family). Use it only if a description cluster reaches this sub-branch; journal it if one does.
  - In both, the `a`/`i` pair still fires on a group link (`borderPointAncestorWrap`, `:98,151`).
- **Kermor family:** follow `ClusterDotStringKermor.java` (title table `:135-137`, protection
  `:258-265`). Read it before writing; 3 cached fixtures use kermor.

## D7 — Re-pin policy

- Ratchets are shrink-only.
- At every re-pin:
  - census attrs moving **away** from the jar
  - element-count growth
  - a baseline-JSON diff for any pin that **rose**
- weightedScore exit bar: **zero unexplained rises** (a correct fix can raise it).
- **Zero conformant losses in any engine** against b0.

## D8 — deroxu is diagnosis-first

After T3/T4 land, run layoutParity on `unknown/deroxu-29-gude369`. A fix (T9) runs only when T8's
diagnosis artifact names the mechanism with a Java `file:line`, inside description's write-set. The
expected area is port-table `plaintext` TABLE node sizing (`SvekNode`/`EntityImage*` with ports).
Otherwise it is filed (stop 11).

## Recorded constraints

- Rollback classification: **Reversible**. Nothing irreversible; no acknowledgement required.
- `plans/` is tracked in this repo by convention (prior briefs are committed); `.claude/` is ignored.
