# Batch 1 baseline — sequence geometry distance at `ebbd1f41`

Measured by `scripts/sequence-geometry-distance.ts` (T1.1). Every later batch
of this mission reports against these numbers, per the brief's per-batch gate
and D1.

**Ref.** The working tree at the point of measurement differs from `ebbd1f41`
only by `scripts/sequence-geometry-distance.ts`, its unit test, and this plan
directory. `src/` is untouched, so this IS the parent-commit measurement; no
detached worktree was needed to obtain it.

**Determinism gate (Batch 1).** PASS. Two consecutive runs produced
byte-identical snapshots (`cmp` clean, 455 409 bytes each).

**Machine-readable form.** `findings/baseline.json` — the same snapshot, read
by `--compare`:

```
npx jiti scripts/sequence-geometry-distance.ts \
  --compare plans/sequence-coordinate-convergence/findings/baseline.json
```

## Corpus-wide

```
fixtures=1141  measured=1124  errored=17  descended=714  shortCircuited=410
distance=4175357.109  numericDiffs=72266
```

| attr | distance | diffs |
|---|---:|---:|
| `x` | 733167.295 | 11582 |
| `points` | 723168.744 | 12144 |
| `y` | 462926.355 | 11584 |
| `width` | 445012.407 | 4899 |
| `viewBox` | 394981.000 | 2239 |
| `d` | 316913.092 | 7779 |
| `height` | 309655.028 | 6763 |
| `x2` | 257713.920 | 3649 |
| `y2` | 200714.713 | 3648 |
| `x1` | 195520.122 | 3649 |
| `y1` | 108702.241 | 3648 |
| `cx` | 16832.393 | 333 |
| `cy` | 10042.466 | 333 |
| `rx` | 3.666 | 8 |
| `ry` | 3.666 | 8 |

## By cohort

The corpus-wide table above is the sum of these two, and the two are NOT
interchangeable — see the instrument's cohort-hazard header. A short-circuited
fixture is compared only down to the root `<svg>`'s own attributes, which is
why its entire contribution is `viewBox`/`width`/`height` and why its
`distance` says nothing about the diagram body.

**Descended (714 fixtures) — the cohort every batch gate reads.**
`distance=3634365.109  diffs=70636`

| attr | distance | diffs |
|---|---:|---:|
| `x` | 733167.295 | 11582 |
| `points` | 723168.744 | 12144 |
| `y` | 462926.355 | 11584 |
| `d` | 316913.092 | 7779 |
| `x2` | 257713.920 | 3649 |
| `width` | 248631.407 | 4489 |
| `height` | 235540.028 | 6358 |
| `y2` | 200714.713 | 3648 |
| `x1` | 195520.122 | 3649 |
| `viewBox` | 124485.000 | 1424 |
| `y1` | 108702.241 | 3648 |
| `cx` | 16832.393 | 333 |
| `cy` | 10042.466 | 333 |
| `rx` | 3.666 | 8 |
| `ry` | 3.666 | 8 |

**Short-circuited (410 fixtures).** `distance=540992.000  diffs=1630`

| attr | distance | diffs |
|---|---:|---:|
| `viewBox` | 270496.000 | 815 |
| `width` | 196381.000 | 410 |
| `height` | 74115.000 | 405 |

## Distribution over the descended cohort

```
min 258.772   median 2851.443   mean 5090.147   max 78218.880
fixtures at distance 0: NONE
```

**No sequence fixture in this corpus is geometrically exact.** The best of the
714, `juputo-08-febo295`, is off by 258.772px summed over 56 numeric
attributes. This is the measured form of D2's claim: it is not that some
diagrams are wrong, it is that the coordinate system is.

Heaviest ten, which are where Batches 2–3 should show up first:

| slug | distance | numeric diffs |
|---|---:|---:|
| `nucumi-51-posa953` | 78218.880 | 447 |
| `sufevi-44-xipa294` | 68126.070 | 435 |
| `guduje-81-mucu193` | 65517.299 | 528 |
| `kejoke-76-curu931` | 65517.299 | 528 |
| `turixi-21-mufe557` | 60204.190 | 381 |
| `rexine-04-regi170` | 51580.426 | 342 |
| `camebe-75-mujo573` | 49743.948 | 252 |
| `zejabi-24-xoja824` | 42113.890 | 323 |
| `gofixe-24-jani946` | 41876.311 | 66 |
| `busexe-78-ruzu110` | 40971.789 | 228 |

Lightest ten, the closest thing this corpus has to a control group:

| slug | distance | numeric diffs |
|---|---:|---:|
| `juputo-08-febo295` | 258.772 | 56 |
| `musegi-69-lovi039` | 477.938 | 23 |
| `muvaxa-46-teze620` | 528.148 | 57 |
| `lubuxu-38-jomi891` | 543.525 | 23 |
| `dulaca-47-neta380` | 598.600 | 23 |
| `buxuba-45-tela497` | 634.150 | 27 |
| `rufama-75-paku115` | 644.756 | 23 |
| `culegi-37-paji732` | 678.938 | 27 |
| `bocudo-94-jode371` | 798.046 | 60 |
| `jesari-34-mudu065` | 798.046 | 60 |

## The 17 errored fixtures

They measure `null`, never 0. Sixteen are parser refusals and one is an
unresolved `!includedef`; none is a geometry failure, and none is in scope
here. Listed so a later batch cannot mistake a change in their number for
progress:

```
bomino-39-tipo216  dolice-60-copi767  fojomu-60-cuda302  fonudu-70-coma124
jiliba-03-lapi286  junide-55-soka558  ladiro-50-gume805  licole-34-vejo527
loteba-26-konu854  nidozi-08-daxa280  nizuzi-32-babe798  nuvoja-46-dezu541
recani-60-licu962  soxata-16-kafi688  tegasu-93-fima016  vubato-50-gebu534
zoturo-25-jima978
```

`nuvoja-46-dezu541` is the `!includedef` one; the other sixteen are
`sequence refused this source at line N (syntax)`.

## Corroboration of the brief's starting condition

The brief's measured cohort — 1141 fixtures, 1124 measured, 714 descending,
410 short-circuiting at the top-level child count — is reproduced here exactly
by an instrument written independently of the count that produced it. The
brief's numbers stand.
