# T4 — canvas, margins and dpi

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T4`. This is a geometry family,
so step 1 is a diagnosis that must be done before any edit (D6).

## Rows
- **canvas (svg width/height/viewBox ± childCount ± text):** basetu, cenoja, cumofi, dozudi,
  dugovi, figika, fogexa, gogosu, kezodo, kuciku, mavicu, nevuzi, radiga, rekisu, revusu, sobobi,
  sodoza, vimulo, zodare. Full slugs are in `measurements/seed/families-1to10.txt`.
- **Census:** viewBox/width/height reach 125/99/96 rows.
- **deroxu (unknown/deroxu-29-gude369):** layout-equal, but the render ignores `skinparam dpi 60`
  and misses the title (dsw follow-on). Note that `renderer.ts:234-237` already reads `theme.dpi`
  (cdd-T30). So find why deroxu does not reach that code path: unknown routing? an embedded pipeline?
  a different chrome?

## Task
1. **Diagnose (no edits):**
   - Read the jar's canvas arithmetic: `svek/SvekResult.java`, `GeneralImageBuilder.java`, the
     `ImageBuilder` margins, `core/TextBlockExporter.java:206` (dpi), and the title/caption/legend chrome.
   - For 4 rows (two with width only, two with height), print the jar `viewBox`/`width`/`height`
     against ours, and the term-by-term sum.
   - Write the artifact for each mechanism.
2. Fix each mechanism at its origin. Any term without a citation means the fix is unfinished.
3. deroxu: apply dpi and the title the way the jar does, quoting the Java.

## Write-set
- `src/diagrams/description/renderer.ts`, `renderer-ink-extent.ts`, `layout-ink-shift.ts`,
  `title-label-sizing.ts`
- the shared chrome files where a stated mechanism lives. These are core under D5 (guards). Note
  that every engine's canvas passes through core chrome: run every engine's survey.
- `tests/unit/description/**`, `tests/unit/core/**` for touched modules
- **Not** `renderer-cluster.ts` (T5 owns it this batch).

## Acceptance
- Given the 19 canvas rows, then render-diff before → after per row, and each residual has a mechanism.
- Given deroxu, then the canvas scale matches dpi 60 and the title is drawn. Report render-diff
  743/2505 → after.
- Given a core chrome edit, then every engine's survey shows zero conformant losses, and the
  class/object/state ratchets are green.

**Observability:** N/A. **Rollback:** Reversible.
