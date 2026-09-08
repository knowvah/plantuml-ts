# asd-T7 — activity-style-defaults close-out

Full scoring in `plans/activity-style-defaults/README.md`. This file
carries only what is reusable beyond the mission.

## Observation: the brief pointed a whole batch at dead code, and it typechecked

- **Context**: applying T3 exactly as briefed, then measuring.
- **Finding**: `activity-layout-helpers.ts` and the `layout.old.ts` cluster
  (~2049 LOC, ten files) are not on the render path. `activityPlugin
  .layoutSync` calls `layoutActivity` from `layout/tile-layout.ts`, which
  builds the `Gtile*` classes in `tiles/`; the live path imports
  `layout.old.ts` for TYPES ONLY (`import type` on both edges). The cluster
  is kept alive by `tests/unit/activity/layout.test.ts` alone. Editing it
  compiles, passes its own tests, and moves the corpus 61677 → 61677.
- **Impact**: the general lesson is that **a green typecheck and a green
  test suite are not evidence that an edit is on the render path**. The
  only instrument that caught it was measuring the corpus after the edit —
  which is why measuring per task, rather than once at the end, is worth
  its cost. Any future activity geometry work targets
  `src/diagrams/activity/tiles/`.
- **Confidence**: High — measured, and the import graph is unambiguous.

## Observation: one unsourced expression stood in for four upstream values

- **Context**: mapping each `Gtile` to its upstream `StyleSignature`.
- **Finding**: `theme.fontSize - 2` appeared at four live sites —
  diamond, note, connector spot, goto label. Upstream wants four DIFFERENT
  sizes there: 11, 13, 14, 14. For the note it was wrong in SIGN (the jar
  draws note text LARGER than action text).
- **Impact**: a relative offset like `- 2` reads as considered and is
  therefore hard to see. It survived because it is close enough to look
  deliberate. Worth grepping for the pattern in other engines.
- **Confidence**: High.

## Observation: a filed follow-on's mechanism was right but incomplete

- **Context**: T6, reading `Worm#drawInternalOneColor` rather than trusting
  the filing that pointed at it.
- **Finding**: the filing correctly said `UStroke.withThickness(1.5)`
  (`Worm.java:154,161`) is decoration-only. It missed that each decoration
  is then drawn through `.apply(UStroke.simple())` (`:159`, `:166`), and
  `UStroke.simple()` is `new UStroke(0, 0, 1.0)`
  (`klimt/UStroke.java:75-77`) — so the 1.5 is overridden before the draw
  and reaches no output at all. Preserving it "on the decorations only",
  which the brief permitted, would have been wrong.
- **Impact**: concrete instance of CLAUDE.md's rule. The brief said "read
  `Worm.java:120-170` yourself and confirm this before changing anything";
  doing so changed the answer. A filing is a pointer to a method, never a
  substitute for it.
- **Confidence**: High.

## Observation: `weightedScore` can rise while the output gets more correct

- **Context**: 14 fixtures rose across T4, T5 and T6.
- **Finding**: two mechanisms. (1) Correcting the box height made
  `rect/@height` exact and shrank the canvas, which was already short
  because `LAYOUT_MARGIN = 12` against the jar's 16 — so the canvas delta
  GREW as the geometry improved. (2) `compareSvg` pairs elements
  positionally, so on a fixture whose draw order already diverges, a
  correctly-added attribute costs one more unit on a pairing that was
  already wrong.
- **Impact**: refines `comparesvg-count-not-monotonic`. `weightedScore` IS
  monotone in alignment for a given structure, but a value fix inside a
  wrong structure can still raise it. A mission that corrects values should
  budget for named risers rather than promising zero — this mission's exit
  bar demanded zero rises and could not have met it.
- **Confidence**: High — each riser instrumented individually.

## Observation: three unrelated suites failed once at load average 124

- **Context**: the first full `npm test` after T6.
- **Finding**: `description-parity`, `sequence.diff-baseline` and
  `build-stdlib-lock` failed together, then all passed in isolation, and a
  clean re-run of the whole suite was green (693 files, 18737 tests).
- **Impact**: reinforces `confounded-wall-clock-readings`. Check the three
  in ISOLATION before re-running the suite — that order distinguishes a
  contention flake from a real break in one cheap step, and re-running the
  whole suite first would have cost 75s and proved less.
- **Confidence**: High.
