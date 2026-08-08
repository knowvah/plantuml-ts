# T4 — klimt text: rules 3 and 5

**Agent:** typescript-pro · **Depends on:** T3 · **Commit:** `feat(T4): drop inherited text attributes and single-glyph textLength`

## Context

T3 put `font-family` and `lengthAdjust` on the root `g`, so every text
element now inherits them. This task removes the now-redundant per-element
attributes (rule 3's second half) and skips `textLength` for
single-character text (rule 5).

**Order matters.** Running this before T3 emits text with neither the
per-element attribute nor an inherited one — a real rendering break, not
just a golden mismatch.

⚠️ Gate deferred (ADR-5): SVG-comparing tests fail until batch-2d.

## Read-set

- `.agent-notes/svg-output-size-reduction-measured.md` — rules 3 and 5
- `src/core/klimt/drawing/svg/svg-graphics-elements.ts` — `applyTextLengthAdjust`
  (:242-249), the `font-family` assignment (:261) and the QA-link comment
  above it (:252), `TextOptions` (~:52)
- `src/core/klimt/drawing/svg/driver-text-svg.ts` — the `textLength: dim.width`
  call site (:137)
- `plans/svg-output-size-reduction/batch-2a/T3-klimt-core.md` — the
  interface contract this task consumes

## Write-set

- `src/core/klimt/drawing/svg/svg-graphics-elements.ts`
- `src/core/klimt/drawing/svg/driver-text-svg.ts`
- their tests

## Task

**Rule 3, per-element half.**
- `lengthAdjust`: stop emitting it on text elements entirely. It is
  inherited from the root `g` now. `textLength` is **not** inheritable and
  must still be emitted per element — do not remove it.
- `font-family`: emit only when the resolved family differs from
  `sans-serif`, compared case-insensitively (upstream:
  `fontFamily.equalsIgnoreCase(DEFAULT_FONT_FAMILY) == false`). The
  monospace QA link in the comment at :252 explains why the resolved
  family can differ — keep that comment, it is still load-bearing.

**Rule 5 — single-glyph `textLength`.** Skip `textLength` when the text is
one character: upstream's guard becomes
`text.length() > 1 && (lengthAdjust == SPACING || SPACING_AND_GLYPHS)`.
`applyTextLengthAdjust` currently receives only the numeric length, so the
text string must be threaded to it — that is the `driver-text-svg.ts`
change. Prefer widening the existing options object over adding a
positional parameter (the file is near this project's 5-param hook limit).

Restructure `applyTextLengthAdjust` to match upstream's shape: one guard
covering both `LengthAdjust` values, since the two branches no longer
differ once `lengthAdjust` itself is not emitted.

## Interface contract

None consumed downstream beyond the emitted SVG.

## Acceptance criteria

1. Given a text run whose family resolves to `sans-serif` (any casing),
   when emitted, then the element has no `font-family` attribute.
2. Given a text run in a monospace family, when emitted, then
   `font-family` IS present with that family.
3. Given any text element, when emitted, then it has no `lengthAdjust`
   attribute.
4. Given single-character text, when emitted, then no `textLength`; given
   two or more characters, then `textLength` is present and 3-decimal
   formatted.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — with the rest of batch-2a–2d (ADR-5). Reverting alone
leaves text elements without inherited-or-explicit attributes only if T3
is also reverted; on its own it simply restores the verbose form.

## Quality bar

- `npm run typecheck` and `npm run lint` pass. Cold-tree `npm test`
  expected red until batch-2d.
- Watch the 500-line file cap and the 5-parameter hook limit on both
  files; if a split is needed, follow the repo's established re-export
  pattern and say so in the commit body.
- Keep upstream names and the existing `@see` citations.

## Boundaries

- **Always:** keep `textLength` per-element; keep the monospace QA comment.
- **Never:** touch `svg-graphics-core.ts` (T3 owns it) or `core/svg.ts`
  (T5); regenerate goldens; run any `git` command.
