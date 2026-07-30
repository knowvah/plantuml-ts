# Decision Journal — sizer-footprint-parity

Appended during execution. Every non-trivial judgment call gets an entry:
if a reasonable developer might have chosen differently, log it.

## Planning — 2026-07-30

The mission exists because planning **overturned the remedy the previous
mission filed**. Both halves of that remedy were checked against the Java
and found wrong:

- **`<img>` fallback.** The filed remedy was "thread the diagram-default
  font". `AtomImg.create` (`AtomImg.java:105-107`) hardcodes
  `UFontFactory.monospace(14)` + `blackBlueTrue`. The jar's 100.362×14 was
  that constant, not the diagram default — a coincidence of the number 14
  that made the wrong diagnosis look confirmed.
- **usecase ink.** The filed remedy was "add an ink channel to `AtomOps`".
  Upstream draws through `Footprint`, a point-collecting `UGraphic`, inside
  `TextBlockInEllipse`. It needs no channel because it measures real marks.
- **Therefore ADR-3:** upstream's `AtomImg` has no ink concept and
  `SheetBlock1.initMap` stacks on plain `sea.getHeight()`. One resolved
  value per atom is FAITHFUL. The gap was in two substitutes we built, not
  in the pipeline.

**A planning error worth recording.** Planning briefly concluded `Footprint`
was "ported but dormant". It is not — `TextBlockInEllipse.ts:7,37-38` uses
it. The claim came from a `grep -v` whose exclusion pattern hid the very
line that disproved it. Caught before it reached the brief. Same shape as
the zsh glob that once reported 24 live constants as dead.

## Execution outcome — 2026-07-30

**Final:** 449 files / 11029 tests, typecheck + lint + build clean.
Description **320/351 w0** (flat), class 219/708 w0, DOT 262/90/708 EQUAL,
parity guard 9/9. Perf **improved**: `gutute-00-gaki684` 17.42ms → 16.79ms
(-3.6%). Five commits.

### Delivered

- **Narrowing #3 (box + `<img>`) is CLOSED.** `jecici-56-bimu826` widened
  0.398264in unguarded before this mission and widens **0** now; its svg
  diff count fell 143 → 133. ADR-1 was right: `AtomImg.create` hardcodes
  `monospace(14)`.
- **Narrowing #2 single-line** routes.
- Two dead seams deleted: `imgFallbackFont` and `AtomImageResolver`'s ink
  fields. `SpriteDims`/`SpriteSvg`'s own ink fields correctly left alone.
- Three stale pins removed (`codabo-50-mupa164`, `fepuvo-06-rugi981`,
  `nenedo-78-fiva569`), each verified already at delta 0 at T3's starting
  commit — unrelated leftovers, attributed in `_doc`.

### NOT delivered, and both are my planning errors

**ADR-2 was falsified for the multi-line case.** I asserted that routing
through `Footprint` would make the ink channel unnecessary. T3 tested it by
dropping the guard and got the pre-mission 0.029321in widening back
verbatim. The cause is upstream of the routing: `fitToInk` substitutes a
sprite's INK box for its whole resolved dimension, and that one number feeds
both `SheetBlock1`'s stacking cursor and the position `Footprint` observes.
Upstream never puts ink in an atom's dimension — it narrows at draw time in
`Footprint#drawPath`. So the fix is to REMOVE `fitToInk`'s substitution, a
third diagnosis neither the previous mission nor this one had. **ADR-3 still
holds**: the fix is emphatically not a `Sea`/`SheetBlock1` channel.

T3 declined to add the forbidden channel and reported instead. That is the
behaviour the stop conditions exist to produce.

**ADR-2's "retire the substitute" was unreachable, and I traced one level.**
`usecase-footprint.ts`'s consumer chain does not end at `measureUsecase`:
`src/diagrams/class/class-layout-leaf-shapes.ts:14,27` calls it
unconditionally from the CLASS engine, predating the guard mechanism.
I checked `usecase-footprint.ts`'s callers and stopped, in a brief whose own
method constraints say to trace two levels. Third time this exact error has
appeared in this mission line — and the first two were the ones I wrote the
constraint about.

### The decomposition error, recorded plainly

T2 and T3 were split by FILE when the call graph made them one unit:
retiring the substitute required editing `leaf-sizing.ts`, which was T3's.
T2 stopped on the boundary, correctly, and I folded its half into T3
mid-mission. The brief's own constraint — "disjoint write-sets are necessary
but NOT sufficient" — was written by me, about parallelism, and I then
violated it in the sequential decomposition.
