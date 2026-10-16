# T1 report (rufopi cluster fill)
Commit: see `git log -1` on fix/graphviz-tracker-consume (fix(description): fill containers from root style background).
Files: src/diagrams/description/renderer-cluster.ts; tests/unit/description/gtc-t1-cluster-root-background.test.ts (new).

## Render-diff
unknown/rufopi-30-roro642: structural 2 / numeric 0 -> 0 / 0 (pass=true).

## Diagnosis
- Mechanism: a group's fill is BackGroundColor of the merged style root,element,<diagram>,group,<uSymbol SNames>; user root{BackgroundColor} merges after plantuml.skin group{BackGroundColor transparent} (declaration order, overwrite) and wins. Port's buildStyleDefaults used packageBackground ?? 'none', never consulting the root cascade.
- Origin: Java Cluster.java:285-296 (signature), :385-391 (getStyle), :363-366 + :701-710 (getBackColor), plantuml.skin:102-103. Port src/diagrams/description/renderer-cluster.ts buildStyleDefaults (backGroundColorDefault).
- Chain: no packageBackground -> 'none' -> resolveBackColor gives NONE -> both file paths fill="none"; jar draws #DFD.
- Ruled out: layout (render-diff numeric 0, dot equal); title/document/caption styles (only path/@fill differed); inline-colour path (override tier unchanged, tested).
- Fix: fallback `packageBackground ?? rootElementBackground(resolved hex) ?? 'none'`. Caveat: order-blind (packageBackground beats root even if root declared later), same as existing rootElementBackground consumers. No src/core edit needed (stop 1 not hit). rootElementBackground also feeds the ELK adapter (description-elk-adapter.ts:359) via buildStyleDefaults.

## Surveys (before -> after; /private/tmp/claude-501/gtc-T1/*-{before,after}.json)
- unknown: conformant 486 -> 487, structural 16, diverged 323 -> 322. Mover: rufopi diverged -> conformant. Losses: 0.
- component: 188/13/65 -> 188/13/65. Mover: banatu-09-koce254 firstDiff @fill -> @stroke (still diverged): node containers now fill gray as the jar does; remaining diffs (root Linecolor #00F stroke, FontColor red text, 12 structural/14 numeric) are a separate root-cascade mechanism on borders/fonts, pre-existing, not touched.
- usecase: 62/4/27 (+1 oracle-error) unchanged. No movers.

## Tests
Targeted: `vitest run --maxWorkers=4 tests/unit/description tests/architecture tests/oracle/svg-conformance`: 137 files collected, 8094 passed, 1 skipped, 0 failed. New test file 4 tests. typecheck, eslint, prettier clean. Catalog not run (no export change).

## Residuals / write-set extensions
- banatu root Linecolor/FontColor cascade into node containers (candidate follow-on).
- No write-set extensions. Item 32: rufopi now conformant, 0/0; zosuje not examined here.
