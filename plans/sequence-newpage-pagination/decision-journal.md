# Decision journal — sequence-newpage-pagination

Branch `feat/sequence-newpage-pagination`, cut from `a7d78afd`.

## Startup (2026-09-01)

The brief directory held only `README.md`: no `decisions.md`, no batch
overviews, no task files. Read the Java named in the README before writing
anything, and recorded the page model in a new `decisions.md` (D1-D6). Batch
and task decomposition is inline in this journal rather than in separate
files, because each batch here is a single-writer change with no parallel
fan-out to co-ordinate.

### Verifications made before Batch 1

- `NewpageTile#getPreferredHeight` = 21: `ComponentRoseNewpage
  #getPreferredHeight` returns `1` (`:68-71`) and `MARGINY` is `10`
  (`NewpageTile.java:50,94-96`). Confirmed by reading both.
- The clip band is `[ymin, ymax + 1]`, not `[ymin, ymax]` — see D2. The
  `+ 1` is measurable in `digula-66-dipe776`'s golden (`y2="339"` where
  `ymax` maps to `338`), and it comes from `pageHeight + 1` in the `UClip`
  constructor plus `AbstractCommonUGraphic#apply`'s translate of the clip.
- `enlargeClip()` has exactly one caller in the whole tree
  (`UGraphicHandwritten.java:60`), so the band is never widened on this path.
- `Newpage#dealWith` returns `false` (`Newpage.java:59-61`), so a newpage
  event links no participant — `collectLinkedIds`'s if/else chain already
  falls through for an unknown kind, so `hide unlinked` needs no change.
- `SequenceDiagram#newpage` is a no-op under `ignorenewpage` (`:243-250`).
  The README's non-goals exclude `ignorenewpage` "beyond parsing"; two
  corpus fixtures carry it (`podata-90-rike047`, `tolake-96-duve519`), and
  ignoring the gate would paginate a document upstream does not. Decision:
  honour the gate (three lines, and it is the SAME `newpage` mechanism, not
  a separate feature). Logged rather than assumed.

## Batch 1 — the page model in layout (T1)

Write-set: `src/diagrams/sequence/{ast,command-page,layout,newpage-style,
renderer,scale-geo,sequence-layout-events}.ts`,
`tests/unit/sequence/{newpage-page-model,frame-style,renderer}.test.ts`,
`docs/catalog.md` (generated).

