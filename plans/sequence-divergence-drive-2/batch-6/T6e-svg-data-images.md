# T6e — `data:image/svg+xml` creole images

Agent: `typescript-pro` (sonnet), worktree `sdd2-T6e`. Commit:
`feat(creole): decode data:image/svg+xml images`.
Read [../task-contract.md](../task-contract.md) first. **Core change (D6):**
the orchestrator runs the all-engine survey after merging it.

## Mechanism (research D cluster L)
`klimt/creole/atom/AtomImg.java:153-161`: a `data:image/svg+xml` source
becomes `AtomImgSvg` / `TileImageSvg`; `:226-232` the svg URL form. The
port's `core/creole-atoms.ts:360-367` (`buildImgSpan`) accepts only PNG
IHDR and draws "(Cannot decode…)". fifasu needs an http fetch (I/O) and
stays out (push-forward).

`src/core/creole-atoms.ts` is **504 lines**: split it first, in this
commit, along an upstream class boundary (e.g. image atoms into
`creole-atoms-img.ts`) as a pure move, then add the SVG branch.

## Targets
vofupo, budevu. Other engines' fixtures with svg data images may move —
list them.

## Write-set
`src/core/creole-atoms.ts`, new `src/core/creole-atoms-img.ts` (or the
split you choose), `src/core/creole-atoms-image-resolver.ts`, tests.

## Read-set
`research/research-d-structure.md` L; `core/creole-atoms.ts:340-400`;
`creole-atoms-image-resolver.ts`; `AtomImg.java`, `AtomImgSvg.java`,
`TileImageSvg.java`.

## Acceptance
- Given `<img data:image/svg+xml;base64,…>`, then an `<image>` with the
  jar's attributes is emitted (test).
- Given the split, then every engine's pinned goldens are unchanged.
- Given vofupo, budevu, then 0 structural sites.
