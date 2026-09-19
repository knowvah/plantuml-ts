# T3b — `paint.ts` and the document shell onto the shared escaper

## Context
`src/core/paint.ts:190` has a private `escapeAttr` used at `:227-228` for
gradient stop colors, and `:225` templates the gradient `id`.
`src/core/klimt/document-shell.ts:146` escapes the shell `style` value with
`svg.ts#escapeXml` ad hoc. T2 exported `escapeAttribute` from
`svg-format.ts`.

## Task
1. `paint.ts`: delete `escapeAttr`; emit the `<linearGradient>` and both
   `<stop>` elements via `attrs()` (from `svg.ts`) or, if importing `svg.ts`
   creates a cycle, via `escapeAttribute` from `svg-format.ts`. Say which
   in the commit body.
2. `document-shell.ts`: import `escapeAttribute` from `svg-format.ts` for
   the `style` value; drop the `svg.ts#escapeXml` import if unused.
3. Tests: `paint.test.ts` — a gradient whose color1 is `x"y` yields
   `stop-color="x&quot;y"` exactly once; `document-shell.test.ts` — the
   existing injection case still passes with the new import.

## Write-set
- `src/core/paint.ts`
- `src/core/klimt/document-shell.ts`
- `tests/unit/core/paint.test.ts`
- `tests/unit/core/klimt/document-shell.test.ts`

## Read-set
- `src/core/paint.ts:185-240`
- `src/core/klimt/document-shell.ts:125-160`
- `src/core/svg-format.ts` (T2 exports)
- `decisions.md#d1`, `#d2`

## Acceptance criteria
- Given `paint.ts`, when grepped, then no `escapeAttr` and no `="${` remains
- Given a gradient with `"` in a stop color, when emitted, then one `&quot;`
- Given the shell with a `"` background, when rendered, then
  `background:x&quot;…` exactly once
- Given the full suite, when run, then zero diffs

## Quality bar
All four gates; conformance unmoved (`gradient-fill` golden in
`emitter.golden.test.ts` byte-identical).

## Observability
N/A.

## Rollback
Reversible.

## Commit
`refactor(saea-T3b): paint and document shell use the shared attribute escaper`
