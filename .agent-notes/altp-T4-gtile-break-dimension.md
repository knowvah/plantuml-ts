## Observation: `GtileBreak` is 20x20; the jar's own `FtileBreak` is 0x0

- **Context**: altp-T4, porting `FtileFactoryDelegatorWhile`'s break
  welding (`walk-while-branch.ts`'s `pushWhileWeldings`). Read
  `FtileBreak.java:47-51` (`super(skinParam, swimlane)`) through
  `FtileEmpty.java:74-76` (`this(skinParam, 0, 0, swimlane)`) to confirm the
  weld target point.
- **Finding**: upstream's `FtileBreak` has `width = 0, height = 0` (the
  `FtileEmpty(ISkinParam, Swimlane)` constructor hard-codes `0, 0`). Our
  port's `src/diagrams/activity/tiles/gtile-break.ts` has `readonly width =
  20; readonly height = 20;`, with no `@see` citing where 20 comes from.
  Not this task's write-set (`gtile-break.ts` is outside T4's files) and not
  fixed here.
- **Impact**: the weld connection itself is unaffected -- upstream's own
  weld point is the break tile's own translated ORIGIN (`Genealogy
  #getTranslate`, `tr1.getDx()/getDy()`, `FtileFactoryDelegatorWhile.java
  :108`), which this port mirrors via the pushed node's own `(x, y)`
  (`tile-coordinates.ts`'s `'gtile-break'` case), independent of width/
  height. But a 20x20 break BOX still occupies layout space (compression
  reservations, sibling spacing, the break's own rendered shape) that the
  jar's 0x0 one does not -- a likely contributor to break-fixture score
  deltas (`bareka-88-fusu160` and others in `fixtures.md`) beyond the
  `if`-side divergence T4 already named.
- **Confidence**: High (direct Java read, both constructors quoted above).
