# B35 — where upstream's `UEmpty` ink reservation actually comes from

## Observation: `TextBlockMarged` is the only `UEmpty` draw site in upstream

- **Context**: B35, chasing why a classifier's ink max-X is sometimes `x+w`
  and sometimes `x+w-1`. Two prior missions had attributed the `+1` to a
  full-box `UEmpty` (G2 N5) and then denied `UEmpty` was drawn at all (T7).
- **Finding**: `grep -rn "draw(UEmpty\|UEmpty.create" src/main/java/net/`
  returns exactly **one** draw site in the whole tree:
  `klimt/shape/TextBlockMarged.java:83`, `ug.draw(UEmpty.create(dim))`,
  where `dim` is that block's OWN dimension. `LimitFinder#drawEmpty`
  (`LimitFinder.java:159-162`) bounds it with a plain un-inset bbox, so it
  reaches 1px past `drawRectangle`'s `-1`-inset corner (`:184-188`).
  Every body compartment is wrapped in one — `BodyEnhancedAbstract#decorate`
  (`:106-118`) and `MethodsOrFieldsArea#asBlockMemberImpl` (`:83-86`).
- **Impact**: any future "what reaches this edge?" question on a class/object
  box should start here. Note `decorate`'s `separator == 0` arm returns
  `TextBlockUtils.withMargin(block, marginX, 0)`, and `withMargin` returns the
  block **unwrapped** when both margins are 0 — so `BodyEnhanced2`
  (`getMarginX() == 0`) draws NO `UEmpty` for its first compartment.
- **Confidence**: High — single grep over the full tree, plus the
  jar-verified arithmetic it predicts.

## Observation: class and object headers reach the box edge differently

- **Context**: deciding whether the conditional max-X rule was corpus-wide.
- **Finding**: `HeaderLayout#drawU` (`svek/HeaderLayout.java:89-109`) centers
  the name in `suppWith = width - circleW - widthStereoAndName - genericW`,
  which is **exactly 0** when the header drove the width — so a class name's
  own `UEmpty` lands on `x + w`. An object header is placed by
  `PlacementStrategyY1Y2#getPositions`
  (`klimt/geom/PlacementStrategyY1Y2.java:59`) at a strict
  `x = (width - blockWidth)/2`, and `EntityImageObject:150-153` pads the
  title term by `2 * xMarginCircle`, so it always stops 5px short.
- **Impact**: `EntityImageClass` and `EntityImageObject` are NOT
  interchangeable for ink reasoning even though their
  `calculateDimensionSlow` bodies look nearly identical. A rule verified on
  one does not transfer to the other.
- **Confidence**: High — jar-verified downstream by 317 byte-exact class
  goldens holding unchanged across the B35 change.

## Observation: byte-exact golden count is a scope oracle, used pre-emptively

- **Context**: the B35 brief asserted "expect class movement — this rule is
  corpus-wide". It was wrong.
- **Finding**: 317 class goldens were already byte-exact against the jar
  under the OLD rule. That alone falsified the scope claim before any code
  was written: a title-driven class box cannot be byte-exact under `x+w` if
  it truly needs `x+w-1`.
- **Impact**: when a brief predicts movement in a corpus that is *already*
  pinned byte-exact to the oracle, treat the prediction as a hypothesis to
  test against the existing pins first — it is cheaper than a re-measure and
  it can invert the mission's scope.
- **Confidence**: High.
