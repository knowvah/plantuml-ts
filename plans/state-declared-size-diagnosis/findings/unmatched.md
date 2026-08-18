# unmatched — 4 fixtures (T12)

All four are the harness's **scope-count case**
(`scripts/measure-composite-declared-size.ts:179`,
`dots.length !== inputs.length`), not the per-scope node-count case
(line 185, `oracle.nodes.length !== ours.nodes.length`): in every one of
these four, jar cached **zero** `svek-N.dot` files (`jarScopes()`, line
96, finds none), because jar never reached graphviz at all — each
`in.svg` is a jar **error render** (green `#33FF02` echoed source +
red `#F00` error line), produced at parse time before any composite
scope could be built. This port, given the same `in.puml`, does not
error — `renderSync` completes and `setLayoutInputObserver` records
K > 0 `DotInputGraph`s (confirmed live via
`scripts_scratch/T12/probe.ts`: cagego 3, fugedo 3, xacona 6, zecivu 2;
no exceptions thrown; no `#F00` text in our SVG). Because jar
contributes 0 scopes, no sorted-per-axis pairing is possible on either
side — there is nothing to pair, not even a subset — so none of the
four can feed T13's per-row `pairingRisk` catalogue.

### cagego-53-vemo516

- **bucketLabel:** unmatched
- **rows:** n/a (unmatched: ours 3 scopes vs jar 0 scopes)
  | — | — | — | — | — | — |
  |---|---|---|---|---|---|
- **status:** divergence-proposed
- **mechanism:** Jar's `state c` reference from `c -> d`, written after the
  `--` concurrent-region divider (so the current group at that point is
  the SECOND concurrent region of `S`), fails
  `StateDiagram#checkConcurrentStateOk`: `c`'s real parent container is
  the composite `b` (not the concurrent-region group itself), so
  `getCurrentGroup() != existing.getParentContainer()` while
  `getCurrentGroup().getGroupType() == CONCURRENT_STATE` → the check
  returns `false` → `CommandLinkStateCommon#getEntity` returns `null` →
  parse-time error, diagram never reaches svek. This port's `ensureState`
  has no equivalent guard: its final branch unconditionally
  resolves-or-creates any bare id via `resolveExistingState` /
  diagram-wide lookup, so `c` resolves to the real (already-declared)
  state and `d` is silently created fresh, and rendering proceeds to 3
  svek scopes.
- **originFileLine:** `src/diagrams/state/state-parse-resolve.ts:358-363`
  (`ensureState`'s generic resolve-or-create tail, no concurrent-region
  ownership check)
- **javaRef:** `~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/StateDiagram.java:70-90`
  (`checkConcurrentStateOk`/`checkConcurrentStateOkInternal`) +
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/command/CommandLinkStateCommon.java:245-282`
  (`getEntity`, the `quark.getParent().getData() == null` / concurrent-ok
  gate that returns `null` and triggers the "cannot be used here" error)
- **causalChain:** jar: `getEntity` returns `null` for `c` at parse time →
  `CommandExecutionResult.error(...)` → the diagram is an error diagram →
  `CucaDiagramFileMakerSvek` never runs → 0 `svek-N.dot` files cached.
  Ours: `ensureState` never returns `undefined` for a plain bare id → the
  transition parses → the diagram lays out normally →
  `setLayoutInputObserver` records one `DotInputGraph` per svek scope (3)
  → `dots.length(0) !== inputs.length(3)` → harness reports `unmatched`.
- **ruledOut:** not a harness/fixture-population gap — `in.puml`/`in.svg`
  both exist and `in.svg` is a genuine jar ERROR render (`grep`'d
  `fill="#F00"` text: "The state c cannot be used here."), not a missing
  cache file; not a crash on our side — `probe.ts` shows `renderSync`
  completes with no thrown exception and no `#F00` in our output; not the
  node-count case (line 185) — jar contributes literally 0 scopes, so
  scope-count (line 179) is the only branch that can fire.
- **pairingRisk:** none — 0 jar rows exist on either side; sorted
  per-axis pairing requires at least one row per side.
