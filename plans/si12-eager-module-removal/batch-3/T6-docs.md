# T6 — Document which bundles offer which mode

## Context

`docs/stdlib-remote.md` is the consumer-facing guide. After this mission,
eager registration exists for `@knowvah/plantuml-stdlib` but NOT for
`-aws`/`-tupadr3`, and a reader has no way to know that from the current text.

## Task

1. State which bundles offer eager registration, which offer manifest+`baseUrl`
   only, and why (size — cite the measured figures).
2. Show the offline recipe for the two remote-only bundles end to end:
   `prepareIncludeStore` + a filesystem fetcher over the shipped `assets/`,
   feeding `renderSync`.
3. Update any example that registers `awslib14`/`tupadr3` eagerly.
4. Quote **T5's re-measured** figures, never SI11a's 99.702%.

## Write-set — write NOTHING outside this

- `docs/stdlib-remote.md` (modify)

Package READMEs are T3's; `planning/mission-index.md` is T7's.

## Read-set

- `docs/stdlib-remote.md` — all of it
- `plans/si12-eager-module-removal/decision-journal.md` — T5's measured figure
- `packages/stdlib-aws/README.md`, `packages/stdlib-tupadr3/README.md` — T3's
  wording, to point at rather than duplicate
- `src/index.ts` — `prepareIncludeStore`, `RenderOptions.fetcher`

## Acceptance criteria

1. Given the guide, then a reader can tell which bundles support eager
   registration without reading any package's source.
2. Given an offline consumer of aws or tupadr3, then the fs-fetcher +
   `prepareIncludeStore` recipe is shown end to end and is copy-pasteable.
3. Given every figure in the doc, then it comes from the decision journal, not
   from SI11a's superseded measurement.
4. Given the pinned-CDN recipe, then it still resolves against `assets/` — the
   thing that must not break.

## Quality bar

All four gates exit 0. Documentation should not move them; if it does,
something is wrong.

## Observability

N/A — documentation.

## Rollback

**Reversible** — revert the commit.

## Boundaries

**Always:** amend dated sections rather than rewriting them.
**Never:** invent a figure; retro-edit a historical measurement; run a git
mutation.

## Method rules

1. **Trace TWO levels:** the doc is linked from `README.md` and the docs-site;
   check both render after an anchor changes.
2. **Verify every code sample against the real export names** T2/T3 shipped.

## Commit

`docs(si12): state which stdlib bundles support eager registration`
