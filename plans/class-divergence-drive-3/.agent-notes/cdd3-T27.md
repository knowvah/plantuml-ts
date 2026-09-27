# cdd3-T27 — gradient def order (C-7) + def-id seed input (C-9)

## Observation: `<defs>` child order must be first-use order, across emitters
- **Context**: givofi-11-xumu978, 10 S on stop colours / `url(#…)` refs.
- **Finding**: `SvgGraphics#createSvgGradient` (`SvgGraphics.java:393,404`),
  `getFilterBackColor` (:777,786) and `manageShadow` (:1076,1086) append to
  `defs` when the first user is drawn, so child order = first `url(#id)` in
  the body. `collectDocumentDefs` put caller-supplied (klimt USymbol) defs
  first. Fixed by `svg-defs.ts#orderSeededDefsByFirstUse` after both
  collapses; unreferenced defs and markers keep their slots.
- **Impact**: any mixed-emitter document is now numbered in draw order; a
  future def-order diff means the BODY order diverges, not `<defs>`.
- **Confidence**: High (probe + class/all-engine survey).

## Observation: the def-id seed is over TIM output, and comments matter too
- **Context**: popesa-39-sobe866 (C-9, was MEDIUM, "not re-probed").
- **Finding**: re-probed: hashing the post-TIM lines gives `30vatrr2be6m`
  (jar) vs raw `1dfzmcprqomz6`. Beyond `!define`, TIM also drops `'` comment
  lines, so every block with a comment line had a wrong seed: sequence
  fadage-04-xoxe727 / netuvi-29-jiti924 and unknown vapelu-42-maba761 now
  mint the jar's ids (`g1mlertifdvwdu0`, `gpyvehw9nzstv0`, `f6g93a0na1af4`).
- **Mechanism of the port gap**: this port's `plainLineFilter` consumes
  skinparam/`<style>`/`skin` lines before `resultList`, so `PreprocessorResult
  .lines` is not `BlockUml#data`. `TContext` now records consumed lines
  (substituted, with their `resultList` index); `uml-source-lines.ts
  #dataListOf` merges them back; `umlSourceSeedLines` ports
  `Jaws.mutateExpandsBreakline`, `UmlSource#loadInternal` (SEQUENCE backslash
  join) and `patchBase64Line`; `BlockUmlOk.seedSource` → `UmlSource
  .seedSourceLines` → `seedOfUmlSource` and description's
  `reconstructSourceForSeed`.
- **Known limits**: a consumed line is positioned before the next
  `resultList` entry; `%retrieve_procedure`'s splice and `appendToLastResult`
  still act on `resultList` alone (no fixture exercises either with a
  skinparam line).
- **Confidence**: High.

## Observation: four files at/over the 500-line cap had to be split to grow
- `svg-defs.ts` (515) → seeded-id pass moved to `svg-defs-seeded.ts`;
  `preprocessor.ts` (538) → collector moved verbatim to
  `preprocessor-collector.ts`; `TContext.ts` held at exactly 500;
  `index.ts` held at 523. Python/sed edits bypass the complexity hook —
  re-check `wc -l` and lizard by hand when using them.
- **Confidence**: High.

## Final report
- Closed (structural → 0): givofi-11-xumu978 10S/2N → 0S/2N; popesa-39-sobe866
  7S/2N → 0S/2N (both diverged → structural-match; residual N = C-8, T31).
- Class render-all: 627/48/48 → 627/50/46; no other class mover.
- Non-class survey movers (27 engines; verdict unchanged, firstDiff moved
  past the def id — C-9, TIM drops `'` comment lines): sequence
  fadage-04-xoxe727, sequence netuvi-29-jiti924, unknown vapelu-42-maba761.
- Gates: typecheck, lint, build green; npm test: only the 5 worktree
  stdlib/sprite files + one 5000 ms timeout in description-parity.ratchet
  (passes alone); class-dot-parity green; catalog regenerated.
- Commit: this note's commit on wt/cdd3-T27.
