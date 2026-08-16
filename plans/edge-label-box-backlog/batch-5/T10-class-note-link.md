# T10 — Class note-on-link

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.**

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

`lozego-15-coci435` reserves `33x15` where the oracle reserves `137x135`. Its
source is a `note on link` whose text carries a sprite:

```
Order --{ OrderItem:Items
note on link  #aqua/aliceblue
<$test>Note on rel
end note
```

The class engine emits the bare label. Upstream merges the note image and the
label into one block, adds `2 * labelShield`, and truncates
(`SvekEdge.java:302-325, 352-356, 440-445`).

T8 added `computeMergedLabelBox`. This task wires it into the class engine —
which the object engine shares.

> The 2026-08-15 backlog survey recorded `lozego` as "a multi-line or creole
> label measured as ONE line". That reading is **wrong**: it is a note-on-link
> merged box. The shape survey was a first pass, and this fixture is the reason
> the brief says to correct it at close-out. Do not plan against the survey's
> characterization.

## Task

1. Route the class engine's note-on-link label box through
   `computeMergedLabelBox`, sourcing the note's dimension from the existing note
   sizer — `EntityImageNoteLink` is a decorated image with padding, a border,
   and here a sprite, not bare text.
2. Determine whether the `--{` link type's middle decor makes `labelShield` 7 or
   0 for this fixture, from `LinkMiddleDecor`, and journal which and why.
3. Remove from the class backlog every slug whose `labelSizeOk` now passes.
   Check the object backlog too — the engines share this path.

## Write-set

- `src/diagrams/class/class-layout-edge-labels.ts`
- `oracle/goldens/class/label-size-backlog.json`

If object slugs also clear, the object backlog edit is yours — add it to the
write-set and journal the addition. If a note-dimension source is not reachable
from this file, **stop and log it** rather than inlining a second note sizer.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:302-326`
  — the merge, note `Position`, `divideLabelWidthByTwo`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:352-356`
  — `labelShield` 7 vs 0 on `LinkMiddleDecor.NONE`
- `LinkMiddleDecor` — what `--{` resolves to; grep `~/git/plantuml/src/main/java/net/`
- `EntityImageNoteLink` — the note operand's real composition
- `src/core/edge-label-box.ts` — T8's `computeMergedLabelBox` contract
- `src/diagrams/class/class-layout-edge-labels.ts:260-331` — `edgeLabelAttrs`,
  `withLabelMargin`, `withLayoutBox`, and the `CONSTRAINT_SPOT` discriminator
  (an empty `label` marks the arm that never builds a `labelText` upstream —
  the merged box must not reach it)
- `test-results/dot-cache/class/lozego-15-coci435/in.puml`
- `decisions.md#d2--model-mergelrmergetb-as-dimension-arithmetic`,
  `decisions.md#d4--backlog-shrink-is-the-bar-no-fixture-may-rise`
- `decision-journal.md` — T8's final signature, T6's changes to this same file

## Architecture decisions

**D2** — consume T8's arithmetic; note dimension from the note sizer.
**D4** — no fixture may rise; ratchets only toward jar, measurement journalled.

## Acceptance criteria

- **Given** `lozego-15-coci435`, **when** the DOT gate runs, **then** its label
  box matches the oracle's `137x135` and it leaves the class backlog.
- **Given** the note text carries a sprite, **when** the box is computed,
  **then** the note dimension comes from the note sizer, not a string measure —
  verifiable from the code path, not just the number.
- **Given** the `--{` link type, **when** T10 lands, **then** the journal states
  whether `labelShield` was 7 or 0 and cites the `LinkMiddleDecor` reason.
- **Given** the `linkConstraint` spot (empty `label`), **when** the box is
  computed, **then** it is untouched — that arm never builds a `labelText`
  upstream.
- **Given** `shape-match-report`, **then** **no fixture rises**; class SVG
  ratchet pins hold or move toward jar, measurement journalled.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class
npx jiti scripts/dot-sync-report.ts object
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts
```

Class DOT EQUAL at or above 680/710. Journal every count.

## Observability

Class and object DOT EQUAL, both backlog counts, ratchet status, census delta.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** verify a slug passes before removing it.
- **Always:** journal the `labelShield` determination with its Java citation.
- **Ask first:** if the note sizer cannot be reached from this file.
- **Never:** touch `src/core/edge-label-box.ts` or any state-engine file (T9 is
  editing those in parallel with you).
- **Never:** let the merged box reach the `CONSTRAINT_SPOT` arm.
- **Never:** add a slug to any backlog.

## Commit

`fix(T10): merged note-on-link box in the class engine`
