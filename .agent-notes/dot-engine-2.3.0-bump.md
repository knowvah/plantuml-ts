# dot-engine 1.6.1 -> 2.3.0 bump (2026-10-10)

## Observation: 2.3.0 is byte-identical to 1.6.1 across the cached corpus
- **Context**: pinning `@knowvah/dot-engine` 2.3.0 (tarball URL, package.json).
  Ratchets are shrink-only, so a green `npm test` cannot show output movement.
- **Finding**: rendered all 4903 `test-results/dot-cache/<type>/<slug>/in.puml`
  fixtures (28 types) with `DeterministicMeasurer` under each version: 0 SVG
  hashes differ, 0 error rows either side. The 2.2.0 `poly_init` vertex change
  and 2.0.0 error hierarchy move nothing we emit. Verified the 1.6.1 run really
  loaded 1.6.1 (no `renderSvgAsync` export) before trusting the zero.
- **Impact**: no re-baseline needed. Filed graphviz-issues are dated against
  1.6.1; #27 (parser accepts `node { ... }`) still reproduces on 2.3.0.
- **Confidence**: High

## Observation: 2.3.0's async API is a prefetch wrapper, not async layout
- **Context**: `renderAsync` / `renderSvgAsync` / `renderSvgInto` are new in 2.3.0.
- **Finding**: they await web fonts (`document.fonts` / `fontSet`) and async
  image hooks (`imageSizer`, `imageResolver`), then run the unchanged
  synchronous layout (`dist/async/render-async.d.ts`). We inject our own text
  measurer and size svek nodes ourselves; only `@startdot`
  (`src/diagrams/dot/layout.ts`) lets the engine size `<IMG>` labels.
- **Impact**: not adopted. Using it for `@startdot` alone would split
  `render()` from `renderSync()` output; `renderSvgInto` needs the DOM.
- **Confidence**: High (read from the shipped declarations)

## Observation: version A/B without touching the lockfile
- **Context**: rendering the corpus under two engine versions.
- **Finding**: swapping `node_modules/@knowvah/dot-engine` for the extracted
  registry tarball works (no runtime deps). A script in the scratchpad cannot
  bare-import the package; resolve it via `createRequire(<repo file>)`.
- **Impact**: reusable for the next engine bump.
- **Confidence**: High
