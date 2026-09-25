# cdd2-T7b — `stack` container shape (R-8, lojiga-09-meka859)

## Result

lojiga-09-meka859: structural 3 → 1, numeric 160 → 0. Remaining
structural=1 is the pre-identified T9/T12 edge-spline mechanism
(`DotPath#moveStartPoint`, journal row 15) — confirmed still present,
untouched (out of this task's write-set).

## R-8's own diagnosis was wrong about WHAT was missing

R-8 (`plans/class-divergence-drive-2/diagnosis/R.md`) concluded "no
dedicated shape renderer" and estimated a new
`class-namespace-stack-shape.ts` (~60-100 lines). That premise was
false: `src/core/decoration/symbol/USymbolStack.ts` is a COMPLETE,
already-jar-cited port of `USymbolStack.java` (`asSmall`/`asBig`/
`drawQueue`/`getMargin`, all present, all doc-commented with Java
citations), and `src/diagrams/class/class-namespace-usymbol-shape.ts` +
`renderer.ts:88` already dispatch ANY `NamespaceGeo.usymbol` through
that shape's own `asBig` generically (the SAME mechanism that already
draws `<<Node>>`/`<<Database>>`/`<<cloud>>` clusters, jar-verified
against `dativu-93-pona469`). No new shape file was created — it would
have been dead code (unreachable, since the dispatch that would call it
already exists).

## The REAL mechanism: `Namespace.usymbol` was never populated for the direct-keyword form

Probe (`layoutClass` on `stack a as a { class foo1 ... }`) showed
`ast.namespaces[0].usymbol === undefined` even though
`class-command-containers.ts`'s rule 5b' (`CommandPackageWithUSymbol`,
`stack a as a {`) DOES parse the keyword — it stores it only in
`state.descriptiveContainers` (consumed by `closeContainer` for the
EMPTY→leaf collapse case only). `Namespace.usymbol` is copied
verbatim into `NamespaceGeo.usymbol`
(`class-geo-namespace-types.ts`), which is what
`renderNamespaceUSymbol` gates on — `undefined` fell through to the
generic folder-tab path.

Upstream (`CommandPackageWithUSymbol.java:197-198`,
`diagram.gotoGroup(location, ident, display, GroupType.PACKAGE,
usymbol)`) stamps the group's `USymbol` UNCONDITIONALLY at open time,
whether the container ends up empty or not — there is no branch that
withholds it from a non-empty cluster. Fixed in
`class-container.ts#closeContainer` by setting `ns.usymbol = usymbol`
there too (mirrors `applyNamespaceUsymbol`'s OPEN-time write for the
sibling GATED `package X <<Node>>` path, `setNamespaceStereotype`).

Unconditional for every `USYMBOL_NAMES` keyword (`ns.usymbol =
usymbol;`, no per-keyword special case) — mirrors
`CommandPackageWithUSymbol.java:197-198` exactly, per orchestrator
follow-up and mission D4 (a rise is acceptable once its mechanism is
stated — see "Movers" below for both).

## The ink term: `USymbolStack#drawQueue` draws an invisible URectangle that also registers ink

Once the shape dispatch was reachable, render-diff dropped to
structural=1, numeric=0 in ONE step except for a uniform Δ1 on every Y
coordinate in the whole document (`svg/@height` 258 vs our 257, every
element below the cluster shifted). Root cause:
`USymbolStack#drawQueue` (`USymbolStack.java:64-65`) draws an
INVISIBLE inner `URectangle.build(width-2*border, height)` (`border =
15`, `HColors.none()`) BEFORE the visible notched-outline `UPath`.
`LimitFinder.draw` dispatches on shape TYPE, not color
(`LimitFinder.java:108-123`) — an invisible fill/stroke still
registers ink. `LimitFinder#drawRectangle`'s classic `-1/-1` min-inset
rule (`LimitFinder.java:184-188`) applied to this inner rect gives
`minY = n.y - 1`, one pixel ABOVE the visible outline's own top
(`n.y`) — the outer path's own un-inset max corner dominates on every
other axis/corner, so this is the ONLY net effect. Added
`addNamespaceStackInk` (`class-ink-shapes.ts`), wired in
`class-ink-box.ts#addNamespaceInk` keyed on `n.usymbol === 'stack'`
directly (not a new `NamespaceGeo.inkShape` bucket — `class-geo-
builders.ts`/`class-geo-namespace-types.ts` are outside this task's
write-set, and the existing `usymbol` field already carries what's
needed).

