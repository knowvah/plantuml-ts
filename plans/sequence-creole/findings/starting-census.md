# Starting census — measured 2026-09-02 at `984da6fe`

Written during planning, not during execution. Every figure here was taken with
`DeterministicMeasurer` and the shared fixture include store, over the same
corpus membership `scripts/sequence-geometry-distance.ts` uses.

## Cohort

```
1141 fixtures · 1124 measured · 797 descended · 327 short-circuited · 17 errored
```

`descended = 797` is this mission's gated quantity.

**Total distance is deliberately absent.** Concentration is 24.9% on
`vitevu-99-rali549` — above the 20% alarm — because the parent mission's B2
opened that fixture and its whole geometry arrived at once. The total is a
statement about that fixture, not about the corpus, until Phase C of the parent
mission works through it.

## Content mismatches attributable to creole

Our `<text>` bodies against the jar's, in document order, over the **1123
fixtures whose text COUNT already matches** — where the counts differ the
pairing is meaningless and the difference is an element gap, not a content one.

| class | mismatches | fixtures |
|---|---:|---:|
| monospace `""` | 341 | 35 |
| HTML-ish tags (`<b>`, `<color:>`, `<font>`) | 38 | 15 |
| other angle-bracket markup | 31 | 14 |
| escaped `\n` (content-visible only) | 19 | 3 |
| creole `[[url]]` | 4 | 3 |
| bold `**` | 4 | 2 |
| guillemet `<<x>>` → `«x»` | 3 | 3 |
| **total** | **440** | **71** |

**The monospace row does not mean what it looks like.** 72.8% of it is two
near-identical fixtures — `SequenceArrows_0001_Test` and
`SequenceArrows_0002_Test`, 124 each — which are exhaustive arrow-syntax
matrices that quote every arrow form in `""…""`. Excluding them the reach is
~93 across 33 fixtures. Quote it that way or not at all.

Reference fixtures, one per class:

| class | fixture | ours → jar |
|---|---|---|
| monospace | `bakuba-09-fica741` | `""x->  ""` → `x->` |
| HTML-ish tag | `benuba-40-puxa935` | `<b>toto</b>` → `toto` |
| guillemet | `bodobu-73-noli773` | `<<createRequest>>` → `«createRequest»` |
| colour | `bakuba-09-fica741` | `<color:red> KO` → `KO` |
| creole url | `devamo-31-coji129`, `cikoca-19-feji527` | markup literal → `<a>` |

## Escaped `\n` — the element-level effect, and the bigger one

514 occurrences across 118 fixtures. Notes already split correctly; **message
labels and participant names do not**, so the splitting exists and two call
sites miss it:

```
Alice -> Bob : one\ntwo          ours: one <text>, `one\ntwo`
participant "Carl\nsecond" as C  ours: one <text>, `Carl\nsecond`
note over Alice : n1\nn2         ours: two <text>, correct
```

B1 of the parent mission measured the payoff: **75 fixtures whose only
root-child difference is `text`**, and 101 of the 410 short-circuiting fixtures
contain a `\n`. `core/klimt/creole/DisplayNewlines.ts` already exports
`splitDisplayLines`, `getWithNewlines3` and `parseWithNewlines`.

Reference fixtures: `butali-53-kige134` (`"Bob\non 2 lines"`),
`cazipo-94-zubu963`, `cimofu-59-xotu865`.

## What is NOT creole, and must not be folded in

**353 mismatches across 84 fixtures.** For **71** of those fixtures our text
multiset equals the jar's exactly — the same strings in a different document
order. That is a draw-order defect, a different mechanism with a different fix,
and it is a stated non-goal of this mission. Two examples, both from
`badoba-13-cuba151`: we emit `[failure]` where the jar emits `OK`, and `OK`
where it emits `[failure]`.

The remaining 42 do have genuinely different content and are counted in the
creole table above.

## Inherited residuals this mission should close

Recorded in source comments by earlier missions, both fixed by the same seam:

- `text-block-geo.ts` — an autonumber's `number.text` is emitted with creole
  markup literal (`<font color=red>[001]</font>`), where upstream runs it
  through `Display.java:704`'s `getCreole`. `create0`'s `createMessageNumber`
  arm is the upstream fix.
- `command-participant.ts` — a multi-line participant BODY renders as literal
  lines. `jozomu-87-tajo507`'s `=MyTitle` / `----` / `""MySubTitle""` should be
  a heading, a rule and a monospace run.
