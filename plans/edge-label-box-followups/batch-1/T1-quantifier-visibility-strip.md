# T1 — Quantifier labels take the visibility strip, never the icon

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.** Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are
vitest.

SI23's T5 added `computeQuantifierBox` (`src/core/edge-label-box.ts:314`) —
`\n` split, max line width, `Math.floor`, no shield/margin — and T12a added
`applyVisibilityIcon` for the **main** label. `class/focaci-80-suzu938`'s
headlabel `~* initiators` still measures 61x13 against the oracle's 53x13:
the quantifier arm applies neither the strip nor the icon. Upstream applies
the **strip only**: quantifiers are built by `Display.getWithNewlines(...)
.create(cardinalityFont, ...)` (`svek/SvekEdge.java:329-351`), whose per-line
visibility strip lives in `Display` (`klimt/creole/Display.java:413-419`);
`addVisibilityModifier` (`SvekEdge.java:302, 363-`) — the icon block — is
called on the main label only. Arithmetic: 61.1 → strip `~` → 53.46 → **53**.

## Task

1. In `computeQuantifierBox`, strip the leading visibility character per line
   exactly as `Display`'s strip does (reuse whatever T12a's `applyVisibilityIcon`
   uses to detect/strip the char, but add **no** icon term). Cite the Java line
   that proves the strip applies to `Display.create` output.
2. Regression-test the arithmetic (`~* initiators` at 13 → 53) and that a
   quantifier with no visibility char is unchanged.
3. Remove `focaci-80-suzu938` from the class backlog once `labelSizeOk` passes.

## Write-set

- `src/core/edge-label-box.ts`
- `tests/unit/core/edge-label-box.test.ts`
- `oracle/goldens/class/label-size-backlog.json`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:302,329-351,363-390`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java:405-425`
- `src/core/edge-label-box.ts:108-205` (`applyVisibilityIcon`), `:286-333` (`computeQuantifierBox`)
- `plans/edge-label-box-backlog/batch-6/T12a-visibility-icon.md` — the strip's citations
- `plans/edge-label-box-backlog/batch-2/T5-quantifier-box.md` — the contract
- `decisions.md#quantifier-visibility-strip-focaci`
- `test-results/dot-cache/class/focaci-80-suzu938/in.puml`

## Architecture decisions

Inherited SI23 D1/D4: shared arithmetic lives here; engines consume. No engine
file changes — both class (`class-layout-edge-labels.ts:375,384`) and
description (`link-edge-attrs.ts:370,375`) already call this function.

## Interface contract

`computeQuantifierBox(text, font, measurer): QuantifierBox` — signature
unchanged; only the measured width may change for texts whose first line
starts with a visibility char.

## Acceptance criteria

- **Given** `~* initiators` at the cardinality font (13), **when**
  `computeQuantifierBox` runs, **then** width is `Math.floor(measure("* initiators"))` = 53 with no icon term.
- **Given** `focaci-80-suzu938`, **when** the DOT gate runs, **then**
  `labelSizeOk` passes (headlabel 53x13) and the slug leaves the class backlog.
- **Given** every other class/state/description/object fixture, **then** DOT
  EQUAL is non-decreasing and `shape-match-report` has no fixture rising —
  journal before/after counts.

## Quality bar

Four gates; then `npx jiti scripts/dot-sync-report.ts class`,
`npx jiti scripts/dot-sync-report.ts description`,
`npx jiti scripts/shape-match-report.ts`, `npx jiti scripts/label-box-triage.ts`.

## Observability

Class/description DOT EQUAL, class backlog count (11 → 10), census delta.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** add an icon term to the quantifier arm.
- **Never** touch engine files or any other backlog.
- **Stop** if the strip needs a constant with no `file:line`.

## Commit

`fix(T1): quantifier boxes strip the visibility char without the icon`
