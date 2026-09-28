# Batch 1: census via renderSync, `tree` ratchet, tooling, post-re-pin baseline

T1–T4 run in parallel, each in its own git worktree off the branch after T0f
(memory: batch-parallelism-needs-worktrees). Link the `test-results` CHILDREN and
`node_modules` into each worktree; never use Serena edit tools inside a worktree.
T2 consumes T1's interface by contract, so it may start concurrently. Merge T1
before T2. T5 is the orchestrator's close.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1](T1-census-rendersync.md) | class census renders via renderSync (D3); unknown CLASS rows in the census | typescript-pro (sonnet) | `render-fixture-class.ts` (+test), `scripts/svg-conformance-census.ts` | — | [x] |
| [T2](T2-ratchet-tree.md) | ratchet `tree` field + `pin-goldens --tree` (D4) | typescript-pro (sonnet) | `class.golden.ratchet.test.ts`, `oracle/goldens/svg-class/{ratchet.json,README.md}`, `$T/pin-goldens.mts` (+test) | T1 (contract) | [x] |
| [T3](T3-assetstore-forwarding.md) | forward `assetStore` in 4 fixture renderers | typescript-pro (sonnet) | `render-fixture-{state,sequence,activity,json}.ts` (+tests) | — | [x] |
| [T4](T4-tools-tree.md) | render-all/render-diff take tree-qualified slugs; fresh test examples | typescript-pro (sonnet) | `$T/render-all.mts`, `$T/render-diff.mts` (+tests), `$T/README.md` | — | [x] |
| [T5](T5-close-b1.md) | close: census both buckets, pin, `b1.json` baseline, re-seed `fixtures.md` | orchestrator | per close-procedure | T1–T4 | [x] |

`$T` = `plans/class-divergence-drive/tools/`.

## Interface contracts

T1 exports, from `tests/oracle/svg-conformance/render-fixture-class.ts`:

```ts
export interface ClassFixtureRenderOptions {
  assetStore?: AssetStore;      // same type RenderOptions.assetStore takes
  includeStore?: IncludeStore;  // same type RenderOptions.includeStore takes
}
/** renderSync(markup, { measurer, ...opts }): census = survey minus the measurer (D3). */
export function renderClassFixture(markup: string, measurer: StringMeasurer, opts?: ClassFixtureRenderOptions): string;
```

T2 and T5 consume it. The existing `renderFixtureClass` stays, because the object
census still uses it (D3: other engines unchanged).

T4 exports a tree-qualified slug form `<tree>/<slug>`, with a bare `<slug>` meaning
`class/<slug>`. It is accepted by `render-all.mts` (`--tree class|unknown|all`, with
unknown filtered to routing-baseline CLASS rows) and `render-diff.mts`. Output rows
gain `tree: string`.
