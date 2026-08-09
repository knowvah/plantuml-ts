# H1 — `skinparam handwritten true`

Port `klimt/drawing/hand/` so a handwritten diagram renders as the jar draws
it. A FEATURE this port lacks entirely, not a defect: `handwritten` is a global
skinparam, so this serves every diagram type. Surfaced by A5's last M6 fixture,
`yaml/litife-43-novo083`.

## What it is

`JsonDiagram#drawU` (and every other engine's) opens with

    if (handwritten) ug = new UGraphicHandwritten(ug);

and that decorator replaces every primitive with a hand-drawn approximation:

| drawn | handwritten as |
|---|---|
| `URectangle` | `<polygon>` |
| `UEllipse` | `<polygon>` |
| `ULine` | `<path>` |
| `UPath` / `DotPath` | `<path>` |

## The RNG model — and the premise this brief got WRONG

This brief originally claimed the random stream was **shared and sequential
across every shape in the diagram**, making the port all-or-nothing. That was
wrong, and it was wrong in the confident direction: it was asserted from
reading `UGraphicHandwritten`'s single `new Random(424242L)` field (`:54`)
without following `apply`.

`UGraphicHandwritten#apply` returns **`new UGraphicHandwritten(getUg().apply(change))`**
(`:114-116`) — a new instance, and therefore a NEW `Random(424242L)`. Upstream
derives a fresh graphic for essentially every shape (`applyStrokeAndLineColor`,
`apply(UTranslate.dy(y))`, `apply(backColor.bg())`), so in practice **each
shape starts from a fresh stream.**

It was the DATA that corrected it: working backwards from the jar's numbers,
both the first polygon and the first line resolve to a first random draw of
`0.35987869…` — the first value of a fresh `Random(424242L)`. Switching from
one shared stream to one per shape took litife from 464 diffs to 246, and made
the first node byte-identical.

Consequences, now that the model is right:

- the port is NOT all-or-nothing; each shape is independent;
- `java.util.Random` must still be reproduced bit-for-bit (48-bit LCG),
  verified against a real JVM rather than by inspection;
- draw ORDER still matters for element sequence, but no longer for jitter.

## Batches

- **B1** `JavaRandom` — the 48-bit LCG, `nextDouble`. Verified against values
  produced by a real JVM, not by inspection.
- **B2** `HandJiggle` + the six shape builders, mirroring upstream's file names.
- **B3** Wire it into the json renderer — DONE. `litife`'s element tally is
  exact and node 1 is byte-identical to the jar. Not yet byte-conformant: node
  2 sits 0.237px off (M1a, the accepted engine divergence, which the jiggle
  then carries into every one of its coordinates) and the document is 19px
  narrower than the jar's for a reason not yet attributed — the usual ink →
  margins → `+1` chain predicts OUR number, not the jar's, so handwritten
  changes document sizing somehow. `enlargeClip` was checked and is a clipping
  flag, not it.
- **B4** (not started) Other engines. Each needs its own draw-order check
  before `handwritten` can be honoured there.

## Quality gates

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` — all four,
plus `yaml/litife-43-novo083` byte-conformant and no fixture regressed.
