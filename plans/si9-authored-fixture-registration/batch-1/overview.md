# Batch 1 — `dot-sync-report` sees authored fixtures

One task. It is the only code change in the mission; batches 2 and 3 are
generated data and documentation.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | `loadFixtures` merges authored fixtures; `ensureCanonical` becomes per-slug; skips become loud | typescript-pro | `scripts/dot-sync-report.ts`, `scripts/dot-sync-fixtures.ts` (500-line split), `tests/unit/scripts/dot-sync-fixtures.test.ts` | — | [x] |

## Batch exit criteria

- All four quality gates green
- `test-results/dot-cache/usecase/` gains the three `sprite-svg-*-0`
  directories, each with `.done`, `in.puml`, `in.svg`, `svek-1.dot`
- **No behaviour change for a type with no authored fixtures** — the 351
  manifest entries must enumerate exactly as before
- `npx tsx scripts/measure-description-size-deltas.ts` still 320/351,
  widened 0
- 389 svg-class/object/state goldens byte-identical

## Why one task and not three

Enumeration ([ADR-1](../decisions.md#adr-1)), canonical freshness
([ADR-2](../decisions.md#adr-2)) and loud skip reporting all land in the same
file and are not independently useful: ADR-1 without ADR-2 silently skips the
very fixtures it adds, which is worse than not shipping it. They are one
coherent change — "the pipeline can see authored fixtures" — and one commit.

## The trap this batch exists to avoid

`buildAgg` does `if (!slugs.has(f.slug)) continue;`. A fixture with no
canonical SVG is dropped **without any output**. If T1 ships ADR-1 alone, the
three fixtures enter `loadFixtures`, get skipped by `buildAgg`, produce no
cache entries, and every gate passes. The mission would look done and have
changed nothing.

That is the same failure shape as the predecessor mission's sprite
regression, which passed `npm test`, all 389 goldens and the size-delta
script while rendering sprites as nothing. Make skips loud.
