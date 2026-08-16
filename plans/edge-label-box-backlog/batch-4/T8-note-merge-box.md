# T8 — `mergeLR`/`mergeTB` + shield + half-width

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body and
the constructor that built its inputs — not a filename, not a remembered
summary. Every constant carries its upstream `file:line`; no citation means
unfinished. **Never fit a value.**

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

When a link carries a note, upstream does **not** size the label alone and draw
the note beside it. It *merges* the two into a single `TextBlock` and measures
that (`SvekEdge.java:302-325`):

```java
if (note.getPosition() == Position.LEFT)
    labelText = TextBlockUtils.mergeLR(noteOnly, labelOnly, VerticalAlignment.CENTER);
else if (note.getPosition() == Position.RIGHT)
    labelText = TextBlockUtils.mergeLR(labelOnly, noteOnly, VerticalAlignment.CENTER);
else if (note.getPosition() == Position.TOP)
    labelText = TextBlockUtils.mergeTB(noteOnly, labelOnly, HorizontalAlignment.CENTER);
else
    labelText = TextBlockUtils.mergeTB(labelOnly, noteOnly, HorizontalAlignment.CENTER);
```

Then `dimNote.delta(2 * labelShield)` and `eventuallyDivideByTwo` (`:440-445`,
`:485-489`). We emit the bare label, so `lozego-15-coci435` reserves `33x15`
against the oracle's `137x135`.

Affected: state's four note-on-link fixtures (`fotigo` family), `lozego`, and
likely several other class slugs. This task adds the formula only — T9 and T10
wire the engines.

## Task

Add a merged-label box function to `src/core/edge-label-box.ts` covering all
three terms:

1. **The merge.** `mergeLR` for `LEFT`/`RIGHT`, `mergeTB` for `TOP`/`BOTTOM`,
   with the operand order upstream uses (note-first for `LEFT`/`TOP`,
   label-first for `RIGHT`/`BOTTOM`). **Derive the dimension arithmetic by
   reading `TextBlockUtils.mergeLR`/`mergeTB`'s `calculateDimension`** — do not
   infer it from the method names (D2).
2. **The shield.** `+ 2 * labelShield`, where `labelShield` is **7** when the
   link type's middle decor is not `NONE`, and **0** when it is
   (`SvekEdge.java:352-356`).
3. **The halving.** Width halves when the note strategy is `HALF_NOT_PRINTED`
   or `HALF_PRINTED_FULL` (`:314-317`, `:485-489`).

The note operand's dimension comes from the existing note sizer, not a string
measurement — `EntityImageNoteLink` is a decorated image.

Leave `computeReservedLabelBox` and T5's `computeQuantifierBox` untouched.

## Write-set

- `src/core/edge-label-box.ts`
- `tests/unit/core/edge-label-box.test.ts`

No engine wiring here. If the note sizer is not reachable from `src/core/`
without a new import edge, **stop and log it** — that is an architecture
question, not a thing to solve by copying a sizer.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:302-326`
  — the merge, and `divideLabelWidthByTwo`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:352-356`
  — `labelShield` 7 vs 0, on `LinkMiddleDecor.NONE`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:440-445`
  — `dimNote.delta(2 * labelShield)`, `eventuallyDivideByTwo`, `appendTable`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:485-489`
  — `eventuallyDivideByTwo`'s body
- `TextBlockUtils.mergeLR` / `mergeTB` — **required reading**, find them under
  `~/git/plantuml/src/main/java/net/` (grep the whole tree, not just
  `net/sourceforge/plantuml/`)
- `EntityImageNoteLink` — what the note operand actually is
- `src/core/edge-label-box.ts` — the whole file
- `decisions.md#d2--model-mergelrmergetb-as-dimension-arithmetic`
- `test-results/dot-cache/class/lozego-15-coci435/in.puml` — a `note on link`
  carrying a sprite

## Architecture decisions

**D2** — dimension arithmetic, derived from the Java, not a `TextBlock` port.
Note side from the existing note sizer. **D1** — this file is the single home.

Both locked. A corpus case the arithmetic cannot represent is a
`DIVERGENCES.md` entry — not an effort excuse, and not a reason to fit.

## Interface contract

Consumed by T9 (state) and T10 (class):

```ts
export function computeMergedLabelBox(input: {
  label: string;
  noteDim: { width: number; height: number };  // from the note sizer
  position: 'left' | 'right' | 'top' | 'bottom';
  halfWidth: boolean;        // HALF_NOT_PRINTED | HALF_PRINTED_FULL
  hasMiddleDecor: boolean;   // labelShield 7 vs 0
  font: FontSpec;
  measurer: StringMeasurer;
}): ReservedLabelBox;
```

Adjust names to the file's conventions; the contract is the term set and their
order of application. Record the final signature in the journal.

## Acceptance criteria

- **Given** a note at `LEFT` or `RIGHT`, **when** boxed, **then** the dimensions
  follow `mergeLR`'s own `calculateDimension` arithmetic, with the operand order
  upstream uses.
- **Given** a note at `TOP` or `BOTTOM`, **when** boxed, **then** `mergeTB`'s.
- **Given** a link whose middle decor is not `NONE`, **when** boxed, **then**
  `2 * 7` is added; **given** `NONE`, **then** `0`.
- **Given** a `HALF_*` note strategy, **when** boxed, **then** the width halves
  and the height does not.
- **Given** the existing label-arm and quantifier-arm tests, **when** the suite
  runs, **then** all pass unchanged, and `shape-match-report` shows **zero**
  fixtures moved.

## Quality bar

All four gates plus the zero-movement census. Journal the numbers. Every one of
the three terms cites its `SvekEdge.java` line in the code.

## Observability

N/A — no caller yet. The census is the signal.

## Rollback

**Reversible** — one commit, additive.

## Boundaries

- **Always:** open `TextBlockUtils` before writing the merge arithmetic.
- **Always:** cite `:352-356` for the 7, `:485-489` for the halving.
- **Ask first:** if the note sizer cannot be reached from `src/core/` cleanly.
- **Never:** change the label or quantifier arms.
- **Never:** wire a caller here.
- **Never:** substitute a string measurement for the note's dimension because
  the note sizer was awkward to reach.

## Commit

`feat(T8): merged note-on-link label box — mergeLR/mergeTB, shield, half-width`
