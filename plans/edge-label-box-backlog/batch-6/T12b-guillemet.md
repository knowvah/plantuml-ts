# T12b — M4 cause C: `<<x>>` → `«x»` in class link labels

> **Split from the original single T12** on 2026-08-16, with maintainer
> approval, after T4 established M4 as three independent sub-mechanisms over
> ~13 slugs rather than the four the brief scoped. Siblings: T12a (visibility
> icon), T12c (magic arrow). See `decision-journal.md`.

**Runs after T12a**, which lands first in the same file
(`src/diagrams/class/class-layout-edge-labels.ts`). Rebase onto it; do not
start while it is in flight.

## Gate — read this first

**Do not start until `.agent-notes/m4-single-line-width.md` exists.** It does,
and it establishes this mechanism with exact reproduced values. Read it first —
it is the specification for this task.

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`. **Never fit a value.**

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

Upstream rewrites `<<x>>` to the single-glyph guillemet form `«x»` **before**
measuring the label. This port measures the four ASCII angle brackets
literally, so every `<<stereotype>>` link label comes out exactly 16 px too
wide: `2·w('<') + 2·w('>') − w('«') − w('»')`.

## Task

Port cause **C**: apply upstream's guillemet rewrite to class link labels
before measurement.

| | upstream step | origin |
|---|---|---|
| C | `<<x>>` → `«x»` | `Display.java:418` → `Guillemet.GUILLEMET.manageGuillemet`, `Guillemet.java:78-88` |

Two details that a naive `replace('<<','«')` gets wrong — read
`Guillemet.java:76-88` and confirm both for yourself:

1. `GUILLEMET_PATTERN` (`Guillemet.java:76`) matches **anywhere in the
   string**, not only at the start.
2. It eats **one optional space inside the brackets**: `<< a >>` → `«a»`.

## Scope — class engine ONLY

The description engine already gets this right by a **different route**: its
parser lifts a post-colon `<<x>>` into `link.stereotype` and
`link-edge-attrs.ts:170` re-wraps it as `«x»`. `usecase/cevuji-49-bile305`
(`GET ..> author: <<includes>>`) passes today at 64 on both sides.

**Do not touch the description engine in this task.** Its route cannot
represent a *mid-string* `<<x>>`, which is a real and separate gap — if you
confirm that gap, record it in the journal as residue with its mechanism
named. Do not fix it here; that widens a task that was split precisely to stay
narrow.

## Write-set

- `src/diagrams/class/class-layout-edge-labels.ts`
- the class engine test file(s) your change requires
- `src/core/edge-label-box.ts` **only if** the rewrite genuinely belongs in the
  shared seam under D1 — argue it in the journal either way

**Do NOT edit any `oracle/goldens/*/label-size-backlog.json`.** The orchestrator
owns every backlog edit in this batch. Report which slugs the triage script
reports `CLEARABLE`.

**Do NOT touch** `src/diagrams/class/class-dot-edges.ts` or
`src/diagrams/class/class-edge-label-anchor.ts` — T11's, possibly concurrent.
**Do NOT touch** `src/diagrams/description/link-edge-attrs.ts` — T12c's.

## Read-set

- `.agent-notes/m4-single-line-width.md` — the mechanism, and the
  "description engine already gets C right by a different route" paragraph
- `~/git/plantuml/.../klimt/creole/Display.java:410-420` — `manageGuillemet`;
  note A (T12a's) and C are the same method
- `~/git/plantuml/.../Guillemet.java:70-90` — the pattern and the rewrite
- `src/diagrams/class/class-layout-edge-labels.ts:246-260` — `computeRelLabelAttrs`
- `src/diagrams/description/link-edge-attrs.ts:165-175` — the parser route,
  **for contrast only**; do not edit

## Architecture decisions

**D1** — if the rewrite is shared behaviour it belongs in
`src/core/edge-label-box.ts`; if it is genuinely class-parser-specific it does
not. Decide by reading where upstream puts it (`Display`, i.e. shared) and
justify in the journal.
**D4** — no fixture may rise.

## Slugs this should clear

Gate-confirmed by T4: `class/xopuku-46-nefa571`, `class/tebore-53-tese080`,
`class/tedeba-19-lisi250`.

Expected widths: `<<delegate>>` 82 → **66**; `<<create>>` 68 → **52**;
`<<alias>>` 59 → **43**; `<<implement>>` 92 → **76**.

## Acceptance criteria

- **Given** `<<delegate>>` at font 13, **when** boxed, **then** width is **66**.
- **Given** `<< a >>`, **when** rewritten, **then** it becomes `«a»` — the one
  optional inner space is consumed.
- **Given** a label with `<<x>>` **mid-string**, **then** the rewrite applies
  there too, not only at position 0.
- **Given** `usecase/cevuji-49-bile305`, **when** the suite runs, **then** it
  still passes — the description route is untouched.
- **Given** every constant introduced, **then** each carries an upstream
  `file:line`.
- **Given** a new test, **when** run against the pre-fix code, **then** it fails.
- **Given** `shape-match-report`, **then** **no fixture rises**.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class usecase
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts
```

Class DOT EQUAL must rise or hold against whatever T12a left it at; usecase
must hold at **88**. Census: no fixture may rise.

## Observability

Class and usecase DOT EQUAL; the triage CLEARABLE list; census delta.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** cite `Guillemet.java:78-88` on the rewrite.
- **Never:** fit.
- **Never:** edit a backlog JSON, the description engine, or a file owned by
  T11 or a sibling task.
- **Never:** widen into the description engine's mid-string gap. Name it in the
  journal and leave it.

## Commit

`fix(T12b): rewrite <<x>> to guillemets before measuring class labels`
