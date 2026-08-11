# Batch 0 — clean tree, honest baseline, freshness guard

Strictly sequential: T0 leaves the tree clean so T1's re-capture is
attributable; T2 asserts the property T1 establishes.

Nothing in batch-1 or later can be trusted before this batch lands — every
downstream number is measured against the oracle T1 re-captures.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0](T0-land-inflight-fontsize.md) | Finish + commit the in-flight `skinparam <sname>FontSize<<label>>` mechanism; resolve the `CLAUDE.md` hunk separately | typescript-pro | `src/core/{preprocessor,skinparam-stereo-keys,theme-graph-colors}.ts`, `src/diagrams/class/class-object-map-sizing.ts`, `tests/unit/**`, `CLAUDE.md` | — | [x] |
| [T1](T1-recapture-oracle.md) | Re-capture `test-results/dot-cache/object/` through the pinned jar; regenerate `parity-object.json`; record the true baseline | general-purpose | `test-results/dot-cache/object/**`, `tests/oracle/svg-conformance/parity-object.json`, `plans/object-close/decision-journal.md` | T0 | [x] |
| [T2](T2-freshness-guard.md) | Oracle freshness guard (D4) | typescript-pro | `tests/oracle/svg-conformance/oracle-freshness.test.ts`, `scripts/svg-conformance-census.ts` | T1 | [x] |

### T0 — landed as `babcfa94`, with two amendments to the plan

- The pre-flight diagnosis was right about the state cause but **incomplete**:
  `tabaxa-70-pomu341` is a second, independent cause. Fixing it required the
  CLASS arm of the same mechanism (`classFontSizeByStereo`), widening the
  write-set to `src/core/{skinparam-accumulator,skinparam-theme-builder,
  theme-graph-colors-a}.ts` and `src/diagrams/class/{class-layout-fonts,
  class-layout-helpers}.ts` — all inside the mission boundary. Journal has the
  upstream citations.
- The `CLAUDE.md` hunk was **reverted, not committed**: the deleted section's
  two traps (`<$name>` is sprite syntax, `<latex>` is a creole tag) are
  specific to a repo whose subject matter IS PlantUML markup, and the global
  `rules/diagrams.md` cannot supply them. So batch-0 has three commits, not
  four.

## Batch exit

- `git status` clean; three commits (T0 mechanism, T0 CLAUDE.md, T1, T2 — four
  if the `CLAUDE.md` hunk is kept rather than reverted).
- Object SVG census reports a real number ≥23/80, never 0/80.
- Object DOT gate still exactly 78/80; all four sibling frozen counts
  unmoved.
- The freshness guard has been *demonstrated* to fail on a stale cache, not
  merely written.
