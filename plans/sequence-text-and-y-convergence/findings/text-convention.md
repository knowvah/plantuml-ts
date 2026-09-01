# Phase A — what emitting the jar's text convention bought

Measured 2026-09-01 at `d26ad9c7`, against the mission's base `e38e53a3`.
Written by A6.

## Headline

Phase A removed **141 731.9** of total distance, 5.5% of the corpus. It closed
the text-convention gap completely — zero anchored elements remain, and
`textLength` now covers every element upstream's own guard permits.

It did **not** remove the 423 064 the brief called phantom. That number was
right, and the reasoning behind it was half right: the x half was phantom and
is largely gone; the y half was never phantom at all. §3 is the correction, and
it is the single most important thing in this document for Phase C.

## 1. The sweep — the convention is closed

Corpus-wide, all 1124 measurable fixtures:

| | this port | the jar |
|---|---|---|
| `<text>` elements | 44 689 | 70 622 |
| carrying `text-anchor` | **0** | 0 |
| carrying `dominant-baseline` | **0** | 0 |
| carrying `textLength` | 43 296 (96.9%) | 68 746 (97.3%) |
| single-character (guard excludes) | 1 393 | 1 799 |

`44 689 − 1 393 = 43 296` exactly: **every** element upstream's
`text.length() > 1` guard permits carries a `textLength`. The jar itself is at
99.9% by that measure (77 of its multi-character elements carry none). The
96.9%-vs-97.3% gap is entirely the different single-character share, not a
coverage gap.

The remaining element count difference — 44 689 against 70 622 — is the
element deficit Phase B owns. It is not a text-convention matter.

## 2. Adjudication — no regressions

`scripts/sequence-ratchet-adjudicate.ts --base e38e53a3`:

```
artefact=0  substructure=79  regression=0  inconclusive=17  unchanged=28  improved=1017
```

- **1017 improved** — 90.5% of measurable fixtures. Aggregate `weightedScore`
  over every measured fixture fell 1 214 208 → 1 198 565.
- **0 regressions.** Every rise is a `substructure` rise, which is a proof
  rather than a judgement: the score delta equals our own unit growth exactly,
  so the golden's contribution to the short-circuit charge cancels and no
  comparison descended at either ref. Adding one `textLength` attribute to
  ~43 296 elements is precisely that shape.
- **The 79 substructure fixtures are exactly the 79 the ratchet fails.**
  Verified by set difference, not by count. Their combined rise is +1 274
  against the −16 917 the improved fixtures contribute.
- **17 inconclusive** are the 17 that error at both refs — the standing error
  census, unchanged by this mission.

No re-pinning was done. D5: once, at C4.

## 3. The correction Phase C must read

`text@x` and `text@y`, scoped to `<text>` elements (the standard instrument
aggregates by attribute across all element kinds, so this needed its own pass):

| | base `e38e53a3` | live `d26ad9c7` | change |
|---|---|---|---|
| `text@x` | 161 539.418 (5 677 diffs) | 104 235.758 (2 750) | **−35.5%, −51.6% of diffs** |
| `text@y` | 261 525.117 (5 862 diffs) | 252 972.547 (5 859) | −3.3%, −3 diffs |
| **total** | **423 064.535** (11 539) | **357 208.305** (8 609) | −15.6% |

The base figure reproduces the brief's published 423 064 to three decimals,
which is what makes the comparison trustworthy.

**A6's acceptance criterion — "`text@x` + `text@y` has fallen by more than 90%
of its 423 064 baseline" — is NOT met, and could not have been.** The criterion
assumed the whole 423 064 was the centre-versus-left-edge artefact. Only the x
half ever was:

- **x behaved as predicted.** More than half its diffs vanished outright —
  those elements are now byte-exact against the jar. What remains is real
  horizontal error (participant column x, `ref` box geometry, note position).
- **y was never phantom.** Comparing a centre against a left edge is an
  x-axis phenomenon; the `jobadi-87-jegi648` worked example in the mission
  README charges 12.469 on an **x**. Our `y` was wrong before Phase A and is
  wrong by almost exactly as much after it — but it is now wrong in a
  *measurable, mechanical* way rather than in an uninterpretable one, which is
  what D6 actually needs.

### The y residual is now legible, and a quarter of it is one constant

`|delta|` over all 5 859 remaining `text@y` diffs:

| bucket | count | share |
|---|---|---|
| `< 1` | 5 | 0.1% |
| `1–5` | 368 | 6.3% |
| `5–9.5` | 456 | 7.8% |
| **`~10`** | **1 573** | **26.8%** |
| `10.5–25` | 1 355 | 23.1% |
| `25–100` | 1 586 | 27.1% |
| `>= 100` | 516 | 8.8% |

