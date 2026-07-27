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

Families from `detectCause` (`scripts/measure-description-size-deltas.ts`),
which detects containers (a container keyword opening `{`, or a bare `{` line)
BEFORE the leaf checks — so a `package X { … }` is cluster sizing (S1L-e), not a
leaf tab. First-match wins on compounding fixtures. Representative slugs shown;
the full per-fixture set is `size-backlog.json`. (Re-bucketed 2026-07-27 for
accuracy — the first cut over-counted package-tab/display and under-counted
containers.)

| Family | n | Root cause | Routed to |
|---|---|---|---|
| container / cluster | 47 | container box + child-cluster sizing (`computeContainerBbox` subsystem); not a leaf fix. e.g. fepuvo-06-rugi981, tuliba-37-liza126, berufi-69-dara369 | **S1L-e** |
| uncategorized | 37 | small residuals (≤~0.9in) not yet attributed by the heuristic; per-fixture triage folds each into the family a sub-mission's re-run identifies. e.g. nixura-77-bina738, dopova-50-digo290, kokodo-61-dano461 | triage |
| sprite / stdlib-macro / icon | 11 | scaled sprite dims via `<$…>` or `!include <awslib\|c4\|…>` macros mis-sized (kofuca-08-pafi749 → 478in), unknown sprite/icon → 0 dims. e.g. kofuca-08-pafi749, vivido-49-nisu863, bivira-53-boja685 | **S1L-f** |
| interface shield | 11 | shielded `interface` sized as a generic box, not the fixed 0.25in circle; `isInterfaceShielded` gate exists, sizing does not. e.g. turasu-73-zoni468, cojege-69-ruku138, cegale-42-loxa672 | **S1L-c** |
| min-width floor | 4 | `skinparam minClassWidth`/`MinimumWidth` sets the box width floor; not wired (leaf boxes floored low). e.g. dexigu-24-deru622, kenece-24-juku624, zifaji-87-raki559 | **S1L-g** |
| display-text expansion | 4 | bracket-body `[…]`, `$var`, `<U+…>`/emoji, creole `====` never expanded to text lines before `measureLeafNode` (parser/`finalizeDisplay` layer). e.g. gafico-37-cuma657, nujito-06-neca370, lurupu-11-fubo915 | **S1L-b** |
| package / folder tab (leaf) | 3 | form-dependent leaf tab geometry (`package "X"` no braces). e.g. codabo-50-mupa164, tajadu-40-juro990, cobuju-30-paxo591 | **S1L-a** |
| latex (DIVERGENCE) | 2 | KaTeX ≠ JLaTeXMath — see below. gevozu-46-sasu860, sunuju-01-pote718 | DIVERGENCES |
| wrapWidth | 1 | `skinparam wrapWidth` word-wrapping unimplemented. mejoxi-96-cegu294 | **S1L-d** |

Container/cluster (47) is the dominant description-sizing gap. The 37
uncategorized are small and pinned; each is attributed to one of S1L-a..g as
those missions re-measure. Nothing here except LaTeX is excluded — all count
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
