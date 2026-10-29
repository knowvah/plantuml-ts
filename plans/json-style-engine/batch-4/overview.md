# Batch 4 — residuals

Runs only if b3 leaves a json/yaml/hcl corpus or authored row structurally
unclean outside the 3 ceilings (push-forward: journal a skip otherwise).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4a](T4a-residuals.md) | every json/yaml/hcl row not clean after b3, diagnosed per family | typescript-pro (sonnet, effort high), jse-T4a | `src/diagrams/{json,yaml,hcl}/*`, `tests/unit/{json,yaml,hcl}/*` | T3a, T3b | skipped (journal row 31) |
| close | merge; gates `b4`; chain vs b3; D6 check; pins/manifest; `fixtures.md` b4 row | orchestrator | per close-procedure | T4a | skipped |
