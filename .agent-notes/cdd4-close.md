## Observation: machine load produces red suites with zero assertion failures
- **Context**: cdd4 batch-2 close gates, 2026-09-27
- **Finding**: Two full `npm test` runs failed only by timeouts. The load
  average was 40–115, driven by mds, duetexpertd and PerfPowerServices. The
  failing tests changed between runs, and 3 files were not collected
  because their workers failed to start. Timing main against the branch
  showed identical first render (50 ms). At load 5 the suite was green.
- **Impact**: Classify failures as TIMEOUT or ASSERT from the JSON reporter
  before believing a red run. Wait for load before surveying: survey
  timeouts showed as fake regressions with `dotEqual` flips.
- **Confidence**: High

## Observation: an oracle "stale cache" can be jar drift
- **Context**: cdd4 T2 (besepi)
- **Finding**: `oracle/dist/plantuml-oracle.jar` symlinks to 8beta1 while
  `pin.json` says 7beta11. The cache was captured with 7beta11 and is
  correct for the pin. "Fresh" `oracle-render.sh` output is 8beta1.
- **Impact**: Before calling a cache stale, render with the pinned jar
  (`~/git/plantuml/build/libs/plantuml-1.2026.7beta11.jar`) and `cmp`.
- **Confidence**: High

## Observation: harness copies drift from production
- **Context**: cdd4 T4, T9, T13, close-b2
- **Finding**: The census, ratchet and render-all each had private copies
  of production seams: parse without `assetStore`, a pre-TIM seed, an old
  `buildTheme`, and a sprite-only store. Each one produced false verdicts
  until it was aligned.
- **Impact**: When a harness verdict disagrees with the survey, diff the
  harness's pipeline against `renderSync` first.
- **Confidence**: High
