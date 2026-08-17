# Mission: class-guide-line-glyphs

**Draw one magic-arrow triangle glyph per guide line of a multi-line class
edge label, and position class edge-label ink at the resolved arrow font.**
Follow-on to `edge-label-box-followups` (SI24, `813207b1`), whose T4 made the
DOT box for `class/gobuco-16-ruke239` / `lapoma-04-vaga142`
(`A -> B : ab >\ncd <\n< ef\n> gh`) exact at 29x54 but stopped before the SVG:
`class-edge-geo.ts` takes the multi-line early return and draws no glyph, while
the jar draws four `<polygon>`s (`test-results/dot-cache/class/gobuco-16-ruke239
/in.svg`). SI24 T5 also left the class geo/anchor layer positioning ink at the
constant `CARDINALITY_FONT_SIZE` (13) while the DOT reservation follows
`resolveArrowLabelFont(theme)` — a box/ink drift on any arrow-font override.
Both are fixed here; class engine only.

**Authorization.** Named in `planning/next-missions.md §1` follow-on #1 and
SI24's close-out ("T4 step 3 stopped, unfixed"). Register row **SI25** at T4.

**Branch:** `feat/class-guide-line-glyphs` · **Merge:** merge commit.

## Starting state (measured 2026-08-16 at `cb4de5c7`/`813207b1`; verify)

DOT EQUAL class **705/711** · state 266/268 · component 259/263 · usecase
92/93 · object 78/80. `shape-match-report` **785** doc-size-exact / **26,255**
matched-shapes (`gobuco` 14/22 168x102 vs jar 168x102; `lapoma` 14/22 68x232 vs
72x232). Class SVG ratchet 315 pins. 595 files / 14,492 tests, coverage
95.37/90.35/96.93/96.46. Backlogs 5/4/2/0 (untouched by this mission).

## Exit bar

1. `gobuco` and `lapoma` class SVG each carry **four** glyph `<polygon>`s, one
   per line, directions right/left/left/right, glyph shape byte-exact to jar's
   (position within the accepted N25/N62 gvts residual, not chased).
2. Every other class fixture **byte-identical** in DOT and SVG, except
   arrow-font-override fixtures (`camuna-58-veca254`, `ticuxa-26-tixo262`,
   `nafiki-56-jixu680`) which may move **toward jar** under D2, journalled.
3. Class DOT EQUAL **≥ 705/711**; class SVG ratchet pins hold or move toward
   jar with the measurement journalled; `shape-match-report` no fixture rises
   (per fixture, vs a baseline captured in a detached worktree at the start).
4. All four quality gates green.

Score clause by clause with a measurement; do not reword a clause.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Shared per-line walk (zero movement) | T1 | [x] |
| [2](batch-2/overview.md) | Geometry: per-line glyph + FontSpec threading | T2 | [x] |
| [3](batch-3/overview.md) | Renderer: draw the glyphs | T3 | [ ] |
| [4](batch-4/overview.md) | Close-out | T4 | [ ] |

## Quality gates

```
- command: npm test            # vitest + 90/90/90
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx jiti scripts/dot-sync-report.ts class
  pass: EQUAL >= 705/711
  on_fail: stop
- command: npx jiti scripts/shape-match-report.ts
  pass: no fixture rises vs the start baseline (per fixture)
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: matches the task's declared write-set only
  on_fail: stop
```

Census discipline: run the census only on a clean tree — detached worktree at
the commit, gitignored dirs symlinked (`.agent-notes/si24-census-worktree-
needs-ignored-assets.md`). Per-slug: `npx jiti scripts/dot-sync-report.ts
--slug <slug> class`. Oracle SVG cached at `test-results/dot-cache/class/<slug>/
in.svg`; new oracles only via `scripts/oracle-render.sh`.

## Stop conditions

1. Files outside the task's write-set need changes and are in no other
   task's (`class-geo-builders.ts`, `class-layout-edge-labels.ts`, anything
   under `src/core/`, description/state engines).
2. Two consecutive gate failures on the same check; fix attempts cap at 2,
   investigation continues to the mechanism (`rules/diagnosis.md` artifact).
3. Any of D1–D6 would be contradicted.
4. A number can only be matched by fitting it — no upstream `file:line`.
5. A fixture rises in `shape-match-report` or a ratchet pin drops and the
   cause is not understood.
6. `camuna`/`ticuxa`/`nafiki` moves **away** from jar under D2.
7. `.80` / `ARROW_GLYPH_SIZE` would enter a measurement or a block position.
8. `class-geo-types.ts` cannot get under 500 lines without removing a
   `file:line` citation.
9. Class DOT EQUAL drops below 705 (T1/T2 are zero-movement on the DOT side).

## Push forward (journal the call)

- Glyph absolute position differs from jar by the accepted N25/N62 residual.
- Trimming doc prose in a write-set file to fit the hook; ≤ 3 lines of dead
  code in a write-set file; extra test cases.
- Description/state would benefit from the same per-line glyph — name it in
  the close-out, do not widen.
- Whether the per-line direction is muted by the edge guide (`LinkArrow#mute`,
  `abel/LinkArrow.java:55`) — read it, mirror the whole-label path, journal.

## Index

- [decisions.md](decisions.md) — D1–D6
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- Predecessor: `plans/edge-label-box-followups/` (D6, corrections, T4 spec and
  journal row), `plans/edge-label-box-backlog/batch-6/T12c-magic-arrow.md`
