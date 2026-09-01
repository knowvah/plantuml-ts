# Batch 2 — the four text kinds

> **Rewritten 2026-09-01**, after A1 landed. The metrics live on `TextRun`
> (D8), not on each geometry type, so every task below has the same shape:
> **layout builds placed, measured runs; the renderer maps them through
> `sequenceText`.** The old per-geo-scalar framing is gone, and the site
> inventory is corrected — it was wrong in three places.

Four tasks, **parallel**.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| A2 | message labels | typescript-pro | `text-block-geo.ts`, `renderer-message.ts`, tests | A1 | [x] |
| A3 | participant labels and stereotypes | typescript-pro | `sequence-layout-participants.ts`, `renderer-participant-shapes.ts`, `geo-participant.ts`, tests | A1 | [x] |
| A4 | frame headers, comments and `ref` bodies | typescript-pro | `renderer-frame-header.ts`, `sequence-layout-events.ts`, `geo-frame.ts`, tests | A1 | [x] |
| A5 | notes, dividers, conditions and box labels | typescript-pro | `renderer.ts`, `sequence-layout-events.ts`, `geo-annotation.ts`, tests | A1 | [x] |

## The shape every one of these has

Each is a **vertical slice**, not a layer:

1. Layout builds a `readonly TextRun[]` for the kind — each run placed at its
   own LEFT edge and BASELINE, each carrying the three metrics A1 made
   required.
2. The geometry type gains one field to carry them.
3. The renderer maps the runs through `sequenceText` and does no arithmetic on
   a font size.

A task that changes a renderer without changing its layout has done half the
job and will fail its own criteria.

## Two shared files, and why that is accepted

`geo.ts` and `sequence-layout-events.ts` are each written by more than one
task. This is a deliberate relaxation of batch-1's disjointness goal:

- **`geo.ts`** — A3, A4 and A5 each add ONE run-carrier field to a different
  interface. Splitting geometry into four per-task modules to avoid a
  three-line contention was priced and rejected (D8).
- **`sequence-layout-events.ts`** — A4 owns frame layout, A5 owns note and
  divider layout, in different functions of the same file.

If these four run genuinely in parallel, serialize A4 and A5, or run all four
sequentially. Nothing about the work requires parallelism; only the file
boundaries do.

## The site inventory, corrected

**Nine** `core/svg.ts#text` call sites, not eight. The previous version of this
document missed one, invented one, and cited stale line numbers. Verified by
grep over `src/diagrams/sequence/` on `da67c704`.

| # | site | today | owner |
|---|---|---|---|
| 1 | participant label AND stereotype rows | `renderer-participant-shapes.ts:102` (`renderLabel`) | A3 |
| 2 | message label runs | `renderer-message.ts:97` (`renderMessageLabel`) | A2 |
| 3 | frame tab title | `renderer-frame-header.ts:197` | A4 |
| 4 | frame tab comment | `renderer-frame-header.ts:205` | A4 |
| 5 | `ref` body lines | `renderer.ts:136` (`renderRefBody`) | A4 |
| 6 | note body lines | `renderer.ts:82` (`renderNote`) | A5 |
| 7 | `[condition]` branch labels | `renderer.ts:186` (`renderBranchSeparators`) | A5 |
| 8 | divider label lines | `renderer.ts:257` (`renderDividerLabel`) | A5 |
| 9 | **box group label** | `renderer.ts:374` (`renderBoxBackground`) | A5 |

Site 1 is one call site but TWO kinds of run: `renderNameBlock:169-182` stacks
the stereotype rows and the name through the same `renderLabel` helper, each at
its own `cy`. A3 owns both.

**There are no newpage titles.** The previous inventory listed one at
`renderer.ts:257`; that line is the divider label, and `NewpageGeo` carries no
text at all. Upstream agrees — `ComponentRoseNewpage#drawInternalU` is three
statements ending in `ug.draw(ULine.hline(dimensionToUse.getWidth()))`
(`skin/rose/ComponentRoseNewpage.java:57-62`). Do not add one.

The box group label (#10) was in no task's inventory. It is A5's, because A5
owns `renderer.ts`.

`ref` bodies (#6) move from A5 to A4: they are frame text, and A4 already owns
the frame's other two runs. A5 keeps the `[condition]` labels even though those
are also frame text, because they live in `renderer.ts` — the split is by FILE,
which is what actually matters for a write-set.

## Expect goldens to move

Unlike A1, all four of these change output — that is the point. Distance must
FALL; `text@x` and `text@y` are the attributes to watch. The ratchet goes red
here and stays red until C4 (D5); that is not a stop condition.

## Watch the cohort

`descended=714` must hold. These tasks remove attributes and add one, so a
fixture crossing the short-circuit line is possible here for the first time in
this engine's history — stop condition 7.

## One hazard A1 hit, which all four will hit

`exactOptionalPropertyTypes: true` is on. Passing an optional field straight
through to another optional field does not compile — use a spread-conditional
(`...(x !== undefined ? { x } : {})`). It is a compile error, not a silent one.

## Result (2026-09-01)

All four landed, sequentially rather than in parallel.

| task | commit | distance after | fall |
|---|---|---|---|
| — | `589bc138` | 2 578 916.759 | (batch 1 close) |
| A2 | `1eb5ea9b` | 2 566 822.374 | 12 094.4 |
| A3 | `bbb8c1ba` | 2 534 331.542 | 32 490.8 |
| A4 | `a2bb90dd` | 2 527 196.477 | 7 111.9 |
| A5 | `ce1dcd07` | 2 437 184.889 | 90 011.6 |

**Phase A total: 141 731.9, or 5.5% of everything remaining.** `descended`
held at 714 through every task — stop condition 7 never fired. The census's
`text-metrics` bucket fell 13 770 → 1 194.

Three findings that changed what later batches should look at, all recorded in
`.agent-notes/A1-sequence-geo-text-metric-fields.md`:

- **Three text kinds were measured at the wrong font** — `ref` body (12),
  `ref` header (13 bold), note body (13). Each was invisible until its site
  emitted a `textLength`. The note one alone is 90k, because the box is sized
  from the same measurement.
- **`note right` is positioned on the wrong side.** 58 fixtures rose in A5,
  every one a note fixture; centring was masking a `computeNotePosition`
  defect. Phase B territory.
- **Nothing was scaled.** `labelRuns`, `tabRuns` and `refBody` all reached
  `scale-geo.ts` unscaled; A4's first measurement ROSE 639.3 and led to it.
  Any future run-carrying field must be added to `scaleRun`'s callers in the
  same commit.
