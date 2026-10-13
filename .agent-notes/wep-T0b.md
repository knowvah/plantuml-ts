# wep-T0b: wbs oracle harness

## Observation: jar-error rows derive from the stock record
- **Context**: seeding the wbs diff-baseline reasons (28 stock-error rows).
- **Finding**: `repin-wbs-baseline.mts` builds `jar-crash:`/`jar-error:` reasons from `oracle/goldens/stock-error-pages.json` `.errors["wbs/<slug>"]` (empty message = crash), and the shape test derives the expected set from the same record minus pinned slugs, so pins do not break it. The crash message "character to be escaped is missing" appears in no PlantUML source (JDK text, no stack in the page).
- **Impact**: no per-slug table to maintain; a re-pin keeps reasons in sync.
- **Confidence**: High
