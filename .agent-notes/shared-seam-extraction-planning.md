## Observation: `.claude/catalog.md` referenced by CLAUDE.md does not exist
- **Context**: `/plan-mission shared-seam-extraction` Phase 1 (2026-08-17)
- **Finding**: CLAUDE.md says "`.claude/catalog.md` — every module + public API. Check before implementing anything"; the file is absent (`.claude/` holds only settings*.json). `planning/mission-guide.md` also says completed phases are tracked there.
- **Impact**: agents told to "check the catalog" find nothing; the mission brief forbids creating it as a side effect (README stop 9). Needs a maintainer decision (restore vs. drop the reference).
- **Confidence**: High

## Observation: `plans/` is committed in this repo (1,290 tracked files)
- **Context**: `/plan-mission` Phase 7 step 9 says to add `plans/` to `.gitignore`.
- **Finding**: the repo tracks `plans/**` deliberately (mission ledgers are history); `test-results/*` is gitignored except `dot-cache/`.
- **Impact**: do not gitignore `plans/`; put large generated baselines under `test-results/`.
- **Confidence**: High
