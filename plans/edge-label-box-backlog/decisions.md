# Architecture decisions — edge-label-box-backlog

Decided 2026-08-16, approved by the maintainer. **Locked.** If execution
surfaces a conflicting constraint, stop and log it — do not silently override.

## D1 — One shared box module, not three engine-local formulas

**Context.** Upstream sizes every edge label in one place: `SvekEdge`'s
constructor builds the `TextBlock`s and `appendTable` writes the reservation
(`svek/SvekEdge.java:302-356, 440-507`). This port has
`src/core/edge-label-box.ts` — used by state and description — plus a
class-local re-derivation (`class-layout-edge-labels.ts:318` calls itself
"this engine's equivalent"). Class owns 29 of the 50 backlogged slugs.

**Decision.** Extend `src/core/edge-label-box.ts` to model all three upstream
arms — plain label, note-merged label, quantifier/role — and have class,
description and state call it. **Do not** port a full `SvekEdge` class.

**Consequences.** One formula to correct, one place to cite. A real `SvekEdge`
port would drag in `labelXY` and `drawU` positioning (`:745-975`) — a separate
structural mission, not a box-sizing one. `edge-label-box.ts`'s own doc comment
already records that its relocation out of `diagrams/state/` was motivated by
exactly this divergence; this finishes that move.

## D2 — Model `mergeLR`/`mergeTB` as dimension arithmetic

**Context.** A note on a link is not drawn beside the label — upstream *merges*
the two into one `TextBlock` before measuring: `mergeLR(noteOnly, labelOnly)`
for `Position.LEFT`, `mergeTB` for `TOP`/`BOTTOM` (`SvekEdge.java:319-325`),
then `+ 2 * labelShield` and `eventuallyDivideByTwo`. This port measures
strings, not blocks.

**Decision.** Implement the two merges as dimension arithmetic over two
measured boxes — **derived by reading `TextBlockUtils.mergeLR`/`mergeTB`'s own
`calculateDimension` bodies**, not inferred from the method names. The note
side's dimension must come from the existing note sizer: `EntityImageNoteLink`
is a decorated note image (padding, border, and on `lozego` a sprite), not
bare text.

**Consequences.** Closes M2 without the Phase 4h creole/TextBlock track. Carries
a named limit — a per-run font change inside a merged label still cannot be
represented, the same caveat `stripCreoleMarkup` already documents at
`edge-label-box.ts:52-64`. If a corpus fixture proves the arithmetic cannot
represent it, that is a `DIVERGENCES.md` entry, not an effort excuse.

## D3 — Resolve the cardinality font through the existing style cascade

**Context.** Upstream's `cardinalityFont` resolves the style signature
`{root, element, <diagram>, arrow, cardinality}`
(`GraphvizImageBuilder.java:124-126`, `getStyleArrowCardinality`), passed
separately from `labelFont` into `SvekEdge` (`:237-241`). `plantuml.skin` has
no `cardinality` block, so by default it inherits `arrow { FontSize 13 }` —
but a diagram may override it, and one in the corpus does.

**Decision.** Add a cardinality cascade alongside the existing `ARROW_SNAMES`
in `src/core/style-cascade-class.ts`, and thread the resolved font into the
quantifier/role box. Split quantifiers on `\n` through the existing
`Display.getWithNewlines` port (`splitEdgeLabelLines`).

**Consequences.** Wiring, not building — `resolveStyleCascade` and the
hierarchical `parseStyleBlock` already exist from the scoped-`<style>` work.
Retires the duplicated `CARDINALITY_FONT_SIZE = 13`
(`class-layout-edge-labels.ts:40` and an independent same-value constant in
`core/graph-layout.ts`).

> **Correction this mission owes the tree.** `class-layout-edge-labels.ts:25`
> asserts "no diagram in the corpus overrides `cardinality` specifically."
> `camuna-58-veca254` does, in a `<style>` block. Fix the comment in T6.

## D4 — Backlog shrink is the bar; no fixture may rise

**Context.** Reserved boxes are handed to dot-engine as `labelBoxWidth`/
`labelBoxHeight`, so changing one changes laid-out geometry and moves rendered
SVG. A DOT win that worsens rendering is not a win.

**Decision.** Every task runs the DOT gate **and** `shape-match-report`. A slug
leaves its backlog only when `labelSizeOk` passes; **no fixture may rise** in
the census. SVG ratchets are re-pinned only when the movement is demonstrably
toward the jar, with the measurement in the journal.

