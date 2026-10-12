# sep-T2c: salt containers and placement

## Observation: Grid's line draw order is java.util.HashMap bin order
- **Context**: porting `Grid.java:57-58` (`Set<Segment> horizontals/verticals = new HashSet<>()`), iterated by `drawU`.
- **Finding**: the jar draws segments in HashMap bin order — bin `(n - 1) & (h ^ h >>> 16)` with `h = row * 47 + col`, insertion order within a bin, table 16 doubling when `size > 0.75 n`. `cifali-45-fexa238` `{+` verticals draw (0,0), (1,2), (0,2), (1,0); a 7 x 4 `{#` (67 segments) pins the 32- and 64-bin resizes. `Grid.ts` carries a module-private `HashSet` emulating `putVal`/`resize`; tree bins (9+ in one bin of a 64+ table) are not emulated.
- **Impact**: any port iterating a Java `HashSet`/`HashMap` whose order reaches the SVG needs the bin emulation, not a TS `Set` (insertion order) — de-duplication alone is not enough.
- **Confidence**: High

## Observation: RecordingUGraphic's string bounder answers 0 x 0
- **Context**: recording an `ElementPyramid` draw with `tests/unit/salt/element/recording-ugraphic.ts`.
- **Finding**: `getStringBounder()` returns a stub measuring every text 0 x 0, so a container that measures at draw time (pyramid `init`, title height, `ElementPyramidScrolled`'s `super.getPreferredDimension`) sizes itself from empty text and the recorded coordinates are not the jar's. The container tests override `getStringBounder` with the deterministic bounder.
- **Impact**: a recorded coordinate that disagrees with the jar may be this instrument, not the port — check which bounder measured first.
- **Confidence**: High

## Observation: `*` merged past the last column is a jar crash row
- **Context**: `Positionner2#mergeLeft` with NEWLINE terminators (`{` / `a` / `b` / `*` / `}`).
- **Finding**: `mergeLeft` updates the max BEFORE moving, so the merged cell's `maxCol + 1` exceeds `getNbCols`; `ElementPyramid.java:151` throws `ArrayIndexOutOfBoundsException: Index 2 out of bounds for length 2` (jar error page, `fixtures/pyramid-merge-overflow.jar.svg`). The port throws the same message as a `RangeError`. `*` as a pyramid's first cell is a `NullPointerException` (`Positionner2.java:89`).
- **Impact**: T3c/T4 must surface both as the jar's crash page, not draw.
- **Confidence**: High
