# T3 — re-verify the still-open dot-engine rows

Only for G rows that T0d left open. For each one, re-run the probe (cached
`svek-N.dot` → real `dot -Tdot` 16.x vs dot-engine `render(parse())`, per
`plans/class-divergence-drive-3/diagnosis/scratch/B-engine-raw.mts`).
Update the issue file's and the TRACKER line's numbers and fixture list for
the CURRENT dot-engine version. The TRACKER is the maintainer's channel
(D2), so each entry must stand alone: fixture list, edge, both `pos`
strings, the diagnostic line, versions.

If a row's residual is NOT dot-engine's (real dot on the SAME input agrees
with dot-engine), return it as a new diagnosis row in `../fixtures.md`
with owner `cdd4 batch 2`. Do not fix it here.

Write only under `docs/graphviz-issues/` and a journal row; never touch
`~/git/knowvah/dot-engine` (stop 10).

**Acceptance.**
- Given each open G row, then its TRACKER entry lists it, with numbers from
  the current version.
- Given a reassigned row, then `fixtures.md` names its new owner.

**Observability** N/A. **Rollback** Reversible.
