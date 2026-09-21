# Where the 825 `unknown` fixtures map (jar oracle captured 2026-09-20, NOT pinned)

Maintainer question after the eleven-bucket capture: "where do the unknown items
map?" All 825 were rendered through `scripts/capture-oracle-cache.ts`
(825/825, 0 jarFailed, 14 adopted from a named block) and measured through the
routing/refusal gates' own seams. The captures are PARKED at
`test-results/dot-cache-unknown-2026-09-20/` (gitignored, outside the walked
`dot-cache/` tree) with `measured-through-gates.json`,
`dispatcher-per-fixture.json` and `capture-result.json` beside them, so a
pinning mission starts from the renders instead of re-paying 30 min of jar time.

## By start keyword (manifest)
692 `@startuml` · 68 `@startnwdiag` · 21 `@startcreole` · 11 `@startmath` ·
8 `@startfiles` · 7 `@startbpm` · 6 `@startjcckit` · 4 `@startgit` · 3 `@starthcl` ·
2 `@startdef` · 2 `@startlatex` · 1 `@startflow`.

## By the jar's `data-diagram-type` (the oracle answer)
285 CLASS · 225 DESCRIPTION · 77 NONE (untyped render: creole, math, latex,
def, jcckit, some `@startuml`) · 64 NWDIAG · 52 SEQUENCE · 48 ACTIVITY ·
26 jar error pages · 13 TIMING · 8 FILES · 7 BPM · 7 HELP · 5 STATE · 4 GIT ·
3 HCL · 1 FLOW.

## Jar vs this port (per fixture, gates' seams)
573 agree · 26 jar error pages · 226 disagree · 111 of the 825 error here on a
source the jar rendered. Cohorts:

     538  agree
      64  no nwdiag engine here (NWDIAG -> NONE)
      42  CLASS -> DESCRIPTION
      35  jar untyped render, we error (per-fixture look needed)
      26  jar error page
      25  ACTIVITY -> NONE (we error, class) — corrected 2026-09-21:
          this is NOT the legacy `(*) -->` cohort (`activity-legacy1-
          example-*`); T2 disproved that premise (`grep -cE
          '\(\*\)|-->'` = 0 for all 25) — these are activity3
          constructs with port gaps (bullet lists, switch/case,
          `backward:`, if-family spellings, `end while`, partition/
          group). The one true legacy-arrow fixture is
          `bitabu-34-lota947`, counted separately below.
      16  CLASS -> NONE (we error, class)
      13  no timing engine here (TIMING -> NONE, we error)
       8  files engine stamps no root diagram type (FILES -> NONE)
       7  no bpm engine here (BPM -> NONE)
       7  no help engine here (HELP -> NONE, we error)
       5  ACTIVITY -> DESCRIPTION
       5  SEQUENCE -> NONE (we error, sequence)
       5  DESCRIPTION -> STATE
       4  no git engine here (GIT -> NONE)
       3  ACTIVITY -> NONE (we error, activity)
       3  DESCRIPTION -> NONE (we error, description)
       3  ACTIVITY -> CLASS
       3  CLASS -> SEQUENCE
       3  DESCRIPTION -> CLASS
       1  no flow engine here (FLOW -> NONE)
       1  ACTIVITY -> STATE
       1  CLASS -> NONE (we error, state)
       1  CLASS -> STATE
       1  NONE -> STATE
       1  DESCRIPTION -> SEQUENCE
       1  CLASS -> NONE (we error, description)
       1  ACTIVITY -> NONE (we error, sequence)
       1  CLASS -> NONE (we error, unknown)
       1  STATE -> CLASS
    
    one-mechanism or settled: 668   needs per-family adjudication: 157

