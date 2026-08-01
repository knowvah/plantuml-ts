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
| 2026-08-01 | T1 | `remoteReExportLine` duplicates `emit-remote-manifest.ts#remoteExportName` rather than importing it | That helper is private and its file is outside T1's write-set. Same precedent `emit-remote-manifest.ts` itself sets by duplicating `read-bundle.ts#isPumlFile`. Verified against a real build: the emitted `index.js` names (`awslib14Remote`, `awslibRemote`, `tupadr3Remote`) match ADR-1 exactly |
| 2026-08-01 | T1 | Test reads the globalSetup-built tree instead of calling `buildStdlibPackages()` | `buildStdlibPackages` is a WRITER of `packages/*/generated/` and vitest runs files in parallel workers — the race `stdlib-packages.test.ts` documents and SI11a lost an escalation to |
| 2026-08-01 | T1 | **STOP raised (condition 1), maintainer-approved:** `tests/unit/sprite-package-files.test.ts` added to T4's write-set | `spec.modules.map(...)` at line 179 stops typechecking under ADR-2 (`error TS18048: 'spec.modules' is possibly 'undefined'`). SI11b file, in no SI12 task's write-set. Options offered: extend T4 / new T4b / orchestrator gate-fix. Maintainer chose extending T4 — it is the identical narrowing error T4 already fixes in the sibling `stdlib-package-files.test.ts:241`, so one agent, one coherent commit. Narrowing only; nothing else in that file is in scope |
| 2026-08-01 | batch 1 | Gates: typecheck RED by design (2 errors, both `spec.modules` narrowing — one is T4's expected breakage, one is the escalation above). lint 0 · build:stdlib 0 · `stdlib-eager-omission` 23/23 · `vendor-stdlib --verify` **34,587 files, all verbatim** · `packages/stdlib` byte-identical (sha256, 12/12) · 395 svg class/object/state goldens + the 54-fixture description ratchet all zero-diff | Batch-1 exit criteria met. The brief's "389 goldens" figure measures 395 today (312 class + 24 object + 59 state) — a drift correction, not a regression; nothing was re-pinned |
