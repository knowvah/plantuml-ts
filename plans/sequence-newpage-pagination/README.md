# Mission: sequence-newpage-pagination

**Branch**: `feat/sequence-newpage-pagination`, cut from `main` (`1e495a1c`
or later). Merge commit back to `main`; never squash.

## Objective

`newpage` is recognised and ignored (`command-page.ts:26-31`), so a multi-page
sequence diagram renders as one continuous image. Upstream renders **one page
per image**, and every golden in the corpus is **page 1**.

Verified, not assumed: `digula-66-dipe776`'s golden contains the text
`Page 1` and neither `Page 2` nor `Page 3`.

## Why the recorded judgment is stale

`planning/next-missions.md` says "implementing multi-page output to clear one
ratchet row is not proportionate". Both halves are wrong now, measured
2026-09-01 over the 39 `newpage` fixtures (6 do not render at all):

- **29 of 33 measurable fixtures over-emit, by +547 elements total.**
  `pibefe-94-cibu835` is ours 298 against a golden of 26. Three of them —
  `fobube-11-nifo424`, `digula-66-dipe776`, `xedomi-77-libu804` — are red
  ratchet rows, but the corpus effect is ten times that.
- **Layout does not change.** Upstream does NOT re-lay-out per page:
  `PlayingSpaceWithParticipants:204-225` draws the SAME full layout,
  translated by `dy(headHeight - ymin)` and clipped to the page band.

## The decision that shapes this mission

Confirmed by the maintainer 2026-09-01: **page 1 from `renderSync`, plus a new
entry point that returns every page.** The jar writes `f.svg`, `f_001.svg`, …;
this port returns one string, so emitting page 1 alone would silently drop
content the user wrote. The rendering work is identical either way — the
addition is API surface, and it is the reason this is a brief and not a
three-file change.

## The page model, read from the Java

```
PlayingSpace#yNewPages()      0.0, each NewpageTile's y, MAX_VALUE   (:340-345)
PlayingSpace#getNbPages()     yNewPages().size() - 1                 (:348-350)

PlayingSpaceWithParticipants (:96-110, :204-225)
  ymin       = pageIndex == 0 ? 0 : newpageTiles[pageIndex - 1].y
  ymax       = pageIndex >= newpageTiles.length
                 ? fullHeight
                 : min(newpageTiles[pageIndex].y + tile.getPreferredHeight(),
                       fullHeight)
  pageHeight = ymax - ymin
  height     = pageHeight + (showFootbox ? 2 : 1) * headHeight        (:80-86)

  body:  ug.apply(dy(headHeight - ymin)), then UClip(-1000, ymin, MAX,
         pageHeight + 1) WHEN getNbPages() > 1
  heads: drawn UNCLIPPED at the top, and the footbox at
         dy(pageHeight + headHeight)
```

