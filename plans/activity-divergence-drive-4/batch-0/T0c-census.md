# T0c / T0d — re-census (D2), read-only

Agent: general-purpose (one per half). Rules: [../common-rules.md](../common-rules.md)
items 1, 3, 4, 6. Work in the main checkout but WRITE ONLY your one file
(`measurements/census-a.md` for T0c: rows ws <= 100 at `b0p.json`; `census-b.md` for
T0d: ws > 100). Scratch under `/private/tmp/claude-501/add4-T0c|T0d/`.

## Task
For each `baseline` row of `oracle/goldens/svg-activity/diff-baseline.json` in your half
(old rows carry add3's mechanism in `fixtures.md` — verify, it has been wrong), name the
NEXT mechanism toward 0 (largest weight first) and its owning files: `--dump`, `--align`,
`measurements/b0p-elements.json` (element-count delta first), the Java. Sandbox proofs
out of repo allowed (report measured drop). T0c also lists every circle-spot letter
(`<ellipse rx="10" ... stroke-width:0.5/> + <path fill>`) in the NEW captures and whether
`src/diagrams/activity/activity-spot-glyph-data.ts` has it.

## Output
(1) `slug | ws | element delta | top diffs | family | mechanism (Java file:line) | owning files`;
(2) `family | rows | Σws | owning files | effort S/M/L | sandbox drop`. Return only (2) +
the count of mechanism-unknown rows (+ T0c: the missing spot letters).
Observability: N/A. Rollback: Reversible (read-only).
