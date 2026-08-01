# Decision Journal — si12-eager-module-removal

Append one row per non-trivial judgment call. "Non-trivial" means: a
reasonable developer might have chosen differently.

Also log here: quality-gate results per batch, any brief line-number
correction, every measurement the brief asks you to record, and every STOP
with its full output.

**T4 must record the measured unpacked size of both packages and the ceilings
it set.**
**T5 must record the re-measured reduction — T6 and T7 quote it rather than
SI11a's 99.702%.**

| Date | Task | Decision | Rationale |
|---|---|---|---|
| 2026-08-01 | planning | Mission brief created | SI12 registered when the eager-module decision was settled; planned the same day |
| 2026-08-01 | planning | Eager dropped for aws + tupadr3 ONLY | Measured: `-tupadr3` 40.8 MB unpacked = eager 20.49 + assets 19.9 + manifest 0.43, so a remote consumer installs 40.8 MB to use 0.43. `-stdlib` is 2.9 MB total and carries the bundles most likely to be wanted offline, so it keeps eager |
| 2026-08-01 | planning | Assets were never a candidate for removal | `docs/stdlib-remote.md`'s pinned-CDN recipe points `baseUrl` at `.../plantuml-stdlib-tupadr3@<v>/assets/tupadr3/` — jsDelivr serves them out of the published tarball, and SI11b's per-sprite loading reads them too |
| 2026-08-01 | planning | T1 runs alone rather than in parallel with its consumers | The generated tree is built once in vitest `globalSetup`; four agents editing consumers while the tree changes underneath them is the shared-worktree hazard SI11b paid for twice |