At the base ref that `~10` bucket held **289**. Phase A moved 1 284 diffs onto
the vertical document margin exactly — they were previously scattered by the
baseline-versus-centre offset, and are now a single identifiable constant.

Sign is near-balanced: 3 118 of our baselines sit above the jar's, 2 741 below.
So the margin is **not** a uniform shift, and the README's own probe agrees —
applying the margin alone raised total distance by 35 145 while lowering diff
count by 6 447. C2 must derive the margin and the body-height terms together.

## 4. The per-attribute table Phase C reads

Live, `d26ad9c7`. Total **2 437 184.889** over **48 904** numeric diffs.

```
cohort   1141 fixtures · 1124 measured · 714 descended · 410 short-circuited · 17 errored
```

`descended` held at 714 through every task of Phase A. Stop condition 7 never
fired.

| attr | distance | diffs | at base | change |
|---|---|---|---|---|
| `y` | 444 419.725 | 11 579 | 455 072.295 | −10 652.6 |
| `points` | 375 100.607 | 8 303 | 377 592.319 | −2 491.7 |
| `viewBox` | 288 787.000 | 2 230 | 321 102.000 | −32 315.0 |
| `height` | 249 944.812 | 3 699 | 283 726.812 | −33 782.0 |
| `width` | 241 379.956 | 1 834 | 241 736.624 | −356.7 |
| `x` | 206 544.308 | 5 173 | 264 109.124 | −57 564.8 |
| `d` | 203 698.638 | 5 719 | 205 473.844 | −1 775.2 |
| `y2` | 193 261.385 | 3 646 | 195 029.385 | −1 768.0 |
| `y1` | 116 397.393 | 3 644 | 117 022.393 | −625.0 |
| `x2` | 62 953.678 | 1 469 | 63 109.099 | −155.4 |
| `x1` | 42 270.922 | 1 188 | 42 439.321 | −168.4 |
| `cy` | 9 912.466 | 333 | 9 942.466 | −30.0 |
| `cx` | 2 506.666 | 71 | 2 553.744 | −47.1 |
| `rx` | 3.666 | 8 | 3.666 | 0 |
| `ry` | 3.666 | 8 | 3.666 | 0 |

**`points` and `d` still mix axes.** `points` is `x,y` pairs and splits exactly
on index parity; `d` is path arguments whose axis depends on the command
letter, and is genuinely mixed rather than splittable by position. **C1 must
land that split before C3 gates on either** — this table understates Y by
roughly 287 000 until it does (D7).

### Concentration

```
heaviest vofupo-09-gafe466 = 223 386.000 (9.2%);  heaviest ten = 27.8%
```

Below the 20% alarm, so the totals above are statements about the corpus rather
than about one fixture.

`zudize-61-vomi445` — the 45 512-line stress case the mission README says to
report on or exclude explicitly — is **included** in every number above. It
contributes 11 972, or 0.49%, and it **short-circuits** (`descended: false`),
so that figure says nothing about its geometry either way. It distorted the
element census that this mission was planned from; it does not distort the
distance figures here.

## 5. What Phase A turned up that later batches need

Four findings, all recorded in
`.agent-notes/A1-sequence-geo-text-metric-fields.md` with citations:

1. **Three text kinds were measured at the wrong font.** `ref` body
   (`reference { FontSize 12 }`), `ref` header (`referenceHeader { 13, bold }`),
   note body (`note { FontSize 13 }`) — all had been using the ambient 14. Each
   was invisible as displacement and became glyph *distortion* the moment its
   site emitted a `textLength`. The note one alone moved 90 011.6, most of it
   `viewBox` and `height`, because the box is sized from the same measurement.
   **A `box` group label is still wrong** — 11 plain here against the jar's 13
   bold — and is deliberately unfixed; see §5.4.
2. **`note right` is positioned on the wrong side.** 58 fixtures rose in A5 and
   every one is a note fixture. `xatotu-85-tusi683` puts its body at x=70.319
   where the jar puts it at 449.319. Centring was masking it; left-alignment is
   jar-verified and correct. **Phase B territory.**
3. **Nothing was scaled.** `labelRuns`, `tabRuns` and `refBody` all reached
   `scale-geo.ts` unscaled. A4's first measurement ROSE 639.3 because of it.
   Any future run-carrying field must reach `scaleRun` in the same commit.
4. **Two divergences left open on purpose**, both needing geometry this port
   has not modelled: a note's box padding versus its text inset (10 here, 6 in
   the jar, and they are different upstream quantities), and the box label font
   above. Guessing either constant would be fitting.
