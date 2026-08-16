# T12c — M4 cause D: the magic-arrow token and its triangle block

> **Split from the original single T12** on 2026-08-16, with maintainer
> approval, after T4 established M4 as three independent sub-mechanisms over
> ~13 slugs rather than the four the brief scoped. Siblings: T12a (visibility
> icon), T12b (guillemet). See `decision-journal.md`.

**Runs after T12a and T12b**, which land first in the same class file. Rebase
onto them; do not start while either is in flight. This is the largest of the
three — it spans two engines and carries two sub-cases.

## Gate — read this first

**Do not start until `.agent-notes/m4-single-line-width.md` exists.** It does.
Read it first — it is the specification, in particular "Two sub-cases found
while confirming D".

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`. **Never fit a value** — keeping whatever shrank the error
is forbidden *especially* when it shrinks.

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

A link label may carry a leading `<` or `>` "magic arrow" token. Upstream
**strips the token** and **prepends a triangle block** whose
`calculateDimension` is `(fontSize, fontSize)` — 13 at the default. This port
gets it wrong two different ways in two different engines.

## Task

Port cause **D** in both engines.

| | upstream step | origin |
|---|---|---|
| D | strip the `<`/`>` magic-arrow token, prepend a triangle block **fontSize px** wide | `StringWithArrow.java:56-91` (strip) + `SvekEdge.java:304` → `TextBlockArrow2.java:57,87` |

**The trap:** `TextBlockArrow2.calculateDimension` returns `(size, size)` where
`size = font.getSize2D()` = **13**. The `.80` factor at `TextBlockArrow2.java:65`
is **draw-only** and must not enter the measurement. Read both lines and satisfy
yourself before writing the constant — a `.80` in the box formula would be
precisely the fitted-looking value this mission forbids.

### Class engine

`class-layout-edge-labels.ts`'s magic-arrow branch already exists but uses
`ARROW_GLYPH_SIZE` = **10** where the upstream dimension is the font size,
**13**. Retire the wrong constant against its upstream citation.

### Description engine

`link-edge-attrs.ts#applyMainLabel` has **no** magic-arrow handling at all —
neither the strip nor the prepended block. Port it.

### Sub-case: the bare `>` / `<` label

Nine edges in `class/xamule-03-jeda376` carry a label that is *only* the arrow
token. Oracle is `13x13`; we emit `12x12`. Upstream takes the
`Display.isNull` arm (`SvekEdge.java:281-285`), which prepends the arrow but
never calls `addVisibilityModifier` — so there is **no `marginLabel` at all**,
giving `13 + 0`. We emit `ARROW_GLYPH_SIZE(10) + 2`: two errors partly
cancelling. Fixing only the glyph size without also dropping the margin
converts a `12x12` into a `15x15` and makes this fixture worse.

## Explicitly OUT of scope

`class/xamule-03-jeda376`'s `<size:30>to Foo >` label (oracle `91x32`, ours
`101x15`) is a **per-run font change inside a label** — the one case
`src/core/edge-label-box.ts:60-64` already documents as needing a real creole
`TextBlock`, which is the Phase 4h track and not this mission. Leave it. Record
it in the journal as named residue.

This means `xamule-03-jeda376` may clear its bare-arrow edges and **still fail
`labelSizeOk`** on that one label. That is the correct outcome, not a failure —
do not chase it, and do not remove the slug from the backlog.

## Write-set

- `src/diagrams/class/class-layout-edge-labels.ts`
- `src/diagrams/description/link-edge-attrs.ts`
- `src/core/edge-label-box.ts` — if the arrow block belongs in the shared seam
  under D1; argue it in the journal either way
- the class and description test files your change requires

**Do NOT edit any `oracle/goldens/*/label-size-backlog.json`.** The orchestrator
owns every backlog edit in this batch. Report the triage script's CLEARABLE
list.

**Do NOT touch** `src/diagrams/class/class-dot-edges.ts` or
`src/diagrams/class/class-edge-label-anchor.ts` — T11's.

