# add4-T1d report

Commits: see `git log add4/T1d` (glyph commit "fix(activity): capture spot glyph E ..." + this note).

Change: `SPOT_GLYPH_D.E` + `ActivitySpotLetter` gains 'E' (activity-spot-glyph-data.ts);
round-trip test for both xovigi occurrences (cy=901.111, cy=1022.722; the two
normalise to the SAME d, no noise) in tests/unit/activity/activity-spot-glyph.test.ts. 12/12 pass.

Rows: xovigi-85-rufa987 probe Σ 399 -> 391 (-8). Risers: 0.
Glyph-path diffs: shape = 0. Occurrence 1 renders byte-identical to the jar's d.
Occurrence 2 d differs only by translate: ours cy=1022.111 vs jar 1022.722
(layout Y offset, another family, not glyph data). Remaining in row: polygon points 2485,
childCount 1445, polygon 859, line x1/x2/y2, text, path @d 419 (407 -> 419: the 2
glyphs now count as paths instead of absent/text; occurrence 2 mispositioned, others
other families).

Gates: typecheck + eslint clean. ratchet, harness-parity, swimlane-baseline GREEN.
Census movers (xovigi only), both equal the pin's `jar` column:
- style-baseline: fontSize 14: 4 -> 2 (jar 2); textCount 27 -> 25 (jar 25). Test red: equality pin, needs re-pin.
- text-baseline: fill #000 27 -> 25, anchor (absent) 27 -> 25, textCount 27 -> 25 (jar 25 each). Test red: needs re-pin.
Mechanism: the two `<text>` fallback glyphs (monospace 14) became `<path>`; moving toward the jar.
Not re-pinned (baseline JSONs off-limits for this task): orchestrator must re-pin style+text baselines.
