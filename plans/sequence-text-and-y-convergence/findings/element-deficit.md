# B1 — what the element deficit actually is

Measured 2026-09-01 at `49f904fd`. Every figure below either excludes
`zudize-61-vomi445` and says so, or reports its share alongside.

## Verdict: stop condition 9 has fired

**Six distinct features, plus a long tail.** The brief allows three. Batch 4's
own overview says that finding more means *"halt and re-plan; improvising four
or more unscoped tasks is exactly what this brief refuses to do up front."*

B2 and B3 were **not** executed. Both are still correctly scoped and both are
confirmed by this measurement — B2 more strongly than the brief estimated — but
they sit in the batch this condition halts, and running them would have been
the improvisation the condition exists to prevent. Neither is invalidated;
both are ready to run on a word.

## The census, reproduced

Corpus-wide, excluding `zudize-61-vomi445`. This reproduces the batch
overview's table exactly, and adds two rows it did not carry.

| element | ours | jar | delta |
|---|---:|---:|---:|
| `line` | 7 083 | 9 406 | **−2 323** |
| `text` | 11 424 | 12 893 | −1 469 |
| `g` | 4 828 | 5 087 | −259 |
| `title` | 3 534 | 3 793 | −259 |
| `rect` | 9 919 | 10 177 | −258 |
| `polygon` | 3 654 | 3 901 | −247 |
| `ellipse` | 722 | 824 | −102 |
| `a` | 0 | 89 | −89 |
| **`image`** | **24** | **66** | **−42** |
| **`path`** | **2 079** | **1 859** | **+220** |

`path` is the only class where we emit MORE, and it is not a separate problem:
it is the self loop, counted from the other side.

Including `zudize-61-vomi445` the `text` row reads −25 933 instead of −1 469.
That one 45 512-line fixture supplies 94% of it, contributes 0.49% of total
distance, and short-circuits, so nothing about it is informative.

## The features

Each is stated with the mechanism, the measurement that isolates it, and a
named fixture.

### 1. A self loop is three `<line>`s, not one `<path>` — B2, confirmed

`ComponentRoseSelfArrow#drawRightSide:124-126` draws `hline`, `vline`, `hline`.
This port draws one `<path>`. `compareSvg` short-circuits on the tag mismatch
(`compare.ts:229`) and never descends.

**125 fixtures emit 495 loops** — the brief estimated 79 fixtures and ~220
paths, so this is 2.2× larger than scoped. In **104** of those 125 the identity
`pathDelta == loops` and `lineDelta == −3 × loops` holds *exactly*.

Accounts for **−1 485 of the `line` deficit (64%)** and all of the `path`
surplus. `tatesu-03-zozo948` alone is +63 `path` / −189 `line`, which is 3×63
to the element.

**Payoff: 71 fixtures close outright** — their root child-count gap goes to
zero and they enter the descended cohort, taking it from 714 to **785**.

### 2. Escaped `\n` is not split in message labels or participant names — NEW

`Display.getWithNewlines` splits a display on `\n`. This port applies it to
note bodies and **not** to message labels or participant names. Minimal case:

```
Alice -> Bob : one\ntwo          ours: one <text> reading `one\ntwo`
participant "Carl\nsecond" as C  ours: one <text> reading `Carl\nsecond`
note over Alice : n1\nn2         ours: two <text>, correct
```

The note arm being right is what makes this a *feature gap* rather than a
parser bug: the splitting exists and two call sites do not reach it.

**101 of the 410 short-circuiting fixtures contain a literal `\n`.** It is the
whole of the largest closable family: of the **75** fixtures whose root diff is
`text` and nothing else, 42 contain one, and in 30 the missing-text count
equals the `\n` count exactly. `butali-53-kige134` (`"Bob\non 2 lines"`) and
`cazipo-94-zubu963` are the reference fixtures.

### 3. A participant head is not wrapped in `<a>` — B3, confirmed

`LivingSpace#drawHeadOrTail:205-212`. All 89 `<a>` elements in the corpus are
missing; **27 fixtures** have `<a>` as their *only* root-level difference.

The root diff shows the shape B3 must get right: `boparo-11-pema294`'s
signature is `a+4, rect−4, text−4`. The `<a>` **replaces** root children by
wrapping them, so a naive implementation that adds an `<a>` beside the head
would move the count the wrong way.

### 4. A `...` delay draws a `DELAY_LINE` on every lifeline, and segments it — NEW