**Consequences.** Slower per task. Accepted: this is the mission where the gate
finally sees label size, and a silent geometry regression here would be the
fifth blind spot in this family (ports, `sametail`, `constraint`/`invis`, label
size). Precedent: SI22's own fifth gate — a census in which no fixture rises.

## D5 — M3 is diagnosis-before-edit, with a hard stop

**Context.** `givoli`'s tail/head swap is not a measurement defect, and the
`leaf-draw-order` follow-on already established that jar reorders links before
DOT emission (`CucaDiagramFileMakerSvek#getOrderedLinks`, `Link#sameConnections`).

**Decision.** T3 produces a stated mechanism — `file:line`, causal chain, what
was ruled out — before any edit. **If the root cause lands in edge emission
order rather than tail/head assignment, STOP** and hand it to the
edge-draw-order mission.

**Consequences.** Keeps M3's four slugs in scope where the fix is local, and
prevents this mission absorbing a known-separate one.

---

## The four mechanisms

Evidence gathered during planning, 2026-08-16, by drill-down against the
oracle (`scripts/dot-sync-report.ts --slug`). Read the Java before acting on
any of it.

### M1 — quantifier/role boxes: wrong font, no line split

`camuna-58-veca254` oracle vs ours:

| | oracle | ours |
|---|---|---|
| head 1 | `23x10` | `31x13` |
| head 2 | `41x20` | `71x13` |

Its source carries both halves of the mechanism in one fixture:

```
arrow {
  FontSize 14
  cardinality { FontColor red  FontSize 10  FontStyle italic }
}
...
Shop [customerId: long] ---> "customer\n1" Customer : foo1
```

Height 10 is the overridden cardinality font; `41x20` is two lines at 10. Ours
measures both with the arrow label font and one `measurer.measure` call
(`class-layout-edge-labels.ts:270-287`), so it produces neither.

**This was already known and deferred.** `class-layout-edge-labels.ts:33-38`
records the font mismatch and says it was "left untouched to avoid ANY risk to
the frozen DOT gate ... the DOT-gate comparator never numeric-checks
`taillabel`/`headlabel` table dims." D7 unfroze exactly that.

Upstream reference: `SvekEdge.java:328-340` (construction, `cardinalityFont`,
`Display.getWithNewlines`) and `:447-467` (emission — note the quantifier boxes
take the **raw** `calculateDimension`, with no `labelShield` and no
`marginLabel`, unlike the label arm at `:440-445`).

### M2 — note-on-link merged box

`lozego-15-coci435`: oracle `label=<TABLE ... WIDTH="137" HEIGHT="135">`,
ours `WIDTH="33" HEIGHT="15"`. Source is a `note on link` carrying a sprite:

```
Order --{ OrderItem:Items
note on link  #aqua/aliceblue
<$test>Note on rel
end note
```

We emit the bare label. Upstream merges note and label
(`SvekEdge.java:302-325`), adds `2 * labelShield` — 7 when the link type has a
middle decor, else 0 (`:352-356`) — and halves the width for the
`HALF_NOT_PRINTED` / `HALF_PRINTED_FULL` strategies (`:316`, `:485-489`).

### M3 — tail and head swapped

`givoli-70-rade072`, first edge only, out of ~100:

| | oracle | ours |
|---|---|---|
| taillabel | `19x13` | `7x13` |
| headlabel | `7x13` | `19x13` |

Every other edge in the fixture matches byte-for-byte. This is an assignment
defect, not a measurement one. Same family: `nadepi`, `tekena`, `tiguma`.
See D5 — diagnose before editing.

### M4 — few-px single-line width deltas

`berelu`, `canuti`, `gikipi`, `xopuku`. **No mechanism established.**

A tempting hypothesis was rejected during planning: `class-layout-edge-labels.ts:34`
says the label font is `theme.fontSize = 14` where `plantuml.skin` has
`arrow { FontSize 13 }`, which would explain a width delta. But `givoli`'s
plain labels match the oracle exactly (`22x15`, `44x15`, `80x15`) — if the font
were wrong, they would not. So that comment is stale, path-specific, or
describes something else. **T4 must establish which before T12 changes
anything.** Do not inherit this premise; it is the exact failure the
mission-index's method note names ("trace two levels — including in your own
plan").
