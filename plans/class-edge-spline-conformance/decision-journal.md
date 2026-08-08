# Decision Journal — class edge-spline conformance

Append one row per non-trivial judgment call. "Non-trivial" means a
reasonable engineer might have chosen differently. Append during
execution; never rewrite an existing row.

Log here in particular:

- **The mechanism, once isolated** — `file:line`, the causal chain, and
  what was ruled out to get there. Per `~/.claude/rules/diagnosis.md` this
  mission is diagnosis mode from the first observed discrepancy: no fix
  before a stated mechanism.
- **Every other fixture whose output moves** when the fix lands. The
  spline code is shared, so a change here is not fixture-local — the
  class ratchet's other 312 pinned fixtures are the blast radius.
- **The disposition if the cause is in `@knowvah/dot-engine`** — the
  `docs/graphviz-issues/` entry and its `TRACKER.md` line, per CLAUDE.md.

| Date | Decision | Why | Flagged for review |
|---|---|---|---|
| 2026-08-08 | Mission opened. `bipudo-23-xavu432` un-pinned from `oracle/goldens/svg-class/ratchet.json` (313 → 312) by maintainer decision, so the size-reduction mission could land green. Documented in `oracle/goldens/svg-class/README.md`'s "Removed fixtures" table with the full measurement. | The gap is pre-existing (proven at `1d913189`) and unrelated to the size-reduction port, which only changed what the comparator could see. Blocking that mission on an unrelated sub-pixel layout gap would have been the wrong trade. **Deliberately NOT an accepted divergence** — no `oracle/accepted-divergences.json` entry — because this is a deferral with an exit condition, not a won't-fix. | no |
