## Observation: jar error-page oracles depend on the capture's wall-clock minute
- **Context**: cdd5 T0c/T0e re-pin of every oracle cache to 1.2026.8beta1.
- **Finding**: `PSystemError.java:218-228` adds a Patreon/Liberapay/dedication banner (yellow rect + PNG) to every error page when `currentTimeMillis()/60000 % 60` is 1, 8, 13, 15, 30, 39, 48 or 55. `disableTimeBasedErrorDecorations()` has no caller in src/main/java. A decorated page pushes the "PlantUML version" error signature past the routing/refusal gates' 4096-byte head-read, so the gates misread it as a rendered diagram. Crash pages (ReportLog) also carry a `Collections.shuffle` quote (QuoteUtils.java:340), which no timing can stabilise.
- **Impact**: any recapture of error-page fixtures (98 cache dirs, 1 golden) must render outside those minutes. `plans/class-divergence-drive-5/measurements/t0c/safe-render-one.sh` retries until the start and end minutes are both undecorated. `scripts/rebaseline-svg-goldens.ts` and `capture-oracle-cache.ts` have no such guard.
- **Confidence**: High (reproduced; 12 old caches and 3 fresh captures were decorated, all plain after a safe re-render).

## Observation: default-worker `npm test` drops files under load
- **Context**: cdd5 T0e gates, 2026-09-28.
- **Finding**: at load 80–160 (the suite's own forks plus WebStorm indexing or macOS installd/mediaanalysisd), vitest logs "Failed to start forks worker … Timeout waiting for worker to respond" for 7–16 random files and still prints a clean summary. `npm test -- --maxWorkers=6` ran the full 875 files green in ~2 minutes.
- **Impact**: when collected ≠ on-disk, rerun with `--maxWorkers=6` before suspecting the code.
- **Confidence**: High (5 runs).
