# T17 — canvas 1 px at its origin

**Agent:** debugger in fix mode (sonnet, effort high) · **Depends on:** T16

## Fixtures

bejeli-39-sina124, cacoma-43-poxu615, gatula-10-bifu561,
jixamu-89-ribo225, jubobo-22-fapu993, julixi-10-jide878,
rulite-35-muno361, xosiza-60-sobu480, daxeno-00-kasu166,
lojiga-09-meka859, sijisi-94-ripu606 (as re-grouped by T6)

## Mechanisms · Write-set

T6 fills from `diagnosis/R.md`. Re-measure first: batches 1–3 may already
have moved some of these (journal which).

## Read-set

`diagnosis/R.md`; `decisions.md` D6; `src/diagrams/class/layout-ink-extent.ts:1-105`
(module doc: the ported canvas chain); prior T35 spec and journal rows.

## Acceptance criteria

- Given each fixture, when it renders, then `svg/@width`, `@height` and
  `@viewBox` equal the jar's exactly
- Given the fix, when reviewed, then it changes an ink term that mirrors a
  cited `LimitFinder`/`SvekResult`/`TextBlockExporter` line, and adds no
  epsilon or rounding tie-break (stop 12)
- Given an origin in dot-engine coordinates, when confirmed by probe, then
  a `docs/graphviz-issues/` file + `TRACKER.md` line exist and the fixture's
  `final` names it
- Given the 13 fixtures T35 made canvas-exact, when render-all runs, then
  they stay exact

## Observability · Rollback

N/A. Reversible.
