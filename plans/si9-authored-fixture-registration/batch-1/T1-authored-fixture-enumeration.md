# T1 — `dot-sync-report` sees authored fixtures

## Context

See [`../README.md`](../README.md) for the registration chain (verified
2026-07-31 — do not re-derive it).

Three changes to `scripts/dot-sync-report.ts`, one commit:

1. **Enumeration** ([ADR-1](../decisions.md#adr-1)) — `loadFixtures(type)`
   also reads `oracle/goldens/svg-description/<type>/*/in.puml`.
2. **Canonical freshness** ([ADR-2](../decisions.md#adr-2)) —
   `ensureCanonical` regenerates when any fixture lacks a canonical SVG,
   instead of early-returning on "the directory has some `.svg` in it".
3. **Loud skips** — `buildAgg` currently drops untagged fixtures in silence.
   Report them.

## Why all three together

ADR-1 alone is worse than nothing: the three fixtures would enter
`loadFixtures`, be skipped by `buildAgg` for want of a canonical, produce no
cache entries, and every gate would pass. See
[`overview.md`](overview.md#the-trap-this-batch-exists-to-avoid).

## Task

### Enumeration
`loadFixtures` returns manifest entries **plus** authored ones, deduplicated
by slug. An authored fixture's `markup` is the contents of its `in.puml`.
On a slug collision the manifest entry wins and the collision is reported on
stderr — silently preferring either side is how a fixture ends up measured
against the wrong source.

Preserve the existing `undefined` return when no manifest exists for a type,
**unless** authored fixtures exist for it — that case should now succeed. Say
in the journal which behaviour you chose and why.

### Canonical freshness
`ensureCanonical(jar, type, fixtures)` currently:

```js
if (existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.svg'))) return;
```

Make it regenerate when any fixture in `fixtures` has no
`<slug>.svg` in `CANON_DIR/<type>/`. Note `generateCanonical` uses
`freshDir` on both directories, so regeneration is all-or-nothing — that is
acceptable at this corpus size ([ADR-2](../decisions.md#adr-2) rejected
incremental generation deliberately).

### Loud skips
In `buildAgg`, when `!slugs.has(f.slug)`, emit the slug on stderr. Also
report the totals — enumerated vs analysed — so a mismatch is visible without
reading every line.

## Write-set — write NOTHING outside these

- `scripts/dot-sync-report.ts` (modify)
- `tests/unit/scripts/dot-sync-fixtures.test.ts` (create)

**Never colocate a test under `src/`.** `vitest.config.ts`'s `include` is
`['tests/**/*.test.ts']`, so a test under `src/` never runs. This bit the
predecessor mission and three files had to be relocated.

If `loadFixtures` is not exported, export it (or extract the enumeration to
an exported helper) rather than testing through the CLI — but do not
restructure the script beyond what testability requires.

## Read-set

- `scripts/dot-sync-report.ts` — `loadFixtures` :94, `findFixture` :100,
  `taggedSlugs` :111, `generateCanonical` :131, `ensureCanonical` :147,
  `buildAgg` :316, `runType` :329. **Line numbers drift — follow the code.**
- `scripts/svg-parity-survey.ts:182-199` (`listFixtureDirs`) — what the
  downstream consumer requires of each cache directory
- `oracle/goldens/svg-description/usecase/sprite-svg-bootstrap-0/in.puml` —
  a real authored fixture

## Architecture decisions (locked)

- [ADR-1](../decisions.md#adr-1) — enumeration; the manifest-paste
  alternative is a **STOP**
- [ADR-2](../decisions.md#adr-2) — per-slug canonical freshness

## Interface contract (consumed by T2)

After a `usecase` run, `test-results/dot-cache/usecase/` contains:

```
sprite-svg-bootstrap-0/   .done  in.puml  in.svg  svek-1.dot
sprite-svg-archimate-0/   .done  in.puml  in.svg  svek-1.dot
sprite-svg-multiline-0/   .done  in.puml  in.svg  svek-1.dot
```

## Acceptance criteria

1. Given `oracle/goldens/svg-description/usecase/*/in.puml` exists, when
   `loadFixtures('usecase')` runs, then the result includes those slugs
   alongside the 351 manifest entries, deduplicated by slug.
2. Given an authored slug colliding with a manifest slug, then the manifest
   entry wins and the collision is reported on stderr.
3. Given a populated canonical directory missing a canonical for some
   fixture, when `ensureCanonical` runs, then it regenerates rather than
   early-returning.
4. Given a fixture skipped by `buildAgg` for want of a tag, then its slug
   appears on stderr — never dropped silently.
5. Given a type with **no** authored fixtures, then enumeration is identical
   to today's — assert the 351 `usecase` manifest entries are unchanged in
   count and order.

## Quality bar

All four gates exit 0. 389 SVG goldens byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` at 320/351, widened 0.

Tests assert specific values, never truthiness. Prefer a temp-directory
fixture over mocking `fs` so the enumeration is exercised for real.

## Observability

**This task's only real observability deliverable is requirement 3 above.**
The defect being fixed is a *silent* skip; if the fix lands without making
skips visible, the next authored fixture fails identically and nobody
notices. Emit on stderr, matching the script's existing `console.error`
convention — this is a CLI tool, not a service.

## Rollback

**Reversible** — revert the commit. `test-results/` is gitignored and
rebuildable, so no generated state is stranded.

## Boundaries

**Always:** keep `loadFixtures`'s behaviour byte-identical for a type with no
authored fixtures.

**Never:** paste markup into `tests/visual/data/*.json` (ADR-1's rejected
option — six unrelated consumers read that file). Never edit a `golden.svg`.
Never touch `src/diagrams/class/` or `measureUsecase` (SI10).

## Method rules

1. **Trace dependency cascades TWO levels.** Enumerate `loadFixtures`'
   callers, then theirs, before declaring the signature safe. This mission's
   blast radius already changed at level two.
2. **Verify any "already fixed / deferred / it will just work" claim against
   the CURRENT call graph.** [ADR-2](../decisions.md#adr-2) exists only
   because "canonicals will be generated automatically" was checked and
   found false.

## Commit

One commit: `feat(T1): enumerate authored fixtures in the dot-sync corpus`
