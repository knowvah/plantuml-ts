# SRE T2 — stdlib-build-race, content-derived up-to-date skip

## Scope reminder
This is HALF the fix (D3). It adds the skip; a later task adds the
cross-process lock that re-checks this same predicate INSIDE the critical
section. **The race is not closed by this task alone** — the env-guarded
repro `tests/integration/stdlib-build-race.test.ts` (`STDLIB_BUILD_RACE_REPRO=1`)
is expected to still fail after this change; I did not attempt to make it
pass.

## What changed
`scripts/build-stdlib-packages.ts`:
- `computePackageOutputs(spec, assetsStdlibDir): Map<string, string>` (exported)
  — pure; the exact `{fileName -> content}` a build would write for `spec`,
  built from the same emit functions the old inline code called, just
  assembled into a map instead of interleaved with `writeFileSync`.
- `isGeneratedDirUpToDate(generatedDir, freshOutputs): boolean` (exported) —
  the predicate. **Signature:**
  `(generatedDir: string, freshOutputs: ReadonlyMap<string, string>) => boolean`.
- `writeOutputs` (private) replaces the old inline body of `buildPackage`/
  `buildAllPackage`: calls the predicate first; on `true` it returns without
  ever calling `freshGeneratedDir` (so `rmSync` never runs); on `false` it
  calls `freshGeneratedDir` (unchanged) and writes `outputs`.
- `buildPackage`/`buildAllPackage`/`freshGeneratedDir` stay module-private,
  per the pre-loaded observation — only the two functions above are newly
  exported.

## Content-derived, never count/mtime — how I assured it
`isGeneratedDirUpToDate` only ever calls `readFileSync` (to get the bytes
actually on disk) and `createHash('sha256')` (via a local `sha256Hex`
helper) — no `statSync`, `.mtime`, `.birthtime`, or `readdirSync` appears
anywhere in it. Assured two ways:
1. **By construction** — the function body is 10 lines: a `for` loop that
   reads one file and compares its hash to the corresponding fresh-output
   hash, wrapped in try/catch. There is nowhere in that shape for a count or
   a timestamp to enter.
2. **A regression test** (`tests/unit/build-stdlib-packages.test.ts`,
   `'is content-derived by construction'`) that takes
   `isGeneratedDirUpToDate.toString()` and asserts the source contains none
   of `mtime`, `birthtime`, `readdirSync`, `statSync`, `expectedCount`,
   `.length ===`, and does contain `sha256Hex`/`readFileSync` (positive
   control). This fails loudly if a future edit reintroduces the
   `copy-assets.mjs#isUpToDate` count pattern this predicate exists to avoid.

Uncertainty handling: the whole function body is one `try { ... } catch {
return false; }`. A missing directory, a missing file, or a path that is
actually a directory (EISDIR) all throw inside the loop and all resolve to
`false` (rebuild) — proven by three separate tests (missing dir, missing
file, EISDIR-via-directory-at-the-expected-path).

## No persisted manifest file
D4 says "hashes the build inputs and the emitted manifest." I hash the
build inputs by recomputing `computePackageOutputs` (a pure function of the
spec + current `.puml` content) and hash "the emitted manifest" by reading
the CURRENT on-disk `generated/` files at check time — there is no
persisted side-car file. I considered writing a `.build-fingerprint.json`
into `generated/`, but rejected it: the write-set forbids touching
`.gitignore` or any `package.json`, and every stdlib package's
`files: ["generated", ...]` ships the whole `generated/` directory in the
published npm tarball — a bookkeeping file with no product purpose would
leak into every consumer's install. Reading currently-on-disk content
directly avoids that with no correctness cost.

## Why the acceptance tests never call the real `buildStdlibPackages()`
`buildStdlibPackages()` also unconditionally rebuilds
`packages/stdlib/assets/bootstrap1.13.1/sprites/` via `buildSpriteSplits` ->
`splitSpriteBundle`, which itself opens with an unconditional `rmSync`
(`scripts/split-sprite-bundle/split.ts:144`) — untouched by this task
(out of write-set, not yet predicate-gated). `tests/unit/split-sprite-bundle.test.ts`
and `tests/helpers/build-stdlib-globalsetup.ts` both document, in comments,
that calling `buildStdlibPackages()`/`splitSpriteBundle` a second time from
inside a vitest worker races any OTHER worker concurrently reading that
tree — the same bug class this mission fixes for `generated/`, just not yet
fixed for `assets/.../sprites/`. Introducing that call, unconditionally, in
my own new test file would make it fire on every default `npm test` run
(unlike the existing race repro, which is `STDLIB_BUILD_RACE_REPRO`-gated
and skipped by default). So the acceptance tests instead:
- exercise `isGeneratedDirUpToDate`/`computePackageOutputs` directly against
  fully synthetic, isolated `mkdtempSync` fixtures (no shared repo state,
  zero risk to concurrent workers), and
