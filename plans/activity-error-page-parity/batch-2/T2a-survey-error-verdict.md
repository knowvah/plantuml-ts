# T2a — survey error verdict + dashboard column (D7)

## Context
The user's rule (decisions.md, verdict table): jar errors (per
`oracle/goldens/stock-error-pages.json`, T1a) + our error page
(`setErrorPageObserver`, T1b) ⇒ `conformant` with `errorPage: true`. Today
no error page can be conformant: our version line (`plantuml-ts version`,
kept by ruling) differs and usually sets the canvas width.

## Task (TDD)
1. `scripts/svg-parity-survey.ts`:
   - `renderFrame` (`:276-292`) installs `setErrorPageObserver` around the
     `renderSync` call (cleared in `finally`, like the layout observer) and
     adds `errorPage: boolean` to the frame JSON.
   - Load the stock record once. In the row builder (`:330-350`), key
     `"<type>/<slug>"`: in record ∧ `errorPage` → `{ verdict: 'conformant',
     errorPage: true }` (skip `diffVerdict`); in record ∧ ¬`errorPage` →
     `{ verdict: 'diverged', firstDiff: 'error-page' }`; not in record →
     today's `diffVerdict` unchanged.
   - `FixtureRow` (`:113-120`) gains optional `errorPage?: true`.
   - Keep the verdict decision a pure function (testable without a JVM).
2. Dashboard: `tallySurvey` (`parity-dashboard-inputs.ts`) counts
   `errorPage` rows; `surveyColumn` (`parity-dashboard-matrix.ts:133-136`)
   shows them, e.g. `433 / 1 / 17 (12 error)` — wording is push-forward;
   update the header prose in `scripts/parity-dashboard.ts` only if the
   generated doc must explain it (then add that file to your report — it is
   NOT in your write-set, stop 1 if needed).
3. Do NOT regenerate `tests/oracle/svg-conformance/parity-*.json` or
   `docs/parity-report.md` (orchestrator). Survey into a temp `--out` to verify.

## Write-set
`scripts/svg-parity-survey.ts`, `scripts/parity-dashboard-inputs.ts`,
`scripts/parity-dashboard-matrix.ts`,
`tests/unit/scripts/aepp-T2a-error-verdict.test.ts`,
`tests/unit/scripts/parity-dashboard.test.ts`.

## Read-set
`scripts/svg-parity-survey.ts:100-200,237-400`;
`scripts/parity-dashboard-inputs.ts:140-200`;
`scripts/parity-dashboard-matrix.ts:120-140`; `decisions.md` (rule table, D7);
T1a/T1b interface sections.

## Interfaces consumed
- `oracle/goldens/stock-error-pages.json`: `{ upstreamSha, plantumlVersion, errors: Record<"<bucket>/<slug>", { line: number | null, message: string }> }`.
- `setErrorPageObserver(fn: (() => void) | undefined): void` from `src/core/error/error-renderer.ts`.

## Acceptance
- Given a record entry and an error-page frame, then the verdict is
  `conformant` with `errorPage: true`.
- Given a record entry and a drawn frame, then `diverged`, `firstDiff: 'error-page'`.
- Given an oracle error page NOT in the record, then exact comparison (today's verdict).
- Given an activity survey into a temp file, then the 12 ERR rows of
  `fixtures.md` are `conformant` + `errorPage`, and no drawn row changed verdict.
- Given the dashboard test, then the error count renders per bucket.

## Observability
The dashboard error-conformant count is this mission's observable (Phase 4).

## Rollback
Reversible (revert restores the old verdicts).
