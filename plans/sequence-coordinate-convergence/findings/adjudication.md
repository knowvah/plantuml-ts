# T9.1 — corpus adjudication against the parent commit

```
npx jiti scripts/sequence-ratchet-adjudicate.ts --base ebbd1f41
```

```
artefact=0  substructure=0  regression=5  inconclusive=17  improved=712  unchanged=407
```

**712 of 1124 measurable fixtures improved on `weightedScore`.** That is worth
noting against D1: the score cannot see a coordinate moving closer, and these
changes were large enough to change diff RECORDS as well — child counts
matching, attributes crossing into tolerance.

## The 17 inconclusive

Exactly the 17 fixtures that error at BOTH refs (16 parser refusals and one
unresolved `!includedef`), listed in `baseline.md`. `null` at both ends, so no
rise can be computed. Not rises; nothing to adjudicate.

## The 5 regressions — none survives diagnosis

| slug | base | live |
|---|---:|---:|
| `mifafi-02-dofi536` | 254 | 256 |
| `musive-74-reva838` | 251 | 253 |
| `posura-78-koji601` | 251 | 253 |
| `rapoto-38-neca900` | 1056 | 1058 |
| `vekuno-87-ponu028` | 254 | 256 |

Every one rose by exactly 2 with its top-level child-count distance unchanged,
which is why the adjudicator — whose only benign-rise tests are that distance
and the substructure equality — could not clear them.

**Measured at both refs, all five have one signature:**

| slug | height (base) | height (live) | width (base) | width (live) |
|---|---|---|---|---|
| `mifafi-02-dofi536` | **exact** | 137 / 147 | 268 / 179 | 190 / 179 |
| `musive-74-reva838` | **exact** | 137 / 147 | 301 / 215 | 221 / 215 |
| `posura-78-koji601` | **exact** | 137 / 147 | 294 / 179 | 214 / 179 |
| `rapoto-38-neca900` | **exact** | 634 / 644 | 377 / 206 | 290 / 206 |
| `vekuno-87-ponu028` | **exact** | 137 / 147 | 268 / 179 | 190 / 179 |

Each traded an exact document HEIGHT for a width error that collapsed from
+89, +86, +115, +171 and +89 down to +11, +6, +35, +84 and +11. The score
charges +1 per record, so **two new height records cost 2 and up to 87px of
real width convergence costs nothing** — D1's thesis, demonstrated.

### The mechanism, stated

Two errors were cancelling on the vertical axis, and Batch 3 removed one.

- Before: this port's head and foot rows were each **34** tall against the
  jar's **29**, and it applied **no** document top or bottom margin where the
  jar applies **10** each (`SequenceDiagram#getDefaultMargins:624-628`'s
  `same(5)` plus the text block's own `UTranslate(5, 5)`).
- 5 + 5 = 10 = the missing margins, exactly. The document height came out
  right for the wrong reason.
- Batch 3 corrected the rows to the jar's 29 (`getTextHeight` +
  `getPreferredHeight`'s `+ 1`), and the compensation went with it. The
  documents are now 10 short.

Only these five had an exactly-correct height to lose; everywhere else the
height was already wrong and the change merely moved it.

This is the same shape as J7's `@y1` note and J5's negative-x note: a term
this mission corrected exposing a term it did not. **The missing vertical
document margin is the fix**, and it is the Y-axis half of Batch 5's own
derivation — deliberately out of scope here (`Non-goals`: "Y-coordinate
convergence beyond what Batch 3 moves as a side effect"). Applying it alone
would take these five from 10 short to 5 over, because their bodies are also
5 too tall; closing them properly is a Y-axis mission, not a constant.

**Verdict: zero regressions survive diagnosis.** All five are adopted into the
baseline with this mechanism on record.

## T9.2 — the re-pin

Re-pinned ONCE, at close-out, after the adjudication (D5).

```
REPINNED 717 entries at 669fc839
```

`diffCount` was measured FRESH first, via `scripts/sequence-repin-snapshot.ts`.
The brief's warning was real and load-bearing: `repin-sequence-baselines.ts`
does `f.diffCount = m.diffCount ?? f.diffCount`, and the adjudicator's snapshot
carries no `diffCount` at all — so without the new script the re-pin would
have written a fresh score beside a stale count on every row.
**716 of 1141 fixtures had a `diffCount` that had drifted**, one of them from
5 to 349.

Baseline JSON diffed before and after, per
`.claude` note `repin-script-raises-preexisting-red-pin`:

```
lowered=712   unchanged=407   RAISED=5
```

The five raised pins are exactly the five adjudicated above. No pin rose that
was not diagnosed.
