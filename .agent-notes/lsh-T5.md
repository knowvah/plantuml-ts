# stdlib-lock-sharing T5 — close-out notes

Docs-only task. Write-set: `plans/stdlib-lock-sharing/README.md`,
`planning/next-missions.md`, `.agent-notes/lsh-T5.md`. No `src/` touched, no
git write command run.

## Observation: build's 3 pre-existing TS notes reproduced verbatim
- **Context**: ran all four quality gates fresh this session before writing
  the close-out.
- **Finding**: `npm run build` reproduces exactly the 3 pre-existing
  TS2591/TS2503 notes in `src/core/include-resolver-node.ts` (two
  `node:fs/promises`/`node:path` type-resolution notes, one `NodeJS`
  namespace note) — unchanged from every prior mission's baseline.
- **Impact**: confirms this mission introduced no new build noise; safe to
  keep citing the "3 pre-existing notes are NOT a failure" convention.
- **Confidence**: High — ran directly, output quoted in the README close-out.

## Observation: B2's gate row never re-quotes render-manifest
- **Context**: verifying "render-manifest '0 unexpected' at every batch"
  before writing it into the close-out, per the task's boundary against
  overclaiming.
- **Finding**: `decision-journal.md` has explicit `render-manifest "0
  unexpected"` quotes for B0 and B1, but B2's only journal row is the
  parallel-hygiene note (T3 saw T2's file mid-edit) — no B2 gate row quotes
  the manifest figure, and neither T2 nor T3 left an `.agent-notes/` file.
- **Impact**: the README close-out states this precisely rather than
  asserting "every batch" — clean at B0, B1, and this session's own re-run,
  with B2 sitting unbroken between two clean readings but not independently
  re-verified for that one batch. Future close-out tasks should check for
  this gap before citing "every batch" verbatim from a batch table's `[x]`
  marks, which only prove the batch was accepted, not that every named gate
  was individually re-quoted in the journal.
- **Confidence**: High — grepped the journal directly for every `| B` row.

## Observation: reader-registry inode-churn shape differs from the old lock
- **Context**: task instruction 4 asked for residuals including "unobserved"
  risk that was reasoned about, specifically inode churn.
- **Finding**: `reader-registry.ts`'s own doc comment (D1 in `decisions.md`)
  already states "costs one inode per concurrently-held reader section" —
  the new cost isn't churn *volume* (create+delete per acquisition is the
  same shape the old exclusive lock always had) but churn *concurrency*: the
  old lock never had more than one live lock file at a time (single holder,
  ever); shared mode now keeps one live file per concurrently-held reader,
  so `readdirSync` inside `countLivePresence` (called on every
  `drainPresence` poll) scans a directory whose size scales with concurrent
  reader count, not acquisition count. Not measured as a problem this
  session — no test approached a large concurrent-reader count — but it's a
  real, new shape of cost, not merely a restatement of the old one.
- **Impact**: recorded in the README close-out's residuals section as a
  named, reasoned-about-but-unobserved risk.
- **Confidence**: Medium — read the source and D1's own doc comment; did not
  construct a synthetic high-reader-count benchmark to measure the
  `readdirSync` cost directly.

## Scope confirmation (this session)
- `npm test`: exit 0, twice — `time npm test` wall 59.995 s; vitest
  `Duration 58.51s`. Both 629 passed | 1 skipped files, 16,076 passed | 2
  skipped | 1 todo tests, coverage 95.44/90.47/96.95/96.53. Load before:
  `uptime` 13:04, 7.33 25.33 31.42; `ps -Aceo pcpu,comm | grep -E
  'suggestd|corespotlightd|mds_stores|biomesyncd|BiomeAgent'` all ≤ 0.5%.
- `npm run typecheck` exit 0. `npm run lint` exit 0. `npm run build` exit 0
  (3 pre-existing notes, see above).
- `git diff --name-only main..HEAD -- src/` → empty.
- `git diff --stat main..HEAD -- packages/` → empty.
- render-manifest vs baseline: `OK: 0 expected moves, 0 unexpected` over
  3,158 fixtures, re-run this session with
  `plans/stdlib-lock-sharing/expected-moves.txt`.
- `tests/unit/build-stdlib-lock.test.ts`: 31 `it(` matches, 21 at the
  leading-indent level used by named test blocks (matches the mission's
  "10 → 21" claim, re-counted independently). `tests/unit/
  with-stdlib-build-lock.test.ts`: 12 `it(` matches, 8 at that level
  (matches "6 → 8").
- No git write command run this session.
