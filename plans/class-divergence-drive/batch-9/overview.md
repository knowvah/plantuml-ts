# Batch 9 — B9 dispatch, hide, chrome

`!include <stdlib>` misdispatch + our error-page formatter (both real
bugs, A6 §5a/§5b), `hide`/`show` by name (A2b E5), `skinparam mode dark`
(A3 M6/A6 §5d), and four independent chrome/AST gaps bucketed under E14
(`newpage` first-page-only, `mainframe` chrome, `skinparam topurl`, the
`<>` n-ary diamond + its jar-refusal sibling). T31/T32/T33 write disjoint
files (`class-directives-removal.ts`+`class-hideshow-dispatch.ts` vs.
`core/dispatcher.ts`+`core/error/*` vs. `core/theme*.ts`+skinparam-key
tables) and run in parallel worktrees. T34 depends on T32: `luzive-62-
zote562`'s malformed diamond must render the SAME refusal page T32 fixes
(`error-renderer.ts`), so T34 needs T32's error path merged first. Partly
moves layout: E5's parent-cascade changes which nodes exist for `hide`
fixtures; T32's dispatch fix changes DOT input for the 4 misrouted
stdlib fixtures; T34's `newpage`/diamond changes node counts. T34's
`mainframe` piece is NOT class-specific despite its E14 filing —
`core/annotations/chrome.ts` already parses and style-resolves
`mainframe` for every engine but explicitly never draws it (`BigFrame`
unported, a deferred item from an earlier mission's own D9, distinct
from this mission's D9); the fix lands in the shared seam, so it is
gated like T32 (every engine's suite, stop 4), not class-only.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T31 | `hide`/`show` by name: separator strip + group cascade (A2b E5) | typescript-pro (sonnet) | `class-directives-removal.ts`, `class-hideshow-dispatch.ts`, `ast.ts` (directive field only), tests | — | [ ] |
| T32 | stdlib `!include` misdispatch + error-page SVG-root formatter (A6 §5a/§5b) | debugger (diagnosis) → typescript-pro (sonnet) (fix) | `core/dispatcher.ts`, `core/error/error-renderer.ts`, `core/error/error-diagrams.ts`, `DIVERGENCES.md` (version-string entry only if absent), tests | — | [ ] |
| T33 | `skinparam mode dark` (A3 M6, A6 §5d) | typescript-pro (sonnet) | `core/theme.ts` or a new `core/theme-dark.ts`, `core/skinparam-key-handlers-table-a/b.ts`, `class-badge.ts` (spot defaults only if needed), tests | — | [ ] |
| T34 | `newpage`, `mainframe`, `topurl`, `<>` n-ary diamond + jar-refusal sibling (A2b E14) | typescript-pro (sonnet) | `class/renderer.ts`, `class/layout.ts`, `class/class-geo-types.ts` (page-boundary field only), `core/annotations/chrome.ts`, a new `core/klimt/shape/big-frame.ts`, `core/skinparam-key-handlers-table-a/b.ts` (`topurl` key), `class/class-url.ts`, `class/class-command-containers.ts`, `CHANGELOG.md` (T7 entry amendment), tests | T32 | [ ] |

Specs: [`T31-hide-show-by-name.md`](T31-hide-show-by-name.md),
[`T32-stdlib-include-dispatch-error-page.md`](T32-stdlib-include-dispatch-error-page.md),
[`T33-mode-dark.md`](T33-mode-dark.md),
[`T34-newpage-mainframe-topurl-diamond.md`](T34-newpage-mainframe-topurl-diamond.md).
Batch close: [`close.md`](close.md) — first re-pin since batch 8.
