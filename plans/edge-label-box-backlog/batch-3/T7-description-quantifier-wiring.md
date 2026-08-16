# T7 — Description quantifier wiring

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.**

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

The **description** engine serves component and usecase diagrams. It already
uses the shared `computeReservedLabelBox` for the main edge label
(`link-edge-attrs.ts:198`) — a previous mission wired that. What it does not
do is size quantifier and role labels at the cardinality font with `\n`
splitting, which is the same defect T6 is fixing on the class side.

T5 added `computeQuantifierBox` to `src/core/edge-label-box.ts`. Ten
description slugs sit in `oracle/goldens/description/label-size-backlog.json`.

**Not all ten are M1.** Some are M4 (few-px single-line width deltas — e.g.
`berelu-46-namo819`), which T4 is diagnosing and T12 may fix. Fix the M1 ones;
leave the rest in the backlog with a journal line saying which mechanism they
belong to. Removing a slug you did not fix is worse than leaving it.

## Task

1. Route the description engine's tail/head (and role, if present) boxes
   through `computeQuantifierBox` at the resolved cardinality font.
2. Remove from the description backlog every slug whose `labelSizeOk` now
   actually passes — and only those.
3. Journal, per remaining slug, which mechanism it belongs to.

## Write-set

- `src/diagrams/description/link-edge-attrs.ts`
- `oracle/goldens/description/label-size-backlog.json`

If the cardinality font needs threading through a call site outside this file,
**stop and log it** — that is a write-set escape, and the call path may be
shared with the class engine T6 is editing in parallel.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:328-352`
  — quantifier and role construction at `cardinalityFont`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:447-467`
  — emission, raw `calculateDimension`, no shield
- `src/diagrams/description/link-edge-attrs.ts` — the whole file, 293 lines
- `src/core/edge-label-box.ts` — T5's `computeQuantifierBox` contract
- `oracle/goldens/description/label-size-backlog.json` — the ten slugs and the
  `_doc` contract
- `decisions.md#d3--resolve-the-cardinality-font-through-the-existing-style-cascade`,
  `decisions.md#d4--backlog-shrink-is-the-bar-no-fixture-may-rise`
- `decision-journal.md` — T1's field names, T5's contract; and T4's note if it
  has landed, which tells you which slugs are M4 rather than M1

## Architecture decisions

**D3** — cardinality font from T1's cascade, not a constant.
**D4** — backlog shrink is the bar; no fixture may rise; ratchets only toward jar.

## Acceptance criteria

- **Given** a description slug whose only defect is an M1 quantifier box,
  **when** the DOT gate runs, **then** `labelSizeOk` passes and it leaves the
  backlog.
- **Given** a slug that is M4 rather than M1, **when** T7 lands, **then** it
  remains in the backlog with its mechanism named in the journal.
- **Given** `shape-match-report`, **when** it runs, **then** **no fixture
  rises**, with before/after numbers journalled.
- **Given** component and usecase DOT EQUAL, **when** measured, **then** both
  are at or above the SI22 baseline (257/263 and 88/93).

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts component
npx jiti scripts/dot-sync-report.ts usecase
npx jiti scripts/shape-match-report.ts
```

Journal every count.

## Observability

Component and usecase EQUAL counts, description backlog count, census delta.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** verify a slug passes before removing it.
- **Never:** touch `src/core/edge-label-box.ts` (T5's) or any class-engine file
  (T6 is editing those in parallel with you).
- **Never:** add a slug to any backlog.
- **Never:** remove a slug because it "looks like" it should have been fixed.

## Commit

`fix(T7): size description quantifier boxes at the cardinality font`