Unit-verified in `layout-ink-extent.test.ts` (isolated
`computeClassDocumentDims`/`computeClassInkShift` calls, no
full-pipeline dependency) with lojiga's own probed numbers (`x=6,y=6,
width=221,height=236.000048` — jar canvas 364×258).

## Movers outside the assigned list

Confirmed via `git stash` isolating JUST `class-container.ts`: with it
reverted, both fixtures below reproduce b0's EXACT numbers (1/344,
6/196) — 100% attributable to the unconditional `ns.usymbol = usymbol`
stamp, zero interaction with the ink-shapes/ink-box changes (which are
`stack`-only regardless).

### xadado-92-lazo250 (`component "C1" as C1 { note "{{...}}" as detailsNote1 }`)

diverged (1/344) → structural-match (0/352) — a `compareSvg`
non-monotonic reveal (per `comparesvg-count-not-monotonic.md`): the
structural diff that CLOSED was `svg/g[1]/g[1][childCount] exp=5|act=3`
(the folder-shape fallback drew 3 children for the component cluster;
`USymbolComponent#asBig`'s real chrome draws 5 — confirmed by re-running
with `class-container.ts` reverted), and once that mismatch stops
short-circuiting the comparator, it walks deeper and the new 352
numerics it surfaces are ALL keyed off one pre-existing, unrelated,
already-known gap: a uniform canvas-size shortfall (`svg/@width` Δ45,
`svg/@height` Δ1, every element below shifted `Δ11`/`Δ1`) from the
embedded `{{ participant MyA ...}}` sequence-diagram note inside this
component, whose real size this port cannot measure yet
(`note-layout-measure-rows.ts`'s own `EmbeddedDiagram.ts#
NestedDiagramRenderer` seam: *"no NestedDiagramRenderer wired for
{{...}} embedded-diagram note regions yet"*, thrown and caught at
render time on every `render-all.mts` run touching this fixture).
`USymbolComponent`'s OWN shape/ink is not implicated — the shift is
uniform, not garbled geometry. Accepted divergence, out of mission; no
fix (the embedded-diagram-sizing gap is a separate, already-tracked
seam, not part of this task's write-set).

### xenere-07-kuji864 (`rectangle pack2 <<ddd>> { legend ... end legend  class foo3 }`)

diverged (6/196) → diverged (8/212), structural ROSE. Mechanism,
Java-cited: `rectangle pack2 <<ddd>>` is `CommandPackageWithUSymbol`'s
DIRECT-keyword grammar (`rectangle` is already the SYMBOL token), so
`<<ddd>>` is a REAL, DISPLAYED stereotype
(`CommandPackageWithUSymbol.java:204-206`,
`p.setStereotype(Stereotype.build(stereotype, false))` — NOT the
USymbol-naming GATED grammar, `CommandPackage`, a different regex).
Jar's `ClusterHeader#getStereoBlock` (`svek/ClusterHeader.java:
173-180`) merges that displayed stereotype with the group's OWN
per-container legend (`Entity.legend`/`getLegend()`,
`abel/Entity.java:101,551-557`, set when a `legend...end legend` block
is written INSIDE the container's body — `EntityImageLegend.create`,
`DecorateEntityImage.add`) into one header block jar draws as part of
the cluster's chrome (confirmed directly against the jar SVG: pack2's
`<g class="cluster">` has 5 children — outer `<rect>`, the legend's
own rounded `#DDD` note box, 1 legend text line, the `«ddd»` stereotype
text, and the `pack2` title text). This port's
`class-namespace-usymbol-shape.ts#buildDecoration` (line ~189)
unconditionally passes `TextBlockUtils.empty(0, 0)` as the
`ClusterDecoration` stereotype param — correct ONLY for the GATED case
(where the stereotype names the shape and is consumed, never
displayed, per that function's own doc comment) but wrong here, where
the stereotype is real text. Independently, and even were that fixed,
this port has NO per-namespace legend storage at all —
`parser.ts:309-326`'s own doc comment: legend content lands in one
GLOBAL `state.ast.annotations.legend` slot, not a per-`Namespace`
field (`ast.ts` has no `Namespace.legend`) — confirmed pre-existing and
unrelated to this task's change: `pack1` (a PLAIN `package <<st>>`,
never touched by `class-container.ts`'s direct-keyword stamp) shows the
IDENTICAL symptom (`childCount exp=7|act=3`, unchanged before/after
this fix).

Both defects (stereotype-display suppression, missing per-namespace
legend) require edits to `class-namespace-usymbol-shape.ts` (outside
this amendment's write-set: `class-container.ts`,
`class-namespace-shape.ts`, `class-ink-shapes.ts`, `class-ink-box.ts`,
new shape files, tests) and, for the legend half, `ast.ts`/`parser.ts`/
`class-namespace-title-table.ts`/BOTH render paths (jar's
`ClusterHeader` is shared by the folder path too, per `pack1`'s
identical symptom) — a materially larger, differently-scoped, multi-
file feature (parser AST + layout sizing + two render paths). Not
edited. Kept the unconditional stamp per the orchestrator's
instruction; this artifact is for the mission ledger to journal
against `xenere-07-kuji864`'s risen structural count.

### Follow-on for a future mission task

1. `class-namespace-usymbol-shape.ts#buildDecoration`: thread the
   group's OWN displayed stereotype (when not USymbol-gated) into the
   `ClusterDecoration` stereotype param instead of unconditionally
   passing an empty block.
2. A per-namespace legend feature: `Namespace.legend` (ast.ts),
   parser-side recognition of `legend...end legend` while inside a
   group scope (currently always global,
   `state.ast.annotations.legend`), and BOTH `class-namespace-shape.ts`
   (folder/rect paths) and `class-namespace-usymbol-shape.ts` merging
   it into their header bundle, per `ClusterHeader.java:173-180`.
3. `USymbolComponent`'s embedded-note interaction (`xadado`) is
   entirely downstream of the pre-existing `{{...}}`
   `NestedDiagramRenderer` gap — no class-diagram-specific work needed
   there; closing the general embedded-diagram sizing seam elsewhere
   resolves it for free.

T7's own pre-existing movers (its commit already landed on this
branch before T7b started): `pibifa-14-leno075`,
`begico-70-guva302`, `vuresa-33-kumu160` (all → conformant),
`nagega-30-poso418` (→ structural-match), `xoxuni-96-fere626`
(diff count fell 4/0→1/0, same verdict both times, no pin-diff line —
not a "transition" by that tool's own definition, but real and
pre-existing per T7's own agent-notes). None of these are T7b's.
