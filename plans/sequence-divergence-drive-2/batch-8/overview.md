# Batch 8 — core preprocessor errors (D6)

Three file-disjoint core fixes in parallel worktrees. These touch every
engine: merge them **one at a time**, running the all-engine survey after
each merge (stop 4). Stop 14's exception applies only to movers each
fix's mechanism explains row by row (e.g. other engines' YAML-front-matter
fixtures that start rendering).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T8a](T8a-yaml-front-matter.md) | strip YAML front-matter | typescript-pro (sonnet) | `src/core/BlockUmlBuilder.ts` + tests | B7 | [ ] |
| [T8b](T8b-includedef-missing.md) | missing `!includedef` → empty body | typescript-pro (sonnet) | `src/core/tim/IncludeExecutor.ts` + tests | B7 | [ ] |
| [T8c](T8c-style-import-close.md) | `<style src=>` import; `</?style>` close | typescript-pro (sonnet) | `src/core/preprocessor-collector.ts` + tests | B7 | [ ] |
| close | standard close (all-engine survey after each merge), pin round 8 | orchestrator | per close-procedure | T8a–T8c | [ ] |
