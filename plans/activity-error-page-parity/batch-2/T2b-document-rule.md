# T2b — write the error-page conformance rule into the docs (D7)

## Context
User ruling 2026-10-10 (quote it verbatim from `decisions.md`). Error pages
are conformant when the stock jar errors and we render our own error page;
nothing on the error page is compared. The version-line ruling (DIVERGENCES.md
"Error pages print this port's version, and the source name is `string`")
still holds and is now moot for conformance.

## Task
1. `CLAUDE.md`, the "**Mirror the jar's output exactly**" bullet: add one
   sentence carving out error pages (rule + stock-jar requirement + pointer to
   `docs/svg-conformance.md`). Keep CLAUDE.md's length within one line of today.
2. `docs/svg-conformance.md`: a section "Error pages" — the verdict table,
   the stock-jar record (`scripts/stock-jar-verify.sh`,
   `oracle/goldens/stock-error-pages.json`, re-run on every pin change), the
   `errorPage` field, and that an oracle-only error (seam artifact) is
   compared exactly.
3. `DIVERGENCES.md` error-page section (~line 1065): note that error pages are
   no longer compared element-by-element (user ruling 2026-10-10), so the
   version/source-name difference no longer appears in any survey.

## Write-set
`CLAUDE.md`, `docs/svg-conformance.md`, `DIVERGENCES.md`.

## Read-set
`decisions.md`; `CLAUDE.md` ("Porting discipline"); `docs/svg-conformance.md`
(headings); `DIVERGENCES.md:455-465,1060-1075`.

## Acceptance
- Given each doc, then it states the rule, the stock-jar requirement, and
  that the version-line ruling still holds in production.
- Given `npm run lint` and any markdown/doc drift gate, then green.

## Observability
N/A.

## Rollback
Reversible.
