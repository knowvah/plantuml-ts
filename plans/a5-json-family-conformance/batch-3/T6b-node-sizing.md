# T6b — port `TextBlockJson`'s node sizing

**Added mid-mission, 2026-08-09, on T5's evidence.** The brief did not plan
this task; T5's go/no-go proved it is the mission's real dimension lever and
that Batch 3 as written cannot reach the exit bar without it. See
`adr1-gonogo.md` and decision-journal #11.

**Depends on T6.** Writes the same file as T7, so it runs before it.

## Context

After T6 re-mirrored the graph (ADR-1), document dimensions are still wrong on
**all 92 fixtures** — mean error 101.83, and **zero** fixtures exact. T5
established why: several fixtures' dimensions are byte-identical under both the
old `rankDir: 'LR'` graph and the mirrored one. A fixture whose size does not
move when the entire graph topology changes is not limited by topology. It is
limited by the size of the boxes handed to the layout.

This is the json family's analogue of **S1L** for description: a leaf-sizing
port, and the same class of defect that mission spent eight sub-missions on.

## Task

Port `jsondiagram/TextBlockJson.java`'s dimension calculation into
`measureNode`/`buildRows`, replacing this port's approximations.

The divergences are already identified — do not re-derive them, but **do**
verify each against the Java before changing it:

| # | upstream (`TextBlockJson.java`) | this port (`layout.ts`) |
|---|---|---|
| 1 | `getWidthColA` starts at **0** and takes `max(b1.width)`; no per-column floor | `maxKeyWidth` starts at `MIN_COL_WIDTH = 30` |
| 2 | same for `getWidthColB`, and it skips lines whose `b2 == null` | `maxValueWidth` also floors at 30, no null-skip concept |
| 3 | width = `colA + colB`; padding lives INSIDE the `b1`/`b2` text blocks | adds `2 * H_PAD` (16) per column on top of the measured width |
| 4 | `getHeightOfRow` = `max(b1.height, b2.height)` | `max(ROW_HEIGHT_MIN = 20, keyHeight + V_PAD)` — a 20px floor upstream does not have, and it ignores the value block's height |
| 5 | `getTotalHeight` = plain sum of row heights, `MIN_HEIGHT (15)` only when the sum is **0** | starts at `V_PAD`, adds `V_PAD` after the last row, then `max(MIN_HEIGHT, …)` |
| 6 | `MIN_WIDTH = 30` exists but is NOT applied per column — find where it IS applied | absent as a node-level concept |

Worked example to anchor the port — `cazuru-97-jala040`, whose entire source is
`{}`:

```
jar:  node rect 10 x 18, document 32 x 40
ours: document 76 x 31
```

An empty object has no lines at all, so upstream's `colA + colB` is `0 + 0` and
`getTotalHeight` returns `MIN_HEIGHT`. Ours produces `30 + 30 + 2*2*H_PAD`.
Whatever draws the jar's 10×18 box is the thing to find — it is not
`MIN_WIDTH = 30`.

## Read-set

- `~/git/plantuml/.../jsondiagram/TextBlockJson.java` — the whole file; the
  sizing surface is `calculateDimensionSlow`, `getWidthColA`, `getWidthColB`,
  `getTotalHeight`, `getAllHeights`, and the inner `Line#getHeightOfRow`.
- Whatever builds `b1`/`b2` (the per-cell `TextBlock`s) — the padding this port
  applies as `H_PAD`/`V_PAD` lives there, and the port must match its source,
  not re-add its own.
- `src/diagrams/json/layout.ts` — `buildRows` (88), `measureNode` (151).
- `plans/a5-json-family-conformance/adr1-gonogo.md` — why this task exists.
- `planning/sizer-renderer-parity.md` and `planning/usymbol-composition.md` —
  both carry a "reuse for another engine" section. **Read them before
  starting**; S1L's recurring lesson was that a feature reaches the RENDERER
  while the SIZER never calls it, and that trap is engine-independent.

## Write-set

- `src/diagrams/json/layout.ts` (`buildRows`, `measureNode` and their constants)
- `src/diagrams/json/json-layout-prep.ts` — only if row construction must move
- `tests/unit/json/**`
- `oracle/goldens/svg-{json,yaml,hcl}/` — pin any fixture reaching zero diffs

Do **not** touch `renderer.ts`: if a sizing change makes the drawing wrong, the
drawing is reading sizes it should be given. Log it for T8.

## Architecture decisions (locked)

- **ADR-2:** Smetana IS the target for this family. A residual gap must be
  diagnosed, not excused by graphviz-version differences.
- **CLAUDE.md:** never ship a fitted constant. Every number comes from the Java
  or a jar-verified measurement, cited in a comment. `MIN_COL_WIDTH = 30`,
  `H_PAD = 8`, `ROW_HEIGHT_MIN = 20` are the current *unsourced* constants —
  each must end up either traced to upstream or deleted.

## Acceptance criteria

1. **Given** `{}`, **when** laid out, **then** the node's dimensions match the
   jar's 10×18 and the document's match 32×40.
2. **Given** the 92-fixture corpus, **when** re-measured, **then** mean
   document-dimension error is substantially below T6's 101.83 — state the
   number.
3. **Given** the corpus, **then** the count of fixtures with EXACT dimensions
   rises above zero — that is the metric this task exists to move.
4. **Given** each constant removed or changed, **then** a comment cites the
   upstream `file:line` it came from.
5. **Given** yaml and hcl, **then** both are re-measured and reported
   separately; they share `layoutJson` and move with it.
6. **Given** the five other type ratchets, **then** none regresses.

## Observability requirements

N/A — layout geometry, no runtime operations.

## Rollback

**Reversible.** Layout-internal; revert the commit. Any golden pinned during
the task reverts with it.

## Quality bar

- Four gates green, exit codes captured directly — never pipe a gate.
- The complexity hook now blocks only what an edit introduces or worsens, so
  `layoutJson`'s pre-existing 120 NLOC / 29 CCN is not in your way — but do not
  make it worse. Put new logic in new functions.
- 90/90/90 coverage holds.

## Boundaries

- **Always:** report the dimension-error number before and after.
- **Never:** widen `TOLERANCES` in `compare.ts`.
- **Never:** run `git commit` or any state-mutating git command.
