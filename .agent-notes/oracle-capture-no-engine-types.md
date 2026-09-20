# Capturing the eleven never-captured buckets (c4, ditaa, ebnf, gantt, mindmap, network, regex, salt, timing, wbs, wire)

Follow-on to `parity-dashboard-refresh`, 2026-09-20, maintainer request. 912/912
captured with `scripts/capture-oracle-cache.ts`, none failed; both gates re-pinned
additively (journal rows 31–33).

## Observation: ditaa's "SVG" oracle is a PNG
- **Finding**: `PSystemDitaa extends DirectOsDiagram` renders through the ditaa
  library as PNG regardless of `-tsvg`; the jar writes those bytes under the
  requested `.svg` name. Both ditaa goldens start with the PNG magic.
- **Impact**: `svg-parity-survey` flags them `oracle-error` (not well-formed XML),
  which is the honest verdict; the freshness sentinel byte-compares the PNG and
  passed. A ditaa port needs a raster oracle path, not this survey.
- **Confidence**: High.

## Observation: the refusal gate cannot see the dispatcher's error sentinel
- **Finding**: for a start keyword no plugin registers (`@startgantt`, …),
  `resolveAllRefused` returns `ERROR_SENTINEL` (`src/core/dispatcher.ts:342`),
  whose page says "Error: unknown diagram type" with NO version banner, so
  `weErroredIn` reads it as rendered. This is consistent with how the gate
  treats upstream's `PSystemUnsupported` (also not a PSystemError page), so the
  848 no-engine pins are `weErrored: false, status: ok` — true by the gate's
  definition, vacuous as a measurement. The dashboard hides the vacuity (no-engine
  rule); the baseline records it honestly.
- **Impact**: when an engine is ported, expect those rows to move through
  `[FIXED]`/`[CHANGED]` in the routing gate, not the refusal gate.
- **Confidence**: High.

## Observation: `@startuml` timing sources reach the legacy-UML run and get the banner page
- **Finding**: 119 of 126 timing fixtures open with `@startuml`; `DiagramType.java:
  198-201` makes the candidate set the ten legacy-UML factories, all refuse, and the
  highest-scoring refusal (class) draws the PSystemError page — so THESE do count as
  `weErrored` and are pinned `known-gap`. One (`zeboxu-77-xola056`) was accepted by
  the STATE parser, which silently dropped the timing commands: a strictness gap
  the routing gate now pins `TIMING -> STATE`.
- **Confidence**: High (measured through the gates' seams).
