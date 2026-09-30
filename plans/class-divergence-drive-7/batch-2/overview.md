# Batch 2: the port leaf

One task, after the b1 close (it consumes T1c's merged `class-geo-types.ts` and
owns `class-geo-builders.ts`, which T1c was kept out of). Runs in a worktree; the
batch closes via [../close-procedure.md](../close-procedure.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-port-leaf-draw.md) | bonaco: `FrontierCalculator` wired into `buildNamespaceGeos`; `EntityImagePort` draw (D4) | typescript-pro (opus) | `class/class-entity-port.ts`, `class/class-geo-builders.ts` (+helper split), new `class/renderer-entity-port.ts`, the class renderer dispatch file, `docs/catalog.md` (+tests) | b1 close | [ ] |
