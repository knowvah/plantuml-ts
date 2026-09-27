# ririlu-13-zipi740 — diagnosis (cdd4-T5)

Measured on `a21795294` (dot-engine 1.6.1; gvi 19 fixed, raw layout = real dot):
structural-match, 0 S / 12 N. All 12 diffs are MoreComplex's three DOWN `Kal`
boxes and their edge starts (`g[14..16]`): x is off by Δ25.77 on the first box
and by Δ12.88 on the other two.

## Mechanism

cdd3 B-6 left open why the jar escapes the `LineOfSegments` float-dust stall.
The reason is that the jar runs the Kal overlap fix **twice**, once per
`SvekResult#drawU` pass (pass 0 = the `calculateDimension` LimitFinder,
pass 1 = the SVG). Pass 1 starts from pass 0's result, for two reasons:

- `Kal#moveX` moves the edge start through `SvekEdge#moveStartPoint`, which
  mutates `dotPathInit` as well as `dotPath`.
- `SvekEdge#computeKal` re-seeds every Kal from `dotPathInit`.

So pass 1 gets `all.size()` more loops, in a frame shifted by `D`. With the jar's
own inputs, pass 0 stalls on 2.84e-14 exactly as ours does, and pass 1 then
resolves the x/y overlap. The port runs `fixKalOverlaps` once.

## Java (quoted)

- `svek/SvekResult.java:95` calls `computeKal();` inside `drawU`, and
  `:104-109` defines it:
  ```java
  private void computeKal() {
      for (SvekEdge line : clusterManager.getBibliotekon().allLines())
          line.computeKal();
      for (SvekNode node : clusterManager.getBibliotekon().allNodes())
          node.fixOverlap();
  }
  ```
  `drawU` runs twice: `:130-134` (`TextBlockUtils.getMinMax(this, …)` →
  `klimt/shape/TextBlockUtils.java:138-141` `tb.drawU(limitFinder)`, then
  `moveDelta`) and the SVG draw.
- `svek/SvekEdge.java:1069-1073`
  ```java
  public void computeKal() {
      if (kal1 != null) {
          final UTranslate tr = UTranslate.point(dotPathInit.getStartPoint()).compose(new UTranslate(dx, dy));
          kal1.setTranslate(tr, extremity1);
  ```
- `svek/SvekEdge.java:1346-1349`
  ```java
  public void moveStartPoint(double dx, double dy) {
      dotPath.moveStartPoint(dx, dy);
      dotPathInit.moveStartPoint(dx, dy);
  }
  ```
- `svek/Kal.java:204-211`
  (`this.translate = this.translate.compose(UTranslate.dx(dx)); if (link.getEntity1() == entity) SvekEdge.moveStartPoint(dx, 0);`)
  and `:179-180` (`setTranslate` replaces `translate`).
- `svek/SvekNode.java:445-464` (`fixOverlap` → `fixHoverlap`: a new
  `LineOfSegments` from `kal.getX1()/getX2()`, then `kal.moveX(res[i] - kal.getX1())`)
  and `svek/LineOfSegments.java:89-126` (`for (int i = 0; i < all.size(); i++) if (oneLoop() == false) return;`
  plus mean re-centring).

## TS origin

- `src/diagrams/class/class-edge-geo.ts:389` runs `fixKalOverlaps(placedKals);`
  exactly once.
- `src/diagrams/class/class-kal-overlap.ts:10-14` states the wrong contract:
  "So {@link fixKalOverlaps} runs once, after every edge is built."
- `fixKalOverlaps`/`fixHoverlap` (`:153-180`) are otherwise faithful.

## Causal chain

MoreComplex's DOWN Kals start at x 508.12/520/531.88 (jar −Tsvg, svek frame)
with widths 51.425/29.6375/64.725.

- **Pass 0:** loop0 pushes pair (1,2) by 45.3, then loops 1–2 push 2.84e-14
  (the stall), then the set is re-centred. `moveX` writes those diffs into
  `dotPathInit`.
- **Pass 1:** re-seeded from the moved starts at `dx=−1`, loop0 pushes pair (0,1)
  by 38.65, then stops. The boxes land at x 440.54/501.965/541.602, the jar's
  exact values.
- **Ours:** one pass leaves 466.307/489.081/528.718, the pass-0 stall. The edge
  starts ride `moveStartPoint`, hence the same Δ on `path/@d[0]`.

## Ruled out (with evidence)

- **dot-engine:** T0d. The raw layout matches real dot on 1.6.1, and edges
  4–6 were already exact in cdd3 (`B-engine-cmp`).
- **Kal widths / means:** equal (cdd3 B-6).
- **2-dp inputs alone (D3):** the current inputs are 2-dp (traced below) and
  still stall in one pass.
- **Frame choice for a second pass:** on the current 2-dp inputs, the pass-1
  result is the jar's to 3 dp in all three frames tried (svek → final,
  ours → final, ours → ours). On cdd3's old exact inputs, a same-frame second
  pass stalls again (`ours-frame two-pass` in the probe output), so the faithful
  frames (pass 0 = svek, pass 1 = final) matter for robustness.

## Probes

- `KAL_TRACE` print in `class-kal-overlap.ts#fixHoverlap` (reverted) gives the
  current inputs: `KAL [[469.4075,530.8325],[492.18125,531.81875],[486.5175,561.2425]]`
  (starts 500.12/512/523.88 in our frame, svek = +8, final = +7).
- `python3 plans/class-divergence-drive-4/diagnosis/scratch/ririlu-kal-2pass.py`,
  output in `scratch/ririlu-kal-2pass.out`:
  ```
  one pass (ours): … -> boxX [466.307, 489.081, 528.718]
  pass 1: loop0: pair 0,1 push 38.65 | loop1: stop -> boxX [440.54, 501.965, 541.602]
  ```
- `scratch/ririlu-kal-2pass-probe.diff` (TS, reverted) calls `fixKalOverlaps`
  twice. With it, `render-diff.mts ririlu-13-zipi740` gives
  `pass=true structural=0 numeric=0`. The class survey gives 1 verdict mover,
  ririlu → conformant (`scratch/survey-kal2-probe.out`; totals 702/5/16).

## Pass-0 ink (same mechanism, not observable here)

The LimitFinder pass draws the Kal boxes at their pass-0 (stalled) positions.
The class ink walk has no Kal term today (`grep kalBox` finds nothing in
`class-ink-box.ts`). ririlu's canvas is unaffected: the rightmost ink is a
class rect at 615.285 in a 630 canvas. The faithful port adds the pass-0 Kal
boxes to the ink.

## Fix shape

- `fixKalOverlaps` runs per pass. Pass 0 goes in the svek frame
  (inputs + m), and its box and start moves persist (the `dotPathInit`
  semantics). Pass 1 goes in the final frame (inputs + S), after D is known.
- The ink sees the pass-0 Kal boxes.
- It shares the SvekResult two-pass origin, and `m`/`S`, with gujigi, so it is
  **collapsed into batch-2 T10**. No separate T12.

## Confidence

HIGH. The jar's exact boxX is reproduced from the jar's own inputs, the TS probe
gives 0/0, and the survey shows one mover.
