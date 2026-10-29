# T0b — files conformance harness (D4)

Agent: `typescript-pro` (sonnet), worktree `ddc-T0b`. Commit:
`test(files): svg-files golden and authored ratchets (T0b)`.
Read [../task-contract.md](../task-contract.md) first.

## Context
`@startfiles` has no byte-conformance harness: no `render-fixture-files.ts`,
no `oracle/goldens/svg-files/`, no ratchet. wbs and salt have the exact
pattern to copy: `tests/oracle/svg-conformance/render-fixture-wbs.ts`
(thin `renderSync` wrapper, two fixture roots), `wbs.golden.ratchet.test.ts`
(cached pins, starts empty with a placeholder assertion, tamper test on
`fixtures[0]`), `wbs.diff-baseline.ratchet.test.ts:40-90` (authored rows =
the `.puml` files on disk, exactly). The survey renders every row in
jar-compatible mode (`scripts/svg-parity-survey.ts:307`,
`jarCompatibleStyleInput: true`), so the helper must too, or the ratchet
measures a different style input than the survey.

## Task
1. `render-fixture-files.ts`: `renderFixtureFiles(markup, { measurer, assetStore?, includeStore? }): string`
   = `renderSync(markup, withJarCompatibleStyleInput({ measurer, assetStore, includeStore }))`;
   `AUTHORED_FILES_ROOT = tests/fixtures/files/` (flat `<slug>.puml` +
   `<slug>.svg`), `readAuthoredFilesFixture(slug)`, `listAuthoredFilesSlugs()`.
   Mirror `render-fixture-wbs.ts`'s exports one for one; JSDoc says why the
   jar-compatible option is passed.
2. `files.golden.ratchet.test.ts`: `wbs.golden.ratchet.test.ts` with the names
   changed; goldens `oracle/goldens/svg-files/<slug>/{in.puml,golden.svg}`,
   `ratchet.json` `{ "fixtures": [] }`; AC1 every pinned slug byte-equal, AC2
   tamper fails naming the slug (placeholder while empty).
3. `files.authored.ratchet.test.ts`: every `tests/fixtures/files/<slug>.puml`
   with a `.svg` has exactly one row in `authored-baseline.json`
   (`{ type: 'files', slug, topic, status: 'baseline'|'error', diffCount, weightedScore, measuredAt, measuredAgainstCommit }`,
   the wbs shape); a row's `diffCount` may only shrink; `status: 'error'`
   rows must still error; a `.puml` with a `.svg` and NO row FAILS naming
   the slug (the wbs invariant — the orchestrator baselines new rows at the
   close, right after merging T1f). Starts `{ "fixtures": [] }` and the
   on-disk set is empty until T1f, so the invariant holds vacuously (the
   directory may be absent).
4. `oracle/goldens/svg-files/README.md`: layout, add rule (pin tool
   `plans/data-diagram-conformance/measurements/pin-files.mts`, orchestrator
   only), the byte-exact bar (D1: files has no layout engine).

## Write-set
`tests/oracle/svg-conformance/render-fixture-files.ts`,
`tests/oracle/svg-conformance/files.golden.ratchet.test.ts`,
`tests/oracle/svg-conformance/files.authored.ratchet.test.ts`,
`oracle/goldens/svg-files/{README.md,ratchet.json,authored-baseline.json}`.

## Read-set
`render-fixture-wbs.ts`, `wbs.golden.ratchet.test.ts`,
`wbs.diff-baseline.ratchet.test.ts:1-120`, `scripts/svg-parity-survey.ts:290-320`,
`src/core/internal-render-options.ts`, `oracle/goldens/svg-wbs/README.md`.

## Interface out (T1b, T1f, pins)
`renderFixtureFiles` signature above; golden dir layout `<slug>/{in.puml,golden.svg}`;
authored root `tests/fixtures/files/`.

## Acceptance
- Given empty manifests, when both ratchets run, then they pass with the documented placeholder assertions.
- Given a hand-made golden dir whose `golden.svg` is edited (test-local temp copy), when AC2 runs, then it fails naming the slug.
- Given `renderFixtureFiles` on `tests/fixtures/lengthadjust/files-default.puml`, then its output equals `renderSync` with `withJarCompatibleStyleInput` byte for byte.
- `npx vitest run tests/oracle/svg-conformance/files.*.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false` green; typecheck, lint clean.

Observability: N/A. Rollback: Reversible.
