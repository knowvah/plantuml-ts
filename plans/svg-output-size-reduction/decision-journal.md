# Decision Journal — SVG Output Size Reduction

Append one row per non-trivial judgment call. "Non-trivial" means a
reasonable engineer might have chosen differently. Append during
execution; never rewrite an existing row.

Log here in particular:

- **Every numeric attribute site found bypassing `attrs`/`attrsFromRecord`**
  (T5's template-literal audit). This is the enumeration the next
  maintainer needs; a site missed here emits raw floats forever.
- **Any surviving `javaRound4`/`javaFixed4` caller** found by T8 outside
  its write-set — which T6/T7 task missed it, and where.
- **Every real mismatch in batch-2d** (as opposed to expectation churn):
  the fixture, the mechanism, and the call site. Per `rules/diagnosis.md`,
  a mismatch is a finding, never a golden to edit.
- **T14's disposition** for `class-actor-bare-no-allowmixing`, with its
  mechanism.
- Any place the two emitters had to diverge in implementation to produce
  identical output — ADR-3 says they should not need to.

| Date | Task | Decision | Why | Flagged for review |
|---|---|---|---|---|