- **sharedCauseWith:** xacona-99-peze211 (identical `checkConcurrentStateOk`
  mechanism — a state whose real parent container differs from the
  current concurrent-region group, referenced from that region)
- **proposedWriteSet:** `src/diagrams/state/state-parse-resolve.ts`
  (`ensureState`'s generic tail — would need a
  `checkConcurrentStateOk`-equivalent guard keyed on `ParseState`'s
  current-scope owner's group kind vs. the resolved state's actual
  parent), `src/diagrams/state/ast.ts` or `state-transitions.ts` (surface
  a parse error result on rejection), plus whatever error-diagram
  rendering path other "unported syntax error" fixtures already use.
- **sizeEstimate:** medium — one focused validation function plus wiring
  an error-result return through `ensureState`'s callers (currently
  `State | undefined` with `undefined` reserved for `[*]`); verification
  cost is the two fixtures here plus a corpus sweep for false positives
  (legitimate cross-region references inside a still-open ancestor scope
  must keep working).
- **confidence:** high
- **nextStep:** n/a (resolved to a stated mechanism; not unresolved)

### fugedo-34-fice721

- **bucketLabel:** unmatched
- **rows:** n/a (unmatched: ours 3 scopes vs jar 0 scopes)
  | — | — | — | — | — | — |
  |---|---|---|---|---|---|
- **status:** divergence-proposed
- **mechanism:** Jar's dotted reference `ChildMode1.A` (from inside sibling
  composite `ChildMode2`) resolves via
  `CucaDiagram#quarkInContextSafe`'s dotted branch, which only searches
  from the diagram ROOT for the first segment (`root.childIfExists`,
  `CucaDiagram.java:277`) — since `ChildMode1` is nested inside
  `ParentMode`, not a root-level quark, that lookup fails and the whole
  dotted string falls through to `currentQuark.child(full)`
  (`CucaDiagram.java:286`). `Quark#child` then walks `"ChildMode1.A"` as
  fresh child segments of the CURRENT group (`ChildMode2`), creating a
  phantom `ChildMode2 > ChildMode1(no data) > A` node distinct from the
  real `ParentMode > ChildMode1 > A`. Because the phantom `ChildMode1`
  segment has no `Entity` data, `getEntity`'s
  `quark.getParent().getData() == null` check fires for `A` → `null` →
  error. **Corrected at close-out (orchestrator re-verification):** this
  port's `resolveOrCreateDottedPath` mirrors that same walk — `anchorIsRoot`
  is false (`ChildMode1` is not in the root scope), so it walks from the
  CURRENT scope (`ChildMode2`) and `makeState`s a NEW `ChildMode1` there,
  then `A` under it — the identical phantom `ChildMode2 > ChildMode1 > A`.
  The divergence is only that jar then refuses the diagram while we keep
  the phantom and DRAW it: our SVG carries `ChildMode1`/`A` twice (probe,
  2026-08-18). The earlier "finds the already-declared ChildMode1 wherever
  nested" reading was wrong.
- **originFileLine:** `src/diagrams/state/state-parse-resolve.ts:153`
  (`resolveOrCreateDottedPath`)
- **javaRef:** `~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:250-288`
  (`quarkInContextSafe`, specifically the `root.childIfExists`
  first-segment-must-be-root-level check at line 277 and the
  `currentQuark.child(full)` fallback at line 286) +
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/Quark.java:116-132`
  (`child`, the per-segment `getDirectChild` walk that manufactures the
  phantom intermediate quark) +
  `CommandLinkStateCommon.java:277-278` (`quark.getParent().getData() ==
  null` gate)
- **causalChain:** jar: phantom-parent-has-no-data → `getEntity` returns
  `null` for `ChildMode1.A` → parse-time error → 0 svek scopes cached.
  Ours: the same phantom is created but no `getData()==null` gate exists →
  the transition parses against the phantom `A` → 3 `DotInputGraph`s
  recorded (root, ParentMode, ChildMode2 with the phantom composite inside)
  → `dots.length(0) !== inputs.length(3)` → `unmatched`. Rendered output
  is a duplicate `ChildMode1 { A }` inside `ChildMode2` — a walking
  error, not a successful resolution.
- **ruledOut:** not the same mechanism as cagego/xacona — `ChildMode1`/
  `ChildMode2` are plain nested composites with no `--` divider, so
  `checkConcurrentStateOk`'s `GroupType.CONCURRENT_STATE` branches never
  fire for this fixture (verified by re-reading the puml: no `--` line
  anywhere); confirmed by re-reading `Quark#child`'s per-segment walk
  (`getDirectChild`, line 134-139) rather than assuming a single literal
  `"ChildMode1.A"`-named node was created — the walk creates two real
  nested quarks, and it is the INNER one's parent that lacks data, not a
  literal-string collision.
