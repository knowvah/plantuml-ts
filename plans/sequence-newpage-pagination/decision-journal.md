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
