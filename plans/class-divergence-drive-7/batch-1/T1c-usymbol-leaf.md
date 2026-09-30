# T1c: usymbol leaf — style gaps and the stereotype sprite

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
1. **xuloxo (`class-head-arrow-triangle`, cdd6 row 67) — leaf half.** After cdd6
   T3d (022801178) the C4 groups draw as stereotyped usymbol leaves; four style
   gaps remain in `renderer-usymbol-entity.ts`: title alignment, RoundCorner and
   wrapWidth (`EntityImageDescription.java:168-191`) plus the by-stereo colours
   T2a landed only for the narrow key set. Read `EntityImageDescription.java`'s
   constructor (:100-200) end to end and port each in source order; report the
   per-atom diff after each. The edge-label half is T1b's.
2. **dezobu (`embedded-skinparam-hoisted`, cdd6 rows 39, 71).** The
   `<<$archimate/…>>` stereotype sprite is never drawn: `extractNodeStereotype`
   already returns `sr.sprite`, but `Classifier` / `ClassifierGeo` carry no sprite
   channel (cdd6 T3f's premise was wrong). Upstream:
   `EntityImageDescription.java:193-202` (`getVisibleStereotypeLabels` +
   `Stereotype.getSprite(skinParam)`), drawn in the stereo block. Add
   `ClassifierGeo.stereotypeSprite` (`class-geo-types.ts:177` next to
   `visibleStereotypeLabels`) and populate it through
   `class-stereotype.ts#stereotypeLabelFields` (:325) — the helper
   `class-geo-builders.ts` already spreads; **do not edit `class-geo-builders.ts`**
   (T2a's, batch 2). Draw the sprite in `renderer-usymbol-entity.ts`'s stereo block
   via the ported sprite drawing (`class-member-atom-resolve.ts#resolveInlineAtom`
   is cdd6 T2d's precedent for a sprite image).

## Rows
- `unknown/xuloxo-85-vibu502` (leaf share of 44/35)
- `unknown/dezobu-62-vuzu421` (1/9: sprite `<image>` missing + its size in the stereo block)

## Write-set
- `src/diagrams/class/renderer-usymbol-entity.ts` (491 lines — a helper split is a
  push-forward file-cap move; name it)
- `src/diagrams/class/class-stereotype.ts`
- `src/diagrams/class/class-geo-types.ts`
- their unit tests under `tests/unit/class/`

## Read-set
cdd6 journal rows 39, 49 (residual round R1 — the `visibleStereotypeLabels`
precedent), 67, 71; `EntityImageDescription.java:100-210`; `Stereotype.java`
(`getSprite`); `class-stereotype.ts:260-335`; `renderer-usymbol-entity.ts:280-320`.

## Interface contracts
Out (consumed by T2a's merged `class-geo-builders.ts`):
`ClassifierGeo.stereotypeSprite?: { name: string; width: number; height: number }`
— `undefined` when the stereotype carries no `$sprite`.

## Acceptance
- Given `rectangle X <<$archimate/business-actor>>` with the sprite in the asset
  store, when rendered, then one `<image>` is drawn in the leaf's stereo block at the
  jar's position; dezobu 1/9 → 0/0.
- Given xuloxo's usymbol leaves, then title alignment, RoundCorner and wrapWidth
  match `EntityImageDescription.java:168-191`; the leaf per-atom diffs → 0 or each
  residual carries a mechanism.
- Given the description/usecase/component surveys, then 0 conformant losses.

## Architecture decisions (locked)
D1, D11. `class-geo-builders.ts` is out of bounds this batch.