## Read-set

- `.agent-notes/m4-single-line-width.md` — the mechanism and both sub-cases
- `~/git/plantuml/.../descdiagram/command/StringWithArrow.java:56-91,103-106`
  — the strip
- `~/git/plantuml/.../klimt/shape/TextBlockArrow2.java:55-90` — read
  `calculateDimension` (`:87`) AND the `.80` at `:65`, and satisfy yourself
  which one the measurement uses
- `~/git/plantuml/.../svek/SvekEdge.java:281-285` — the `Display.isNull` arm,
  for the bare-arrow sub-case
- `~/git/plantuml/.../svek/SvekEdge.java:296-305` — where the arrow block is
  prepended
- `src/diagrams/class/class-layout-edge-labels.ts:246-260` and its
  `ARROW_GLYPH_SIZE` constant
- `src/diagrams/description/link-edge-attrs.ts:185-210` — `applyMainLabel`

## Architecture decisions

**D1** — shared behaviour belongs in `src/core/edge-label-box.ts`, not
duplicated per engine. Two engines needing the same arrow handling is a strong
signal for the shared seam.
**D4** — no fixture may rise. This one is load-bearing here: the description
measurement also feeds `computeGraphSpacing` via `computeLinkDzeta`, so
`ranksep`/`nodesep` move with it.

## Slugs this should clear

Gate-confirmed by T4:

- class: `class/lojepe-37-liri985` (28/25), `class/bitove-03-sanu160` (56/53),
  `class/jakapi-64-tine258` (35/32 ×3),
  `class/class-inheritance-interface-assoc` (45/42),
  `class/dorelu-66-lixu637` (43/40)
- description: `component/berelu-46-namo819`, `usecase/funeme-74-tenu200`
  (21/16, 22/16)

`component/berelu-46-namo819` additionally carries **inline creole**
(`**missing**`) measured literally — the only such slug corpus-wide. Upstream
consumes it via `CreoleMode.SIMPLE_LINE` (`SvekEdge.java:300`;
`CreoleStripeSimpleParser.java:119,128,138` gates only BLOCK constructs, so
`**bold**` still parses to a bold run with no literal asterisks). If handling
that is more than a small extension of the existing `stripCreoleMarkup`, **stop
and log it** — it may be residue rather than this task's work.

## Acceptance criteria

- **Given** `> right arrow works` at font 13, **when** boxed, **then** width is
  **106**, not today's 101.
- **Given** a bare `>` label, **when** boxed, **then** the result is **13x13** —
  arrow block at font size, **no `marginLabel`**.
- **Given** the class engine, **then** `ARROW_GLYPH_SIZE`'s 10 is retired
  against its upstream citation, not left alongside a second constant.
- **Given** `<size:30>to Foo >`, **then** it is left alone and recorded as
  residue — `xamule-03-jeda376` stays in the backlog.
- **Given** every constant introduced, **then** each carries an upstream
  `file:line`. The `.80` does **not** appear in any measurement path.
- **Given** a new test, **when** run against the pre-fix code, **then** it fails.
- **Given** `shape-match-report`, **then** **no fixture rises**.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class component usecase
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts
```

Class DOT EQUAL must rise or hold against whatever T12b left it at; component
must rise or hold from **257**, usecase from **88**. Census: no fixture may
rise.

## Observability

Class, component and usecase DOT EQUAL; class and description backlog counts;
census delta. Journal every count.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** cite an upstream line for every number you touch.
- **Ask first:** if the inline-creole half of `berelu` turns out to need the
  real creole `TextBlock` stack rather than a small extension.
- **Never:** let the `.80` draw-only factor into a measurement.
- **Never:** fit, or edit a backlog JSON, or touch a file owned by T11 or a
  sibling.
- **Never:** chase `<size:30>to Foo >`. It is named residue.

## Commit

`fix(T12c): strip the magic-arrow token and reserve its triangle block`
