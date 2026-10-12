# Decisions: cdd8 (locked 2026-10-11, maintainer-approved during planning)

A finding that contradicts any of these triggers stop 3: amend this file, then halt.

| ID | Decision |
|---|---|
| D1 | ELK loading: `render()` lazy-imports elkjs only when the diagram carries `!pragma layout elk` |
| D2 | ELK is a swappable `ElkBackend`, mirroring upstream's `elk/proxy/` layer |
| D2b | `renderSync` takes `options.elk`; `loadElk()`; an error when it is missing |
| D2c | dropped: layout stays synchronous inside the cuca plugin |
| D2d | the harness stays on `renderSync` and preloads a backend once per process |
| D3 | The ELK maker is ported at the cuca level, with a spike gate |
| D4 | Ruling docs: DIVERGENCES ELK entry reopened; one line in CLAUDE.md |
| D5 | nugecu stays accepted; no dot-engine work |
| D6 | Latex sized by JLaTeXMath's TeXIcon rule over KaTeX metrics |
| D7 | Smetana re-capture of 5 unknown rows with the pragma stripped |
| D8 | Acceptance hygiene |
| D9 | cdd7 execution conventions; non-class mover cap 60 |
| D10 | Exit launches `/plan-mission salt-engine-port` |
| D11 | Pre-authorised acceptance classes (the only ones signable) |
| D12 | ELK rows' ratchet eligibility without a DOT stage |
| D13 | ELK maker shape: upstream's maps + draw order, with an engine adapter |

## D1: lazy ELK loading
Upstream picks the maker at `net/atmp/CucaDiagram.java:478-479` (`isUseElk()` →
`CucaDiagramFileMakerElk`). `render()` runs `await import('elkjs')` only for such
a diagram, and only when `options.elk` is absent. The core build has no static
elkjs import: elk-worker.min.js is 1.6 MB.

## D2: swappable `ElkBackend` (maintainer requirement)
The maintainer will port ELK to TypeScript next. The integration must let a
TypeScript backend replace elkjs with no change to the maker.
- **The seam is upstream's own proxy layer.** `net/sourceforge/plantuml/elk/proxy/`
  (670 lines) wraps exactly the ELK API PlantUML uses: `ElkGraphUtil.create*`,
  `ElkNode`/`ElkEdge`/`ElkLabel`/`ElkEdgeSection`/`ElkBendPoint`, `setProperty`
  with `CoreOptions`/`Direction`/`HierarchyHandling`/`EdgeLabelPlacement`/
  `NodeLabelPlacement`/`SizeConstraint`, `ElkPadding`, and
  `RecursiveGraphLayoutEngine.layout(root, monitor)`. Port it to `src/core/elk/proxy/`
  as interfaces plus a synchronous `ElkBackend`, keeping upstream names.
- **Backend 1 (this mission): the elkjs adapter.** It builds proxy objects, converts
  them to ELK JSON with option ids (`org.eclipse.elk.*`), and lays them out
  synchronously: `new Worker().dispatcher.dispatch({data:{cmd:'register',
  algorithms:[…]}})`, then `{cmd:'layout', graph}`. The reply arrives through `onmessage`
  in the same tick (proven 2026-10-11, planning scratch `elkjs-probe/sync.cjs`).
  Results are written back onto the proxies.
- **Backend 2 (later): the maintainer's TypeScript ELK port.** Its adapter is near
  identity.
- **A shared contract test suite** that every backend must pass (testability rule 6).
- `elkjs` is pinned to exactly `0.12.0`, which matches the jar's ELK
  (`org.eclipse.elk.core` pom.properties `version=0.12.0`). The contract suite fails
  loudly if the internal `dispatcher` moves (stop 15).

## D2b: `renderSync` and `options.elk`
- `RenderOptions.elk?: ElkBackend`. `loadElk()` (exported, async) returns the elkjs
  backend, and any `ElkBackend` is accepted.
