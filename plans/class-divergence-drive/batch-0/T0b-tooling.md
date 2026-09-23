# T0b — build render-diff, render-all, pin-diff

**Agent:** typescript-pro (sonnet) · **Depends on:** —

## Context

Every batch close (`README.md` batches table, `close.md`) needs three
commands that do not exist yet: a single-slug structural+numeric diff, a
whole-corpus verdict dump, and a two-JSON transition report. The seed is
`diagnosis/scratch-render-one.ts` (written read-only during diagnosis; read
it before writing anything). Production parity is already computed by
`scripts/svg-parity-survey.ts:260-280`, which renders through `renderSync`
with `WidthTableMeasurer` + `buildSpriteAssetsStore()` — the same call this
mission's tools must reuse verbatim so `measurements/*.json` stays
comparable to `tests/oracle/svg-conformance/parity-class.json`. The report
is a lead: re-read `svg-parity-survey.ts` and `compare.ts` before writing
call sites, don't reproduce this description from memory.

## Task

1. Tests first: `tools/render-diff.test.ts`, `tools/render-all.test.ts`,
   `tools/pin-diff.test.ts` under a `tools/` test dir (these are mission
   scratch tools, not `src/`/`tests/`, so they run via a direct `vitest run
   plans/class-divergence-drive/tools` invocation, not the main suite —
   confirm with `npm test`'s config whether `plans/` is included; if not,
   note that in `tools/README.md` and run them manually before commit).
2. `render-diff.mts`: `npx tsx tools/render-diff.mts <slug...>`. For each
   slug, read `test-results/dot-cache/class/<slug>/in.puml`, render via
   `renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore:
   buildSpriteAssetsStore() })` (exact call, `scripts/svg-parity-survey.ts:
   268-271`), write `measurements/out/<slug>.ours.svg`, copy the cached
   `in.svg` to `measurements/out/<slug>.jar.svg`. Print the structural diff
   count and numeric diff count using `tests/oracle/svg-conformance/
   compare.ts`'s exported comparator (read its signature first — do not
   guess the export name).
3. `render-all.mts`: `npx tsx tools/render-all.mts <out.json>`. For every
   cached class fixture dir, render the same way, classify with
   `svg-parity-survey.ts#diffVerdict`, write rows `{slug, verdict,
   structural, numeric, firstDiff}` to `<out.json>` sorted by slug.
4. `pin-diff.mts`: `npx tsx tools/pin-diff.mts <a.json> <b.json>`. Print,
   per slug present in either: verdict transitions (`a.verdict ->
   b.verdict`), `dotEqual` flips (only if both files carry it — `render-all`
   output does not by default; read the field from `parity-class.json` when
   diffing against it instead), and diff-count deltas where `b.structural +
   b.numeric > a.structural + a.numeric`. A slug in only one file is
   reported, not silently dropped.
5. `tools/README.md`: one paragraph per tool — invocation, output shape,
   which upstream call each mirrors.
6. `.agent-notes/cdd-T0b.md`: anything about `renderSync`'s call shape,
   `compare.ts`'s export names, or the mission `tools/` test-runner gap that
   a later task would otherwise re-derive.

## Read-set

`diagnosis/scratch-render-one.ts` (whole); `scripts/svg-parity-survey.ts:
1-40,90-115,180-200,196-215,260-280` (types, `diffVerdict`,
`computeDotEqual`, the `renderSync` call); `scripts/svg-parity-dashboard.ts:
1-40` (ledger join shape, for T0 not this task); `tests/oracle/
svg-conformance/compare.ts` (whole — export names + signatures);
`test-results/dot-cache/class/<any slug>/` (dir shape: `in.puml`, `in.svg`,
optional `svek-N.dot`).

## Write-set

`plans/class-divergence-drive/tools/render-diff.mts`,
`tools/render-all.mts`, `tools/pin-diff.mts`, `tools/README.md`,
`tools/render-diff.test.ts`, `tools/render-all.test.ts`,
`tools/pin-diff.test.ts`, `.agent-notes/cdd-T0b.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Interface out (consumed by T0 and every batch's close.md)

```ts
interface RenderAllRow { slug: string; verdict: 'conformant' | 'structural-match' | 'diverged' | 'errored' | 'timeout'; structural: number; numeric: number; firstDiff?: string }
// render-all.mts writes RenderAllRow[] (sorted by slug) to its <out.json> arg
```

## Acceptance criteria

- Given no arguments beyond a slug, when `npx tsx tools/render-diff.mts
  canuti-20-jotu614` runs, then it prints 9 structural / 3 numeric (per
  `fixtures.md`'s LNK2 row, cross-checked against `parity-class.json`)
- Given `npx tsx tools/pin-diff.mts base.json base.json` (same file twice),
  when it runs, then it reports zero transitions and exits 0
- Given a fixture present in `a.json` but absent from `b.json`, when
  `pin-diff` runs, then that slug is printed, not silently skipped
- Given `render-all.mts` over the full class cache, then the row count
  equals the cached-fixture directory count (723, per `parity-class.json`'s
  `oracle` count in `docs/parity-report.md`)

## Observability

N/A — dev-only tooling, not a production code path; no new observable
operation.

## Rollback

Reversible — revert the task's commits; the tools are additive, nothing
else reads them until T0 and later close tasks are written.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all green
(the new `.mts`/`.test.ts` files live under `plans/`, excluded from the
complexity-hook's normal `src/`/`tests/` scope but still checked by
`lint`/`typecheck` if included in `tsconfig` — confirm and note either
way). `tools/render-diff.mts` run on `canuti-20-jotu614` before commit,
output pasted into the commit body. Files ≤500 lines, functions ≤30 NLOC,
CCN ≤10, ≤5 params.

## Boundaries

Always: reuse `svg-parity-survey.ts`'s exact `renderSync` call rather than
re-deriving measurer/asset-store setup. Ask first: adding a new npm script
for these tools (out of write-set unless approved). Never: touch
`oracle/dist/plantuml-oracle.jar`, `oracle/pin.json`, or run any
`--rebuild` (D12); write outside `plans/class-divergence-drive/tools/` and
`.agent-notes/`.

## Commit

`feat(cdd-T0b): build render-diff, render-all and pin-diff tools`

Body: why these three shapes (mirrors `svg-parity-survey.ts` exactly so
mission measurements stay comparable to the committed `parity-class.json`).
