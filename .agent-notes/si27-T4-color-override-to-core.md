## Observation: no colocated test existed for resolveBareOrBackColor
- **Context**: T4 spec step 3 said "Move the colocated test."
- **Finding**: `src/diagrams/class/class-color-override.ts` had no
  `.test.ts` anywhere (not colocated in `src/`, not in `tests/unit/class/`
  or `tests/unit/core/`). This repo's test convention is `tests/unit/**`
  mirroring `src/**`, not truly colocated — grep confirmed zero hits for
  `resolveBareOrBackColor` under `tests/`.
- **Impact**: Wrote a new `tests/unit/core/color-override.test.ts` (TDD
  gap-fill, not a move) instead of moving an existing file. Acceptance
  criteria's "new case cites ColorParser.java for the `##red` branch" is
  satisfied there; all other branches (bare, compound `back:`, no-`back:`
  compound, shadowing-only, multi-token) also covered since none pre-existed.
- **Confidence**: High (verified via grep across both `src/` and `tests/`).

## Observation: manifest diff transiently showed 4 state fixtures changed,
  traced to sibling task T1, not T4
- **Context**: Per-task manifest check (`--only class,state`) against the
  T0 baseline, run twice ~2 min apart.
- **Finding**: Both runs reproducibly showed the SAME 4 state fixtures
  changed (`duzazu-41-telu529`, `juvagu-33-dupa212`, `lokija-02-dipe348`,
  `vixobo-14-jole910`), all with literal `\n`/`\t` escape sequences in
  state body text and zero color-override syntax (`#`, `back:`, `##`) —
  grep-verified empty. `resolveBareOrBackColor`'s body is byte-identical to
  the pre-move version (pure `git mv` + doc/import edits only), so it
  cannot be the cause. Batch-1a's sibling task T1 (Display.getWithNewlines
  unification) directly touches this exact mechanism (`\n`/`\t` handling
  in display text) and was mid-edit, uncommitted, in the same working tree
  at the time of both manifest runs.
- **Impact**: T4's own manifest scope is otherwise clean; these 4 diffs are
  T1's in-flight work bleeding into a shared-tree render, not a T4 defect.
  Not filed as a stop condition. Should self-resolve once T1 commits;
  worth a spot-check at batch-end's full manifest run.
- **Confidence**: High (reproducible across 2 runs; content-grep rules out
  color-override involvement; mechanism matches T1's declared task scope).
