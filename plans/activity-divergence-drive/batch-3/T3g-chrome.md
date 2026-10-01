# T3g — document title / legend chrome

Agent: typescript-pro, worktree `add1-T3g`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
Row 30: title/legend chrome is applied by the SHARED `core/annotations/chrome.ts#applyChrome` (`DiagramChromeFactory.java:137-149,320-413`) for every engine. cifafo: title text x 10 vs 20, y +10 and a ~10.15 body shift; letare: legend x +10 / y −11; bigide: ~1.29 title x. First find WHY activity differs where class/state/mindmap (hundreds conformant WITH titles) do not — likely the inputs activity hands chrome (content dims/margins, e.g. the `Recentred`/margin model T1a ported now living inside the activity block vs. the chrome's own margins), not chrome itself. Prefer fixing the activity-side inputs; editing chrome.ts is allowed only if the all-engine survey shows zero non-activity movers.

## Rows (b2)
- **title/legend chrome offsets (shared core/annotations/chrome.ts, DiagramChromeFactory)**: `bigide-91-bise382`, `cifafo-49-jazi415`, `letare-59-gore448`

## Write-set
`src/core/annotations/{chrome,blocks}.ts`, `src/index.ts` (only the chrome call), the tests exercising them, new tests (names unique to T3g).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.