`MutingLine#drawLine:73-91` splits each lifeline at every delay fully inside
its span, drawing `ComponentType.DELAY_LINE` for the delay itself and
`PARTICIPANT_LINE` either side. Each segment is its own `<g><title>` group with
its own `<line>` and hit-target `<rect>`. This port's `handleDelayEvent`
advances the cursor and draws nothing.

Two independent measurements pin it:

- **Dotted-line count = delays × participants, exactly.** `kukeja-88-zida141`
  3×5=15, `dugeki-47-celo546` 1×14=14, and `mitefi-27-cubo687`,
  `peduzi-80-giki495`, `vucomo-53-gicu658` all 3×3=9. Corpus-wide the jar has
  **242** `stroke-dasharray:1,4` lines excluding `zudize` (which alone has
  1 740 of 1 982 — 88%, so the raw total is unquotable); this port has **zero**.
- **The `g`/`title`/`rect` deficit is almost entirely inside delay fixtures.**
  39 fixtures contain a `...`; they hold **−249 of the −259 `g`** (96%),
  **−249 of −259 `title`** (96%), **−207 of −258 `rect`** (80%) and −606 `line`.

`nosebu-15-fasu691` is the extreme case: 7 delays × 11 participants, and the
jar emits **6** `<g><title>` groups per participant where this port emits 1.

### 5. `create` draws a second participant head — NEW

`create X` places the participant's box at the creation point. The jar emits an
extra `rect`+`text` pair there; this port does not. The **17** fixtures whose
root diff is exactly `rect+1, text+1` are dominated by it —
`baxuxa-14-puvo950` and `gabisi-10-male675` are both two-line `create` cases.

### 6. Sprite `<image>` elements are missing — NEW, unattributed in detail

`image` is −42 across **16** fixtures (`baketu-62-cumu838`,
`tumuke-16-xomo243`, …). The mechanism is not established here beyond the count
and is **recorded as unexplained**; it needs its own look.

### The tail

410 short-circuiting fixtures produce **41 distinct root-diff signatures**.
After the six above, roughly 30 signatures remain, each on 1–7 fixtures, mixing
`ellipse`, `polygon`, nested `box` and combinations. `ellipse` (−102) is
concentrated in `SequenceArrows_0001_Test`/`_0002_Test` (−28 each), whose
sources are exhaustive arrow-syntax matrices; the both-ends circle case
(`o->o`) was tested in isolation and is **correct**, so the residual is a
narrower arrow form and is not attributed here.

## Payoff, so B4..Bn can be sized

410 fixtures short-circuit at the root; **380 emit fewer children, 30 emit
more.**

| root child-count gap | fixtures | cumulative | cohort if closed |
|---:|---:|---:|---:|
| 1 | 48 | 48 | 762 |
| 2 | 121 | 169 | **883** |
| 3 | 22 | 191 | 905 |
| 4 | 59 | 250 | **964** |
| 5–8 | 80 | 330 | 1 044 |

The brief's "250 within four elements → roughly 880" is right on the fixture
count; the cohort it implies is 964, and 883 is the within-**two** figure.

By family, fixtures that one feature would close outright:

| feature | closes | cohort after |
|---|---:|---:|
| 2. escaped `\n` (`text`-only family) | 75 | 789 |
| 1. self loop (B2) | 71 | 785 |
| 3. participant `<a>` (B3) | 27 | 741 |
| 5. `create` head (`rect+text` family) | 17 | 731 |

These are **not additive** — 32 further fixtures have a self-loop signature
*plus* something else, and the compound cases only close when every one of
their features does. The honest ceiling for the four together is between 190
and 222 fixtures, i.e. a cohort of roughly **905–936** against today's 714.

## What re-planning has to decide

The mission's Phase B was scoped as "three features, B2 and B3 already in
hand". It is six plus a tail, and the two biggest by payoff — escaped `\n` and
the delay lifeline — were not in the brief at all. Three shapes a re-plan could
take, in the order I would rank them:

1. **Take the top four by payoff** (`\n`, self loop, `<a>`, `create`) as B2–B5
   and stop Phase B there. Highest cohort gain per task, and every one is a
   self-contained mechanism with a named oracle.
2. **Add the delay lifeline as a fifth.** It is the largest *element* deficit
   after the self loop and the only one that explains `g`/`title` at all, but
   it closes few fixtures on its own because delay fixtures are compound.
3. **Defer the tail explicitly**, including `image` and `ellipse`, rather than
   leaving it implied — 30 signatures on 1–7 fixtures each is a different kind
   of work from the six above and should not be smuggled into this mission.
