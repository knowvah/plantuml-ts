# cdd2-T13 — canvas ink walk (Q-9, Q-6), Q-11/Q-4/Q-5 artifacts

## Observation: Q-6 is the pre-move path in the ink walk, not port rows
- **Context**: nenepe/pegeso canvas 3px narrow, zero ink diffs.
- **Finding**: `buildInkBox` walked `EdgeGeo.points`, which since T12 is the
  PRE-extremity `dotPath`. Upstream mutates `this.dotPath` in
  `getExtremitySimplier` (`SvekEdge.java:539-562`, `moveEndPoint` moves the
  end point AND the last control point, `DotPath.java:229-234`) before
  `drawU`, so `LimitFinder#drawDotPath` (`LimitFinder.java:190-194`) bounds
  the moved control point. nenepe: 106.724 -> 111.724 (5px arrow trim).
  Fixed with `class-ink-dot-path.ts#drawnEdgePoints` (the renderer's own
  `buildEdgeArrowheads` trims fed to the same `applyDecorTrim`).
- **Impact**: also closed gekope, xefeme (the "5.001 X-shift" of cdd T36
  row 222), zuramo 147 -> 2, object ruloso, unknown pavuso/seloni.
- **Confidence**: High (probe of `buildInkBox` input; red/green tests).

## Observation: Q-11 is HeaderLayout's suppWith, not Kal geometry
- **Context**: rilali/xoxega/goloxu (and rifuzu/camuna/nafiki) 1px WIDE.
- **Finding**: the widest ink is a class box widened by
  `getKalWidth() * 1.3` (`EntityImageClass.java:113`). The widening leaves
  `suppWith > 0` in `HeaderLayout#drawU` (`HeaderLayout.java:88-104`). The
  name's `TextBlockMarged` `UEmpty` therefore ends at `x + w - h1`
  (goloxu class3: h1 5.127, name right 218.992). The body's `UEmpty` stays
  at the body's own width. So the max is the rect's `LimitFinder
  #drawRectangle` corner `x + w - 1`. `class-ink-shapes.ts#addRectInk`
  uses a fixed `x + w` for classes (`bodyInkWidth` undefined), and its doc
  comment assumes suppWith is 0. The jar maxX is x+w-1 in all four:
  goloxu 223.119, rilali 357.119, xoxega top 358.755, rifuzu Shop 388.534.
- **Impact**: the fix is to have `measureGenericClassifier`
  (`class-layout-generic-classifier.ts`) export `bodyInkWidth` = max(name
  UEmpty right, body UEmpty right). Both files are outside T13's write-set.
  The Kal boxes are not the max ink (Kal right 204.07 < 224.119).
  `minClassWidth`/`sameClassWidth` widening reaches the same branch.
- **Confidence**: High (four fixtures, jar arithmetic exact).

## Observation: Q-4/Q-5 need Theme/renderer fields outside the write-set
- Q-4: jar probes (`class { BackgroundColor yellow; LineColor blue }`,
  `classDiagram { generic { LineColor red } }`, `element { BackgroundColor }`,
  `skinparam classBackgroundColor/BorderColor`) all recolour the generic tag.
  Upstream merges user styles after `plantuml.skin:211-213`'s `generic {
  BackgroundColor white }`. Ours stays `#FFF`/`#181818` in all four. The
  carrier needs a `Theme.colors.graph` field (`theme-graph-colors-a.ts`),
  and the skinparam path needs an "explicitly set" marker.
- Q-5 (live): size and colour are already cascaded into `theme.cardinality
  Font*`, and positions match. What is left is the DRAWN `font-size`, which
  is hard-coded `CARDINALITY_FONT_SIZE` (`renderer-edge-extras.ts:222`), and
  `FontStyle`, which has no field at all (`style-cascade-class.ts:210-226`,
  `theme.ts:26-29`). `addEdgeTextInk`'s text height uses the same constant.
  Upstream uses the font's own height (`LimitFinder.java:217-225`).
- Q-10: gone after T11/T12. rifuzu's remaining diffs are link 2
  (dot-engine issue 19) plus the Q-11 canvas px.
