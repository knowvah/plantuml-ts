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
      25  ACTIVITY -> NONE (we error, class)
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
