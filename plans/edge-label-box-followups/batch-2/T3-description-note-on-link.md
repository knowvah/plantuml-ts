# T3 — Description note-on-link merged box

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.** Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are
vitest.

The description engine (component + usecase) parses `note [pos] on|of link`
(`note-grammar.ts:145-153`) but **folds the text into `link.label`**
(`parse-state.ts:365-371`, `attachNoteToLastLink`; the multi-line close at
`:409`). Upstream keeps `Link#getNote()` and `SvekEdge.java:306-325` merges an
`EntityImageNoteLink` into the label block with `mergeLR`/`mergeTB`,
`labelShield`, `divideLabelWidthByTwo`. SI23's T8 ported that arithmetic as
`computeMergedLabelBox` (`src/core/edge-label-box.ts:388-465`); T9 wired state,
T10 wired class; **nobody scoped a description arm**, which is why
`dikexa-30-jobu917`, `fogiku-22-gone205`, `jafuke-47-xepe403`,
`zavitu-69-cemu013` remain (oracle 80x33 vs ours 51x15 for the simplest two).

**Two traps, both hit before:**
- **The note sizer is `ComponentRoseNote`, not `Opale`/`measureNote`.**
  `EntityImageNoteLink.java:57-66` builds via `Rose#createComponentNote`
  (`skin/rose/Rose.java:109-116`) → `ComponentRoseNote` whose
  `getPreferredWidth/Height` (`ComponentRoseNote.java:82-91`) add the
  constructor `paddingX/Y` (5, `Rose.java:65-66`) **twice** on top of the
  6/15/5 style padding: `pureText + 31` wide, `pureText + 20` tall. SI23's T9
  brief said `+21`; the agent read the Java and was right to disobey. Full
  derivation: `src/diagrams/class/class-note-link-box.ts:1-56`.
