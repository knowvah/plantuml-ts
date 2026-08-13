# Root cause: link labels are measured as a raw STRING where upstream measures a creole TEXT BLOCK

Diagnosed 2026-08-13 on `usecase/jecici-56-bimu826`. Supersedes the earlier
"suggests one long line" hypothesis with the mechanism and exact numbers.

## Mechanism

`SvekEdge.java:441` sizes the DOT label table from
`labelText.calculateDimension(stringBounder)` — a real creole `TextBlock`, so
`\n` becomes multiple stripes and `<color:…>` becomes a formatting change
rather than literal glyphs. This port calls
`measureLineWithAtoms(resolvedLabelText, …)` from
`description/link-edge-attrs.ts#applyMainLabel` — a **single-line** string
measurer that understands `<img>`/sprite atoms and nothing else.

Three independent defects fall out of that one mismatch. Measured on
`jecici`'s label `<color:green>Purchase Price\n<color:green>Payment of $100`,
whose oracle box is **72 x 22**:

| what is measured | width | height |
|---|---|---|
| raw string, size 13 — **what we do today** | 336.1 | 13.0 |
| creole tags stripped | 175.6 | 13.0 |
| + longest line instead of the concatenation | 70.0 | 13.0 |
| + line count honoured, at size 10 | 70.0 | ~22 |
| **oracle** | **72** | **22** |

1. **Creole markup is measured as literal text.** `<color:green>` contributes
   ~13 glyphs of width, twice. 336 -> 176.
2. **Multi-line labels are measured as one line.** Width should be the max
   over lines, not the sum; height should scale with the line count.
   176 -> 70 wide, 13 -> 22 tall.
3. **`skinparam arrowFontSize` is unported.** We measure at the
   `ARROW_LABEL_FONT_SIZE = 13` default where this fixture asks for 10 —
   already flagged in `class-layout-helpers.ts#CARDINALITY_FONT_SIZE`'s doc
   comment (`core/skinparam.ts#ELEMENT_BUCKET_SNAMES` omits `'arrow'`).

**No partial fix converges.** Splitting lines without stripping creole leaves
the longest raw line at ~190 against 72, and correcting the line count alone
moves height 13 -> 26 against 22. All three are required together, which is
what makes this one job rather than three.

## Blast radius — small, and that is the good news

- multi-line link labels: **6 of 358** description fixtures
  (`component/bagoze-78-lada681`, `component/josoxo-49-taci997`,
  `component/zosaxo-93-nici652`, `usecase/dopova-50-digo290`,
  `usecase/zilisi-99-rate911`, `usecase/jecici-56-bimu826`)
- creole markup in a link label: **6**
- `skinparam arrowFontSize` anywhere in the corpus: **3** (component, usecase,
  class — one each)

The same measurement also feeds `computeGraphSpacing` via `computeLinkDzeta`,
so `ranksep`/`nodesep` are wrong on those fixtures too, not just the label box.

## Why it is not fixed here

The fix is to route link-label measurement through the creole text-block stack
this repo already has (`klimt/creole/`, `SheetBlock1/2`, `CreoleParser`),
replacing `measureLineWithAtoms` at `applyMainLabel` and `dzetaTexts` — plus
the `arrowFontSize` skinparam plumbing. That is a wiring job into an existing
subsystem with corpus-visible output, not a patch, and the class engine has
the same seam (`ARROW_LABEL_FONT_SIZE`) waiting behind it.

## Still invisible to the gate

`parseEdges` records only `hasLabel: boolean`, so a 336-vs-72 divergence
scores EQUAL. Adding label dimensions to `StructuralEdge` would make this
class of defect visible — the fourth instance of that blind-spot shape after
`sametail`, `constraint` and `style=invis`.

**Confidence**: High — every number above is a direct measurement, and the
upstream side is read from `SvekEdge.java:441`, not inferred.
