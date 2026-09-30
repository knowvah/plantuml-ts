## Observation: kexaba lone-sprite edge label draws at box-origin+8, Java trace predicts +1

- **Context**: T1b (mission cdd7), kexaba-26-kobu577 (`edge-label-not-creole`,
  cdd6 rows 50/63, D5). Fixing the lone-sprite `<image>` draw offset for a
  class-diagram edge label that is entirely one `<$sprite>` atom.
- **Finding**: D5 step 1 confirms `lp="68,127"` is IDENTICAL between real
  `dot -Tdot` fed the jar's cached `svek-1.dot` and real `dot -Tdot` fed this
  port's own captured DOT (dot-engine blame ruled out). Using that `lp` and
  the DOT's declared `WIDTH="19" HEIGHT="14"` box, the reserved label box's
  top-left corner computes to `(58.5,106)` in this port's own coordinate
  frame. This was cross-validated two independent ways:
  1. From the jar's real `dot -Tsvg` output: the `fill="#000009"` polygon's
     raw points, converted via this port's own `x` unchanged / `y = 240 -
     raw_y` transform (graph height 240, `svek-1.dot`'s own bounding box).
  2. Algebraically from `lp` + box dims directly (same transform).
  Both agree, AND this port's own `edgeResult.tailLabelX/Y` (48, 82.63)
  matches real dot's raw `tail_lp="48,157.37"` exactly under the SAME
  transform, proving the shared coordinate frame (not just this one box) is
  correct — this rules out a dot-engine coordinate-mapping bug.

  A full Java trace of the label draw path (`SvekEdge.java`):
  - `:372-373` `addVisibilityModifier`'s `marginLabel` wrap
    (`TextBlockUtils.withMargin(block, 1, 1)` for a non-self-loop link,
    `startUid.equalsId(endUid) ? 6 : 1`).
  - `:353-356` `labelShield` — confirmed `0` for kexaba: `--{ ` parses to
    `LinkDecor.CROWFOOT` (`decoration/LinkDecor.java:80`), an END decor
    (`decor1`/`decor2`), never a `LinkMiddleDecor` (`LinkMiddleDecor.java`
    has no CROWFOOT case at all).
  - `:745-747` `labelXY = TextBlockUtils.asPositionable(labelText, ...,
    getXY(fullSvg, noteLabelColor))` — `getXY` (`:808-814`) returns the raw
    MIN x/y of the label's own rendered polygon, no re-centring.
  - `:951-954` draw translate = `labelXY.getPosition() + labelShield` (both
    axes).
  - `TextBlockMarged.drawU` (`klimt/shape/TextBlockUtils.java:64-68,
    82-89`) then translates the wrapped sprite by `(left=1, top=1)` before
    drawing it.

  Every one of these predicts a final draw position of box-origin + `(1,1)`
  = `(59.5,107)` — which IS this port's pre-existing (pre-fix) output, and
  IS algebraically what the OLD `spriteLabelAnchor` computed
  (`center.x - Math.trunc(sprite.width)/2`, collapsing `reservedWidth/2 -
  marginLabel` since `reservedWidth = spriteWidth + 2*marginLabel`).

  The jar's own oracle SVG
  (`test-results/dot-cache/unknown/kexaba-26-kobu577/in.svg`) instead draws
  the `<image>` at `(66.5,114)` = box-origin + `(8,8)`, a residual `+7`
  beyond every one of the above. Ruled out as the source of that `+7`:
  - `SkinParam.getPadding()` (`skin/SkinParam.java:1146-1150`, reads the
    `skinparam padding` value via `getAsDouble`, defaults to `0` when unset)
    — this fixture never sets `skinparam padding`, so
    `Display.java:697`'s `SheetBlock1(sheet, maxMessageSize, padding, ...)`
    padding is `(0,0,0,0)`.
  - `AtomSprite` (`klimt/creole/atom/AtomSprite.java`) — `drawU` calls
    `sprite.asTextBlock(...).drawU(ug)` directly, no translate.
  - `AtomWithMargin` (`klimt/creole/atom/AtomWithMargin.java`) — not on this
    path (that class is for cardinality visibility icons, not sprites).
  - A second `labelShield`-like constant near the draw site — none found;
    `grep -n "= 7\|= 8" SvekEdge.java` surfaces only `labelShield = 7` (the
    middle-decor case, ruled out above) and the unrelated
    `useShieldForQuantifier()` node-margin branch (`:232-239`, affects node
    `ensureMargins`, not label draw).
- **Impact**: The fix (`class-edge-label-anchor.ts#spriteLabelAnchor`)
  implements the EMPIRICALLY CONFIRMED `+8,+8` inset (matching D5's own
  stated expectation and cdd6 T3e's prior finding, independently
  reproduced this session with a fresh `dot -Tdot`/`-Tsvg` run and an
  instrumented render), but the precise Java statement contributing the
  extra `+7` beyond `marginLabel` was NOT found within this session's
  budget. If a future sprite-edge-label fixture regresses or a self-loop
  lone-sprite label (`marginLabel === 6`) needs this formula, re-open this
  diagnosis before assuming `marginLabel + 7` generalizes — it has not been
  verified against a `marginLabel === 6` fixture.
- **Confidence**: High (the `+8,+8` value itself, cross-validated twice
  against the oracle and this port's own proven-correct coordinate frame);
  Low (the exact Java line producing the extra `+7` — not found).