## Why it is not pinned
The 95-ish one-mechanism rows (no nwdiag/timing/bpm/git/flow/help engine; the
files engine's missing root attribute) could be pinned the way the eleven
buckets were. The remaining ~130 -- 42 CLASS sources this port routes to
DESCRIPTION, 29 ACTIVITY and 18 CLASS refusals, 5 DESCRIPTION -> STATE, and a
long tail of one-offs -- each need the refusing line and the upstream Command
named (the gates' bar for `known-misroute`/`known-gap`). That is
`routing-heuristic-repair`-shaped adjudication, a mission, not a follow-on.
Meanwhile the `unknown` row on the dashboard stays `accounting bucket` (D7).

## Outcome (2026-09-21)

All 825 fixtures are now pinned (`unknown-bucket-routing-repair` T14,
commit `4b6949ee`); the parked capture at
`test-results/dot-cache-unknown-2026-09-20/` moved into
`test-results/dot-cache/unknown/`. Of the 157 diagnosed disagreements
counted above ("needs per-family adjudication: 157"), batch 2 fixed 115
and pinned 42 named cohorts (T14 commit `4b6949ee`):

**Fixed (115):** class 66, activity 34 (including the 5
description-sprite cross-seam rows), sequence 9, description 6.

**Pinned, not fixed (42 named cohorts, plus T1's 668 baseline pins):**
no nwdiag/bpm/git/flow/timing/help engine 96 (settled), files' root
attribute 8 (settled), 12 jar error pages past the gates' 4096-byte
head window (`jar-error-beyond-head-window`), 22 unported utility/
easter-egg factories, timing/help `@startuml` sources 20, description
archimate/map/embedded gaps 3, the one true legacy `(*) -->` fixture
(`bitabu-34-lota947`), a class link fallback 1, a Tim function gap 1, a
preprocessor-only source 1, and `kubuju` (state now refuses what only
`PSystemListFonts` accepts).

**`tests/oracle/svg-conformance/unknown-ledger/*.json` tally by cohort**
(counted 2026-09-21, `disposition` field, 825 rows total): agree 538 ·
jar-error 26 · known-misroute 86 (no-engine-nwdiag 64,
files-untyped-root 8, no-engine-bpm 7, no-engine-git 4, no-engine-flow
1, activity-legacy-arrow-syntax 1, class-generic-link-fallback-overclaim
1) · known-gap 60 (no-engine-timing 13, no-engine-help 7,
jar-error-beyond-head-window 12, jar-listemoji-utility 7,
jar-listfonts-utility 3, jar-sudoku-utility 2, jar-welcome-page 2,
jar-colors-utility 2, state-angle-bracket-overclaim 1,
preprocessor-function-resolution 1, preprocessor-only 1,
description-archimate-multiline-gap 1, description-embedded-diagram-gap
1, description-map-command-gap 1, jar-openiconic-utility 1,
jar-listopeniconic-utility 1, jar-stdlib-catalog-utility 1,
jar-dedication-easter-egg 1, jar-charlie-easter-egg 1,
jar-listarchimatesprites-utility 1) · fixed 115 (34 activity cohorts +
66 class + 9 sequence + 6 description). 538+86+60+115+26 = 825. This
ledger `disposition` is a single per-fixture classification, distinct
from the routing/refusal GATES' own separately-computed view of the
same tree (decision-journal row 21): routing unknown 689/110/26
(agree/known-misroute/jar-error); refusal unknown 26 jar-error / 61
known-gap / 738 render — the two do not need to reconcile row-for-row,
they measure different gates.

**[FIXED] retirements on the EXISTING (non-unknown) tree, same batch:**
43 activity pins and 1 sequence pin (routing known-misroute -> agree,
refusal `weErrored` true -> false).

**What remains pinned, and why:** the jar-error (26) and known-gap (60)
ledger rows have no port-side fix available — a missing engine, an
unported utility/easter-egg factory, or the golden itself is a jar
error page. The known-misroute rows (86, plus T1's 668 baseline pins)
are settled: each names the missing upstream engine or the refusing
line. Genuine follow-on work is filed in `planning/next-missions.md`
§5: `activity-emphasize-arrow-atomic-anchor`, the four sequence/timing
gaps T9 unmasked, widening the gates' 4096-byte head window, and T10's
documented activity rendering divergences.
