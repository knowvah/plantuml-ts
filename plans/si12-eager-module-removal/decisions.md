# Architecture Decisions — si12-eager-module-removal

All five approved by the maintainer 2026-08-01. **Treat every decision here as
locked.** If you discover a conflicting constraint, STOP and log it to
`decision-journal.md` — do not silently override.

ADR-3 and ADR-4 are the ones that change behavior beyond deletion. Read those
two even if you skip the rest.

## ADR-1 — `.` exports the remote manifests

**Context.** `.` resolves to `generated/index.js`, which today re-exports the
eager bundle. With no eager module it would export nothing.

**Decision.** For `stdlib-aws` and `stdlib-tupadr3`, `generated/index.js`
re-exports the REMOTE manifests instead: `awslib14Remote`, `awslibRemote`,
`tupadr3Remote`.

**Consequences.** A root import keeps working and hands back exactly what a
consumer of these two packages now needs. The `./…remote` subpaths stay, so
nothing that already targets them changes.

**Rejected.** Dropping `.` entirely (breaks a root import for no gain); an
empty index (ships a dead export).

## ADR-2 — `PackageSpec.modules` becomes optional

**Context.** `modules` drives BOTH the eager emit and `emit-index.ts`'s
re-export. `remoteModules?` is already optional and already carries its own
`GeneratedModule` objects — the specs pass the same objects to both today.

**Decision.** `modules?: readonly GeneratedModule[]`. Absent ⇒ no eager module
is emitted, and the index is built from `remoteModules` instead.

**Consequences.** Symmetric with `remoteModules?`, smallest possible diff, and
a spec can now declare eager, remote, or both. Adding a future remote-only
bundle is additive.

**Rejected.** An `eager: boolean` flag (a second way to say the same thing); a
spec union type (more surface than the change earns).

## ADR-3 — Re-base the measurement on asset bytes

**Context.** `tests/integration/stdlib-remote-e2e.test.ts` reads the eager
`tupadr3.js` off disk as the denominator for SI11a's measured 99.702%
reduction. Deleting the file removes that baseline.

**Decision.** The baseline becomes the sum of the bundle's asset bytes, read
from disk. **The reduction must be RE-MEASURED and restated**, never carried
over from SI11a.

**Consequences.** Preserves the project's "read from disk, never hardcode"
rule, and the assets are what a consumer now actually pays for. The
denominator drops ~20.49 → ~19.9 MB, so the percentage shifts slightly. SI11a's
dated row in `planning/mission-index.md` is **not** edited — dated numbers were
true when taken.

**Rejected.** Freezing SI11a's constant (hardcodes what the project requires be
measured); keeping the eager module alive purely to measure it (defeats the
mission).

## ADR-4 — `stdlib-all` re-exports eager AND manifests

**Context.** `emit-all-index.ts` does `export * from` all three packages so a
consumer can register everything in one call. Two of the three lose their
eager exports.

**Decision.** `stdlib-all` re-exports `stdlib`'s five eager bundles PLUS
`awslib14Remote`, `awslibRemote` and `tupadr3Remote`. Its README must state
plainly that the manifest bundles require a `baseUrl`.

**Consequences.** It stays a coherent single discovery surface — "every
non-GPL bundle: eager where cheap, manifest where large" — at ~0 MB. The
"one-call register-everything" claim becomes conditional and the README must
say so rather than imply otherwise.

**Rejected.** Retiring it (removes a concept for no size win); leaving
`export *` as-is (silently exports less than documented — the only genuinely
bad option).

## ADR-5 — Stop generating, do not merely stop shipping

**Context.** `files` could exclude the eager modules while the generator still
writes them.

**Decision.** Stop generating them.

**Consequences.** Removes ~29 MB of writes from every `npm run build:stdlib`
AND every CI run's `globalSetup`. Forces the VERBATIM round-trip test onto the
shipped assets, which is the thing that actually ships. No shadow copy remains
to confuse a future reader.

## Rollback classification

**Reversible** — revert the commits and regenerate. Generated output is
regenerable and gitignored, the vendored tree is untouched, and nothing is
published, so there is no consumer state to compensate for.

## Public API impact

**Breaking by `architecture.md`'s taxonomy** (exports removed), with **zero
published consumers**. No versioning, dual-write or deprecation window is
warranted; versions stay `0.1.0`. The obligation is documentary: both package
READMEs and `docs/stdlib-remote.md` must state that eager registration is
unavailable for these bundles and show the replacement.
