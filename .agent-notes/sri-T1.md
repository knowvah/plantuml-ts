# SRI T1 — census of `packages/<pkg>/generated/` consumers

Independent second measurement (not copied from the orchestrator's
withheld count). Method: `grep -rn` for `generated`/`packages/stdlib` across
`tests/`, `scripts/`, `packages/`, `src/`, then manually opened every hit to
separate an actual `readFileSync`/`readdirSync`/`import()`/`execFileSync`
against `packages/<pkg>/generated/` from a doc-comment mention of the same
words. `src/` confirmed **zero** references (`grep -rn "packages/.*generated|PACKAGES_DIR" src/`
→ no matches; `grep -rln "'generated'" src/` → no matches).

Files that mention "generated" but do **not** touch the real tree, so
excluded: `tests/unit/stdlib-registry.test.ts`, `stdlib-registry-prefetch.test.ts`
(comment-only), `tests/unit/sprite-split-prefetch.test.ts` (mentions in a
comment, reads `assets/` not `generated/`), `tests/unit/split-sprite-bundle.test.ts`
(reads `assets/`), `tests/integration/sprite-split-e2e.test.ts` (reads
`assets/`+manifest, `generated/` only in a doc comment), `tests/unit/build-stdlib-lock.test.ts`
(all paths are `mkdtempSync` scratch dirs, explicitly "never the real shared
`packages/*/generated/`" per its own header, line 16), `tests/unit/core/utils/SignatureUtils.test.ts`
(unrelated "generated fixture values" comment), `packages/*/scripts/copy-assets.mjs`
(copies from `assets/stdlib/` — the vendor source — into the package's
`assets/`; `generated/` appears only in a narrative comment, line 4/12, no
path join to it). `tests/unit/build-stdlib-packages.test.ts` uses synthetic
`mkdtempSync` dirs for every test **except one** (`REAL_PACKAGES_DIR`, kept).

## Consumer table

| # | File:line | R/W | In vitest worker? | Seam-eligible or immovable | Why |
|---|---|---|---|---|---|
| 1 | `packages/stdlib/package.json` (files:17; main/types:24-25; exports:26-49) | R (node resolver, npm pack) | No — manifest | **Immovable** | D2: this file IS the published surface |
| 2 | `packages/stdlib-aws/package.json` (files:19; main/types:27-28; exports:29-40) | R | No — manifest | **Immovable** | same |
| 3 | `packages/stdlib-tupadr3/package.json` (files:19; main/types:26-27; exports:28-35) | R | No — manifest | **Immovable** | same |
| 4 | `packages/stdlib-all/package.json` (files:17; main/types:22-23; exports:24-27) | R | No — manifest | **Immovable** | same |
| 5 | `packages/stdlib/tsconfig.json:6` `include: ["generated/**/*.d.ts"]` | R (tsc) | No — `npm run build:stdlib`'s sequential `--workspaces` typecheck step | **Immovable** | tied 1:1 to `types` above; relocating breaks the same publish contract |
| 6 | `packages/stdlib-aws/tsconfig.json:6` | R | No | **Immovable** | same |
| 7 | `packages/stdlib-tupadr3/tsconfig.json:6` | R | No | **Immovable** | same |
| 8 | `packages/stdlib-all/tsconfig.json:6` | R | No | **Immovable** | same |
| 9 | `scripts/build-stdlib-packages.ts:50-53` (`freshGeneratedDir`, `rmSync`+`mkdirSync`), `:120-132` (`isGeneratedDirUpToDate`, read), `:142-155` (`writeOutputs`, write) | W (+R for the hash check) | No — invoked by `globalSetup` or CLI (`npm run build:stdlib`) | **Seam-eligible** | it is the producer; it writes wherever `PACKAGES_DIR` says — the actual seam target if isolation is adopted |
| 10 | `tests/helpers/build-stdlib-globalsetup.ts:108` (`buildStdlibPackages()` call inside `setup()`) | W | **No** — `globalSetup` runs once before any worker spawns (own doc comment, lines 20-24) | **Seam-eligible** | caller decides where the producer writes |
| 11 | `tests/unit/sprite-package-files.test.ts:81` (`npm pack --dry-run --json`), `:182` (`readFileSync(.../generated/${mod.fileBaseName}.js)`) | R (both) | **Yes** | **Immovable** (file-level) | line 81 is D3's hard case: `npm pack` resolves `files:["generated"]` against the real package dir; line 182 alone would be seam-eligible but runs in the same file/run as the pack call |
| 12 | `tests/unit/stdlib-dts-import-specifier.test.ts:63,80,100` (`readdirSync`/`readFileSync` of `generated/*.d.ts`) | R | **Yes** | **Seam-eligible** | plain fs reads of a path constant; no pack call |
| 13 | `tests/unit/stdlib-all-exports.test.ts:27` (`STDLIB_ALL_GENERATED_DIR` const), `:55` (`import(pathToFileURL(path))`) | R | **Yes** | **Seam-eligible** | dynamic `import()` of an absolute path built from a directory constant, not a bare-specifier package resolution |
| 14 | `tests/unit/build-stdlib-packages.test.ts:317` (`isGeneratedDirUpToDate(generatedDir, ...)` against `REAL_PACKAGES_DIR`) | R | **Yes** | **Seam-eligible** | "acceptance 4" is the only real-tree case in this file; the other ~15 describe blocks use `mkdtempSync` scratch dirs already |
| 15 | `tests/unit/stdlib-package-files.test.ts:57` (`npm pack --dry-run --json`), `:70` (`readFileSync(.../generated/${moduleFile})`) | R (both) | **Yes** | **Immovable** (file-level) | same D3 shape as #11 |
| 16 | `tests/unit/stdlib-eager-omission.test.ts:27` (`generatedPath` helper) + ~14 call sites 46-152 (`existsSync`/`readFileSync`) | R | **Yes** | **Seam-eligible** | plain fs reads/existence checks, no pack call |
| 17 | `tests/unit/stdlib-packages.test.ts:55` (path helper), `:74,76` (`importGenerated` dynamic import in `beforeAll`) | R | **Yes** | **Seam-eligible** | reads only; comment at :66-72 confirms it no longer rebuilds itself (relies on `globalSetup`) |
| 18 | `tests/integration/stdlib-remote-e2e.test.ts:49` (`TUPADR3_REMOTE_MODULE`), `:51` (`AWSLIB14_REMOTE_MODULE`) | R (dynamic `import()` later in file) | **Yes** | **Seam-eligible** | absolute-path dynamic import; doc comment's "the ACTUAL file T6 emitted" intent is satisfied equally by an isolated copy with identical bytes |
| 19 | `tests/integration/stdlib-build-race.test.ts:149` `describe.skipIf(!process.env.STDLIB_BUILD_RACE_REPRO)` | R+W (via spawned children) | Spawned as **child OS processes** from inside a worker; **skipped by default** | **Immovable** | by design: the test's entire purpose is inter-process contention on the *real* shared path across two OS processes (D2/D3 in `plans/stdlib-build-race/decisions.md`); redirecting to an isolated dir defeats the test |
| 20 | `tests/helpers/stdlib-build-race-writer.ts:26` (`buildStdlibPackages()` loop, no path override) | W | Spawned child process (`jiti`), not a worker; only runs when #19 runs | **Immovable** | same reason as #19 |
| 21 | `tests/helpers/stdlib-build-race-reader.ts:46` (`TUPADR3_REMOTE_MODULE` hardcoded to `REPO_ROOT/packages/stdlib-tupadr3/generated/tupadr3.remote.js`) | R | Spawned child process, not a worker; only runs when #19 runs | **Immovable** | same reason |

## Published surface (verbatim), for D2

**`packages/stdlib/package.json`**
- `main`: `"./generated/index.js"`
- `types`: `"./generated/index.d.ts"`
- `exports`: `"."` → `{types:"./generated/index.d.ts", import:"./generated/index.js"}`; `"./c4"`, `"./archimate"`, `"./cloudinsight"`, `"./cloudogu"`, `"./bootstrap"` → same shape against `generated/<name>.{d.ts,js}`; `"./bootstrap1.13.1/sprites.json"` → `"./assets/bootstrap1.13.1/sprites.json"`; `"./package.json"` → `"./package.json"`
- `files`: `["generated","assets","licenses","LICENSE","LICENSES.md","README.md"]`

**`packages/stdlib-aws/package.json`**
- `main`: `"./generated/index.js"`, `types`: `"./generated/index.d.ts"`
- `exports`: `"."` (index pair); `"./awslib14.remote"` → `generated/awslib14.remote.{d.ts,js}`; `"./awslib.remote"` → `generated/awslib.remote.{d.ts,js}`; `"./package.json"`
- `files`: `["generated","assets","licenses","LICENSE","LICENSE-CODE","LICENSES.md","README.md"]`

**`packages/stdlib-tupadr3/package.json`**
- `main`: `"./generated/index.js"`, `types`: `"./generated/index.d.ts"`
- `exports`: `"."`; `"./tupadr3.remote"` → `generated/tupadr3.remote.{d.ts,js}`; `"./package.json"`
- `files`: `["generated","assets","licenses","LICENSE","LICENSES.md","README.md"]`

**`packages/stdlib-all/package.json`**
- `main`: `"./generated/index.js"`, `types`: `"./generated/index.d.ts"`
- `exports`: `"."`; `"./package.json"`
- `files`: `["generated","LICENSE","LICENSES.md","README.md"]`

All four `tsconfig.json`: `{"extends":"../tsconfig.base.json","compilerOptions":{"rootDir":"."},"include":["generated/**/*.d.ts"]}`.

## Summary

- **Total consumers: 21** (4 package.json + 4 tsconfig.json + 1 producer
  script + 1 globalSetup caller + 8 regular test files + 3 build-race-harness
  files).
- **Concurrent readers (run inside a default, non-skipped vitest worker): 8**
  — `sprite-package-files.test.ts`, `stdlib-dts-import-specifier.test.ts`,
  `stdlib-all-exports.test.ts`, `build-stdlib-packages.test.ts`,
  `stdlib-package-files.test.ts`, `stdlib-eager-omission.test.ts`,
  `stdlib-packages.test.ts`, `stdlib-remote-e2e.test.ts`.
- **Seam-eligible: 8** — the producer script, the globalSetup caller, and
  6 of the 8 concurrent readers (all but the two `npm pack` files).
- **Immovable: 13** — 4 manifests + 4 tsconfigs (D2: sacred publish surface)
  + 2 files that call real `npm pack` (D3's hard case, confirmed at
  `sprite-package-files.test.ts:81` and `stdlib-package-files.test.ts:57`)
  + 3 build-race-harness files (immovable by design — the test's entire
  purpose is contention on the real shared path, guarded behind
  `STDLIB_BUILD_RACE_REPRO`, skipped by default).

**Disagreement with the brief's "at least six":** my count of concurrent
readers is **8**, not 6 — two more than what the brief flags as the
orchestrator's own (still-undercounting, by its own admission) revision of
the "two import sites" SI34 used. The two extra: `stdlib-dts-import-specifier.test.ts`
and `stdlib-eager-omission.test.ts`, both plain `readFileSync`/`readdirSync`
readers with no `npm pack` call, easy to miss because "generated" appears in
dozens of comment-only hits that have to be individually opened and ruled
out (see exclusion list above) rather than grepped for the word alone. The
total consumer count (21) is far higher than either "two" or "six" because
it also counts each package's `package.json`+`tsconfig.json` and the
build-race harness — none of which are "concurrent readers" in the
worker-parallelism sense, but all of which are unambiguously consumers of
the canonical path per the task's literal definition.

## Quality gates

- `npm run typecheck` — **pass** (`tsc --noEmit && tsc --project tsconfig.node.json --noEmit`, no output, exit 0).
- `npm run lint` — **pass** (`eslint --no-error-on-unmatched-pattern src tests demo`, no output, exit 0).
- `npm test` — **deferred to the orchestrator's batch gate.** Per orchestrator
  amendment received mid-task: T0 is concurrently racing two
  `buildStdlibPackages()` processes against genuinely-changed
  `assets/stdlib/` inputs to reproduce the changed-inputs residual, and this
  suite's own `globalSetup` calls the same builder against the same shared
  `packages/*/generated/` path. Running `npm test` here would confound both
  this task's duration reading and T0's reproduction. No number is reported
  because none was measured.
- `npm run build` — **deferred**, same reason (amendment applied to both).
