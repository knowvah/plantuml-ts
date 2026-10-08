# Architecture decisions: lgm (user ruling 2026-10-08: "1, write Mission A's brief")

Scope: the three bounded `DIVERGENCES.md` entries (edge precision, non-class
mainframe sizing, composite-anchor clip rect). The single-style-engine
migration is Mission B (a separate series), out of scope here.

## D1: mirror, never accept
Ruling 2026-10-08 (CLAUDE.md "A divergence exists only where a library forces
it"): each entry is a mirror task. "Accepted, permanent" in an entry is a claim
to re-verify, not a status to keep.

## D2: library-forced needs a controlled experiment
An entry survives only if a task proves a library forces it: the same input
through the jar and through ours differs ONLY at the library's output, shown by
feeding the library the jar's own inputs (e.g. the cached `svek-N.dot` through
dot-engine vs real `dot`). Assertion without that experiment is stop 14.

## D3: A1 is an audit first
`graph-layout-svek-read.ts` (cdd3-T-D3) already parses dot-engine output as the
jar parses `dot -Tsvg` text, and `graph-layout.ts:368` defaults every caller to
`read: 'svek'`; only `diagrams/json/layout.ts:440` reads `exact` (a Smetana path,
correct). T0b enumerates every value the jar takes from the SVG
(`DotStringFactory.java:377-437`, `SvekEdge.java:618-637`, label/tail/head
positions) and every consumer of `@knowvah/dot-engine` in `src/`
(`diagrams/dot/layout.ts` included), proves each reads through the svek seam or
fixes it, and measures `bipudo-23-xavu432` plus the class/state/description
surveys. Retire the entry with that table.

## D4: A2 mirrors the jar's chrome order, not class's patch
`DiagramChromeFactory.create` wraps the body with `decorateWithFrame`
(`core/DiagramChromeFactory.java:126-133,275-336`) and
`TextBlockExporter#calculateFinalDimension` runs AFTER it. Class reaches that
order through `applyClassDocumentMargin` re-applied post-chrome (`src/index.ts`,
G2 N46). The task measures the five sequence fixtures' frame diffs FIRST, reads
how upstream's sequence file makers reach `DiagramChromeFactory`, and ports that
path once for every engine that routes through `applyChrome` — not a
per-engine constant. Re-verify the three unknown-bucket fixtures stay conformant.

## D5: element-count guard at every merge
After each merge the orchestrator compares per-tag element counts (ours vs
jar) for every fixture of every engine the task touched; any count moving AWAY
from the jar is a fix task, never an accepted rise (memory
census-away-from-jar-catches-hidden-regressions). Score rises need a
Java-quoted mechanism (reveals are allowed with the census showing it).

## D6: exit bar
- Every `fixtures.md` row `final` ∈ `exact`, `moved (<mechanism of residual>)`,
  `open -> <mission> (<mechanism>)`.
- The three DIVERGENCES entries retired, or narrowed to a D2-proven
  library-forced remainder.
- Four gates green, collected = on-disk.
- 0 conformant losses in any engine (b0 -> final); 0 unexplained rises.
- The five sequence mainframe fixtures: the frame rect and tab geometry equal
  the jar's (other sequence diffs are not this mission's).
- `pesita-10-dene726`, `viroxo-69-fito663` and every authored A3 fixture: the
  clipped endpoints equal the jar's.

## D7: execution rules
`common-rules.md` first in every agent prompt. Parallel tasks in
`measurements/mkwt.sh` worktrees. A stalled agent: inspect its worktree, resume
via SendMessage (memory subagent-handback-single-shot: read its worktree
journal/commits if the second report never arrives). `src/core/**` edits are
allowed when named in the write-set, with an all-engine survey before/after.
