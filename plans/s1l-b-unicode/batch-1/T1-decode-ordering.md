# T1 — Decode codepoint escapes per-line, not before the line-split

## Context
`finalizeDisplay` (`src/diagrams/description/parse-helpers-strings.ts:229`) is
`resolveTextEscapes(resolveNewlineEscapes(stripFullWrap(display)))`.
`resolveTextEscapes` (`src/core/text-escapes.ts`) decodes `<U+XXXX>`/`&#NNN;`
to their glyph — so `<U+000A>` becomes a literal `\n` BEFORE the display reaches
the sizer, which then splits on `\n` and OVER-SPLITS (gafico node with 4×
`<U+000A>` renders as 5 lines here, 1 line in the oracle). See `decisions.md`
Rule 1 / ADR-1: upstream decodes codepoints per text atom, per-line, AFTER the
split (`AtomText.manageSpecialChars`), so a decoded newline-codepoint is inline.

## Task
Stop decoding codepoint escapes in `finalizeDisplay`; decode them per-line at
measure and render time, kept in sync.
1. `finalizeDisplay`: drop the `resolveTextEscapes` wrap — keep
   `resolveNewlineEscapes(stripFullWrap(...))`. `node.display` now retains raw
   `<U+…>`/`&#…;` tokens. (Leave the separate stereotype-path
   `resolveTextEscapes` call at line ~260 alone — stereotypes are single-line.)
2. Add a shared per-line decode (reuse `resolveTextEscapes` on ONE line) and
   call it:
   - in `leaf-sizing.ts` `maxLineWidth` and `textBlockHeight`, per split line,
     before measuring (a decoded inline `\n` is measured within the line — our
     width table gives `\n` ~0 width — and does NOT re-split);
   - in `EntityImageDescriptionSupport.ts#buildTextBlock`, per split line,
     before building atoms, so the rendered glyph matches.
3. Verify the sizer and renderer decode identically (sync invariant).

## Read-set
- `src/diagrams/description/parse-helpers-strings.ts:210-260` (`finalizeDisplay`,
  `resolveNewlineEscapes`, the stereotype call).
- `src/core/text-escapes.ts` (the decoder — unchanged; called per-line now).
- `src/diagrams/description/leaf-sizing.ts` — `maxLineWidth`,
  `textBlockHeight`, `creoleVisibleText` (S1L-b-display added the per-line loop
  these hook into).
- `src/core/svek/image/EntityImageDescriptionSupport.ts#buildTextBlock` — its
  per-line `built`/`drawU` loop.
- `plans/s1l-b-display/decision-journal.md` — the sizer↔renderer sync invariant.

## Write-set
- `src/diagrams/description/parse-helpers-strings.ts`
- `src/diagrams/description/leaf-sizing.ts`
- `src/core/svek/image/EntityImageDescriptionSupport.ts`
- `tests/unit/description/codepoint-display.test.ts` (new)

## Architecture (locked)
ADR-1 — decode per-line, post-split. Do NOT edit `core/text-escapes.ts`'s
behavior or any non-description caller (the class note path is out of scope). If
the fix appears to need the shared decoder changed, STOP and log.

## Interface contract
`node.display` after `finalizeDisplay`: raw `<U+…>`/`&#…;` PRESERVED; `\n`/`\r`/
`\l` already resolved to real newlines. Consumers (sizer, renderer) own the
codepoint decode per-line.

## Observability
N/A — no new observable operations (pure sizing/render transform).

## Rollback
Reversible — revert the commit. No data/format migration.

## Quality bar
`npm run typecheck` clean; complexity hook non-block; new unit tests pass.
Critically OUTPUT-NEUTRAL: `dot-sync-report component usecase` stays 262/262 +
90/90 and `measure-description-size-deltas.ts` shows zero `widened` (a display
without a newline-codepoint must size byte-identically).

## Acceptance criteria (Given/When/Then)
- Given a display `"aaa<U+000A>bbb"` on a leaf, when measured, then height is
  ONE line (the `<U+000A>` is inline), not two.
- Given a display `"aaa\nbbb"` (backslash-n), when measured, then height is TWO
  lines (unchanged — `\n` still splits).
- Given a display `"x<U+221E>y"` (non-newline codepoint), when measured/rendered,
  then width and SVG are byte-identical to before this change.
- Given the full description corpus, when `dot-sync-report component usecase`
  runs, then structure is unchanged (262/262 + 90/90) and zero fixtures widened.

## Commit
`fix(description): decode <U+…>/&#…; per-line so codepoint newlines are inline (S1L-b-unicode T1)`.
