# T1d — spot glyph letters from the new captures (D5)

Agent: typescript-pro, worktree `add4-T1d`. Rules: [../common-rules.md](../common-rules.md).
Read `.agent-notes/add3-T3g.md` and `src/diagrams/activity/activity-spot-glyph-data.ts`.

## Task
For each circle-spot letter T0c listed as missing, extract the jar's `<path d>` from its
cached `test-results/dot-cache/activity/<slug>/in.svg`, normalize to the (10,10) reference
centre exactly as the existing entries, add it to `SPOT_GLYPH_D`, and add a round-trip test
back to the source fixture's raw `d`. If no letter is missing, report and make no commit.

## Write-set
`src/diagrams/activity/activity-spot-glyph-data.ts`, `tests/unit/activity/activity-spot-glyph.test.ts`.

## Acceptance
- Given each new letter, then the round-trip `d` equals its source fixture's.
- Given each spot row, then its glyph diff is 0.
Observability: N/A. Rollback: Reversible.