- exercise a **local mirror** of `writeOutputs`'s shape (same skip-then-
  `rmSync` wiring, calling the real exported predicate) against an isolated
  temp `generated/`-style dir, for the filesystem-level "no rmSync on skip"
  assertion — never against the real shared `packages/*/generated/` tree.
- make ONE read-only exception: `isGeneratedDirUpToDate` itself never
  writes, so calling it (not `buildStdlibPackages()`) against the REAL,
  already-built `packages/*/generated/` tree is safe, and is what proves
  byte-identity below.

## Acceptance evidence
- **Skip performs no rmSync, verified on the filesystem (not a log line):**
  `'skips (sentinel survives, real content unchanged) when the tree already
  matches'` — writes a sentinel file into an isolated `generated/`-style
  dir, captures `statSync(...).ino` for `index.js`, calls the
  `writeOutputs`-mirroring wrapper, and asserts the sentinel file still
  exists with its original content AND the `index.js` inode is unchanged.
- **Contrast (rmSync really runs on a mismatch):** the sibling test changes
  the input `.puml` content, reruns the same wrapper, and asserts the
  sentinel is now GONE (rmSync fired) and the tree matches the new input.
- **Any input content change rebuilds:** `'returns false when a change to
  the build INPUT ... changes the fresh output'` — changes the vendored
  `.puml` content, recomputes `computePackageOutputs`, and shows the
  predicate flips from `true` to `false` against the stale tree, then back
  to `true` once the (simulated) rebuild runs.
- **Uncertain always rebuilds:** three tests (missing dir, missing file,
  EISDIR) all assert `false`.
- **Byte-identical to the pre-change tree:** `'packages/$label/generated
  matches a fresh computePackageOutputs() exactly'`, `it.each` over the real
  `PACKAGE_SPECS` (`stdlib`, `stdlib-aws`, `stdlib-tupadr3`) — calls
  `isGeneratedDirUpToDate` (read-only) against the REAL, already-built
  `packages/*/generated/` tree with a freshly computed output map and
  asserts `true`. Passed for all 3 real specs, proving `emitModuleJs`/
  `emitIndexJs`/etc. (unmodified by this task) still produce exactly what's
  on disk, just reassembled through `computePackageOutputs` instead of the
  old inline interleaving.

## Quality gates
- `npm test`: 625 test files passed / 1 skipped (626); 16019 passed / 2
  skipped / 1 todo (16022). `Duration` 57.20s (vitest-reported). Measured
  `uptime` load1 **7.82** just before the run, `mds_stores` at 34.8%
  (`suggestd`/`corespotlightd` at 0%) — elevated vs. the T0 baseline reading
  (4.56), consistent with the pre-loaded warning that a sibling agent (T3)
  is running concurrent vitest invocations against
  `tests/helpers/build-stdlib-globalsetup.ts` right now. 57.20s is still
  under the 60.3s ceiling and in line with the 57.00s baseline.
- `npm run typecheck`: exit 0, no output (both tsconfigs).
- `npm run lint`: exit 0, no output.
- `npm run build`: exit 0. Exactly the 3 pre-existing TS2591/TS2503 notes in
  `src/core/include-resolver-node.ts` — not a new failure.
- `git diff --name-only -- src/`: empty.

## Complexity hook / write-set
No extraction was forced — `scripts/build-stdlib-packages.ts` grew from 128
to 206 lines (file-length limit 500), and every new/changed function is
well under 30 NLOC / CCN 10 (`isGeneratedDirUpToDate` and `writeOutputs` are
each ~10-line single-loop-plus-branch functions). No new file was created
under `scripts/build-stdlib-packages/`.

## Interface-contract result
```json
{
  "predicateName": "isGeneratedDirUpToDate",
  "signature": "(generatedDir: string, freshOutputs: ReadonlyMap<string, string>) => boolean"
}
```

## Addendum -- coordinator review (Item 1 + Item 2)

### Item 1: extended the skip to `buildSpriteSplits` (required, done)

