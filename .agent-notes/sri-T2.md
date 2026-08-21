# SRI T2 — options ADR for the stdlib changed-inputs residual

## Observation: the `architect-reviewer` agent type has no write or execute tools
- **Context**: Executing stdlib-run-isolation T2 — write an ADR at
  `planning/adr/ADR-003-stdlib-run-isolation.md` and run two gates.
- **Finding**: `architect-reviewer` is defined with `Read, Grep, Glob` plus
  Serena navigation only — no `Write`, `Edit`, or `Bash`. The agent produced
  the ADR content and returned it in its report, disclosing plainly that it
  could not write files or run `npm run typecheck` / `npm run lint`, rather
  than claiming gates it had not run.
- **Impact**: Any mission routing a *document-producing* task to
  `architect-reviewer` must expect the orchestrator to place the file and run
  the gates. The agent is a reviewer, not an author. Either route such tasks
  to an agent with `Write`, or plan for the orchestrator to transcribe.
  `plans/stdlib-run-isolation/decisions.md` "Routing" assigned T2 to
  `architect-reviewer` without accounting for this.
- **Confidence**: High — directly observed from the tool list, not inferred.

## Observation: option A's snapshot is unsafe unless taken inside the build lock
- **Context**: Orchestrator verification of the ADR's recommended option
  before presenting it to the user.
- **Finding**: `acquireBuildLock`'s `release()` runs in a `finally` at
  `scripts/build-stdlib-packages.ts:301`, immediately after the build loop and
  before `buildStdlibPackages()` returns. A snapshot taken by the caller
  "right after the build" — as option A was first drafted — is therefore taken
  **outside** the lock. A second process may legally acquire the freed lock
  and `rmSync` the canonical tree *during* the copy.
- **Impact**: The result is a **torn snapshot** — a stable-looking but
  silently incomplete tree the first run then reads for its whole suite.
  That is strictly worse than the current failure, which is at least loud
  (`ENOENT`). Any implementation of option A or B must take the copy inside
  the lock's critical section. `acquireBuildLock` is exported
  (`build-lock.ts:264`), so this is achievable, but it is not a pure
  caller-side change: it needs a new build-and-snapshot entry point or an
  explicit lock acquisition spanning both operations.
- **Confidence**: High — read the critical section directly.

## Observation: the snapshot copy is ~20x cheaper than estimated
- **Context**: The ADR's cost column carried "<100 ms, MEDIUM confidence, not
  measured"; the brief requires measured cost, not adjectives.
- **Finding**: The four `generated/` trees total **2.3 MB across 24 files**
  (`stdlib` 1.8 M, `stdlib-tupadr3` 436 K, `stdlib-aws` 92 K, `stdlib-all`
  8 K). Five `cpSync` runs of all four into a fresh temp dir measured
  **6.5 / 4.3 / 4.1 / 3.9 / 4.0 ms**.
- **Impact**: Cost is negligible — once per vitest process, against a ~57 s
  suite. Cost is not a reason to prefer any other option. Recorded so the
  next reader does not re-estimate it.
- **Confidence**: High — measured this session.

## Options summary
Option B (the declined per-run isolated directory) collapses into option A
(read seam plus snapshot copy) once D3's pack-test constraint is honoured:
`npm pack --dry-run` resolves via `cwd` against the real package directory
(`stdlib-package-files.test.ts:57-60`), so the canonical
`packages/<pkg>/generated/` tree can never be relocated regardless of which
option is chosen — only supplemented, for the 6 non-pack, non-tsconfig
concurrent readers. Neither A nor B therefore needs to touch
`main`/`types`/`exports`/`files`, which materially weakens the original
2026-08-21 packaging-blast-radius objection. Recommended: option A with the
lock-scoping amendment. Full reasoning in ADR-003.
