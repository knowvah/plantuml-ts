# The 1.5px offset: class edges hand the layout engine a text label where the jar hands it a sized box

Diagnosed 2026-08-13 on `oracle/goldens/svg-class/class-inheritance-interface-assoc`.
This is the "constant **1.500** offset accounts for 148 of them" residual that
[`class-realization-edge-rank-gap.md`](class-realization-edge-rank-gap.md)
recorded as a separate, unowned gap when it closed.

## Mechanism

**For class/component/usecase edges we pass `@knowvah/dot-engine` a plain-text
`label` attribute. The jar passes graphviz a `<TABLE FIXEDSIZE="TRUE"
WIDTH=".." HEIGHT="..">` reservation.** The engine therefore measures the
label *text* and reserves its own height — a constant **16.5** for one line —
where graphviz reserves the *declared* height, 15. A labelled edge spans the
rank gap, so the gap comes out `ranksep + 16.5 = 76.5` against the jar's
`ranksep + 15 = 75`, and every node below that rank sits **+1.5**.

The 1.5 is arithmetic on this fixture's numbers, not a constant: the error is
`16.5 - labelHeight`, so it grows with the label. A 60pt-tall label would be
out by 43.5.

## Origin

`src/core/graph-layout-build-edges.ts:85-89` — the `!hasLabelBox` branch:

```ts
const hasLabelBox = a?.labelBoxWidth !== undefined && a?.labelBoxHeight !== undefined;
if (a?.label !== undefined && !hasLabelBox) {
  attrs.label = a.label;          // <-- plain text; dot-engine measures it
  attrs.fontname = 'Times';
}
```

`labelBoxWidth`/`labelBoxHeight` are set **only** by the state-composite
pipeline (`state-composite-edge-label.ts#edgeLabelAttrs`). Every other caller
falls into the text path. That is deliberate and documented in the function's
own comment — it was scoped that way so the G8/T2 change stayed byte-for-byte
neutral elsewhere — but it leaves class/component/usecase on a path that
cannot convey a label's reserved size.

The jar's own dumped DOT for this fixture shows what it sends instead:

```
label=<<TABLE BGCOLOR="#000018" FIXEDSIZE="TRUE" WIDTH="45" HEIGHT="15">...
```

## Causal chain

1. `class-dot-graph.ts` supplies `labelWidth: 42.3875, labelHeight: 15`.
2. `addEdges` ignores both (no `labelBox*`) and sends `label: "owns >"`.
3. dot-engine sizes the label node from the text: height 16.5.
4. Rank gap = `ranksep + 16.5` = 76.5; graphviz = `ranksep + 15` = 75.
5. Ranks 2 and 3 sit +1.5 (once, not per-rank — rank 3's own gap is
   unlabelled and matches at 61.00 in both engines).
6. 148 of the fixture's 202 diffs are that offset; canvas height 387 vs 386.

## Ruled out

- **dot-engine.** Given the table form it matches real graphviz *exactly* at
  every height tested — boxH 15/20/30/60 → gap 75/80/90/120, and graphviz
  gives 75/80/90/120. The engine honors the reservation; we never send one.
- **Node sizing/measurement.** Every node's width and height is byte-identical
  to the oracle DOT (`sh0006 1.938542in × 72 = 139.575` = our `Animal`, and so
  on for all five).
- **Our DOT emission.** `parity-class.json` records `dotEqual: true`; the
  DOT-parity gate compares `svek-dot-emit.ts`'s output, which *does* emit the
  table. **The gate does not cover the graph handed to the layout engine** —
  two emitters, one gate. That is why this survived a green DOT gate.
- **Rank assignment.** Fixed separately on 2026-08-08; ranks now match.
- **tail/head labels.** Varying `tailLabelHeight`/`headLabelHeight` moves the
  rank gap not at all, correctly — they are xlabels.

## This also re-classifies `docs/graphviz-issues/11`

Issue 11 reports that dot-engine ignores a flat edge's label **width**. It
does not — it was measured through this same text path, which never conveys a
width either. Box-to-box gap on a `minLen: 0` edge:

| label width | via plain text (issue 11's path) | via FIXEDSIZE table | jar |
|---|---|---|---|
| 0 | 42.000 | 47.000 | — |
| 29 | 42.000 | **64.000** | 63.425 |
| 200 | 42.000 | **235.000** | ~234.4 |
| 400 | 42.000 | **435.000** | ~434.4 |

Flat at 42 on the text path — matching issue 11's "flat at 60.425" symptom —
and tracking the jar within ~0.6 on the table path. Same root cause, vertical
and horizontal.

## Why the obvious fix is NOT (yet) the fix

Falling back to `labelWidth`/`labelHeight` when `labelBox*` is absent takes
this fixture **202 → 13 diffs** and removes the canvas-height error, but
regresses `usecase/jecici-56-bimu826` (diff-count baseline 143 → 159); full
suite 1 failed / 12,829 passed.

The reason is visible in the numbers above: the jar's box is `WIDTH="45"`
where our raw `labelWidth` is `42.3875`. The jar reserves a **margined**
box — the `computeReservedLabelBox` formula the state pipeline already uses
(`SvekEdge.java:504-507` truncates towards zero) — not the raw measured label.
Class happens to land closer with the raw value; usecase lands further away.

So the real fix is to compute the jar's reserved box for these callers and
pass it, not to reuse the raw label dimensions. That is a mission with a
corpus-wide blast radius, not a drive-by.
