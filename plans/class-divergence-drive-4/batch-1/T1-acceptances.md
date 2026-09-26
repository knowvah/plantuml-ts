# T1 — acceptances (D6)

Add three entries to `oracle/accepted-divergences.json`, matching the
existing class entries' shape (`match.id` = `svg-class/<slug>`, `scope`,
`acceptedAt: 2026-09-26`, `acceptedBy: maintainer`, `reason`). Reasons are
quoted from `plans/class-divergence-drive-3/diagnosis/C.md` (luzive, sadamo: C-18. The residual is
ONLY the version banner, `[From …]` strings and their textLength; every
other number is exact after cdd3 T29) and `plans/class-divergence-drive-3/diagnosis/E3.md#zuduxu`
(E3-A: graphviz 16.1.0 loses both `sh0006->sh0008` edges and the jar
renders an NPE page from `Neighborhood.java:151`; precedent `DIVERGENCES.md`
"upstream crashes (deliberate)"). Before committing, re-verify each
reason on the current tree with `render-diff.mts <slug>`.

**Acceptance.** Given the file, then there are 16 class entries and every
test reading it passes. Given each reason, then it names the residual lines
exactly.

**Observability** N/A. **Rollback** Reversible.
