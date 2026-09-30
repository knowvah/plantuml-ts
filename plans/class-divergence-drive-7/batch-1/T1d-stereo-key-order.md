# T1d: stereo-key declaration order

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
**fepiko (`cluster-style-signature-unmerged`, cdd6 fixtures.md row; journal 49).**
After cdd6 T2a + the b2 residual round the row is 2/0: on one `<<stereo>>`
signature `FontColor` and `StereotypeFontColor` are declared in an order the port
loses — `skinparam-stereo-keys.ts`'s `*ByStereo` maps keep the LAST value per key
and drop declaration order, where upstream resolves by declaration order
(`DarkString.java:54-57`; read the `FromSkinparamToStyle` path that feeds it,
`FromSkinparamToStyle.java:120-135`). Quote the resolution rule, then port it so the
map preserves order (an ordered list of `(key, value)` per stereotype, or a
declaration index on each entry — whichever mirrors upstream's structure).

## Rows
- `unknown/fepiko-26-vobi566` (2/0)

## Write-set
- `src/core/skinparam-stereo-keys.ts`
- its unit tests under `tests/unit/core/`

## Read-set
cdd6 journal row 49 (residual round); `DarkString.java:40-70`;
`FromSkinparamToStyle.java:100-140`; `skinparam-stereo-keys.ts` (whole file, 1
concept).

## Interface contracts
none (the map's consumers keep their accessor signatures; if one must change, that
is a type move — journal it).

## Acceptance
- Given `skinparam <<s>> { FontColor red \n StereotypeFontColor blue }` and the
  reverse order, when resolved, then each order yields upstream's result
  (`DarkString.java:54-57`), asserted on specific colours.
- Given fepiko, when render-diff runs, then 0/0.
- Given the state/class/description surveys (the maps are shared), then 0 losses.

## Architecture decisions (locked)
D11; cdd6 D2 (one style path).
