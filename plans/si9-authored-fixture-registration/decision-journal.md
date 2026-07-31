# Decision Journal — si9-authored-fixture-registration

Append one row per non-trivial judgment call. "Non-trivial" means: a
reasonable developer might have chosen differently.

Also log here: quality-gate results per batch, any brief line-number
correction, every measurement the brief asks you to record, and every STOP
with its full output.

| Date | Task | Decision | Rationale |
|---|---|---|---|
| 2026-07-31 | planning | Mission brief created | Gap found while closing `svg-sprite-nanoparser`: three fixtures matching the jar with zero diffs could not be ratcheted. Scope was investigated before planning, so the brief starts near Phase 2 |
| 2026-07-31 | planning | **ADR-2 exists because an assumption was checked and found FALSE** | "Canonicals will be generated automatically for new fixtures" was plausible and wrong: `ensureCanonical` early-returns when the directory merely has any `.svg`, so authored fixtures would get no canonical, no tag, and be silently dropped by `buildAgg`. Without ADR-2 this mission would have appeared to work while changing nothing |
| 2026-07-31 | planning | ADR-1's containment argument came from a level-two trace | `tests/visual/data/*.json` has **six** consumers. The rejected manifest-paste option would have touched all of them; the chosen reader-side change touches none. This was not part of the original rationale and is now the strongest one |
