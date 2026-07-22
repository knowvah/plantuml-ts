# T3 — Adopt the fixed graphviz-ts build

## Context

Library-path only. The graphviz-ts project has shipped a fix for
`docs/graphviz-issues/09-*.md`; a new `.tgz` exists in
`../graphviz-ts/`.

## Task

1. Bump the `package.json` pin to the new `.tgz`; refresh lockfile;
   `npm install`.
2. Re-run issue 09's repro matrix (rebuild the probes from the issue
   file — it is self-contained): builder path must now match real dot
   on EVERY cell, including the previously-failing one(s).
3. Full gates BEFORE any batch-3 work: `npm test` (DOT gate frozen,
   57 svg-state pins byte-identical, size-backlog byte-unmoved),
   `npm run typecheck`, `npm run lint`, `npm run build`.
4. Journal the verification table. Do NOT check the TRACKER box (that
   happens in T6 after fixtures re-measure clean).

## Write-set

`package.json`, `package-lock.json`. Probes deleted.

## Acceptance criteria

- Given the new pin, when the repro matrix re-runs, then builder ==
  text == real dot on every cell.
- Given the new pin, when the full suite runs, then zero regressions
  (any regression → revert the pin, reopen issue 09 with the failing
  fixture, STOP).

## Boundaries

No src/ changes; no TRACKER checkbox; no git mutations.