- `renderSync` given an ELK diagram without `options.elk` throws an error naming
  `render()` and `options.elk`. The wording mirrors the `!include` message at
  `src/index.ts:395-399`. Upstream's equivalent is `InstallationRequirement.ELK_LIBRARY_REQUIRED`
  (`CucaDiagram.java:950-952`, already ported at `src/core/cucadiagram/CucaDiagram.ts:385`).
- `render()` uses `options.elk`, falling back to the lazy elkjs backend.
- The backend reaches the class layout through an additive optional services
  parameter on `SyncPlugin.layoutSync`. T1a owns that plumbing.

## D2d: harness
The survey, census, `render-fixture-class.ts` and the cdd tools keep calling
`renderSync`. They call `loadElk()` once per process and pass the result. A
fixture without the pragma must render byte-identically to b0 (stop 14).

## D3: the ELK maker at the cuca level
- **Port 1:1.** `CucaDiagramFileMakerElk` (501 lines), `MyElkCluster` (172),
  `MyElkDrawing` (352) and `MyElkEdge` (354) go to `src/core/elk/`.
- **Drawing.** Edges are straight `ULine` segments through ELK's section points with
  `MagneticBorder` forces (`MyElkEdge.java:319-352`), never splines.
- **Spike gate (T0c).** Before the port, cadutu's node coordinates from elkjs must
  match the jar's (stop 13).
- **Scope.** All 7 class ELK rows must conform. The c4, component and unknown ELK
  fixtures are measured as movers and fixed by T3b only when they share a mechanism
  with a class row; otherwise they are ledgered.
- **Not deferrable.** ELK is a different algorithm with a different drawing path
  (maintainer ruling 2026-10-11), so this is a port, not a deferral to dot-engine.

## D4: ruling docs
- DIVERGENCES.md's `!pragma layout elk` entry is rewritten as "reopened 2026-10-11:
  supported via an ElkBackend". Remove the false "elkjs is async-only" argument
  and keep the EPL note.
- CLAUDE.md's "One layout engine" section gains one line: ELK is upstream's second
  engine and is supported through `ElkBackend`; the Smetana ban stands.

## D5: nugecu (final 2026-10-11)
nugecu-04-tona107 stays accepted as dot-engine A3 / `docs/graphviz-issues/23` `[~]`.
The maintainer read issue 23 in depth and ruled: "we won't do better on
dot-engine". cdd8 does no dot-engine work (stop 9).

## D6: latex sizing
- **Rule.** `TeXIconBuilder.java:47-56`: `setStyle(0)` (display), `setSize(20)`,
  insets 1. Size the image from that rule over KaTeX's Computer Modern metrics
  (`node_modules/katex/src/fontMetricsData.js`).
- **Delete** the heuristic constants at `src/core/latex.ts:274-289`.
- **Simple atoms must be exact.** sapofa's `\theta` is 18×22 and `\nu` is 18×17
  (stop 16).
- **Library-forced residue.** Formulas where KaTeX's box layout differs from
  JLaTeXMath's are signed under D11.3.
- **Stale correction.** The jar's oracles now carry real JLaTeXMath output (Batik SVG),
  so DIVERGENCES' 2026-09-02 "every latex oracle is a rollback" correction is stale.
  T1d measures how many latex oracles are now JLaTeXMath before T3c rewrites it.

## D7: Smetana re-capture
- **Rows.** vakovo-25-licu237, fakone-16-boro774, japode-92-famo984,
  tikiti-02-bagu049 and xagomi-49-caki729, all in the unknown tree.
- **Procedure.** G0's (`plans/g0-limitfinder/batch-1/T2-pragma-recapture.md`), via
  `scripts/capture-oracle-cache.ts`. That script writes markup unstripped at :104;
  apply `stripLayoutPragma` from `scripts/dot-sync-drilldown.ts:46` there.
- **Oracle bytes** change for these five only.

