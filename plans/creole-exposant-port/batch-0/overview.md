# Batch 0 — Authored fixtures, oracles, baselines (serial)

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Three authored `<sup>`/`<sub>` fixtures + jar oracles; pin both baselines; write `expected-moves.txt` | typescript-pro | `test-results/dot-cache/{class,description,state}/<slug>/{in.puml,in.svg,svek-N.dot}`, `oracle/goldens/{class,description,state}/<slug>/{input.puml,svek-N.dot}`, backlog entries for the three (pinned tighten-only), `plans/creole-exposant-port/expected-moves.txt`, both gitignored baselines | — | [ ] |

Expected manifest moves: the three new slugs APPEAR (new entries) — nothing
else may move.
