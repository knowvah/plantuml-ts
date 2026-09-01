# T6.1 — inter-participant spacing

**Result.** The gap is **10 between box EDGES**, not 20. One constraint says
all of it.

## The derivation

`LivingSpaces#addConstraints:61-71` — the entire spacing rule for the
participant row:

```java
public void addConstraints(StringBounder stringBounder) {
    LivingSpace previous = null;
    for (LivingSpace current : all.values()) {
        if (previous != null) {
            final Real point1 = previous.getPosE(stringBounder);
            final Real point2 = current.getPosA(stringBounder);
            point2.ensureBiggerThan(point1.addFixed(10));
        }
        previous = current;
    }
}
```

Unpacking the two positions (`LivingSpace.java`):

| position | definition | is |
|---|---|---|
| `posB` | the chained origin (`:248-250`) | box LEFT |
| `posC` | `posB + preferredWidth / 2` (`:226-231`) | box CENTRE |
| `posD` | `posB + preferredWidth` (`:238-245`) | box RIGHT |
| `posA` | `posB - marginBefore` (`:292-294`) | footprint left |
| `posE` | `posD + marginAfter` (`:296-298`) | footprint right |

`marginBefore`/`marginAfter` start at 0 and are raised only by
`ensureMarginBefore`/`ensureMarginAfter`, which have exactly two callers in
the whole tree:

- `Doll.java:220-221` — an ENGLOBER (a `box ... end` group) reserves its own
  `marginX` outside its first and last participant.
- `CommunicationTileSelf.java:208-213` — a self message whose loop or label
  overflows its own lifeline widens the neighbour gap by the overflow.

So for ordinary participants both margins are zero and the constraint reduces
to

```
nextBoxLeft >= prevBoxRight + 10
```

`getPreferredWidth` there is `getHeadPreferredDimension(...).getWidth()`
(`:225-227`), i.e. the same `getPreferredWidth` Batches 2 and 4 established.

## What this port had

`sequence-layout-participants.ts:533`:

```ts
const naturalCenterGap = width / 2 + theme.sequence.participantGap + nextWidth / 2;
```

with `participantGap: 20`. Centre-to-centre of `w1/2 + gap + w2/2` IS an edge
gap of `gap`, so the shape was right and the number was double.

## The evidence, from before the change

`kibave-01-tafo463` declares six participants of six different kinds and
nothing else. Its five consecutive lifeline spacings were each off by exactly
**+10**:

| pair | jar | ours (before) | delta |
|---|---:|---:|---:|
| boundary → control | 66.181 | 76.181 | +10 |
| control → database | 65.788 | 75.788 | +10 |
| database → entity | 61.500 | 71.500 | +10 |
| entity → actor | 48.244 | 58.244 | +10 |
| actor → collections | 70.256 | 80.256 | +10 |

A constant offset across six different kinds is what forced Batch 4's
conclusion that every width was already exact — and it identified the residual
as a single additive term, which is what a gap is. After the change every one
of those five is exact, which is what
`tests/unit/sequence/participant-symbol-sizing.test.ts` now pins (its
`deltas[0]` assertion went from 10 to 0).

## Measured

| | before | after |
|---|---:|---:|
| fixtures with EVERY lifeline centre exact | — | **275** of 1039 |
| fixtures with the first lifeline centre exact | — | 747 |
| total geometry distance | 2661116.421 | **2603787.547** |

Cumulative fall from the Batch 1 baseline: **1571569.562**, 37.6% of it.

## The two margin terms, not modelled here

`posA`/`posE` differ from `posB`/`posD` only through the englober and
self-overflow margins above. This port models neither as a participant-row
margin:

- **Englobers (`box ... end`).** `computeBoxGeos` draws the box background
  from the leftmost participant edge − 8 to the rightmost + 8, but does not
  reserve that space in the row, so a box's border can sit closer to its
  neighbour than upstream allows. Upstream reserves it through
  `Doll#addConstraints` → `ensureMarginBefore/After`.
- **Self-message overflow.** `CommunicationTileSelf:200-215` widens the
  neighbour gap when a self loop or its label overruns the lifeline; this port
  widens the gap for message labels through `scanMessageLabels` instead, which
  is the pairwise pre-scan **D6** is about.

Both are inputs to Batch 7's D6 decision rather than separate defects: they
are the same question — does a wide thing move its neighbours, and is that
resolved pairwise or globally.
