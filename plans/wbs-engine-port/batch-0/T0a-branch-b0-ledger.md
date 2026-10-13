# T0a: branch, b0, ledger

Agent: orchestrator.

## Task
1. `git checkout -b feat/wbs-engine-port` off a clean main; commit the brief. Copy
   `settings.autonomous.json` to `.claude/settings.autonomous.json` if absent.
2. Four gates → `measurements/b0-{vitest.json,npm-test.log,typecheck.log,lint.log,build.log}`
   (collected = on-disk).
3. Surveys of every engine → `measurements/b0-eng/parity-<e>.json` via `chain.sh b0-eng`;
   `render-diff` on `activity/bozido-07-geze049`.
4. Fill `fixtures.md`: all 204 wbs rows (verdict, S/N, constructs from `in.puml`: depth
   markers `[*+-]+`, `<`/`>`, `_`, `[#color]`, `(code)` / `"x" as code`, multiline `:…;`,
   links `a -> b`, `<<stereo>>`, `<style>`, `skinparam`, title/caption/legend/header/footer,
   `{{`, `!include`); the bozido embed row.
5. Classify the 28 wbs oracles that are jar error pages (`oracle/goldens/stock-error-pages.json`
   `wbs/*` keys: 20 "Syntax Error?", 3 "Bad tree structure", 3 one-root, 2 blank) and the 2
   routing rows pinned `agree NONE -> NONE` (`tojixi-05-lusu056`, `zecavo-98-kini554`): confirm
   each is a jar error page the 2026-10-10 rule covers (D8). Anything else is stop 12.
6. Journal: the guide correction (WBS has its own tree, D2), the b0 numbers, the error-row
   classification.
7. Commit `chore(wep-b0): branch, b0 baseline, ledger`.

## Acceptance
- Given b0, then wbs reads 0/0/204 (or the difference is journaled and stop 12 handled).
- Given `fixtures.md`, then every wbs row and the embed row has a b0 verdict, S/N and constructs.

**Observability:** N/A. **Rollback:** Reversible.
