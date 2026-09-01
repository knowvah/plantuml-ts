# T4.1 — the seven non-rectangular heads, audited against their Java

**Result: none of the seven is wrong.** Every glyph kind's preferred width,
preferred height and drawn shape already reproduce the jar exactly, so T4.2 is
a no-op and T4.3's constant is confirmed. The evidence is below rather than
the claim alone, because "nothing to fix" is the finding most easily reached
by not looking.

`planning/usymbol-composition.md` and the header of
`src/diagrams/sequence/sequence-layout-participant-sizing.ts` already carry
the per-kind derivation, read first as the brief directs; this audit measures
rather than re-derives.

## Per kind

| kind | upstream `getPreferredWidth` / `Height` | this port | golden | verdict |
|---|---|---|---|---|
| `actor` | `max(stickman.width, getTextWidth)` / `stickman.height + getTextHeight` (`ComponentRoseActor:89-98`) | `symbolPreferredWidth`/`Height` same | `kibave-01-tafo463` | exact |
| `boundary` | same pair (`ComponentRoseBoundary:90-98`) | same | `kibave-01-tafo463` | exact |
| `control` | same pair (`ComponentRoseControl:91-99`) | same | `kibave-01-tafo463` | exact |
| `entity` | same pair (`ComponentRoseEntity:91-99`) | same | `kibave-01-tafo463` | exact |
| `database` | same pair (`ComponentRoseDatabase:96-105`) | same | `kibave-01-tafo463` | exact |
| `queue` | glyph width / glyph height alone (`ComponentRoseQueue:71-85`) | same | `pumula-71-gigi389` | exact |
| `collections` | plain participant + `getDeltaCollection()` = 4 (`ComponentRoseParticipant:114-118,129-137`) | plain rule + `COLLECTIONS_DELTA` | `kibave-01-tafo463`, `fatake-97-ciki135` | exact |

## How "exact" was established

### Heights — the head row lands on the jar's, to the pixel

`kibave-01-tafo463` declares one participant of each of six kinds (boundary,
control, database, entity, actor, collections) and nothing else, so its head
row is the max over six different `getPreferredHeight` implementations.

| fixture | jar head row | less the 10px document margin | ours | delta |
|---|---:|---:|---:|---:|
| `kibave-01-tafo463` (6 kinds) | 84 | 74 | 74 | **0.000** |
| `cebeje-70-bada975` (participant + 5 kinds) | 84 | 74 | 74 | **0.000** |
| `pumula-71-gigi389` (queue) | 34 | 24 | 24 | **0.000** |
| `fatake-97-ciki135` (collections) | 43 | 33 | 33 | **0.000** |

If any kind's preferred height were wrong, the kind that is tallest in its
fixture would move the row. Four fixtures, seven kinds, no movement.

### Widths — forced exact by a uniform gap error

Lifeline centres on `kibave-01-tafo463`, consecutive spacings:

| pair | jar | ours | delta |
|---|---:|---:|---:|
| boundary → control | 66.181 | 76.181 | +10 |
| control → database | 65.788 | 75.788 | +10 |
| database → entity | 61.500 | 71.500 | +10 |
| entity → actor | 48.244 | 58.244 | +10 |
| actor → collections | 70.256 | 80.256 | +10 |

Centre-to-centre spacing is `w_i/2 + gap + w_{i+1}/2`. A constant +10 across
five consecutive pairs spanning six DIFFERENT kinds forces every width error
to be zero: if any `w_i` were off by `e`, the two gaps adjoining it would
differ from each other by `e`. They do not, anywhere. The whole +10 is the
gap term — which is Batch 6, not Batch 4.

### Shapes — element by element, not just extents

Every glyph on `kibave-01-tafo463` is dimensionally identical to the jar's,
differing only by the document offset (+20 in x, −10 in y) that Batches 5–6
own:

| kind | jar | ours |
|---|---|---|
| boundary | `path M21.681,42 L21.681,66 M21.681,54 L38.681,54` + `ellipse rx=12` | `path M41.681,32 L41.681,56 M41.681,44 L58.681,44` + `ellipse rx=12` |
| control | `ellipse rx=12` + `polygon 104.362,42 110.362,37 108.362,42 110.362,47` | same polygon shape at `134.362,32 …` |
| database | `path M156.15,34 C…192.15,34 L192.15,60 C…` (36 × 46) | same curve at `M196.15,24 …` |
| entity | `ellipse rx=12` + `line x1=223.65 x2=247.65` (24 long) | `ellipse rx=12` + `line x1=273.65 x2=297.65` |
| actor | `ellipse rx=8` + `path M283.894,26.5 L283.894,53.5 M270.894,34.5 …` | identical relative form at `343.894` |
| collections | two `rect 79.45 × 28` stacked 4 apart, at `316.425,51` and `312.425,55` | two `rect 79.45 × 28` stacked 4 apart, at `386.425,41` and `382.425,45` |

## T4.3 — `getDeltaCollection()` and `COLLECTIONS_DELTA`

`ComponentRoseParticipant:114-118`:

```java
private double getDeltaCollection() {
    if (collections)
        return 4;
    return 0;
}
```

`COLLECTIONS_DELTA = 4` (`renderer-participant-symbol.ts:174`), already
carrying that `@see`. Confirmed, and confirmed observationally: our stacked
pair on `kibave-01-tafo463` is `79.45 × 28` offset by 4, and so is the jar's.
The constant is verified, not replaced.

## One thing found that is NOT a coordinate, filed rather than fixed

`kibave-01-tafo463` sets `ActorBorderColor blue`. The jar strokes the actor
glyph `#00F`; this port strokes it `#181818`. Every other kind in that fixture
honours its `*BorderColor` skinparam correctly — only the actor's is dropped.
`.agent-notes/coverage-buckets/sequence.tsv:303` already records a second
fixture (`metuso-48-siti946`, `ActorBorderColor DeepSkyBlue`) in the same
bucket, so this is a known-shaped gap and not a new one.

Out of scope here (a colour, not a coordinate, and this mission's gate cannot
see it), but recorded so it is not lost: **`ActorBorderColor` is not applied
to the actor stickman's stroke.**
