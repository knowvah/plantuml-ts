# T0b — resolveInlineLinks to a core url seam (D9)

Agent: typescript-pro, worktree `add3-T0b`. Rules: [../common-rules.md](../common-rules.md).

## Task
Upstream resolves `[[url label]]` in the shared `net.sourceforge.plantuml.url`
package (`UrlBuilder`, `Url.java`). Move `src/diagrams/description/parse-helpers-inline-links.ts`
to `src/core/url/inline-links.ts` (git mv; keep its doc and `@see`), keep a
re-export from `description/parse-helpers-strings.ts` for existing description
callers, point `src/diagrams/activity/activity-renderer-swimlanes.ts` and
`layout/swimlane-placement.ts` at the core path, and delete the two
activity -> description entries add2 added to `tests/architecture/layering.test.ts`.
`npm run catalog`.

## Write-set
`src/core/url/**` (new), `src/diagrams/description/parse-helpers*.ts`, the two
activity files above (import line only), `tests/architecture/layering.test.ts`,
`docs/catalog.md`, moved tests.

## Acceptance
- Layering test green with the two entries removed.
- Probe Σ unchanged; description/class/sequence/state surveys byte-identical.
Observability: N/A. Rollback: Reversible.