- **pairingRisk:** none — 0 jar rows exist on either side.
- **sharedCauseWith:** none (dotted-path root-only resolution is a
  distinct jar quirk from the concurrent-region guard)
- **proposedWriteSet:** `src/diagrams/state/state-parse-resolve.ts`
  (`resolveOrCreateDottedPath` / `ensureState`: mirror
  `CommandLinkStateCommon.java:277-278`'s `parent.getData()==null` gate —
  a dotted reference whose walk manufactures a data-less intermediate is
  a parse error, as in the jar). Alternative ruling (documented
  divergence): resolve to the real nested `ChildMode1` diagram-wide; that
  is a deliberate improvement over the jar, not fidelity.
- **sizeEstimate:** medium — same shape as cagego's estimate; this is a
  second, independent validation gap in the same function family, so a
  fix mission could plausibly batch both under one write-set review even
  though the mechanisms differ.
- **confidence:** high
- **nextStep:** n/a (resolved to a stated mechanism; not unresolved)

### xacona-99-peze211

- **bucketLabel:** unmatched
- **rows:** n/a (unmatched: ours 6 scopes vs jar 0 scopes)
  | — | — | — | — | — | — |
  |---|---|---|---|---|---|
- **status:** divergence-proposed
- **mechanism:** Same mechanism as cagego, confirmed by parse-order
  tracing: `pUndetected` is declared inside composite `Ping`, itself
  nested in `Drive`'s FIRST concurrent region. The forward reference
  `pUndetected --> conditionsForward` is written in `Drive`'s LAST
  concurrent region (current group = that region, `GroupType
  .CONCURRENT_STATE`). `pUndetected`'s real parent container is `Ping`
  (not the current region), so `checkConcurrentStateOk` returns `false`
  → `getEntity` returns `null` for `pUndetected` → error, matching the
  cached `in.svg`'s literal text ("The state pUndetected cannot be used
  here."). This port's `ensureState` again resolves `pUndetected`
  unconditionally (no cross-region ownership check), so parsing and
  layout proceed to 6 svek scopes (one per concurrent region plus
  nesting).
