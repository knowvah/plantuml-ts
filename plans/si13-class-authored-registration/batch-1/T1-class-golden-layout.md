# T1 — per-type golden layout in `dot-sync-fixtures.ts`

## Context

`plantuml-ts`, branch `feature/si13-class-authored-registration`. SI9
taught `scripts/dot-sync-fixtures.ts` to merge authored description
goldens (`oracle/goldens/svg-description/<type>/<slug>/in.puml`) with the
`tests/visual/data/<type>.json` manifest (`authoredFixtures`,
`mergeFixtures`, `enumerateFixtures` — read them all; the file is small).
Class goldens live at `oracle/goldens/svg-class/<slug>/` — different root,
NO `<type>` level — so `enumerateFixtures('class')` finds no authored
fixtures and the whole registration chain (dot-cache → survey →
`parity-class.json` → ratchet eligibility) is unreachable for them. ADR-1
(`plans/si13-class-authored-registration/decisions.md#adr-1`) is locked.

## Task

1. Implement ADR-1: a per-type golden layout so `enumerateFixtures('class')`
   enumerates slug dirs directly under `oracle/goldens/svg-class/` (flat),
   while every other type keeps the existing `<GOLDEN_DIR>/<type>/<slug>/`
   shape byte-for-byte. Keep the change minimal and reader-side; preserve
   the existing `in.puml`-presence filter (it is what skips `README.md`/
   `ratchet.json` in the flat root), slug sorting, and `mergeFixtures`'
   manifest-wins/reported-collision semantics untouched. There is no
   `tests/visual/data/class.json`, so class flows through the existing
   `manifest === undefined` authored-only branch — do not add a class
   manifest.
2. Extend `tests/unit/scripts/dot-sync-fixtures.test.ts` (SI9's own test
   file — follow its patterns/fixtures): (a) `enumerateFixtures('class')`
   returns the five authored slugs currently on disk
   (`class-actor-bare-no-allowmixing`, `class-allowmixing-usecase-mix`,
   `class-missing-label-URL-SVG-0`, `class-usecase-inline-img`,
   `class-usecase-inline-sprite`) with markup read from each `in.puml`;
   (b) the flat root's non-fixture entries (`README.md`, `ratchet.json`)
   are skipped; (c) a description type's enumeration is byte-identical to
   pre-change (regression guard on the default shape); (d) a temp-dir
   test for the flat layout that does not depend on the live golden set
   growing (mirror how SI9's tests build temp fixtures, if they do — read
   first).

## Write-set

- `scripts/dot-sync-fixtures.ts`
- `tests/unit/scripts/dot-sync-fixtures.test.ts`

## Read-set

- `plans/si13-class-authored-registration/decisions.md#adr-1`
- `scripts/dot-sync-fixtures.ts` (whole)
- `tests/unit/scripts/dot-sync-fixtures.test.ts` (whole)
- `plans/si9-authored-fixture-registration/decisions.md` (ADR-1 context)
- `oracle/goldens/svg-class/README.md` (the flat-shape statement)

## Interface contracts

Consumed by T2: `enumerateFixtures('class')` returns
`Fixture[] = { slug: string; markup: string }[]` including the authored
slugs — same shape as today, no new fields.

## Acceptance criteria

1. Given `enumerateFixtures('class')`, when called, then the five authored
   slugs are present with correct markup, sorted.
2. Given `enumerateFixtures('component')` (or any description type), when
   called, then output is identical to pre-change.
3. Given `npm test`/`typecheck`/`lint`, when run, then exit 0.

## Quality bar

Full gates exit 0 before finishing. This is harness code — normal
quality rules (YAGNI) apply; no speculative layout registry beyond the
two shapes that exist.

## Boundaries

**Always:** read SI9's test patterns before writing tests. **Ask first:**
touching `dot-sync-report.ts` or `svg-parity-survey.ts` (expected
UNNECESSARY — they consume `enumerateFixtures`; if you find otherwise,
stop and report the mechanism). **Never:** git mutations; touching
`tests/visual/data/*`; changing the description shape.

## Observability

N/A — offline tooling.

## Rollback

Reversible — revert the commit.

## Commit

`feat(T1): enumerate authored class goldens in dot-sync fixtures`
