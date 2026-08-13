# SI1/T2 — abel enum/small-type layer

## Observation: LinkType.equals compares LinkStyle by REFERENCE
- **Context**: Porting decoration/LinkType.java:106-109 for SI1/T2.
- **Finding**: Upstream `LinkType.equals` uses `==` on the `LinkStyle`
  field, and every `LinkStyle.NORMAL()/DASHED()/...` factory call
  allocates a fresh instance. Two independently-built `LinkType`s are
  therefore NEVER equal; only copies derived from the same instance
  (withoutDecors1, getPart1, ...) share the style reference and can
  compare equal. Ported verbatim with `===`
  (src/core/abel/decoration/LinkType.ts).
- **Impact**: T6 (Link) and the T11 dedup must NOT "fix" this by adding
  value equality — `Link.sameConnections` (:462-470) compares entities,
  not LinkType, so dedup semantics do not depend on it, but any future
  use of LinkType.equals must preserve the reference quirk.
- **Confidence**: High (read upstream source directly).

## Observation: decoration/ types homed under abel/ by write-set
- **Context**: T2's write-set was `src/core/abel/**` only; upstream
  package for LinkDecor/LinkStyle/LinkMiddleDecor/LinkType is
  `net/sourceforge/plantuml/decoration/` (mirrored home would be
  `src/core/decoration/`, which already exists holding `symbol/`).
- **Finding**: Ported to `src/core/abel/decoration/*` to stay in
  write-set; headers note the tension. A `git mv` + import fixes moves
  them to `src/core/decoration/` if the orchestrator prefers.
- **Impact**: Path divergence from upstream package layout until moved.
- **Confidence**: High.

## Observation: blocked members (deps outside T2 write-set)
- `LinkDecor.getExtremityFactoryLegacy` CIRCLE_CROSS / ARROW_AND_CIRCLE
  branches throw: `ExtremityFactoryCircleCross` /
  `ExtremityFactoryArrowAndCircle` unported repo-wide (both decors are
  token-unreachable — decors1/decors2 null upstream).
- `EntityPosition.drawSymbol/getDimension` blocked on `Rankdir`
  (klimt/geom — T4's dir this batch, 2-value enum, unported);
  `getShapeType` blocked on full 12-value svek/ShapeType (existing port
  in EntityImageDescriptionSupport.ts has 5 values, lacks
  RECTANGLE_PORT, engine file — not modifiable by T2).
- `LinkArrow.mute` blocked on svek/GuideLine (unported).
- `LinkMiddleDecor.getMiddleFactory` blocked on MiddleFactory* family
  (svek/extremity, unported).
- **Impact**: Follow-on task should land Rankdir + ShapeType(12) +
  GuideLine + MiddleFactory* + the two extremity factories, then
  complete these members.
- **Confidence**: High.
