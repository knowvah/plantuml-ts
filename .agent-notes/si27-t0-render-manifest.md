# si27-t0-render-manifest

## Observation: `renderSync` never throws
- **Context**: Writing `scripts/render-manifest.ts#renderFixture` and its
  unit tests; the T0 spec calls for `{ error: message }` on a fixture that
  throws.
- **Finding**: `src/index.ts#renderSync` wraps its entire body in a single
  `try { ... } catch (err) { return errorSvg(source, err, options); }`. Every
  failure mode reachable from source text — including a bare `!include`
  with no `includeStore`, which the function's own guard clause throws for —
  is caught internally and turned into a normal SVG string (an "error
  diagram"), never propagated to the caller.
- **Impact**: A batch-render script's per-fixture try/catch around
  `renderSync` cannot be exercised with realistic PlantUML input; the only
  way it fires is a bug below `renderSync`'s own boundary (e.g. `toSvekDot`
  on a malformed `DotInputGraph`). Anyone writing a "renders and asserts a
  thrown error" test against `renderSync`/`render()` directly should expect
  it to return an error-diagram SVG instead, not throw. `scripts/render-
  manifest.ts` keeps its defensive catch (harmless, and it did stay
  documented per decisions.md#d6) but the corresponding unit test asserts
  the mechanism via a code comment rather than a fabricated throwing input.
- **Confidence**: High (read `src/index.ts:206-250` directly, confirmed the
  try/catch scope).

## Observation: the registry/dispatch import lives in `src/index.ts`, not `src/core/dispatcher.ts`
- **Context**: Seeding the `layering.test.ts` ALLOWLIST entry for "registry
  → diagrams/*/index.js" per decisions.md#d5.
- **Finding**: `src/core/dispatcher.ts` declares `DiagramRegistry`/`registry`
  but does not import any `src/diagrams/**` module. Every
  `registry.register(xPlugin)` call, and the corresponding
  `import { xPlugin } from './diagrams/x/index.js'`, lives in `src/index.ts`
  (the package's composition root), which is neither `src/core/**` nor
  `src/diagrams/X/**`. `tests/architecture/layering.test.ts`'s two rules
  (D5) are scoped exactly to those two prefixes, so `src/index.ts`'s
  diagram imports are structurally outside both rules — the seeded
  ALLOWLIST entry for it is documentation, not something a real offender
  exercises today.
- **Impact**: If a later task moves the registration into `src/core/
  dispatcher.ts` (making the registry pattern literally live under
  `src/core/`), the existing ALLOWLIST entry (`from: 'src/index.ts'`) will
  need its `from` updated to the new location, or it becomes stale in the
  opposite direction from `KNOWN_DEBT` (an ALLOWLIST entry that no longer
  matches its intended edge — not asserted by the current test, since only
  `KNOWN_DEBT` has a staleness check).
- **Confidence**: High (grepped every `diagrams/*/index.js` importer;
  `src/index.ts` is the only match).

## Observation: `npm run build` emits non-fatal TS diagnostics from a version-mismatched bundled compiler
- **Context**: Running the T0 quality bar's `npm run build` gate.
- **Finding**: The `vite-plugin-dts` declaration bundler reports `TS2591`/
  `TS2503` against `src/core/include-resolver-node.ts` (`node:fs/promises`,
  `node:path`, `NodeJS.ErrnoException` not found) and separately logs: "The
  target project appears to use TypeScript 6.0.3 which is newer than the
  bundled compiler engine [API Extractor, 5.9.3]". The build still exits 0
  and produces `dist/plantuml-ts.js`/`.cjs` — this is the bundled API
  Extractor's own TS 5.9.3 engine failing to resolve `node:*` specifiers and
  the ambient `NodeJS` namespace that TS 6's `types: ["node"]` resolution
  handles fine; it is not a real error in the source.
- **Impact**: Pre-existing, unrelated to T0's write-set (`include-resolver-
  node.ts` was never touched). Not fixed here — out of write-set, and
  `npm run build`'s exit code (the actual gate) is unaffected. Worth a
  dedicated cleanup task if API Extractor's bundled-compiler lag becomes a
  real problem (e.g., if it starts affecting `.d.ts` output correctness,
  not just noisy stderr).
- **Confidence**: High (reproduced on a clean `npm run build` before and
  after this task's commit; identical diagnostics both times).
