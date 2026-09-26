# Batch 0 — close cdd3, review dot-engine responses, baseline

Serial, orchestrator. T0a–T0c run on `feat/class-divergence-drive-3` with
dot-engine 1.6.0. T0d is the maintainer-response gate (D2): it may HALT.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-epsilon-deletion.md) | Commit `absorbLayoutEpsilon` deletion | orchestrator | `core/layout-epsilon.ts` (del), `core/TextBlockExporter.ts`, `core/klimt/drawing/svg/svg-graphics-core.ts`, `docs/catalog.md` | — | [ ] |
| [T0b](T0b-cdd3-exit.md) | cdd3 T-exit (b5 close) | orchestrator | cdd3 close write-set | T0a | [ ] |
| [T0c](T0c-cdd3-close-out.md) | cdd3 T-close-out + merge | orchestrator | cdd3 close-out write-set | T0b | [ ] |
| [T0d](T0d-dot-engine-responses.md) | Review TRACKER responses, bump dot-engine, measure | orchestrator | `package.json`, lockfile, `fixtures.md`, `decisions.md`, journal, TRACKER | T0c | [ ] |
| [T0e](T0e-baseline.md) | cdd4 baseline survey (all engines) | orchestrator | `measurements/b0.json`, `measurements/b0-eng/` | T0d | [ ] |
