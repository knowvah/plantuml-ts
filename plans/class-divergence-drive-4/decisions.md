# Architecture decisions — cdd4 (approved 2026-09-26, "Approve all")

## D0 — Close cdd3 first
Commit the `absorbLayoutEpsilon` deletion (journal 56: identity moves 0
rows), run cdd3's `batch-5/T-exit.md` and `final/T-close-out.md`, and
merge to main with a merge commit. cdd4 branches off that main, so the cdd3
ledger is final before cdd4 measures anything. cdd3's close is measured on
dot-engine 1.6.0, keeping its numbers separate from any dot-engine bump.

## D1 — Exit bar
Class conformant ≥ 695: 689 + gujigi, jakapi, lecelo, sokevu, mizupo,
besepi. Plus every dot-engine row a new release fixes (D2).
- Accepted (class) = 17 (D6, including nugecu).
- Every remaining dot-engine row maps to a re-verified TRACKER entry.
- bidusa, ruliki, popesa pinned.
- Zero conformant losses and zero unexplained rises, in every engine.
- Class DOT parity green; four gates green with collected = on-disk.

## D2 — dot-engine: document only; review responses before proceeding
The maintainer addresses the `docs/graphviz-issues/TRACKER.md` entries
(19, 22–26) in dot-engine BEFORE this mission executes. The tracker is the
channel; the individual issue files are its detail.
- T0d reviews every TRACKER response and any new dot-engine release, bumps
  the dependency, and measures every engine.
- If a response changes scope (issue declined, behaviour reassigned to
  plantuml-ts, a partial fix), amend this file and HALT for the user
  before batch 1.
- Never edit `~/git/knowvah/dot-engine`, never publish or release it.
- Findings that are not dot-engine's return to this mission's scope as new
  diagnosis rows.

### D2 amendment — responses reviewed 2026-09-26 (planning)
dot-engine **1.6.1** (npm, 2026-09-27, PR #60 `3e0690f6`) fixes 19, 22, 24, 26
and the engine half of 25. Probe on the cached `svek-1.dot` compared real
dot 16.1.0 with 1.6.1 `render(parse())`: **13 of 14 G fixtures byte-match**
(nafiki included), 0 `triangulation failed`.
- 23 is ACCEPTED in dot-engine (its known-divergences A3: a tie-break
  decided by float noise). nugecu still differs (one edge, Δ16.063); its
  plantuml-ts handling is D6.
- 25's consumer half is plantuml-ts work: new task T11.
- 18 is reclassified as ours, but bejusa-95 and pecabi-95 are already
  class-conformant, so there is no class work; T-close-out files it in
  next-missions for the other engines.
- T0d bumps to 1.6.1, re-measures, and checks the TRACKER boxes for 19, 22,
  24, 25 and 26 only once each fixture re-measures clean in the SVG survey.

## D3 — `!theme` execution
Port `TContext#executeTheme` (`TContext.java:726-755`): the theme source's
lines run through the preprocessor.
- Theme sources are embedded verbatim as a generated, browser-safe TS
  module (`~/git/plantuml/src/main/resources/themes/`, 44 files, ~384 KB).
  Follow the stdlib pattern: no fs at runtime.
- `!theme X from <lib>` resolves through the include resolver.
- The precompiled summary (`scripts/compile-themes.py` → `themes-builtin*`)
  is retired only when all 25 `!theme` corpus fixtures (all engines) are no
  worse.
- Consequences: a larger bundle (T7a measures and records it); renderers
  reading `Theme.colors` may need the executed state routed in (T7b).

## D4 — E3-9 description measurer
Apply `plans/class-divergence-drive-3/measurements/e3-9-description-measurer.patch`
(`git apply --check` passed on 2026-09-26) and survey every engine. Every
mover gets a journal row with its mechanism. cdd3 stop 9 (>20 non-class
movers) is waived for this task only; an unexplained rise still stops.

## D5 — besepi oracle re-render
Run `scripts/oracle-render.sh` on besepi only, 3×, and require
byte-identical output (proves the jar is deterministic here). Then replace
its committed oracle SVG + `svek-N.dot`, committed as an explicit oracle
change. Stop 8 is waived for this slug only. If the runs differ, HALT: that
is jar nondeterminism, not a stale cache.

### D5 amendment — premise disproved 2026-09-26 (T2, stop 3): HALTED for the maintainer
The cache is NOT stale.
- The pinned jar `~/git/plantuml/build/libs/plantuml-1.2026.7beta11.jar`
  (the `pin.json` version) reproduces besepi's committed `in.svg` and
  `svek-1.dot` byte-for-byte.
- The "fresh jar" is `oracle/dist/plantuml-oracle.jar`, which symlinks to
  `plantuml-1.2026.8beta1.jar` (the drift already filed in cdd1 D12). Three
  renders with it are byte-identical to each other, and they flip the couple
  edge orientation.
- OUR render matches the 8beta1 output exactly (render-diff structural=0,
  numeric=0 with the 8beta1 files swapped in temporarily).
- So besepi's gap is jar-version drift. The port follows the newer Java
  source (`~/git/plantuml` is past the pin) and the oracle is pinned older.
- Re-rendering only besepi would make the cache inhomogeneous: one fixture
  at 8beta1, the rest at 7beta11.

## D6 — Acceptances
luzive-62-zote562, sadamo-18-siva346 (C-18: version-identity banner,
`[From …]` strings, textLength) and zuduxu-90-kosi876 (E3-A: upstream NPE
crash page, `Neighborhood.java:80/151`) go into
`oracle/accepted-divergences.json`. Also nugecu-04-tona107 (signed
2026-09-26: TRACKER 23 is accepted in dot-engine as known-divergence A3, a
float tie-break, and one edge stays Δ16.063). Class accepted count = 17. `acceptedBy: maintainer`, 2026-09-26,
evidence cited from `plans/class-divergence-drive-3/diagnosis/{C,E3}.md`.

## D7 — Census harness
Census renders with `fixtureIncludeStore()` / the sprite asset store,
exactly as the ratchet does (bidusa, ruliki). popesa's census vs
`renderSync` difference is diagnosed first. The fix aligns the census
pipeline to `renderSync`; it never special-cases a slug.

## D8 — Diagnosis before fix (jakapi, lecelo, gujigi)
Each needs a quoted Java `file:line` and a probe before any edit. No
mechanism means `final = open -> <owner>`; nothing is fitted.

## D9 — Carried from cdd3
cdd3 D4 (primaries + journaled extension) and D7 (measure against the
mission's own baseline, never stale engine pins). Prefix `cdd4`; merge
commit; [`close-procedure.md`](close-procedure.md).
