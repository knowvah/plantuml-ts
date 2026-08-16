# T4 — M4 diagnosis: single-line width deltas

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification.

This is a **diagnosis task under `~/.claude/rules/diagnosis.md`**. You will
write **no source code**. Read that rule file first. The success condition is a
stated mechanism, not a disappeared symptom.

### The observed discrepancy

Four backlogged slugs — `berelu-46-namo819` (description),
`canuti-20-jotu614`, `gikipi-69-pepo172`, `xopuku-46-nefa571` (class) — fail
`labelSizeOk` with **few-pixel width deltas on single-line edge labels**. Not
multi-line, not merged, not tail/head. No mechanism has been established.

This is the mission's one unknown floor: the exit bar is set at ≤ 12 remaining
slugs rather than 0 because nobody knows yet how large M4 is or whether it is
reachable. **Your finding sets T12's scope, and may set it to zero.**

### A hypothesis that was already rejected — do not inherit it

`src/diagrams/class/class-layout-edge-labels.ts:34` states that the label font
`edgeLabelAttrs` measures with is `theme.fontSize` = **14**, while
`~/git/plantuml/src/main/resources/skin/plantuml.skin` has
`arrow { FontSize 13 }`. A one-point font error would explain a few-pixel width
delta, and it is the obvious first guess.

It does not survive contact with the corpus: `givoli-70-rade072`'s plain labels
match the oracle **exactly** (`22x15`, `44x15`, `80x15`). If our arrow label
font were 14 against jar's 13, those would not match.

So the comment is stale, path-specific, or describing something else — and
**settling which is part of this task**. Three premises in this mission line
have already gone stale the same way (see the method note at the end of
`planning/mission-index.md`): *trace two levels, including in your own plan.*

## Task

Establish the mechanism for the width deltas, or establish that it cannot be
established yet. Produce the diagnosis artifact: **mechanism · origin
`file:line` · causal chain · ruled out (with evidence)**.

Answer these along the way:

1. What are the actual numbers? Per slug, per edge: oracle `WxH` vs ours.
   Deltas of 3px and 8px may be different mechanisms wearing the same shape.
2. Is `class-layout-edge-labels.ts:34`'s "theme.fontSize = 14" claim true of
   the path these fixtures take? If our arrow label font really is 14 somewhere
   and 13 elsewhere, name both call paths.
3. Do the four slugs share one mechanism, or is this a bucket?
4. What does the label text contain — creole tags, a sprite or icon atom,
   non-ASCII, trailing whitespace? `stripCreoleMarkup`
   (`src/core/edge-label-box.ts:66`) deliberately does not strip `img`, `$` or
   `&` because those are width-bearing atoms; check whether an atom is in play.

Instrument before hypothesizing. Do not paper over uncertainty with a candidate
fix.

## Write-set

- `.agent-notes/m4-single-line-width.md` — this file only

**No source edits. No test edits. No journal edits.**

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:286-305`
  — how `labelOnly` is built: `create0(font, alignment, skinParam, wrapWidth, CreoleMode.SIMPLE_LINE, ...)`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:440-445,500-510`
  — emission and the `(int)` truncation in `appendTable`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:235-241`
  — where `labelFont` actually comes from
- `src/core/edge-label-box.ts` — the whole file, 105 lines
- `src/diagrams/class/class-layout-edge-labels.ts:20-40` — the constants and
  the stale-looking comment
- `src/diagrams/description/link-edge-attrs.ts:190-210` — the description arm

Drill down with `npx jiti scripts/dot-sync-report.ts --slug <slug> <type>`.
T2's `scripts/label-box-triage.ts` may land before you finish — if it has, use
it for question 1 instead of grepping by hand.

## Acceptance criteria

- **Given** the four fixtures, **when** diagnosis completes, **then** the note
  states the mechanism, or explicitly records it as unestablished with the
  ruled-out list and the next instrumentation step.
- **Given** the note, **then** it settles whether
  `class-layout-edge-labels.ts:34`'s font claim is true, stale, or
  path-specific — with the evidence.
- **Given** the note, **then** it states per slug whether they share one
  mechanism, verified rather than assumed.
- **Given** a mechanism is found, **then** every number in the explanation
  traces to an upstream `file:line` — no value is kept because it made the
  error shrink.

## Quality bar

No code changes, so no gates. The bar is that T12 can act on the note without
redoing the work — or that the mission can honestly name the residue.

## Observability

N/A — read-only diagnosis.

## Rollback

**Reversible** — a note file only.

## Boundaries

- **Always:** capture actual measured values before proposing any mechanism.
- **Never:** write a fix, or edit `src/` or `tests/`.
- **Never:** fit. If a constant makes the delta vanish but has no upstream
  origin, that is a stop condition, not a finding.
- **Never:** treat "the deltas are small" as a reason to close. Size is not a
  diagnosis, and 4 slugs of the exit bar depend on this.

## Commit

`docs(T4): diagnose the single-line edge-label width deltas`
