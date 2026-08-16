# T6 — Class + object quantifier wiring

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value** — keeping whatever shrank the error is forbidden especially when it
shrinks.

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

T5 added `computeQuantifierBox` to `src/core/edge-label-box.ts` — the
cardinality-font, `\n`-splitting, no-shield box for multiplicity and role
labels. It has no caller. This task makes the **class engine** (which the
object engine shares) call it.

Today `computeMultiplicityAttrs` (`class-layout-edge-labels.ts:270-287`)
measures both ends with the arrow label font in a single `measurer.measure`
call, producing `31x13` where `camuna-58-veca254`'s oracle has `23x10`.

## Task

1. Route `computeMultiplicityAttrs`'s tail and head boxes through
   `computeQuantifierBox`, at the cardinality font T1's cascade resolves.
2. Do the same for **role** labels if this engine emits them (upstream has
   `startTailRoleText`/`endHeadRoleText`, `SvekEdge.java:342-352`) — check
   whether the port has that path at all, and journal the answer either way.
3. Retire the duplicated `CARDINALITY_FONT_SIZE = 13`. It exists twice: at
   `class-layout-edge-labels.ts:40` and as an independent same-value constant
   in `src/core/graph-layout.ts`. One owner after this task.
4. **Correct the falsified comment** at `class-layout-edge-labels.ts:25`, which
   claims "no diagram in the corpus overrides `cardinality` specifically."
   `camuna-58-veca254` does, in a `<style>` block. Name it as the
   counter-example. Also correct `:33-38`, whose "NOT-fixed-this-iteration"
   deferral this task closes.
5. Remove every class and object slug from its backlog whose `labelSizeOk` now
   actually passes — and only those.

## Write-set

- `src/diagrams/class/class-layout-edge-labels.ts`
- `src/core/graph-layout.ts` — the duplicated constant only
- `oracle/goldens/class/label-size-backlog.json`
- `oracle/goldens/object/label-size-backlog.json`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:328-352`
  — quantifier and role construction
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:447-467`
  — emission, including the `else if` role fallbacks
- `src/diagrams/class/class-layout-edge-labels.ts:20-45` (constants, the two
  stale comments) and `:260-331` (`computeMultiplicityAttrs`, `edgeLabelAttrs`,
  `withLayoutBox`)
- `src/core/edge-label-box.ts` — T5's `computeQuantifierBox` contract
- `src/core/graph-layout.ts` — grep `CARDINALITY_FONT_SIZE`
- `test-results/dot-cache/class/camuna-58-veca254/in.puml` — the fixture
- `decisions.md#d3--resolve-the-cardinality-font-through-the-existing-style-cascade`,
  `decisions.md#d4--backlog-shrink-is-the-bar-no-fixture-may-rise`
- `oracle/goldens/class/label-size-backlog.json` — the `_doc` field states the
  shrink-only contract
- `decision-journal.md` — T1's field names, T5's contract

## Architecture decisions

**D3** — cardinality font from the cascade, not a constant.
**D4** — backlog shrink is the bar; **no fixture may rise** in
`shape-match-report`; ratchets re-pinned only toward jar, with the measurement.

## Acceptance criteria

- **Given** `camuna-58-veca254`, **when** the DOT gate runs, **then**
  `labelSizeOk` passes and the slug leaves the class backlog.
- **Given** `CARDINALITY_FONT_SIZE`, **when** T6 lands, **then** it is defined
  in exactly one place.
- **Given** `class-layout-edge-labels.ts:25`, **when** T6 lands, **then** the
  comment names `camuna-58-veca254` as a corpus diagram that *does* override
  `cardinality`.
- **Given** `shape-match-report`, **when** it runs, **then** **no fixture
  rises** versus the pre-task census, and the before/after numbers are in the
  journal.
- **Given** the class and object backlogs, **when** T6 lands, **then** every
  removed slug demonstrably passes `labelSizeOk` and no slug was added.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class
npx jiti scripts/dot-sync-report.ts object
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts        # T2's instrument
```

Journal every count. The class SVG ratchet (292+ pins) must hold or move toward
jar.

## Observability

The DOT EQUAL counts and the census are this task's signal. Record class and
object EQUAL before and after, plus the backlog counts.

## Rollback

**Reversible** — one commit. Backlog and ratchet edits revert with it; no
external state.

## Boundaries

- **Always:** verify a slug passes before removing it from a backlog.
- **Always:** journal whether the role-label path exists in this port.
- **Ask first:** if a ratchet pin breaks and you cannot show the movement is
  toward jar.
- **Never:** add a slug to any backlog — that is a stop condition.
- **Never:** touch `src/core/edge-label-box.ts` (T5 owns it) or the description
  engine (T7 owns it, in parallel with you).
- **Never:** change `computeReservedLabelBox`'s label arm to make a number fit.

## Commit

`fix(T6): size class/object quantifier boxes at the cardinality font`