## D8: acceptance hygiene
- **Retire now.** `svg-class/bixogo-47-xulu385` and `svg-class/roxosu-00-pini153`.
  Their stated mechanism ("payload bytes only") is false: the nested `{{salt}}`
  renders our 300×60 "Error: unknown diagram type" box against the jar's 111×90.
  Both become `open -> salt-engine-port`.
- **Retire as each row goes conformant.** The 7 ELK entries and the 4 Smetana entries.

## D9: execution conventions
cdd7 conventions: b0 is the reference for every "loss", and every close checks
movers across all engines. Raise the non-class mover cap from 30 to **60**
because latex and ELK legitimately cross engines.

## D10: exit
T-exit closes the ledger and merges. T-salt then **immediately** runs
`/plan-mission salt-engine-port` with lubicu-73, bixogo-47 and roxosu-00 as seed rows.

## D11: pre-authorised acceptance classes (the only ones signable)
1. **nugecu.** The entry stays. Append "re-ruled 2026-10-11: no dot-engine fix
   pursued (D5)" to its reason.
2. **A residual in a dot-engine known-divergence class.** First verify with real
   `dot -Tdot` on the cached `svek-N.dot` (memory: dot-engine blame needs real
   dot). Sign it citing the A-class; nothing is filed to dot-engine.
3. **Latex residue forced by the library** (KaTeX box ≠ JLaTeXMath box). Sign per
   formula with its measured delta. Never for single-atom formulas.

Anything else that would need an acceptance, including **any ELK residue**, is
stop 11. elkjs is the same ELK 0.12.0 as the jar.

## D12: ELK rows' ratchet eligibility
- **Why the current gate fails.** The jar dumps no svek DOT on the ELK path
  (`scripts/dot-sync-report.ts:288`), so ELK rows are `oracleBlind` with
  `dotEqual: false`. The class ratchet's eligibility test
  (`tests/oracle/svg-conformance/class.golden.ratchet.test.ts:242-251`) requires
  `dotEqual: true`.
- **The rule.** A row is eligible when it is `dotEqual: true`, OR when it is
  `oracleBlind: true` AND its `in.puml` carries `!pragma layout elk`. Such a row has
  no DOT stage, like the non-svek engines.
- **Structural, not an exemption list.** No `dotEqualExempt` is added. T3a owns the change.

## D13: ELK maker shape (set while writing the brief; mirrors upstream)
- **What upstream changes.** `CucaDiagramFileMakerElk` keeps three ordered maps
  (`CucaDiagramFileMakerElk.java:140-142`: `nodes`, `clusters` (`Entity → ElkNode`) and
  `edges` (`Link → ElkEdge`)) and hands them to
  `new MyElkDrawing(clusterManager, diagram, minMax, clusters, edges, nodes)` (:496-498).
  `MyElkDrawing.drawU` draws **clusters, then nodes, then edges**
  (`MyElkDrawing.java:110-114`). Each node is the SAME entity image the svek path draws,
  translated to ELK's corner (:131-142). So upstream replaces layout, cluster drawing
  and edge drawing, and reuses entity images.
- **Mirror.** Port the four files into `src/core/elk/` with those maps, that draw order and
  klimt `UGraphic` drawing (`src/core/klimt/`).
- **The adapter.** Upstream's `CucaDiagram`, `Bibliotekon` and `printEntityInternal`
  become one engine-supplied adapter, `ElkDiagramAdapter` (T2a defines it, in
  `src/core/elk/ElkDiagramAdapter.ts`), with members named after the Java calls they
  replace:
  - leaves, groups and links in diagram order
  - each leaf's image dimension, plus a draw callback at a translate (stands in for
    `printEntityInternal(entity)` + `image.drawU`)
  - link label, tail/head label and quantifier text blocks
  - skin parameters
- **Engine wiring.** Class implements the adapter over its existing sizing and leaf drawing
  in T3a; description does the same in T3b. The engine renderer takes the
  `MyElkDrawing` output in place of the svek/dot path when `layoutEngine === 'elk'`.
- **Escalation.** If a needed upstream member has no class-side equivalent, that is a
  stop 3 finding, not an invented shape.
