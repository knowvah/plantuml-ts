# T2 — Shared visible-atoms helper; rewire sizer + renderer

## Context
`buildLine` (`EntityImageDescriptionSupport.ts:192`) and `creoleVisibleText`
(`leaf-sizing.ts:376`) independently turn a raw line into drawable/measurable
content, using two different creole lexers. `buildLine` (via `buildStripeAtoms`)
strips unclosed `<b>` / `<u:blue>` / `<color:green>` / `<font Name>`;
`creoleVisibleText` (via `parseCreole`) does not — so the DOT box is wider than
the ink. Unify on ONE helper (ADR-1). The spike (T1) has confirmed net-positive.

## Task
1. **Extract the shared helper** into
   `src/core/klimt/creole/legacy/StripeSimple.ts` (has room; ≤500 cap). It takes
   a raw line + a `FontConfiguration` and returns the classified line's TEXT
   atoms (or their concatenated visible text) — mirroring `buildLine`'s branches:
   HORIZONTAL_LINE → no glyph text; LITERAL → `buildLiteralAtoms`; HEADING →
   `buildStripeAtoms` under `fontConfigurationForHeading`; NORMAL →
   `buildStripeAtoms`. Preserve upstream-ish naming.
2. **Rewire `buildLine`** to call the helper — its returned `LineBuild.atoms`
   and renderer output MUST be byte-identical (this is a pure extraction for the
   renderer; verify no SVG golden moves).
3. **Rewire `creoleVisibleText`** to use the helper's visible TEXT (ADR-2):
   build a base `FontConfiguration` from the `FontSpec` (ADR-3 shim: family/size,
   empty styles, black), get the stripped text, and keep feeding
   `measureLineWithAtoms` (do NOT change the `<img>`/`<$sprite>` atom path).
   Drop the `parseCreole` import from `leaf-sizing.ts`.
4. **Unit test** (`tests/unit/description/leaf-sizing-creole.test.ts`): assert
   the sizer now strips the four driver tags (widths match the stripped form),
   AND that a balanced `<b>arn</b>` and a plain line are unchanged (no
   regression). Reuse the `stubMeasurer` pattern from `leaf-sizing-body.test.ts`.

## Read-set
- `src/core/svek/image/EntityImageDescriptionSupport.ts:186-200` (`LineBuild`,
  `buildLine`).
- `src/core/klimt/creole/legacy/StripeSimple.ts:197-` (`buildStripeAtoms`,
  `buildLiteralAtoms`, `fontConfigurationForHeading`).
- `src/core/klimt/creole/legacy/CreoleStripeSimpleParser.ts#classifyStripeLine`.
- `src/diagrams/description/leaf-sizing.ts:375-401` (`creoleVisibleText`,
  `maxLineWidth`).
- `tests/unit/description/leaf-sizing-body.test.ts` (test/stub conventions).
- `decisions.md#adr-1`, `#adr-2`, `#adr-3`.

## Write-set
- `src/core/klimt/creole/legacy/StripeSimple.ts` (add shared helper)
- `src/core/svek/image/EntityImageDescriptionSupport.ts` (`buildLine` delegates)
- `src/diagrams/description/leaf-sizing.ts` (`creoleVisibleText` uses helper)
- `tests/unit/description/leaf-sizing-creole.test.ts` (new)

## Interface contract
Shared helper: `(line: string, font: FontConfiguration) → readonly CreoleAtom[]`
(text + inline atoms, HR yields none) OR a thin `visibleText` wrapper. `buildLine`
consumes the atoms unchanged; `creoleVisibleText` consumes the concatenated text.
`node.display` contract from S1L-b-unicode T1 is unchanged (raw `<U+…>` still
decoded per-line by the sizer/renderer AFTER stripping).

## Architecture (locked)
ADR-1/2/3. Do NOT change `parseCreole` or its non-description callers
(`annotations/blocks.ts`, `error-renderer.ts`). If the fix seems to need editing
`parseCreole`, STOP — it means scoped wrong. Do NOT change the renderer's drawn
output. Keep both 500-line-capped files under cap (helper lives in StripeSimple).

## Observability
N/A — no new observable operations (pure sizing/stripping transform).

## Rollback
Reversible — revert the commit. No data/format migration.

## Quality bar
`measure` exit 0 (zero widened); `dot-sync component usecase` 262/262 + 90/90;
renderer SVG goldens unchanged (npm test green — any `buildLine` output drift is
a bug); typecheck + lint + build green; complexity hook non-block.

## Acceptance criteria (Given/When/Then)
- Given `bar` = `"<b>this is also <U+221E> <font Segoe UI Emoji>…</font> long"`,
  when the sizer measures it, then its width matches the stripped form
  (`"this is also ∞ 🚀☺ long"`), not the literal-tag form.
- Given a balanced `<b>arn</b>`, when measured, then width == `arn` (unchanged).
- Given the renderer, when it draws any golden, then SVG output is byte-identical
  to before (pure extraction — `buildLine` behavior preserved).
- Given the full corpus, when `dot-sync component usecase` runs, then structure
  stays 262/262 + 90/90 and `measure` shows zero widened.

## Commit
`fix(description): unify sizer/renderer creole visible-text on one stripe helper (creole-lexer-unification T2)`