`NewpageTile#getPreferredHeight` is `1 + 2 * MARGINY` = **21**
(`NewpageTile.java:50,94-96`), so page 1 extends 21px past the newpage's own y
— which is why the separator belongs to BOTH adjacent pages ("the pages
slightly overlap", `:78-80`).

### The six clip rules — per shape, and they differ

The jar emits **no `clipPath`**: its drivers trim geometry numerically.
Verified on `digula`'s golden, whose lifelines read `y1="74" y2="339"` in a
378-tall document with no clip attribute anywhere.

| shape | rule | driver |
|---|---|---|
| `ULine` | **clamped** to the band; dropped when wholly outside | `DriverLineSvg:59-69` |
| `URectangle` | **clamped**; dropped when the clamped height ≤ 0 | `DriverRectangleSvg:66-74` |
| `UText` | all-or-nothing on its anchor `(x, y)` | `DriverTextSvg:88-90` |
| `UPath` | all-or-nothing on its bbox min AND max corner | `DriverPathSvg:58-60` |
| `UPolygon` | all-or-nothing: dropped unless EVERY point is inside | `DriverPolygonSvg:57-61` |
| `UEllipse` | all-or-nothing on `(x,y)` and `(x+w, y+h)` | `DriverEllipseSvg:56-64` |

## Architecture decision — clip in GEOMETRY space, not at the emitters

**Decided, and the reasoning must not be re-litigated per batch.**

The port's sequence renderer emits through 38 direct `rect`/`line`/`text`/…
call sites across 8 modules. Threading a clip through all of them mirrors
upstream's "drivers hold the clip" structure but is an 8-file refactor for a
feature only 39 fixtures reach, and post-filtering the emitted SVG string
would mean regex-parsing our own `path` `d` and `polygon` `points`.

Instead: **a `SequenceGeometry` → `SequenceGeometry` page transform**
(`src/diagrams/sequence/sequence-page.ts`). Layout runs once, unchanged; the
transform drops, clamps and translates geometry objects for one page; the
renderer stays untouched and unclipped.

This is faithful because the six rules above map onto geometry KINDS, and the
mapping must be written down per kind rather than assumed:

- lifeline, activation, frame → the CLAMP rules (line, rect)
- message, note, divider, participant → all-or-nothing, since each sits at one
  y and its text/polygon/path components share that y

**Where the mapping is genuinely ambiguous — a note or divider whose BOX
straddles the boundary, where upstream would clamp the rect but drop the
text — enumerate the case, pick upstream's per-shape answer, and pin it in a
test.** Do not average the two.

## Batches

- [x] **Batch 1** — the page model in layout. `newpage` becomes an event with
      a y; `SequenceGeometry` gains the newpage y list. No render change, no
      fixture movement. Verify that claim rather than assuming it.
- [x] **Batch 2** — `sequence-page.ts`: the page transform, all six rules,
      per-kind mapping, and the straddle cases pinned.
- [x] **Batch 3** — the newpage SEPARATOR. `ComponentRoseNewpage#drawInternalU`
      draws one `ULine.hline(areaWidth)` at `dy(MARGINY)` with the style's
      stroke; `sequenceDiagram { newpage { LineStyle 2 } }`
      (`plantuml.skin:179-181`) is the `stroke-dasharray:2,2` the golden
      shows at `y=327`, distinct from a lifeline's `5,5`. This port draws
      nothing for it today.
- [x] **Batch 4** — the public API: `renderSync` returns page 1; a new
      `renderPagesSync` (and its async sibling) returns every page. Document
      the precedent — no other engine here paginates.
- [x] **Batch 5** — adjudicate and close out.

## Quality gates

Per task: `npm run typecheck`, `npm run lint`, `npx vitest run tests/unit`,
`npm run build`, all exit 0; `git diff --name-only` matches the declared
write-set.

Per batch: `npx jiti scripts/sequence-ratchet-adjudicate.ts --base <parent>`.
**Invariant: zero `regression` that survives diagnosis.** Expect large
movement — this is a +547-element correction — and expect the adjudicator to
struggle: three `DIVERGENCES.md` entries already record that it cannot clear
a rise on a document whose child count was already wrong. Measure the
body-group child TAG SEQUENCE census alongside it, as the last three missions
did.

`main` is 4 red at the start: `fobube`, `digula`, `xedomi` (this mission) and
`rugeco` (`sequence-activation-double-box`). **`rugeco` must not rise.**

## Stop conditions

1. A file outside the write-set needs changing and no task owns it.
2. Two consecutive quality-gate failures on the same check.
3. The geometry-space clip cannot reproduce a per-shape rule for some kind —
   stop and report the case rather than approximating it.
4. Any `regression` that survives diagnosis, with the full artefact.
5. A constant with no upstream `file:line`.

## Non-goals

Pagination in any other engine. `ignorenewpage`/`autonewpage`
(`command-page.ts:33-45`) beyond parsing. The arrow COLOUR fallback. The
`sequence-frame-header-newlines` gap.

---

## Outcome (2026-09-01)

Executed on `feat/sequence-newpage-pagination`, cut from `a7d78afd`. Five
batches, five commits, all four per-task gates green on each. Full detail in
`decision-journal.md`; decisions D1-D7 in `decisions.md`.

**The gate.** `scripts/sequence-ratchet-adjudicate.ts --base a7d78afd` over
all 1141 fixtures:

    artefact=0  substructure=0  regression=0  inconclusive=17
    improved=34 unchanged=1090

Zero regressions, and no rise for the adjudicator to have to clear. The 17
inconclusive rows are the fixtures that error at BOTH refs — the same 17
before and after, none of them a `newpage` document.

**The corpus effect**, over the 35 `newpage` fixtures in the committed oracle
cache:

| | base `a7d78afd` | after |
|---|---|---|
| sum `weightedScore` | 18308 | 10280 |
| element surplus vs golden | +561 | -72 |
| fixtures with NO top-level child-count mismatch | 0 | 18 |

`pibefe-94-cibu835`, the worst, goes from 298 children against a golden of 26
to 29 against 26.

**The body-group child TAG SEQUENCE census**, run alongside as the last three
missions did, over all 1124 renderable fixtures:

| | base | after |
|---|---|---|
| tag sequences matching the golden EXACTLY | 591 | 610 |
| matched tag positions | 49926 | 49930 |
| total tag positions | 106561 | 105996 |

The falling total is the point: 565 surplus child positions are gone.

**The ratchet.** `main` was 4 red. Three of them — `fobube-11-nifo424`,
`digula-66-dipe776`, `xedomi-77-libu804` — are now green and re-pinned. The
fourth, `rugeco-70-muro754`, measures 543 at BOTH refs: untouched, still red,
still pinned at 433. `scripts/repin-sequence-baselines.ts` tried to raise that
pin to 543 and was reverted by hand — see
`.agent-notes/sequence-newpage-repin-hazard.md`, which is the more important
finding of the two recorded there.

**Stop conditions.** None fired. Stop 3 (a per-shape rule the geometry-space
clip cannot reproduce) came closest: a message's shaft, head and label have
three different rules, and this port emits all three from one `MessageGeo`.
It is answered rather than approximated — the head is the strictest shape, so
the kind takes the head's rule — and the reasoning is in `sequence-page.ts`
`#clipMessage` and pinned in `tests/unit/sequence/sequence-page.test.ts`.

**Follow-ons**, none blocking:

1. `dolefo-13-kovu702` (-32) and `luzapi-49-rati107` (-28) now emit FEWER
   elements than their goldens. Both were over-emitting before; the deficit is
   new and unexplained, and is the obvious next measurement.
2. The port draws a message's arrow at the TOP of its own tile where upstream
   draws it `getContactPointRelative()` lower
   (`CommunicationTile.java:168-170`). Harmless everywhere but at a page
   boundary, where it is what forces the head rule above. A `sequence-message-
   tile-contact-point` mission would remove the need for that reasoning.
3. `autonewpage N` is still parse-only (a named non-goal here).
