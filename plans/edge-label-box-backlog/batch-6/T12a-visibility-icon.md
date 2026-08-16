# T12a — M4 cause A+B: visibility strip + icon block

> **Split from the original single T12** on 2026-08-16, with maintainer
> approval, after T4 established M4 as three independent sub-mechanisms over
> ~13 slugs rather than the four the brief scoped. Siblings: T12b (guillemet),
> T12c (magic arrow). See `decision-journal.md`.

## Gate — read this first

**Do not start until `.agent-notes/m4-single-line-width.md` exists.** It does,
and it establishes this mechanism with 22/22 predicted values reproduced
exactly. Read it before anything else — it is the specification for this task.

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`; no citation means unfinished. **Never fit a value** —
keeping whatever shrank the error is forbidden *especially* when it shrinks.

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

Upstream does not measure the link label as written in the `.puml`. Between
source and measurement it strips a leading visibility character off line 0 and
prepends a visibility **icon block** — and this port does neither, so every
label carrying a leading `+-#~` measures short.

## Task

Port causes **A** and **B**:

| | upstream step | origin |
|---|---|---|
| A | strip a leading visibility char (`-#+~*`) off line 0 | `Display.java:415-416` via `LinkArg.build` (`LinkArg.java:71`) |
| B | prepend a visibility icon block, **+12 px** wide | `SvekEdge.java:302,363-374`; `VisibilityModifier.java:100-102` returns `(size+1, size+1)` with `size = classAttributeIconSize()` default **10** (`SkinParam.java:555`); `TextBlockUtils.withMargin(v,0,1,2,0)` (`TextBlockUtils.java:75-78`) adds 1 → **11 + 1 = 12** |

Both are **gated on `classAttributeIconSize() > 0`**
(`AbstractClassOrObjectDiagram.java:74`, reached via
`CommandLinkElement.java:320-321` and `CommandLinkStateCommon.java:202` — every
cuca engine). When the skinparam is 0, today's raw-string behaviour is correct
and must not change.

Derive the 12 by reading `VisibilityModifier.calculateDimension` and
`TextBlockUtils.withMargin` yourself. Do not take the note's arithmetic on
trust — confirm it, then cite it.

## Write-set

- `src/core/edge-label-box.ts` — the shared preprocessing seam (D1)
- `src/diagrams/class/class-layout-edge-labels.ts` — class wiring
- `tests/unit/core/edge-label-box.test.ts`
- plus the class/state engine test files your change requires

**Do NOT edit any `oracle/goldens/*/label-size-backlog.json`.** The orchestrator
owns every backlog edit in this batch, because T11 and your two sibling tasks
also clear class slugs and one-writer-per-file is not negotiable. Report which
slugs the triage script reports `CLEARABLE`; the orchestrator removes them.

**Do NOT touch** `src/diagrams/class/class-dot-edges.ts` or
`src/diagrams/class/class-edge-label-anchor.ts` — those are T11's, which may be
running concurrently.

## Read-set

- `.agent-notes/m4-single-line-width.md` — **the mechanism; start here**, in
  particular the "Controlled experiment isolating cause A/B" and "Where the
  port diverges" sections
- `~/git/plantuml/.../klimt/creole/Display.java:410-420` — `manageGuillemet`,
  where the strip happens; note A and C are the same method (C is T12b's)
- `~/git/plantuml/.../svek/SvekEdge.java:296-305,363-374` — where the icon is
  prepended and how the label block is assembled
- `~/git/plantuml/.../skin/VisibilityModifier.java:100-102` — the icon's
  `calculateDimension`
- `~/git/plantuml/.../klimt/TextBlockUtils.java:75-78` — `withMargin`
- `~/git/plantuml/.../skin/SkinParam.java:555` — the default 10
- `src/core/edge-label-box.ts` — the whole file
- `src/diagrams/class/class-layout-edge-labels.ts:246-260` — `computeRelLabelAttrs`

## Architecture decisions

**D1** — the preprocessing belongs in `src/core/edge-label-box.ts`, the single
home for the box formula, not duplicated per engine. The state engine
(`state/susena-02-gusa448`) reaches it through that shared module.
**D4** — no fixture may rise.

Both locked.

## Slugs this should clear

Gate-confirmed by T4, not inferred: `class/canuti-20-jotu614`,
`class/gikipi-69-pepo172`, `class/gixesa-28-feri809`,
`state/susena-02-gusa448`.

`class/bugeli-63-mixa543` is the **regression guard** — it is `gixesa` plus
`skinparam classAttributeIconSize 0`, and it PASSES today. If it fails after
your change, the gate on the skinparam is wrong.

## Acceptance criteria

- **Given** `+parameter` at font 13 with `classAttributeIconSize` defaulted,
  **when** boxed, **then** width is **73** (oracle), not today's 68.
- **Given** `skinparam classAttributeIconSize 0`, **when** boxed, **then** the
  raw-string behaviour is unchanged and `bugeli-63-mixa543` still passes.
- **Given** a label with no leading visibility char, **then** neither the strip
  nor the icon applies and its width is unchanged.
- **Given** every constant introduced, **then** each carries an upstream
  `file:line` in a comment.
- **Given** a new test, **when** run against the pre-fix code, **then** it fails.
- **Given** `shape-match-report`, **then** **no fixture rises**.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class state
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts
```

Baselines to beat / hold: DOT EQUAL class **680**, state **259** (both must
rise or hold, never fall). Census `TOTAL doc-size-exact: 779/1074`,
`TOTAL matched-shapes: 25975` — no fixture may rise.

## Observability

Class and state DOT EQUAL; the triage script's CLEARABLE list; census delta.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** cite an upstream line for every number you touch.
- **Ask first:** if the fix appears to need a change in the measurer, the
  creole atom scanner, or font resolution beyond edge labels.
- **Never:** fit. A constant that closes the delta with no upstream origin is a
  stop condition, not a fix.
- **Never:** edit a backlog JSON, or a file owned by T11 or a sibling task.
- **Never:** treat "the deltas are only a few pixels" as licence to fudge one.

## Commit

`fix(T12a): strip the visibility char and reserve its icon block`