- **originFileLine:** `src/diagrams/state/state-parse-resolve.ts:358-363`
  (same site as cagego — `ensureState`'s generic tail)
- **javaRef:** `~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/StateDiagram.java:70-90`
  (`checkConcurrentStateOk`) +
  `CommandLinkStateCommon.java:245-282` (`getEntity`) — identical citation
  to cagego
- **causalChain:** identical shape to cagego's: jar errors at the
  cross-region reference → 0 svek-N.dot cached; ours resolves it →
  6 `DotInputGraph`s recorded → `dots.length(0) !== inputs.length(6)` →
  `unmatched`.
- **ruledOut:** not a diagram-type misclassification like zecivu — the
  fixture's first line (`[*] --> Drive`) is unambiguous `[*]` state
  syntax on both sides, and jar's error text names a STATE ("pUndetected"),
  not a sequence-diagram syntax complaint; not the join-pseudostate
  (`<<join>>`) itself failing — `conditionsForward` is the reference
  TARGET (`ent2`), and jar's error names `ent1` (`pUndetected`), matching
  `getEntityStart` failing before `getEntityEnd` is ever reached.
- **pairingRisk:** none — 0 jar rows exist on either side.
- **sharedCauseWith:** cagego-53-vemo516 (identical `checkConcurrentStateOk`
  mechanism)
- **proposedWriteSet:** same as cagego's proposed write-set — one shared
  fix would cover both fixtures.
- **sizeEstimate:** medium, subsumed by cagego's estimate if fixed
  together (same function, same guard).
- **confidence:** high
- **nextStep:** n/a (resolved to a stated mechanism; not unresolved)

### zecivu-62-pagu681

- **bucketLabel:** unmatched
- **rows:** n/a (unmatched: ours 2 scopes vs jar 0 scopes)
  | — | — | — | — | — | — |
  |---|---|---|---|---|---|
- **status:** divergence-proposed
- **mechanism:** **Corrected at close-out (orchestrator re-verification;
  the T12 "dispatch order" reading below is withdrawn).** Line 1
  `XA13 --> Y1` creates `XA13` at the diagram root; line 5 `state XA13`
  inside XA6's concurrent region (`--`) then re-references it, and jar's
  `StateDiagram#checkConcurrentStateOk` (`StateDiagram.java:70-90`)
  refuses it — current group is `CONCURRENT_STATE` and is not the existing
  entity's parent — so the STATE factory errors. Jar's `PSystemBuilder`
  does not "lock in" the first factory: it tries EVERY factory of the
  `@startuml` type set and returns the first that `isOk`
  (`PSystemBuilder.java:258-282`); when none is, it shows the merged error
  with the highest `score()` (`PSystemErrorUtils.java:140-147`,
  `PSystemError.java:382-385`) — here sequence's line-2 error, which is
  why the cached SVG says "Assumed diagram type: sequence". Proof from the
  jar (oracle-render, 2026-08-18): the same source WITHOUT the `--`
  divider renders as a state diagram (1 svek dot; sequence-first order did
  not block it), and the same source WITHOUT line 1 renders too (2 svek
  dots); only root-level `XA13` + `--` + `state XA13` errors. Our
  `ensureState` has no such guard (`state-parse-resolve.ts:358-363`) — the
  same gap as cagego-53/xacona-99. (Aside: moving line 1 AFTER the block
  makes the jar CRASH with `IllegalArgumentException ... too many levels
  of indirection` — an upstream bug, not in scope.)
- **originFileLine:** `src/diagrams/state/state-parse-resolve.ts:358-363`
  (`ensureState` — no `checkConcurrentStateOk` equivalent)
- **javaRef:** `~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/StateDiagram.java:70-90`
  (`checkConcurrentStateOk`/`checkConcurrentStateOkInternal`) +
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:258-282`
  (try-all-factories loop) +
  `~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemErrorUtils.java:140-147`
  (`mergeV2` picks the highest score)
- **causalChain:** jar: state factory fails the concurrent guard, every
  other factory fails on syntax → merged error (sequence's scores highest)
  → 0 `svek-N.dot`. Ours: no guard → `state XA13` re-parents/references
  the root `XA13` inside the region → 2 `DotInputGraph`s → `unmatched`.
- **ruledOut:** dispatch order (T12's original mechanism) — refuted by the
  no-`--` variant rendering as STATE under the jar's sequence-first
  registration; a plain sequence-syntax failure — refuted by the no-line-1
  variant rendering; our-side crash — clean 2-scope render.
- **pairingRisk:** none — 0 jar rows exist on either side.
- **sharedCauseWith:** cagego-53-vemo516, xacona-99-peze211 (same missing
  guard; one fix covers all three)
- **proposedWriteSet:** `src/diagrams/state/state-parse-resolve.ts`
  (`ensureState`: port `checkConcurrentStateOk`, error the diagram as jar
  does) — same write-set as cagego/xacona.
- **sizeEstimate:** small — one guard function + error path; three
  fixtures move from `unmatched` to jar-identical error behaviour.
- **confidence:** high
- **nextStep:** n/a (resolved to a stated mechanism; not unresolved)
