# cdd7-T2a observations

## Observation: FrontierCalculator moves the cluster border, not the port node
- **Context**: bonaco-71 port placement (`Cluster.java:410-430`).
- **Finding**: nothing in upstream moves a port node after layout; dot's
  `rank=source/sink` already puts it on the cluster edge. `manageEntryExit
  Point` recomputes the cluster RECTANGLE so its border passes through each
  port centre (touched sides from `insides`+points, untouched sides from the
  graphviz box, DELTA=18 push near corners). The brief's "port nodes are
  moved onto that border" wording is inverted.
- **Impact**: port placement fixes belong in the namespace geo, never in the
  port's ClassifierGeo x/y.
- **Confidence**: High (jar bonaco: cluster top 39.611 = port centre).

## Observation: a HEAD worktree built by symlinking test-results measures wrong
- **Context**: before/after render-all sweep via `git worktree add` at HEAD.
- **Finding**: `test-results/dot-cache` exists in a fresh worktree, so
  `ln -sfn <cache> <wt>/test-results/dot-cache` nests the link INSIDE it and
  the tool reads the worktree's own partial cache: 6 conformant rows showed as
  2/4 diverged (`svg/@background`). The committed `measurements/b1.json` is
  the reliable "before".
- **Impact**: compare against the batch's committed render-all JSON, or
  remove the directory before linking.
- **Confidence**: High

## Observation: ClassifierGeo field added by module augmentation
- **Context**: `entityPortUp` needed by layout and renderer; `class-geo-types.ts`
  is at 499 lines and owned by T2b this batch.
- **Finding**: declared via `declare module './class-geo-types.js'` in
  `class-entity-port.ts`; spreads in scale/shift passes carry it unchanged.
- **Impact**: fold into `class-geo-types.ts` when that file is next split.
- **Confidence**: High
