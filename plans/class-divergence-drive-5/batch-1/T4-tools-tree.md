# T4: render-all/render-diff accept tree-qualified slugs; fresh test examples

**Prior observations.** Both tools hard-code `test-results/dot-cache/class`
(`render-all.mts:117`, `render-diff.mts:72,90`). Their tests use canuti-20 as a
"still diverged" example, and canuti-20 is now conformant (cdd4 journal 23).

**Task (TDD).**
1. Slug syntax: `<tree>/<slug>`, where a bare `<slug>` means `class/<slug>`. Both tools
   read `test-results/dot-cache/<tree>/<slug>/`.
2. `render-all.mts <out.json> [--tree class|unknown|all]`. The default is `class`,
   which preserves today's behaviour. `unknown` walks only slugs whose
   `oracle/goldens/svg-conformance/routing-baseline.json` row (`type: unknown`) has
   `ourType === 'CLASS'`. Rows gain `tree`.
3. `render-diff.mts` writes `measurements/out/<tree>__<slug>.{ours,jar}.svg`.
4. Tests: replace the canuti example with one chosen at run time from
   `parity-class.json` (first non-conformant slug not in the accepted ledger), or a
   synthetic tree. Add cases for the `unknown/` form and the routing filter.
5. Update `$T/README.md`.

**Write-set:** `$T/render-all.mts`, `$T/render-all.test.mts`, `$T/render-diff.mts`,
`$T/render-diff.test.mts`, `$T/README.md`.
**Read-set:** both tools and their tests; `pin-diff.mts:1-40` (row shapes it accepts,
which must stay compatible).

**Acceptance.**
- Given `render-all --tree unknown`, then its row count equals the routing-baseline
  CLASS count for `type: unknown`.
- Given a bare slug, then output is identical to today's.
- Given `pin-diff` on old vs new render-all output, then it still parses both.

**Commit:** `test(cdd5-T4): address fixtures by tree in the mission tools`.
**Observability:** N/A. **Rollback:** Reversible.
