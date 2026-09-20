# Decision journal

| # | When | Task | Decision | Why | Flag for review? |
|---|------|------|----------|-----|------------------|
| 0 | 2026-09-20 | plan | Baseline recorded at `a012be16` (main, clean): typecheck 0, lint 0, `npm test` 730 files / 20066 tests, coverage 96.00 / 91.37 / 97.08 / 96.97. | Phase 8 pre-flight | no |
| 0a | 2026-09-20 | plan | `plans/` is NOT added to `.gitignore`: this repo commits its plan directories (130 in tree, `chore(plans): …` commits). `.claude/` already ignored. `.claude/settings.autonomous.json` left as-is: it already permits `npm`, `npx`, `scripts/oracle-render.sh`; specs use `npx jiti` for that reason. | project convention overrides the skill's step 9 | no |
| 0b | 2026-09-20 | plan | `scripts/dot-sync-report.ts` is 596 lines, over the 500-line complexity hook; T4 extracts `dot-parity-rows.ts` first so the edit can land. | hook would block any edit | no |
