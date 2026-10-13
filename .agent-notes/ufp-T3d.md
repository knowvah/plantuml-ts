# ufp-T3d — the `version` page (D14)

## Observation: @knowvah/dot-engine exposes no version at runtime
- **Context**: looking for a truthful replacement for `<b>GraphViz</b> ""<dot -V>""` (GraphvizUtils.java:123-127).
- **Finding**: dot-engine 2.3.0 exports no version string. The only version-like export is `XDOT_VERSION = '1.7'`, the xdot format version. The package.json version is not reachable: the `exports` map has no `./package.json`. The pin `2.3.0` lives only in plantuml-ts's package.json (a tarball URL).
- **Impact**: a hard-coded engine version in `src/` could drift unseen, as `core/version.ts` VERSION has (0.1.0 vs 0.2.0). The `version` page names the engine and prints no version for it.
- **Confidence**: High

## Observation: the jar writes `""monospace""` spaces as U+00A0
- **Context**: pinning the jar `version` probe's text runs in a test.
- **Finding**: inside a `""..""` run the jar emits NBSP for every space, e.g. `Unknown compile time` (`od -c` shows `302 240`). Plain runs such as `Installation seems OK...` keep U+0020.
- **Impact**: a hand-typed jar constant fails on spaces that look identical. Generate constants from the probe file instead of retyping them.
- **Confidence**: High (measured)

## Observation: renderSvg warns about Times metrics unless dot-engine-measurer is imported
- **Context**: running `renderSvg('digraph foo { test; }', 'dot')` (the file-generation test, GraphvizUtils.java:161).
- **Finding**: dot-engine's default measurer prints `Warning: no hard-coded metrics for 'Times,serif'` on the console. Importing `core/dot-engine-measurer.js` for its side effect installs the LUT measurer and stops the warning.
- **Impact**: any new `src/` caller of the engine must import that module, as `diagrams/dot/layout.ts` does.
- **Confidence**: High

## Observation: upstream's browser build already drops the host blocks
- **Context**: deciding which `createShowVersion` lines have no browser equivalent.
- **Finding**: under TeaVM, `OptionPrint.interestingProperties` returns empty (OptionPrint.java:62-63) and `interestingValues` adds nothing (:85). `createShowVersion` skips License, the Graphviz status and both blocks (PSystemVersion.java:178).
- **Impact**: the D14 omissions (JVM properties, `PLANTUML_LIMIT_SIZE`) match what upstream does in a browser.
- **Confidence**: High
