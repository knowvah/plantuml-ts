# T0c / T0d — cohort re-census (D3), read-only

Agent: general-purpose (one per half). Rules: [../common-rules.md](../common-rules.md)
items 1, 3, 4, 6. Work in the main checkout but WRITE ONLY your one file
(`measurements/census-a.md` for T0c: rows ws <= 100; `census-b.md` for T0d:
ws > 100). Scratch under `/private/tmp/claude-501/` named `add3-T0c`/`add3-T0d`.

## Task
For each un-pinned baseline row in your half (list it from
`oracle/goldens/svg-activity/diff-baseline.json`), name the NEXT mechanism that
brings it toward 0 (largest weight first) and its owning files: `--dump`,
`--align`, a per-row diff script (same seams as `scripts/activity-probe.ts`),
`measurements/b0-elements.json` (element-count delta first — compareSvg falls
back to LCS when counts differ), the Java. Known open families
(`planning/next-missions.md` § add2 Open -> add3; `.agent-notes/T3f.md`,
`T3g.md`, `T3i.md`): XLANE, Snake text position, notes (width, alone, multi,
if/while/repeat attached, swimlaneNote), multi-line text height, embedded
`{{ }}`, klimt (glyph outline, AtomText floor, creole bold, `%n()`), reluvi,
levuma, ruzazu, document gradient. Verify, don't assume. You may prove a fix in
an out-of-repo sandbox copy toggled by env var and report its measured drop.

## Output
(1) `slug | ws | element delta | top diffs | family | mechanism (Java file:line) | owning files`;
(2) family summary `family | rows | Σws | owning files | effort S/M/L | sandbox-measured drop`.
Return only the family summary + count of "mechanism unknown" rows.

Observability: N/A. Rollback: Reversible (read-only; one output file).
