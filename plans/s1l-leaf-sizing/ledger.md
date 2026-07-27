# Size-conformance ledger — description diagrams (S1L)

Honest-accounting close of mission **S1L** (maintainer-selected 2026-07-27).
Every non-`conformant` description fixture is carried here by a named
root-cause family, each routed to a tracked follow-on sub-mission or a
`DIVERGENCES.md` entry — satisfying the standing rule *"every conformance bar
is 100% minus known divergences."*

Measurement: `scripts/measure-description-size-deltas.ts` over the 351 committed
`oracle/goldens/description/<slug>/` goldens (all structurally EQUAL). Captured
2026-07-27. A fixture is size-`conformant` when its `maxSizeDeltaIn` ≤ 0.01in.

## Result

| | count | share |
|---|---|---|
| structurally EQUAL goldens | 351 | — |
| size-`conformant` (≤0.01in) | **231** | **65.8%** |
| non-conformant (carried below) | 120 | 34.2% |
| — of which inherent-tolerance DIVERGENCE (LaTeX) | 2 | |
| conformant excluding the LaTeX divergence | 231 / 349 | **66.2%** |

Every non-conformant fixture is a keyed entry in
`oracle/goldens/description/size-backlog.json`, pinned at its current delta,
shrink-only. The parity ratchet (`tests/oracle/description-parity.ratchet.test.ts`)
asserts `maxSizeDeltaIn ≤ pin + 1e-6` per fixture and ≤0.01in for any fixture
absent from the backlog — so sizes are regression-proof and a fixture flips to
asserted-`conformant` the moment a sub-mission drops it to ≤0.01 (its entry is
then deleted).

## Non-conformant by cause → routing (120)

Families are heuristic (from `detectCause` + a `<style>`/`{}`/`!include` refine
pass); representative slugs shown, full per-fixture set is `size-backlog.json`.

| Family | n | Δ range (in) | Root cause | Routed to |
|---|---|---|---|---|
| container / cluster | 30 | 0.07–3.18 | container box + child-cluster sizing (`computeContainerBbox`); not a leaf fix. e.g. berufi-69-dara369, bobije-35-nigi914, seline-83-vifi756 | **S1L-e** |
| package / folder / artifact tab | 20 | 0.06–3.57 | form-dependent tab geometry + min-width (leaf vs `{}` vs braces); not a constant. e.g. fepuvo-06-rugi981, zotiru-33-legi180, dexigu-24-deru622 | **S1L-a** |
| display-text expansion | 18 | 0.04–5.78 | bracket-body `[…]`, `$var`, `<U+…>`/emoji, creole `====` never expanded to text lines before `measureLeafNode` (parser/`finalizeDisplay` layer). e.g. gafico-37-cuma657, nujito-06-neca370, balomu-94-kegi822 | **S1L-b** |
| interface shield | 17 | 0.22–1.23 | shielded interface sized as generic box, not the fixed 0.25in circle; `isInterfaceShielded` gate exists, sizing does not. e.g. turasu-73-zoni468, cojege-69-ruku138, cegale-42-loxa672 | **S1L-c** |
| sprite / stdlib-macro / icon | 13 | 0.10–478.94 | scaled sprite dims via `!include <awslib\|c4\|…>` macros mis-sized (kofuca-08-pafi749 → 478in), unknown sprite/icon → 0 dims. e.g. kofuca-08-pafi749, tuliba-37-liza126, vivido-49-nisu863 | **S1L-f** |
| wrapWidth | 1 | 3.00 | `skinparam wrapWidth` word-wrapping unimplemented. mejoxi-96-cegu294 | **S1L-d** |
| **uncategorized** | 19 | 0.11–0.88 | small residuals not yet attributed by the heuristic; per-fixture triage folds each into the family a sub-mission's re-run identifies. e.g. dopova-50-digo290, nadocu-64-juba262, figika-36-sola271 | triage |

The 19 uncategorized are small (≤0.88in) and pinned; each will be attributed to
one of S1L-a..f as those missions re-measure. They are NOT excluded — they count
against the bar until conformant.

## Inherent-tolerance divergence (excluded from the conformant denominator)

| Slug | Δ (in) | Cause |
|---|---|---|
| gevozu-46-sasu860 | 4.67 | LaTeX label rendered via KaTeX ≠ upstream JLaTeXMath — different math engine, different glyph metrics. Permanent, maintainer-approved (`DIVERGENCES.md`). |
| sunuju-01-pote718 | 4.67 | same |

These 2 are the **only** exclusion. Sprites, OpenIconic, and `<style>` blocks
are ported subsystems (gaps in coverage, not divergences) and stay in the
denominator, routed to S1L-f/S1L-b above.

## Size backlog

`oracle/goldens/description/size-backlog.json` — 120 shrink-only per-fixture
pins (incl. the 2 LaTeX fixtures, tracked for non-regression even though
excluded from the reported denominator). Its `_doc` records the capture
provenance. Re-measure with `npx tsx scripts/measure-description-size-deltas.ts`
(exit 0 iff zero widened).
