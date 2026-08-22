# stdlib-lock-sharing T1 — shared/exclusive lock, notes for T2/T3/T4

## Observation: raw dynamic `import()` of a `.ts` file with relative
imports fails once spawned outside this repo's `node_modules` tree
- **Context**: `build-lock.ts` gained its first relative import
  (`./reader-registry.ts`) when shared mode was added. The existing
  worker-spawning tests in `tests/unit/build-stdlib-lock.test.ts` write a
  small `.mjs` script to a `mkdtempSync(tmpdir())` scratch dir (OUTSIDE the
  repo) and run it via the local `jiti` CLI binary; the worker does
  `await import(buildLockModuleUrl)` where `buildLockModuleUrl` is a raw
  `file://.../build-lock.ts` URL.
- **Finding**: Node 25's native TS type-stripping resolves the TOP-LEVEL
  `.ts` file fine (no jiti transform needed for plain syntax), but Node's
  native ESM resolver does NOT perform TypeScript's `.js`→`.ts` NodeNext
  specifier remap for nested static imports inside that file — it looks
  for a literal `reader-registry.js` on disk and throws
  `ERR_MODULE_NOT_FOUND`. This never surfaced before because the OLD
  `build-lock.ts` had zero relative imports. Fix: route the import through
  jiti's own resolver instead of Node's native one —
  `createJiti(process.cwd()).import(buildLockModuleUrl)` — which correctly
  remaps nested specifiers. A second trap: `import 'jiti'` (bare specifier)
  from a worker script living in a scratch dir OUTSIDE the repo fails too
  (`Cannot find module 'jiti'`), because bare-specifier resolution walks up
  from the IMPORTING FILE's own directory, not `process.cwd()`. Fix:
  import jiti by its absolute `file://` URL
  (`node_modules/jiti/lib/jiti.mjs`), passed into the worker via `argv`
  exactly like `buildLockModuleUrl` already is — see `JITI_MODULE_URL` in
  `tests/unit/build-stdlib-lock.test.ts`.
- **Impact**: Any future worker script (T2/T3/T4, or a new test) that
  dynamically imports a `.ts` module with its own relative imports, from a
  scratch dir outside the repo, will hit the same two failures. Use the
  `JITI_MODULE_URL` + `createJiti(...).import(...)` pattern already
  established in `build-stdlib-lock.test.ts` rather than a raw
  `import(url)`.
- **Confidence**: High — reproduced directly via `node_modules/.bin/jiti`
  outside vitest, isolating each failure mode before fixing it.

## Design note: intent-dir + readers-dir both live beside `lockPath`
`readersDirFor`/`writerIntentDirFor` (`reader-registry.ts`) compute
`<lockPath>.readers` and `<lockPath>.writer-intent` by simple string
concatenation on `lockPath`. T2/T3, when switching reader call sites to
`mode: 'shared'`, do not need to create or clean up these directories
themselves — `registerPresence` creates them on demand (`mkdirSync`
recursive) and stale entries self-reclaim via `countLivePresence`/
`drainPresence`. Nothing new to add to `.gitignore`; they land under the
same `os.tmpdir()`-rooted `lockPath` the existing lock file already uses.
