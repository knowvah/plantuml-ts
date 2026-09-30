# Batch 2: the port leaf, and the rows batch 1 re-slotted

Two tasks in parallel worktrees, after the b1 close. T2a consumes T1c's merged
`class-geo-types.ts` and owns `class-geo-builders.ts`; its port dispatch lives in
`renderer.ts` (the classifier loop at `renderer.ts:351-356`, a branch before the
usymbol one), so `renderer-usymbol-entity.ts` stays T2b's. T2b was created at the b1
close (journal rows 13, 14, 19). The batch closes via
[../close-procedure.md](../close-procedure.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-port-leaf-draw.md) | bonaco: `FrontierCalculator` wired into `buildNamespaceGeos`; `EntityImagePort` draw (D4) | typescript-pro (opus) | `class/class-entity-port.ts`, `class/class-geo-builders.ts` (+helper split), new `class/renderer-entity-port.ts`, `class/renderer.ts` (dispatch), `docs/catalog.md` (+tests) | b1 close | [x] |
| [T2b](T2b-stereotype-sprite-leaf-style.md) | dezobu stereotype sprite chain; xuloxo RoundCorner/alignment keys + edge-label word-wrap | typescript-pro (opus) | seven `class/` parse/size/stereo files, six `core/skinparam*`/`theme*` files, four edge-label files (see spec) | b1 close | [x] |