`newpage` is now an event with a y. `NewpageEvent` carries the optional
label; `NewpageGeo` is a tile of `NEWPAGE_TILE_HEIGHT` (21) with a
back-filled `[border1, border2]` band; `SequenceGeometry` gains `headHeight`
(= `LivingSpaces#getHeadHeight`, the row this port's body starts below).
`renderer.ts` draws nothing for the kind yet — Batch 3.

### The README's Batch 1 claim, measured rather than assumed

> "No render change, no fixture movement. Verify that claim rather than
> assuming it."

Half true, and the half that is false is worth writing down.

- **Geometry DID move.** `digula-66-dipe776` went from `height="1019px"` to
  `height="1061px"`, exactly `2 * 21` for its two `newpage` lines. That is
  the tile taking the vertical space `NewpageTile#getPreferredHeight`
  reserves, which it must, or the pages cannot overlap on the separator.
- **No fixture MOVED on the gated quantity.** A census over all 35
  `newpage` fixtures in `test-results/dot-cache/sequence/`, run at
  `a7d78afd` in a detached worktree and again in the working tree, is
  byte-identical: sum `weightedScore` 18308 both times, sum element surplus
  +561 both times, and every per-fixture row equal.

  The mechanism, not a coincidence: every one of the 35 short-circuits at
  `svg/g[1][childCount]`, and Batch 1 changes no element's EXISTENCE, only
  its y. `compareSvg` never descends past a child-count mismatch, so a
  coordinate shift below it is invisible to the score. This is the same
  property `comparesvg-count-not-monotonic` records from the other side.

  Consequence for the rest of the mission: the score cannot move until the
  child COUNT does, i.e. not until Batch 2 drops the off-page elements. Do
  not read a flat score after Batch 1 as "nothing happened".

- Census population is 35, not the README's 39/33: the README counted
  `.puml` files under `tests/corpus/sequence/` mentioning `newpage`
  anywhere (42 by `grep -l`, including `ignorenewpage` and prose); this
  counts fixtures in the committed oracle cache whose source has a `newpage`
  COMMAND line. All 35 render; none errors. The +561 surplus corroborates
  the README's +547 within that population difference.

### Two things fixed while the file was open, both cited

- `newpageCommand`'s pattern captured nothing and accepted `newpage :`.
  Upstream's LABEL is `(.*[%pLN_.].*)` inside a `RegexOptional` followed by
  `RegexLeaf.end()` (`$`, `RegexLeaf.java:51`), so an all-punctuation label
  cannot match and the line is not a `newpage` at all. Now `/^@?newpage
  (?:(?:[\s ]*:[\s ]*|[\s ]+)(.*[\p{L}\p{N}_.].*))?\s*$/iu` —
  `[\s ]` is `%s`'s own expansion (`Pattern2.java:57`) and
  `[\p{L}\p{N}]` is `%pLN`'s (`:56`). Corpus-checked: no fixture writes a
  label this newly rejects.
- `ignorenewpage` now sets a flag `newpageCommand` reads, per the startup
  note above.

## Batch 2 — the page transform (T2)

Write-set: `src/diagrams/sequence/{sequence-page,ast,renderer,
renderer-frame-header}.ts`, `tests/unit/sequence/sequence-page.test.ts`,
`docs/catalog.md`.

`paginateSequence(geo, pageIndex)` clips and translates; `renderSequence`
became `renderSequencePage(geo, theme, 0)`. The page selection sits between
layout and render, ahead of the scale multiply, because that is where
`SequenceDiagramFileMakerTeoz#getTextBlock(num)` sets it and because upstream
paginates in layout space and scales on the way out.

### The one place the mapping was genuinely ambiguous, and how it was answered

Probed rather than guessed: over all 35 fixtures x every page, exactly TEN
geometries straddle a band edge — 4 activations, 3 dividers, 3 frames. No
notes, no messages. Each was answered from the shape it actually emits:

- activations CLAMP (`URectangle`), exactly;
- all three straddling dividers are the tile that OPENS the next page, whose
  top is one pixel inside the band while every shape it draws is ~20px lower
  and clipped away. Anchoring on the divider's own band rule, `y + height/2`
  (`ComponentRoseDivider.java:68,79`), drops all three — which `digula`'s
  golden confirms, carrying no trace of its `== Page 2 ==`;
- two of the three frames clamp with their tab intact; the third
  (`fobube-11-nifo424` page 1) has its body on the page and its tab off it,
  which is the one case where upstream's `URectangle` and `UPath` rules
  disagree WITHIN a kind. `FrameGeo.headerClipped` carries that answer.

### The one halt-worthy moment, and its diagnosis

The first working transform left THREE risers — `devamo-31-coji129`,
`pidadu-86-cuda807`, `sobiga-51-damo304`, each +8 with the child-count
distance moving the wrong way, i.e. `regression` by the adjudicator's rule
and stop condition 4.

Diagnosed rather than accepted. Mechanism: this port assigns a message's
arrow `y = cursor.y`, the top of its own tile
(`sequence-layout-message.ts:38-41`), where upstream draws it at
`yGauge.getMin() + getContactPointRelative()`, below the label
(`CommunicationTile.java:109-117,168-170`). The band ends at
`newpageTile.y + 21 + 1` and the next tile's top is `newpageTile.y + 21`, so
the port's arrow sat one pixel INSIDE a band upstream's arrow is ~14px below.
All three fixtures are `newpage` immediately followed by a message; every
other fixture puts a divider there and was unaffected.

Ruled out: the band arithmetic (`digula`'s golden pins the separator,
lifeline end, footbox top and image height simultaneously, and all four
land); the clip rule for the message shaft (a horizontal `ULine` at one `y`
is correct); a fitted fix (shrinking the band, or making the message test
half-open, would have been choosing an interval to make three fixtures pass).

Resolved by D8: the head is the strictest of a message's three shapes and
answers the case with a cited constant, `ARROW_DELTA_Y`. Result: 0 risers,
34 falls, 1 hold; sum weightedScore 18308 -> 13855.

## Batch 3 — the separator (T3)

Write-set: `src/diagrams/sequence/{newpage-style,renderer}.ts`,
`tests/unit/sequence/newpage-separator.test.ts`.

The three stroke values are the style cascade, not a measurement:
`ComponentType.NEWPAGE.getStyleSignature()` is `root, element,
sequenceDiagram, newpage`, giving `#181818` / `0.5` / `LineStyle 2`, and a
single `LineStyle` token means dash == space (`Style#getStroke:265-282`). The
golden's `stroke:#181818;stroke-width:0.5;stroke-dasharray:2,2` is what that
resolves to, and it is confirmation, not the source.

13855 -> 10280; surplus -106 -> -72.

## Batch 4 — the public API (T4)

Write-set: `src/core/dispatcher.ts`, `src/index.ts`,
`src/diagrams/sequence/{index,ast,command-page,sequence-page}.ts`,
`tests/unit/sequence/{newpage-render-pages,newpage-page-model}.test.ts`,
`DIVERGENCES.md`, `docs/catalog.md`.

`PaginatedPlugin` is three optional members, not two: chrome is composed
outside `render()` here, and `TitledDiagram#addChrome(index, …)` substitutes
`getTitle(index)` for `index > 0` — so `pageAst` carries the per-page title.
Without it every page of `digula` would have shown page 1's title, where the
jar shows none (its `newpage`s carry no label). No corpus movement: page 0's
path is unchanged and every other engine takes the single-page branch.

## Batch 5 — adjudication and close-out (T5)

Numbers in the README's Outcome section. Two measurement findings filed in
`.agent-notes/sequence-newpage-repin-hazard.md`; the first — the re-pin script
raising a pre-existing red row's pin — is the one that matters, and it was
caught only because the README named `rugeco` in advance.
