# T0a: branch, b0, ledger

Agent: orchestrator.

## Task
1. `git checkout -b feat/salt-engine-port` off a clean main; commit the brief. Copy
   `settings.autonomous.json` to `.claude/settings.autonomous.json` if absent.
2. Four gates → `measurements/b0-{vitest.json,npm-test.log,typecheck.log,lint.log,build.log}`.
3. Surveys of every engine → `measurements/b0-eng/parity-<e>.json`; `render-diff` on the 5
   embed rows; census not applicable to salt.
4. Fill `fixtures.md`: all 51 salt rows (verdict, S/N, the salt constructs in `in.puml`:
   `{#`, `{+`, `{/`, `{*`, `{^`, `{T`, `{S`, `[button]`, `()`, `[]`, `^drop^`, `"text"`,
   `<&icon>`, `<<sprite>>`, `--`, `..`, `==`, `~~`); the activity and gantt embed slugs
   (`grep -l '{{ *salt' test-results/dot-cache/*/*/in.puml`); the 17 `salt`-keyword
   fixtures with their routed engine (`grep -l '^\s*salt\s*$' …`).
5. Classify the 3 salt oracles that contain error-looking text
   (`grep -l 'Syntax Error\|Error line\|java.lang' test-results/dot-cache/salt/*/in.svg`):
   real jar error pages vs content. Check them against `oracle/goldens/stock-error-pages.json`
   and the release jar (memory "error-page conformance rule"). A change to the 51-row count
   is stop 12.
6. Commit `chore(sep-b0): branch, b0 baseline, ledger`.

## Acceptance
- Given b0, then salt reads 0/0/51 (or the difference is journaled and stop 12 handled).
- Given `fixtures.md`, then every salt and embed row has a b0 verdict, S/N and constructs.

**Observability:** N/A. **Rollback:** Reversible.