Coordinator's finding was correct and verified independently: `buildStdlibPackages()`
called `buildSpriteSplits()` unconditionally, which called `splitSpriteBundle`
(`scripts/split-sprite-bundle/split.ts:144`) whose own `rmSync(opts.outDir, ...)`
deletes `packages/stdlib/assets/bootstrap1.13.1/sprites/` on every call, with an
active concurrent reader (`tests/unit/sprite-package-files.test.ts:98,138-149,200`
reads `sprites.json`, `npm pack`s the tree, and `readdirSync`s `sprites/`, all in
test workers). My original T2 note mislabeled this "out of scope" without
verifying it -- it is live and it defeats D3 exactly as described (the lock
cannot help: B legally acquires it after A's `globalSetup` released it, and
A's workers are still reading).

**Fix (same file, same discipline, `split.ts` untouched):**
- `computeSpriteSplitOutputs(spec, assetsStdlibDir)` (private) -- calls the
  real, unmodified `splitSpriteBundle` against a throwaway `mkdtempSync`
  scratch directory (never the real `sprites/` path), then reads back
  `{ 'sprites.json': <manifest JSON>, 'sprites/<name>.puml': <content>, ... }`
  as a `Map<string, string>` -- the sprite-split analogue of
  `computePackageOutputs`. `splitSpriteBundle` is not a pure function (it
  writes as it computes), so this is the cheapest way to get "what it would
  emit" without touching the shared tree or forking its algorithm.
- **`isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsStdlibDir): boolean`**
  (exported) -- delegates straight to `isGeneratedDirUpToDate` with the
  scratch-computed outputs above. Same asymmetry: `computeSpriteSplitOutputs`
  throwing for ANY reason (non-MIT license, missing source, ...) is caught
  and treated as "not up to date" -- uncertain always rebuilds.
- `buildSpriteSplits()` now checks this predicate first and returns without
  calling `splitSpriteBundle` at all when it is `true` -- the real
  `rmSync` inside `split.ts:144` never runs on a match.

**Filesystem-level proof (mirrors the `generated/` proof exactly, same
"never call the real entrypoint against shared state" discipline -- see the
test file's header comment for why):** a sentinel file placed inside an
isolated `sprites/` directory survives a no-op call when the source is
unchanged (`statSync(...).ino` on a fragment also unchanged), and is
destroyed (the real `rmSync` ran) when the source content changes.
`tests/unit/build-stdlib-packages.test.ts`, describes
`'isSpriteSplitUpToDate: ...'` and `'buildSpriteSplits-shaped wiring: ...'`
(7 new tests).

### Item 2: the extra-file case (note only)

Verified the coordinator's reasoning independently rather than accepting it:
`emit-index.ts#indexLines` builds `index.js`'s re-export lines directly from
`spec.modules`/`spec.remoteModules`, one `export { ... } from
'./${mod.fileBaseName}.js'` line per module (`reExportLine`/
`remoteReExportLine`). Removing a module from the spec, or renaming its
`fileBaseName`, changes that line, so `index.js`'s emitted content differs
from what's on disk -- and `index.js` is always one of the entries
`isGeneratedDirUpToDate` hashes and compares. That mismatch alone flips the
whole predicate to `false`, forcing `writeOutputs` into the real
`freshGeneratedDir` (`rmSync` + full rewrite), which removes the orphaned
file. **Confirmed correct** for the realistic case (a legitimate spec
change). I additionally note a strictly narrower residual the coordinator's
example doesn't quite cover: a file placed in `generated/` that was NEVER
tied to any spec entry at all (so no index line ever referenced it) would
survive indefinitely on repeated skips, since nothing in `freshOutputs`
mismatches. I consider this materially narrower still (it requires a file
appearing in a gitignored, tool-owned directory through some means other
than this generator or a legitimate spec edit), and, per the coordinator's
instruction, have NOT added a `readdirSync` set-comparison to close it --
that check is exactly the count-based staleness signal D4 forbids. Recorded
in `isGeneratedDirUpToDate`'s doc comment is left as originally written
(generic, both cases already implied by "never notices an untracked
extra file"); the specific `index.js`/`sprites.json` mechanisms are
documented on `computePackageOutputs`'s and `isSpriteSplitUpToDate`'s own
comments instead, where the concrete claim actually lives.

### Diagnosis note: the guarded repro's failure MODE changed (still red, worth flagging)

Ran `STDLIB_BUILD_RACE_REPRO=1 npx vitest run tests/integration/stdlib-build-race.test.ts`
after this task's changes (both Item 1 and the original `generated/` skip).
**Result: still FAILS (1 failed), satisfying the "must still fail" boundary
-- but via a different mechanism than before.**

- **Before this task (T0/T1 baseline):** the writer subprocess's `for`
  loop called `buildStdlibPackages()` 300 times, and (pre-fix) EVERY call
  did a real, unconditional `rmSync`+rewrite of `packages/*/generated/` --
  300 separate destructive windows for the reader's 100,000 cache-busted
  `import()` attempts to collide with. Mean 700.6 attempts to first
  failure (`.agent-notes/sre-T0.md`).
- **After this task:** the writer's 300 iterations call `buildStdlibPackages()`
  against inputs that never change between iterations (same `assets/stdlib/`,
  same specs, run inside one process). `isGeneratedDirUpToDate`/
  `isSpriteSplitUpToDate` correctly report "already up to date" from
  (at latest) the second iteration onward, so `writeOutputs`/
  `buildSpriteSplits` skip -- zero further `rmSync` calls for the rest of
  the loop. The reader therefore has (at most) one narrow destructive
  window instead of 300, and in this run never hit it inside its 100,000-attempt
  budget -- it ran to the test's 120s timeout instead of the documented
  `FAIL at attempt N: Cannot find module ...` signature (log:
  `Error: Test timed out in 120000ms`, no writer/reader stdout captured
  before the timeout fired).
- **Mechanism, stated plainly:** this task's fix removes the repeated-
  rebuild-of-unchanged-inputs case from the race surface (exactly what D3
  intends it to do), so the T0/T1 harness -- built around a writer that
  loops rebuilding the SAME unchanged inputs -- now stresses a much
  narrower window than it used to, and 100,000 reader attempts is no
  longer enough to reliably land in it within 120s.
- **Not fixed here, not attempted:** the underlying inter-process lock is
  a later task's write-set. I did not touch
  `tests/integration/stdlib-build-race.test.ts` or
  `tests/helpers/stdlib-build-race-writer.ts`/`-reader.ts` (outside this
  task's write-set) and made no attempt to make this test pass.
- **Flagging for the lock task:** D3's own residual note already says "if
  Run B genuinely must rebuild (the source really changed mid-run), it
  still `rmSync`s" -- this harness, as written, never changes the source
  between the writer's iterations, so it no longer exercises that residual
  at all post-T2. The lock task may need the writer to mutate an input
  (e.g. touch/rewrite one vendored `.puml` between iterations) to keep
  reproducing a genuine concurrent-rebuild-of-DIFFERENT-inputs race, or to
  raise `READER_ATTEMPTS`/lower `WRITER_DELAY_MS` further, since "rebuild
  repeatedly with unchanged inputs" is no longer a race this codebase has.
- No stray `writer`/`reader` subprocesses were left running after the
  timeout (`ps aux | grep stdlib-build-race-` empty afterward).

## Re-measured quality gates (post Item 1 + Item 2, quieter machine)

- `npm test`: 625 test files passed / 1 skipped (626); 16026 passed / 2
  skipped / 1 todo (16029) -- 7 more than the original T2 report (the new
  sprite-split tests). `Duration` **56.07s**. Measured `uptime` load1
  **2.87** just before the run (`corespotlightd` ~95%, `mds_stores` 0%,
  `suggestd` 0%) -- load1 dropped from the earlier contended 7.82 reading
  down through a settling window (8.06 -> ... -> 2.87) after the sibling
  T3 agent finished; `corespotlightd` churn (from this task's own repeated
  temp-dir creation/deletion in tests) stayed elevated but load1 is the
  more reliable signal here and is now well below baseline contention.
  56.07s is under the 60.3s ceiling and close to the 57.00s baseline.
- `npm run typecheck`: exit 0, no output (both tsconfigs).
- `npm run lint`: exit 0, no output.
- `npm run build`: exit 0. Exactly the 3 pre-existing TS2591/TS2503 notes
  in `src/core/include-resolver-node.ts` -- not a new failure.
- `git diff --name-only -- src/`: empty.
- `STDLIB_BUILD_RACE_REPRO=1 npx vitest run tests/integration/stdlib-build-race.test.ts`:
  still FAILS (see diagnosis note above) -- confirms the mission boundary
  ("must still fail") holds; the lock is a later task's job, not this one's.

## Updated interface-contract result
```json
{
  "generatedDirPredicate": {
    "predicateName": "isGeneratedDirUpToDate",
    "signature": "(generatedDir: string, freshOutputs: ReadonlyMap<string, string>) => boolean"
  },
  "spriteSplitPredicate": {
    "predicateName": "isSpriteSplitUpToDate",
    "signature": "(bundleAssetsDir: string, spec: SpriteSplitBundleSpec, assetsStdlibDir: string) => boolean"
  }
}
```