- **`matchOnLink` captures neither position nor colour** (`note-grammar.ts:
  148-153`). `computeMergedLabelBox` needs `position` (`left|right|top|
  bottom`); a hardcoded `'bottom'` is a fitted value. Class T10 hit exactly
  this (`plans/edge-label-box-backlog/batch-5/overview.md`, correction #1).

## Task

1. **AST (D1):** `DescriptiveLink.linkNote?: string`, `linkNotePosition?:
   NotePosition` (mirror `class-relationship-ast.ts:151-161`). Optional
   `linkNoteColor?` only if the renderer needs it for D2 — journal.
2. **Grammar/parser:** `matchOnLink` returns the position (and colour if
   captured upstream by `CommandFactoryNoteOnLink`'s regex — read it);
   `attachNoteToLastLink` and the `on-link` pending close set `linkNote`/
   `linkNotePosition` instead of concatenating into `label`. Multiple
   `note on link` on the same last link: read what upstream does
   (`Link#addNote` — replace or append?) and mirror it; `zavitu` has three on
   distinct links, `dikexa` two on one link.
3. **Core helper (D5):** `roseNoteDim(pure: {width,height}): {width,height}`
   in `src/core/edge-label-box.ts` — `pure.width + OPALE_MARGIN_X1 +
   OPALE_MARGIN_X2 + 2*5`, `pure.height + 2*OPALE_MARGIN_Y + 2*5`, every
   term cited. Do **not** touch the existing class/state copies.
4. **`link-note-box.ts` (new):** `measureLinkNoteDim(text, theme, measurer)`
   = `roseNoteDim(buildNoteBody(text, noteFont).calculateDimension(...))` —
   `leaf-sizing.ts:297` is the description engine's real creole TextBlock and
   is the "pure text" operand. Verify `buildNoteBody`'s own outer margins are
   **not** already Opale's (read `buildDesc`) — no double-count, no
   under-count.
5. **Layout:** `link-edge-attrs.ts`'s main-label arm routes through
   `computeMergedLabelBox` when `linkNote` is set (mirror
   `class-layout-edge-labels.ts:177-230` — note the `CONSTRAINT_SPOT`/empty-
   label discriminator there and check whether description has an analogue).
   `labelShield`: description links have no `LinkMiddleDecor` either — cite
   `SvekEdge.java:352-356` and journal 0.
6. **Renderer (D2):** the note text must remain visible in the SVG. Draw
   `linkNote` lines beneath the main label inside the merged box (today's
   visible result, now correctly boxed). Read `renderer-edge.ts:60-110` for
   the label plumbing; if the layout label object needs a `noteLines` field,
   add it in `layout.ts`. **Not** the note polygon (out of scope).
7. Remove from the description backlog every slug whose `labelSizeOk` passes;
   for `dikexa`/`zavitu` edges that do not clear, journal the per-edge
   residual mechanism and keep the slug (push-forward).

## Write-set

- `src/diagrams/description/ast.ts`, `note-grammar.ts`, `parse-state.ts`,
  `link-edge-attrs.ts`, `layout.ts`, `renderer-edge.ts`
- `src/diagrams/description/link-note-box.ts` (new)
- `src/core/edge-label-box.ts` (**`roseNoteDim` only**)
- `tests/unit/description/parser.test.ts`, `link-edge-attrs.test.ts`,
  `layout.test.ts`, `renderer.test.ts`; `tests/unit/core/edge-label-box.test.ts`
- `oracle/goldens/description/label-size-backlog.json`

If another description file must change, stop and log — do not inline.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:302-326,352-356,440-445`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageNoteLink.java:50-80`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/Rose.java:60-70,105-120`, `ComponentRoseNote.java:60-95`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/note/CommandFactoryNoteOnLink.java` (regex + `Link#addNote` call), `abel/Link.java` (`addNote`, `getNote`)
- `src/core/edge-label-box.ts:335-465`; `src/core/svek/image/Opale.ts` (margin constants)
- `src/diagrams/class/class-note-link-box.ts` (whole, 90 lines — the derivation), `class-layout-edge-labels.ts:150-235`
- `src/diagrams/description/note-grammar.ts:1-60,140-215`, `parse-state.ts:130-145,360-420`, `link-edge-attrs.ts` (whole, 417 lines), `renderer-edge.ts:1-120`, `leaf-sizing.ts:280-330`, `ast.ts:161-175`
- `plans/edge-label-box-backlog/batch-5/T9-state-note-link.md`, `T10-class-note-link.md`, `batch-5/overview.md` (write-set correction), `decision-journal.md` rows for T9/T10 (`lozego` term-by-term)
- `.agent-notes/description-edge-label-oversizing.md` — the string-vs-TextBlock mechanism this engine already carries
- `decisions.md#d1`, `#d2`, `#d5`, `#description-m2`
- `test-results/dot-cache/{usecase/fogiku-22-gone205,usecase/jafuke-47-xepe403,component/dikexa-30-jobu917,usecase/zavitu-69-cemu013}/in.puml`

## Architecture decisions

D1, D2, D5 as written; inherited: consume `computeMergedLabelBox`, never
re-derive.

## Interface contracts

Output (core): `roseNoteDim(pure: {width:number;height:number}): {width;height}`.
Output (AST): `DescriptiveLink.linkNote?: string; linkNotePosition?: NotePosition`.

## Acceptance criteria

- **Given** `A --> B` then `note left on link #blue\n text\nend note`,
  **when** parsed, **then** the last link has `linkNote === 'text'`,
  `linkNotePosition === 'left'`, and `label` is unchanged/undefined.
- **Given** `fogiku-22-gone205` / `jafuke-47-xepe403`, **when** the DOT gate
  runs, **then** the label box is 80x33 and both leave the backlog; `dikexa`
  (75x48, 174x46) and `zavitu` (268/272/393x48) likewise, or their residual
  mechanism is journalled per edge.
- **Given** `fogiku`'s rendered SVG, **then** the text "Link note" is present.
- **Given** `shape-match-report`, **then** no fixture rises; description DOT
  EQUAL non-decreasing (component ≥ 257, usecase ≥ 89).
- **Given** `roseNoteDim`, **then** a unit test pins `{w,h}` → `{w+31, h+20}`
  with the citations in the test name/comment.

## Quality bar

Four gates; `npx jiti scripts/dot-sync-report.ts description`,
`shape-match-report`, `label-box-triage`. Journal every count.

## Observability

Description DOT EQUAL, description backlog (9 → target 5), census delta,
description SVG ratchet if one exists.

## Rollback

Reversible — one commit (a partial landing that drops visible note text is
**not** an acceptable intermediate; if the renderer half cannot land, do not
commit the parser half).

## Boundaries

- **Always** keep the note text visible in SVG (D2); stop 9 if that conflicts
  with no-rise.
- **Never** modify `computeQuantifierBox`, `computeMergedLabelBox`, or the
  class/state note sizers.
- **Never** hardcode a note position or a `+21`.
- **Stop** if `buildNoteBody`'s margins make the operand ambiguous — journal
  both readings with the Java before choosing.

## Commit

`feat(T3): merged note-on-link box in the description engine`
