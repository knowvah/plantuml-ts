# Batch 0 — baseline, re-capture tool, harness rename (no behaviour change)

Gates stay green throughout; nothing here changes what any measurer returns.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-baseline.md) | branch, b0 survey/scores/elements, pin snapshot, production manifest | orchestrator | `plans/instrument-space-width/measurements/{b0*,production-manifest.mts}`, `fixtures.md` | — | [ ] |
| [T0b](T0b-recapture-tool.md) | one-JVM-per-fixture re-capture tool with `--verify`; fix `rebaseline-svg-goldens.ts` batching | typescript-pro | `scripts/recapture-oracles.ts`, `scripts/lib/recapture-*.ts`, `scripts/rebaseline-svg-goldens.ts`, `tests/unit/scripts/recapture-oracles.test.ts`, `tests/unit/scripts/rebaseline-svg-goldens*.test.ts` | — (∥ T0a) | [ ] |
| [T0c](T0c-harness-rename.md) | every harness/test/script/plan tool constructs `DeterministicMeasurer`; architecture test | typescript-pro | call sites in `scripts/**`, `tests/**`, `plans/*/tools/**`, `plans/*/measurements/**`; `tests/architecture/isw-measurer.test.ts` | T0b (shared `scripts/`) | [ ] |

T0a's survey runs while T0b only reads Java/scripts; if T0b starts surveying,
pause it until T0a's survey finishes (load). Close per
[close-procedure.md](../close-procedure.md) with prev = b0; the T0c merge must
show 0 survey movers vs b0 (pure rename).
