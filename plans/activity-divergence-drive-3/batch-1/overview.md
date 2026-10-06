# Batch 1 — label/translate census, Snake labels, XLANE (serial)

T1a (diagnosis, no src) -> T1b -> T1c. Close per close-procedure (`b1`, prev `b0`).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-label-translate-census.md) | every live `withLabel` + `drawTranslate` site -> ours; oracle label cases | typescript-pro | `measurements/label-census.md`, `measurements/label-cases/**` | b0 | [ ] |
| [T1b](T1b-snake-labels.md) | `Snake.getTextBlockPosition` + label canvas ink | typescript-pro | see spec | T1a | [ ] |
| [T1c](T1c-xlane.md) | cross-lane `LoopTranslate` kinds | typescript-pro | see spec | T1b | [ ] |
