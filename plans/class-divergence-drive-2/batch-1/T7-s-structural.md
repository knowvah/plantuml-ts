# T7 — S structural singletons

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T6 ·
parallel with T8/T9 if write-sets are disjoint.

## Fixtures

sugifi-33-xefe083, sumule-00-pefa744, xumofu-43-fode658,
pibifa-14-leno075, begico-70-guva302, xoxuni-96-fere626 (from T8),
vuresa-33-kumu160 (from T8), rakuci-96-tuti371, rojoxi-79-vimu822.
fumalu-64-vude116 moved to T8 (S-5 is a style-cascade call).

## Mechanisms

From `diagnosis/S.md` (T6, journal rows 4-12). Diagnosis sections are quoted from `diagnosis/<group>.md` into the agent prompt.

- **S-1** sugifi, sumule — `resolveQualified` collapses per-segment
  namespace walk; `src/diagrams/class/class-namespace-resolve.ts`. HIGH.
- **S-1b** xumofu — second endpoint's package-vs-leaf uid order inverted.
  OPEN: counter-dump trace of `parser.ts`'s per-relationship-line
  processing BEFORE any edit (diagnosis mode).
- **S-2** pibifa, begico — couple connector `EdgeGeo` id suffix / dash;
  `renderer-edge.ts`, `class-assoc-double-couple.ts`. HIGH.
- **S-4** begico, xoxuni — `REL_COLOR` leading `#color` token discarded;
  `class-relationship-parser.ts`, `class-geo-types.ts`, `renderer-edge.ts`. HIGH.
- **S-8** vuresa — guillemet/creole stripping asymmetry on edge label;
  `class-edge-label-attach.ts`, `class-edge-label-anchor.ts`,
  `renderer-edge.ts`. HIGH. (Moved from T8: shares `renderer-edge.ts`.)
- **S-11** rakuci — jar wraps the whole classifier/package in one `<a>`
  for a container-level `[[url]]`. OPEN: instrument top-level URL handling
  in `renderer-classifier-box.ts` / `renderer-group.ts` first.
- **S-12** rojoxi — jar collapses an empty package to a bare un-clustered
  path, dropping its declared background. The brief's stderr/no-viewBox
  lead did NOT reproduce. OPEN: instrument `class-namespace-shape.ts`'s
  zero-child package fill path first.

## Write-set

`src/diagrams/class/class-namespace-resolve.ts`, `src/diagrams/class/parser.ts`,
`src/diagrams/class/renderer-edge.ts`, `src/diagrams/class/class-assoc-double-couple.ts`,
`src/diagrams/class/class-relationship-parser.ts`, `src/diagrams/class/class-geo-types.ts`,
`src/diagrams/class/class-edge-label-attach.ts`, `src/diagrams/class/class-edge-label-anchor.ts`,
`src/diagrams/class/renderer-classifier-box.ts`, `src/diagrams/class/renderer-group.ts` (the namespace/package renderer; S.md names a non-existent `renderer-package.ts`),
`src/diagrams/class/class-namespace-shape.ts`, plus the tests beside each.
An OPEN mechanism whose trace lands outside this list: report, do not edit
(stop 1).

## Read-set

`diagnosis/S.md` (this task's mechanism sections only), `decisions.md` D2,
D3; prior mission `decisions.md` D7 (dense uid re-numbering with phantom
slots — keep that design; add slots, do not replace the counter).

## Acceptance criteria

- Given each fixture, when it renders, then its structural diff count is 0
- Given a uid-tick mechanism, when its test runs, then it asserts the exact
  `@id` sequence the jar emits, citing the Java line that burns the tick
- Given the 560 conformant fixtures, when render-all runs, then none leaves
  conformant

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
