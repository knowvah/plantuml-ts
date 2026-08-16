# T9 — State note-on-link

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.**

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

The state engine is the reference implementation for edge-label sizing — it is
where `computeReservedLabelBox` was born before being relocated to
`src/core/edge-label-box.ts`. But it does not model the **merged** note-on-link
box, so all four of its note-on-link fixtures reserve a box a few pixels off
(e.g. `fotigo-12-gufu949`: oracle `104x33`, ours `105x30`).

T8 added `computeMergedLabelBox` — the `mergeLR`/`mergeTB` arithmetic plus
`labelShield` and the half-width rule. This task wires it into both state paths.

Nine slugs sit in `oracle/goldens/state/label-size-backlog.json` (ten pinned
entries — `tumaba` and `xupefu` are two-graph fixtures). `xupefu-98-roni234`
has `svek-1` clean and `svek-2` off, which is why the backlog contract is
per-file SUBSET plus per-fixture UNION-exact rather than exact.

## Task

1. Route the note-on-link label box through `computeMergedLabelBox` in both
   `state-dot-graph.ts` and `state-composite-edge-label.ts`.
2. **Remove the `labelSizeOk` exclusion** from
   `tests/unit/state/state-note-link-dot.test.ts#expectAllPassesEqual`. It was
   narrowed by SI22 with the reason on the helper: presence and topology were
   right, size was not. You are fixing size. The `sizeConformantOk` exclusion
   is a separate, tolerant check — leave that one alone.
3. Remove from the state backlog every slug whose `labelSizeOk` now passes.

## Write-set

- `src/diagrams/state/state-dot-graph.ts`
- `src/diagrams/state/state-composite-edge-label.ts`
- `tests/unit/state/state-note-link-dot.test.ts`
- `oracle/goldens/state/label-size-backlog.json`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:302-326`
  — the merge and `divideLabelWidthByTwo`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:352-356,440-445`
  — shield and emission
- `src/core/edge-label-box.ts` — T8's `computeMergedLabelBox` contract
- `src/diagrams/state/state-dot-graph.ts:161-240` — `edgeLabelAttrs` and its callers
- `src/diagrams/state/state-composite-edge-label.ts:60-125`
- `tests/unit/state/state-note-link-dot.test.ts` — `expectAllPassesEqual` and
  the reason comment on the helper
- `oracle/goldens/state/label-size-backlog.json` — the slugs and the `_doc`
  contract
- `tests/oracle/dot-parity-backlogs.ts` — the SUBSET + UNION-exact semantics
- `decisions.md#d2--model-mergelrmergetb-as-dimension-arithmetic`,
  `decisions.md#d4--backlog-shrink-is-the-bar-no-fixture-may-rise`
- `decision-journal.md` — T8's final signature

## Architecture decisions

**D2** — the merge arithmetic is T8's; consume it, do not re-derive it here.
**D4** — no fixture may rise; ratchets only toward jar, measurement journalled.

## Acceptance criteria

- **Given** `fotigo-12-gufu949`, **when** the DOT gate runs, **then**
  `labelSizeOk` passes and it leaves the state backlog.
- **Given** `state-note-link-dot.test.ts`, **when** T9 lands, **then**
  `expectAllPassesEqual` no longer excludes `labelSizeOk`, and the suite passes.
- **Given** `xupefu-98-roni234`'s two graphs, **when** the parity suite runs,
  **then** the per-fixture UNION-exact clause is satisfied — do not remove a
  two-graph entry on the strength of one graph.
- **Given** the state SVG ratchet (59 pins), **when** it runs, **then** pins
  hold, or move toward jar with the measurement in the journal.
- **Given** `shape-match-report`, **then** **no fixture rises**, before/after
  journalled.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts state
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts
```

State DOT EQUAL must be at or above the SI22 baseline of 259/268. Journal every
count.

## Observability

State DOT EQUAL, state backlog count, ratchet pin status, census delta.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** re-include `labelSizeOk` in the state note-link test. A green
  suite that still excludes it is not a pass.
- **Always:** verify a slug passes before removing it.
- **Never:** widen the test beyond that one check — `sizeConformantOk` stays
  excluded, for the reason already on the helper.
- **Never:** touch `src/core/edge-label-box.ts` or any class-engine file (T10
  is editing those in parallel with you).
- **Never:** add a slug to any backlog.

## Commit

`fix(T9): merged note-on-link box in the state engine`
