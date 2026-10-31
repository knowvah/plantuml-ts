## Observation: the json back-colour rect is painted by SvgGraphics, not by addBackcolor
- **Context**: jff T2a, routing json/yaml/hcl finalize through `exportTo`; the brief said the rect sits at the raw block size inside the scaled block.
- **Finding**: `TextBlockUtils.addBackcolor` (`TextBlockUtils.java:152-174`) draws nothing; it only carries the colour into the exporter's `SvgOption`. `SvgGraphics`' constructor paints the rect (`SvgGraphics.java:176-192,207-212`) before the margin translate, and `finalizeRootAttributes` sizes it `format(maxX) × format(maxY)` = the root size (`:819-821`). Jar-verified with scaled + titled scratch oracles.
- **Impact**: any family moving onto `exportTo` must splice the back-colour rect AFTER the export, at the scaled canvas. The jar also skips the rect for `#000000` (`:189-190`); our `isSolidNonDefault` does not.
- **Confidence**: High

## Observation: merge-one's ratchet set misses two gates that a json change can break
- **Context**: jff b1 and b2 closes; both first full-gate runs failed after merge-one was green.
- **Finding**: b1 failed `tests/architecture/catalog.test.ts` (a removed export, `scaleDasharray`); b2 failed `tests/unit/oracle/json-family-positional.test.ts` (T0b unit tests asserting the pre-fix defect). Neither file is in `merge-one.sh`'s list.
- **Impact**: add `tests/architecture/catalog.test.ts` and `tests/unit/oracle/` to a json-family merge gate, or expect the close's full run to surface them.
- **Confidence**: High

## Observation: committed parity-json/yaml files can lag the code by a whole mission
- **Context**: jff b2 close, re-surveying json/yaml/hcl into `tests/oracle/svg-conformance/parity-*.json`.
- **Finding**: 10 json rows and yaml/nuzaje carried pre-jfp `maxDelta` values (timafu 64.06, nuzaje 133.63) although b0-eng already measured 0.81 / 2.82. jfp re-pinned the positional ceiling but never the parity files; nothing gates their freshness.
- **Impact**: compare `parity-<type>.json` with a fresh survey at every close, not only the pins.
- **Confidence**: High

## Observation: a 0.001 format-order move is invisible to compareSvg and residue.mts
- **Context**: jff T2b, json/babico-87-soxo095 (title, no scale).
- **Finding**: formatting the body once after the title translate moved 52.637 → 52.638 (the jar's value). compareSvg's 0.01 tolerance and residue's 3-dp print both read 0 before and after; only a byte hash of the render (and the extended-mode baseline) caught it.
- **Impact**: when a change touches number formatting order, hash renders; tolerance-based gates cannot see it.
- **Confidence**: High

## Observation: a title narrower than the body inherits half the body's width residue
- **Context**: jff T2c stop-14 check on yaml/title-scale.
- **Finding**: its title x is 0.338 off at scale 2 because the title is centred over the block, and the body is 0.675 wider (U-REC, node 2 at 172.675 vs 172). A wider title instead shifts the body by half (json/title-scale, −0.254).
- **Impact**: a residual title-x diff on a json-family row is not by itself an export-order defect; compare it with half the body's width delta first.
- **Confidence**: High
