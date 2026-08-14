# Batch 4 — per-end port-label placement (issue 12)

Independent of batches 1–3 in mechanism, and disjoint from their write-sets.
Folded into this mission because it is the same family: batches 1–2 fix the
SIZE of an edge label's reserved box; this fixes where the TEXT sits relative
to a box that is already correct.

Source: `docs/graphviz-issues/12-port-label-placement-near-head-node.md`.
Read it in full before starting — it is the status, and it records two dead
ends that must not be re-walked.

## The gap

`object/tobuka-93-jale775` — **41 diffs, all port-label text positions**
(14 y, 14 x, rest). Every multiplicity-bearing edge (`A "1" -- "*" B`) is
affected.

`portLabelAnchor` (`src/diagrams/class/class-edge-geo.ts:202-223`) applies ONE
formula to both ends:

```ts
y: center.y - m.height / 2 + baselineOffset,
```

Upstream has a **per-end** rule. One formula fed correct centres cannot produce
opposite-signed errors, and the errors are opposite-signed:

| element | ours | jar | delta |
|---|---|---|---|
| `g[8]/text[1]` (head) | 146.561 | 153.195 | **+6.634** |
| `g[8]/text[2]` (tail) | 284.804 | 278.212 | **−6.592** |

Measured per-end offsets, jar baseline minus engine anchor:

| end | offset | samples |
|---|---|---|
| tail | **+18.244** | 18.246, 18.239, 18.247 |
| head | **+3.022** | 3.019, 3.025 |

Their midpoint is 10.633 — which is why the original filing measured a
"uniform +10.611" and concluded the conversion was fine. A single formula lands
on the average of two real constants. **Uniform is not the same as correct.**

## The head end is solved; the tail end is the batch

Derived, not fitted: `SvekEdge#getXY` is `getMinXY(...extractList(
POINTS_EQUALS))` (`SvekEdge.java:808-815`) — the **minimum** x/y of the marker
polygon, i.e. the reserved box's top-left. `PositionableImpl.create(pt, dim)`
stores that point verbatim, no centring (`PositionableImpl.java:44-52`), and
the draw is `drawU(ug.apply(new UTranslate(labelX, labelY)))`
(`SvekEdge.java:956-980`). So the baseline lands at `boxTop + ascent`. Both
boxes here are `HEIGHT="13"`, so `boxTop = centre − 6.5` and a 13pt ascent of
≈9.5 predicts **centre + 3.0** — the measured head constant to 0.02.

The tail end does not follow that: +18.244 is `boxTop + 24.74`, roughly a full
box height further down. **That extra ≈15.2 is the open question.** Upstream's
draw path for the two ends is textually identical (`:956-967` vs `:969-980`),
so the asymmetry enters earlier — either the two markers are emitted at
different anchors, or `moveAwayFrom` / the cluster-avoidance pass
(`SvekEdge.java:1208-1214`) displaces one end.

## Tasks

| id | task | write-set |
|---|---|---|
| [ ] T11 | **Diagnose** the tail-end ≈15.2. Produce a mechanism with `file:line`, not a constant. | none (diagnosis) — findings to `decision-journal.md` |
| [ ] T12 | Port the per-end placement into `portLabelAnchor` | `src/diagrams/class/class-edge-geo.ts` |
| [ ] T13 | Scope the 14 x diffs (deltas 0.98–39.36, not constant) — separate question, NOT explained by the above | none (scoping) |

T12 depends on T11. **If T11 cannot produce a mechanism, STOP** — do not ship
`+18.244` and `+3.022` as constants. The issue file is explicit that they are
evidence, not a formula, and hard-coding them would turn 14 diffs green while
burying the real rule. That is the exact failure this repo's "never fit a
value" rule exists to prevent.

## Exit bar

`tobuka-93-jale775`'s **14 y diffs go to zero**, via a rule whose every term
traces to a Java line. The 14 x diffs may remain; they are T13's to scope, not
this batch's to close.

## Dead ends — recorded so they are not re-walked

- **`place_portlabel` is not on this path.** `PORT_LABEL_DISTANCE`/
  `PORT_LABEL_ANGLE` only run when `labelangle` or `labeldistance` is set
  (`lib/common/splines.c:1321-1327`, same gate at `:1206`); our svek DOT sets
  neither, so both native graphviz and the engine route these through the
  xlabel placer (`postproc.c:addXLabels`). Any engine-side work belongs there.
- **The engine is not at fault.** Verified against the canonical oracle on four
  inputs including the fixture's own `svek-1.dot`: every `points=` and `d="M…"`
  identical. Issue 12 was reclassified from a dot-engine defect to ours on
  2026-08-13.
- **graphviz never draws these labels.** Our svek DOT declares them as empty
  `FIXEDSIZE` tables, so graphviz reserves a box and emits zero `<text>`. The
  jar draws the text itself from that box — which is why the rule to mirror is
  in `SvekEdge.java`, not in the engine.

## Watch-outs

- `SvekEdge.java`'s per-end placement **has not been read** as part of the
  re-diagnosis. It is the next place to look, not a confirmed line reference —
  treat `:956-980` and `:1208-1214` as starting points, and cite what you
  actually find.
- Batches 1–2 change the MAIN label's reserved box; tail/head labels carry
  their own `tailLabelWidth`/`headLabelWidth`. The coupling is expected to be
  nil, but re-measure `tobuka` after batch 2 lands rather than assuming.
- `tobuka-93-jale775` is an OBJECT fixture that routes through the CLASS
  engine, so `portLabelAnchor` changes reach both corpora. Run the object and
  class censuses, per-fixture.
- No pinned golden covers a multiplicity-bearing edge today except
  `class-inheritance-interface-assoc`, which batch 2 pins. That makes batch 2's
  pin the guard for this batch too — sequence accordingly if both are in play.
