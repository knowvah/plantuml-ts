## Observation: all 17 utility rows render OUR error banner, not ERROR_SENTINEL
- **Context**: seeding svg-utility diff-baseline at b0 (3e99b64fc).
- **Finding**: the sources reach the registry's refusal path and draw the PSystemError look-alike (`weErroredIn`), so the wbs-style sentinel-only check would have pinned meaningless numeric baselines. `measureUtilityMarkup` treats sentinel, our banner and throws as `error`.
- **Impact**: any later family harness over `unknown` rows needs the banner check too.
- **Confidence**: High

## Observation: HELP "never added" clause is in 7 routing + 7 refusal rows; kubuju reason is a state-seam note
- **Context**: `--fix-records` dry run.
- **Finding**: routing 7 rows, refusal 8 rows (7 HELP + kubuju-35-neji041) rewritten. kubuju's line is `listfonts <text>` -> PSystemListFontsFactory (PSystemBuilder.java:148; font/PSystemListFontsFactory.java:49-50); old text also claimed "permanently unported" with no maintainer ruling, dropped.
- **Impact**: orchestrator runs `repin-utility-routing.mts --fix-records --write`.
- **Confidence**: High

## Observation: worktree-header.md was absent at launch
- **Finding**: untracked orchestrator file, read from the main checkout; never committed.
- **Confidence**: High
