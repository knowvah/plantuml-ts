# T-next: brief the `@startuml` utility-factory mission (maintainer request 2026-10-13)

Agent: orchestrator. Runs AFTER T-exit has merged wbs into local main — it starts the next
mission, it is not part of wep's exit bar.

## Task
1. Run `/plan-mission` for the unported `@startuml` single-line utility factories that
   `PSystemBuilder.java:133-200` registers ahead of the UML factories: `colors`
   (`PSystemColorsFactory`), `listfonts`, `emoji`/`listemoji`, `openiconic <name>`
   (`PSystemOpenIconicFactory`), `listopeniconic` (`PSystemListOpenIconicFactory`,
   `openiconic/PSystemListOpenIconicFactory.java:50`), `listsprite`/archimate sprites,
   `sudoku`, and the easter-egg/dedication factories — scope set by the maintainer in the
   planning interview. Source inventory: `plans/unknown-bucket-routing-repair/diagnosis/T6.md`
   rows 27-34 and "22 unported utility/easter-egg factories" (`planning/mission-index.md:272`).
2. Known groundwork to check first: `src/core/openiconic-glyphs{,-data}.ts` (OpenIconic glyph
   data for `<&icon>` atoms) vs upstream `openiconic/` (1,455 lines: `SvgPath`, `SvgCommand*`,
   `StringDecipher`); the dispatcher seam in `src/core/` that today refuses these lines.
   Corpus rows: `unknown/fotete-48-viga126` (`listopeniconic`), `unknown/jigemu-90-titu666`
   (`colors`), and the rest of the T6 known-gap rows.
3. Add the mission to `planning/mission-index.md` / `planning/next-missions.md`.

## Acceptance
- Given the brief, then it names every factory in scope with its Java `file:line`, the corpus
  rows it moves, and the dispatcher seam; the maintainer approves the decisions before execution.
