# cdd2-T7 — group S fixes (session notes)

## Closed (in write-set)

- **S-2** pibifa-14-leno075: double-couple join `Relationship.type` was
  hardcoded `'association'` regardless of the arrow token actually written
  between the two couples (`class-assoc-double-couple.ts`). Fixed by
  extracting the token with a small local regex (kept local to this file —
  `ASSOC_DOUBLE_COUPLE_RE` in `class-assoc-couple.ts` is outside this
  task's write-set) and resolving it through the SAME `resolveArrow` every
  ordinary relationship uses.
- **S-4** begico-70-guva302, xoxuni-96-fere626 (partial): the trailing
  `#color[;text:color2]` spec after a relationship's second endpoint
  (`CommandLinkClass.java:368`) was matched by `REL_RE` and discarded
  (D6, DOT-parity-only scope). Captured independently via a private twin
  regex (`REL_COLOR_CAPTURE_RE`, named group — NOT a positional index,
  since `REL_ROLE` embeds its own capturing group used twice in the
  prefix) and threaded onto the EXISTING `Relationship.colorOverride`
  field. The `;text:COLOR` half (labelfill) is NOT closed — see Open
  below.
- **S-8** vuresa-33-kumu160: `multiLineLabelAnchor`
  (`class-edge-label-anchor.ts`) measured/rendered RAW un-creole-stripped
  line text, unlike its sibling LAYOUT path
  (`class-edge-label-measure.ts`). Now strips
  (`applyGuillemet`→`stripCreoleMarkup`→`resolveTextEscapes`, same order)
  and reports a per-line `bold` flag consumed by
  `renderer-edge.ts#renderEdgeMainLabel` as a `font-weight="700"`
  override.

## Movers outside the assigned list

- **nagega-30-poso418**: diverged → structural-match (structural 12→0,
  numeric 114→114 UNCHANGED). Same S-4 mechanism: its `!define` macros
  expand to `"x" o-up-> "x::y" #MediumTurquoise : ...`/`#0000ff`, the
  identical trailing-color-spec shape. Verified via `git stash`
  before/after `render-diff.mts` — the 114 numeric diffs are byte-identical
  pre- and post-fix (pre-existing dot-engine/layout drift on this
  macro-heavy fixture, not a regression from this change).

## OPEN — mechanism fully diagnosed, fix lands outside T7's write-set

All three below were re-probed per diagnosis-mode (mechanism confirmed
against the Java, not guessed) before concluding the write-set given to T7
cannot contain the fix. No edit was made to any file outside the write-set
list.

### S-1 / S-1 (sugifi-33-xefe083, sumule-00-pefa744)

- **Mechanism** (upgraded from the S.md diagnosis): upstream's
  `AbstractEntityDiagram#packSomePackage`
  (`classdiagram/AbstractEntityDiagram.java:85-106`, gated by
  `ClassDiagram.java:84-85`'s `!pragma useIntermediatePackages false`)
  runs AFTER every uid is already minted (leaf-creation-time sweep,
  `CucaDiagram.java:239-240,325-336`) — it does NOT change how many quarks
  exist or how many ticks are burned; it only marks an intermediate,
  single-child group `packed` (`Entity.java:717-741`) so DOT-emission
  skips its own `subgraph` wrapper (`ClusterDotString.java:76-82`) and
  merges its display into the child. The PORT's `resolveQualified`
  (`class-namespace-resolve.ts:418`) instead collapses the dotted
  qualifier into ONE joined `Namespace` at RESOLUTION time — one fewer
  `Namespace` object exists, so `eventuallyBuildPhantomGroups`'s sweep
  (already-correct, unchanged) mints one fewer tick.
- **Why it cannot close inside `class-namespace-resolve.ts` alone**: the
  ONLY thing that consumes a namespace's `creationIndex` into a final
  dense `ent000N` id is `renderer-uid.ts#assignExact`'s DENSE re-numbering
  (sort-order rank, `i+1` — NOT the raw `creationIndex` value). A dense
  rank can only be "skipped" by an entry that occupies a slot in that
  sort — i.e. an ACTUAL Namespace object with a `creationIndex`, present
  in `ast.namespaces` at render time. Building the full per-segment chain
  (so the extra tick exists) unavoidably also makes the elided ancestor
  reachable by `class-dot-clusters.ts#nonEmptyNamespaceIds`'s ancestor
  walk (`ns.parentId` — the SAME field that must be set for the sweep's
  `countChildren` gate to fire), which then draws it as a second,
  unwanted cluster box. Confirmed by direct trial: every way tried to give
  the phantom segment a legitimate `countChildren > 0` (real classifier
  membership, parentId chaining) also made it visible to the unmodified
  drawing code; every way tried to hide it (no parentId, no classifiers)
  left it with `countChildren === 0`, so the existing sweep never ticks it
  and `assignExact`'s `isExact` gate fails, falling back to
  `assignFallback` for the WHOLE diagram.
- **Fix requires**: `class-dot-clusters.ts` (exclude a `packed`/phantom
  namespace from `nonEmptyNamespaceIds`'s keep-set; resolve
  `parentClusterId` past a packed ancestor) and a `Namespace.packed`-style
  field on `ast.ts` — NEITHER is in T7's write-set (write-set: only
  `class-namespace-resolve.ts`).
- Probe: `render-diff.mts sugifi-33-xefe083 sumule-00-pefa744` (both
  single `@id` diffs, gap scales with elided-segment count — confirmed
  unchanged after this session's edits).

### S-11 (rakuci-96-tuti371)

- **Mechanism** (now isolated to an exact line, was "unconfirmed" in
  S.md): `renderer-group.ts#wrapCluster` ALREADY exists and IS correctly
  wired (`renderer.ts:303`, `wrapCluster(ns.label, uid, ns.id,
  renderNamespace(...), ns.url)`) for a plain `package`/`namespace`
  block — confirmed working: the fixture's outer `package " XY " as XXY
  [[url]] {` renders its `<a>` wrap correctly. The DEFECT is that
  `rectangle "..." as CODE [[url]] { ... }` (a DESCRIPTIVE container —
  `YYY`/`XYY` in this fixture) never calls `setNamespaceUrl` at all: grep
  of `class-command-containers.ts` (descriptive-container command table)
  finds ZERO `.url =`/`setNamespaceUrl` calls, unlike
  `class-container.ts`'s `NAMESPACE_COMMANDS` (plain `package`/`namespace`
  block), which does. `Namespace.url` is simply never populated for a
  descriptive container, so `wrapCluster`'s own `url !== undefined` check
  is false and it silently no-ops — correct behavior given its input, the
  input is just never set.
- **Fix requires**: `class-command-containers.ts` (parse a `[[url]]`
  bracket on a descriptive-container header and call the existing
  `setNamespaceUrl`) — outside T7's write-set (the render-side consumer,
  `renderer-group.ts`, is already correct and needed no change).
- Probe: read `wrapCluster`'s ONE caller (`renderer.ts:303`) end-to-end;
  grepped `class-command-containers.ts` for any url-setting call (none);
  confirmed via the rendered SVG that the OUTER `package` (which DOES call
  `setNamespaceUrl` via `NAMESPACE_COMMANDS`) wraps correctly while the
  INNER `rectangle`s do not, in the SAME fixture, SAME render pass.

### S-12 (rojoxi-79-vimu822)

- **Mechanism** (now isolated to two exact lines, was "unconfirmed" in
  S.md; the T5 stderr/no-viewBox lead stays disproven): an empty
  `package "Classic Collections" #DDDDDD {}` collapses to a leaf
  classifier via `class-namespace.ts#collapseEmptyNamespace`, which copies
  `ns.stereotype` to the synthesized classifier (line ~106) but NEVER
  copies `ns.color` (the `#DDDDDD` background override) — so the
  collapsed leaf has no color of its own. Separately,
  `renderer.ts#renderEmptyPackageLeaf` builds a synthetic `NamespaceGeo`
  from the classifier's `ClassifierGeo` fields to hand to
  `class-namespace-shape.ts#renderEmptyPackageIcon`, and that synthetic
  object has no `color` field either — even if the classifier carried one,
  this adapter drops it. `emptyPackagePaint`
  (`class-namespace-shape.ts:404-416`, IN this task's write-set) has NO
  per-instance color parameter at all today — only theme-level fallbacks.
- **Fix requires**: `class-namespace.ts` (copy `ns.color` →
  `classifier.color`, mirroring the existing `stereotype` copy) AND
  `renderer.ts` (thread `geo.color` into the synthetic `NamespaceGeo`) —
  both outside T7's write-set. `class-namespace-shape.ts` alone (in
  write-set) cannot receive a value neither upstream file ever produces.
- Probe: read `collapseEmptyNamespace`'s full body (class-namespace.ts:
  74-113) — confirmed stereotype IS copied, color is NOT; read
  `renderEmptyPackageLeaf` (renderer.ts:107-135) — confirmed its
  `NamespaceGeo` literal has no `color` field; read `emptyPackagePaint`
  (class-namespace-shape.ts:404-416) — confirmed no override parameter.

### S-1b (xumofu-43-fode658)

- **Mechanism** (closed the diagnosis's own "probe next" — was LOW
  confidence, now HIGH): `CommandLinkClass.java:320-333` resolves BOTH
  relationship endpoints' quarks (`quarkInContextSafe`, pure Quark-tree
  walk/create, NO tick) BEFORE creating EITHER missing leaf
  (`reallyCreateLeaf`, which ticks + sweeps). So for
  `classic.collections.ArrayList <|-- net.sourceforge.plantuml.ArrayList`'s
  FIRST relationship (`java.lang.Object <|-- classic.collections.ArrayList`):
  both `java.lang.Object`'s AND `classic.collections.ArrayList`'s full
  dotted quark chains are registered (data-less, no tick) BEFORE `Object`
  is created; `Object`'s OWN creation-time sweep then finds `classic`/
  `classic.collections` ALREADY registered (countChildren > 0 each,
  because `classic.collections.ArrayList`'s own leaf-designate quark was
  registered by the earlier resolve pass) and ticks them immediately —
  `classic`(4)/`classic.collections`(5) BEFORE the `ArrayList` leaf itself
  is created (6). This port's `resolveRelationshipEndpoint`
  (`class-command-relationships.ts`) instead calls `ensureClassifier` —
  resolve+create+sweep bundled as ONE atomic step — separately for `from`
  THEN `to`, so `to`'s namespace chain isn't even registered until AFTER
  `from`'s own leaf-creation sweep has already run.
- **Fix requires**: splitting `ensureClassifier`'s resolve/create phases
  (`class-ensure-classifier.ts`) and restructuring the two-endpoint
  dispatch in `class-command-relationships.ts` to resolve BOTH endpoints'
  namespace chains before creating either missing leaf — both files
  outside T7's write-set, and a change of this shape to `ensureClassifier`
  (the single classifier-creation chokepoint) has blast radius far beyond
  this fixture; not attempted.
- Probe: read `CommandLinkClass.java:320-333` directly (cited but not
  previously read in full by the S.md diagnosis); traced the SAME 2-phase
  shape against `resolveRelationshipEndpoint`
  (class-command-relationships.ts:25-27, calls `ensureClassifier` per
  endpoint) and `class-ensure-classifier.ts`'s single-function resolve+
  create+sweep bundling.
