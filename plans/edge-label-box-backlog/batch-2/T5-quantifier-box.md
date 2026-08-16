# T5 — `computeQuantifierBox` in the shared module

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body and
the constructor that built its inputs — not a filename, not a summary. Every
constant carries its upstream `file:line`; no citation means unfinished.
**Never fit a value.**

Pure SVG: `src/` has no DOM, no async, no Node built-ins, no `Date.now()`.
Tests are vitest.

Upstream sizes an edge's **quantifier** (multiplicity) and **role** labels
differently from its main label, and this port does not distinguish them:

| | upstream | this port |
|---|---|---|
| font | `cardinalityFont` — its own style cascade | the arrow label font |
| line breaks | `Display.getWithNewlines` splits `\n` | single `measurer.measure` call |
| shield / margin | **none** — raw `calculateDimension` | (n/a) |

`camuna-58-veca254` shows both halves: oracle heads `23x10` and `41x20`, ours
`31x13` and `71x13`. The `41x20` is two lines at the fixture's overridden
cardinality font size of 10.

This is a **known, deliberately deferred** defect: `class-layout-edge-labels.ts:33-38`
records the font mismatch and says it was left alone because "the DOT-gate
comparator never numeric-checks `taillabel`/`headlabel` table dims". SI22's D7
changed that.

## Task

Add `computeQuantifierBox` to `src/core/edge-label-box.ts` — the box formula for
quantifier and role labels, at the cardinality font, with `\n` splitting and
**no** shield and **no** `marginLabel`.

Read `SvekEdge.java:447-467` and confirm the absence of the shield for yourself
before writing it: the label arm at `:440-445` adds `2 * labelShield`, and the
quantifier arms deliberately do not. That asymmetry is the point of this
function existing separately from `computeReservedLabelBox`.

The existing label arm stays exactly as it is. Do not refactor it.

## Write-set

- `src/core/edge-label-box.ts`
- `tests/unit/core/edge-label-box.test.ts`

Nothing else — no engine wiring in this task (that is T6 and T7).

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:328-352`
  — `startTailText`/`endHeadText`/`startTailRoleText`/`endHeadRoleText`
  construction: `Display.getWithNewlines(pragma, link.getQuantifier1()).create(cardinalityFont, CENTER, skinParam)`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:447-467`
  — emission: `appendTable(sb, startTailText.calculateDimension(stringBounder), ...)`, raw
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:500-510`
  — `appendTable`'s `(int)` truncation
- `src/core/edge-label-box.ts` — the whole file, 105 lines
- `src/diagrams/class/class-layout-edge-labels.ts:42-100` —
  `splitEdgeLabelLines`, the existing `Display.getWithNewlines` port; reuse it
  rather than writing a second splitter
- `decisions.md#d1--one-shared-box-module-not-three-engine-local-formulas`
- `decisions.md#d3--resolve-the-cardinality-font-through-the-existing-style-cascade`
- `decision-journal.md` — T1's entry, for the resolved cardinality font's field names

## Architecture decisions

**D1** — this file is the single home for all three upstream arms.
**D3** — the font comes from T1's cascade; do not add a constant.

Both locked. If either conflicts with what the Java says, stop and log it.

## Interface contract

Consumed by T6 (class, object) and T7 (description):

```ts
export function computeQuantifierBox(
  text: string,
  font: FontSpec,          // the CARDINALITY font, from T1's cascade
  measurer: StringMeasurer,
): { reservedWidth: number; reservedHeight: number; lines: readonly string[] };
```

`reservedWidth`/`reservedHeight` are the values that go straight into the
`<TABLE FIXEDSIZE="TRUE" WIDTH HEIGHT>` reservation — already truncated, with
no shield and no margin applied.

## Acceptance criteria

- **Given** `"customer\n1"` at cardinality font size 10, **when** boxed, **then**
  height is two lines' worth and width is the max over lines — matching
  `camuna-58-veca254`'s oracle `41x20`.
- **Given** a single-line quantifier, **when** boxed, **then** neither
  `labelShield` nor `2 * marginLabel` is added, and the result matches the
  oracle for a single-line case you verify from the corpus.
- **Given** a fractional measured width, **when** boxed, **then** it truncates
  toward zero, per `appendTable`'s `(int)` cast — not rounds.
- **Given** the existing label-arm tests, **when** the suite runs, **then** all
  pass unchanged.
- **Given** the new function, **when** `shape-match-report` runs, **then**
  **zero fixtures move** — it has no caller yet.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Plus the zero-movement census. Journal the numbers.

## Observability

N/A — no new observable operations. The census is the signal.

## Rollback

**Reversible** — one commit, additive, no caller.

## Boundaries

- **Always:** cite `SvekEdge.java:328-340` for the construction and `:447-467`
  for the raw-dimension emission, in the function's doc comment.
- **Always:** reuse `splitEdgeLabelLines` for `\n` handling.
- **Never:** change `computeReservedLabelBox` or its behavior. State's DOT
  output must stay byte-identical through this task.
- **Never:** wire a caller here.
- **Never:** derive the cardinality font size from a literal. If T1's cascade
  cannot supply it, stop — that is a contradiction of D3.

## Commit

`feat(T5): computeQuantifierBox — cardinality-font tail/head reservation`
