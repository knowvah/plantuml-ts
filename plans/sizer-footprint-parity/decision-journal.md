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
