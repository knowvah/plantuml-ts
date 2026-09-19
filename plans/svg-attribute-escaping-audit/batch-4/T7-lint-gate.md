# T7 — Fitness gate (D5) and close-out

## Context
After Batch 3, `grep -rnE '[a-z:-]+="\$\{' src --include='*.ts'` is empty.
D5 makes that permanent at `npm run lint`. ESLint is v10 with
`typescript-eslint` v8 (`eslint.config.ts`, flat config; the `src/tests/demo`
block starts at `:44`). `tests/architecture/svg-emission-seam.test.ts`
already guards shape markup outside the seam (textual scan of `src/`).

## Task
1. `eslint.config.ts`, in a NEW block scoped to `files: ['src/**/*.ts']` with
   `ignores: ['src/core/svek-dot-emit*.ts', 'src/core/graph-layout-build*.ts']`
   and a comment: those emit graphviz DOT / HTML-like labels, not SVG — a
   language boundary, not a sink allowlist (journal B3). Tests and scripts
   stay free to build markup strings:
   ```ts
   'no-restricted-syntax': ['error', {
     selector: 'TemplateElement[value.raw=/="$/]',  // widened (journal B3): dynamic names too
     message: 'Attribute values must go through attrs()/attrsFromRecord() so they are escaped once (plans/svg-attribute-escaping-audit/decisions.md D5).',
   }],
   ```
   A `TemplateElement` whose raw text ends in `name="` is, by construction,
   immediately followed by an interpolation (the last quasi has `tail:
   true`; a trailing `="` there is a syntax error in the output anyway).
   Verify the selector against the ESLint selector docs before trusting
   it; adjust the regex if `value.raw` needs escaping in the selector.
   D8 adds a SECOND entry in the same rule: a template chunk that contains
   an unclosed comment opener before an interpolation —
   `TemplateElement[value.raw=/<!--(?:(?!-->).)*$/]` — with a message
   pointing at `escapeComment`. Fixture (d) `` `<!--class ${name}-->` `` →
   one error; (e) `` `<!--class ${escapeComment(name)}-->` `` → ALSO one
   error by construction (the chunk before the interpolation is identical),
   so the comment sinks must be rewritten as `` `<!--` + 'class ' + escapeComment(name) + `-->` `` or via a tiny `comment(text)` helper in `svg.ts`; pick one, apply it in T3c's files if T3c did not, and say which in the commit body.
2. `tests/architecture/attribute-sink-rule.test.ts`: load the flat config,
   run `new Linter({ configType: 'flat' }).verify(code, config, 'src/x.ts')`
   on (a) `` `<a href="${x}">` `` → one error; (b) `` `<a${attrs([['href', x]])}>` ``
   → zero; (c) a template with `="` in the middle of a quasi (not before an
   interpolation) → zero.
3. `svg-emission-seam.test.ts`: one more `it`: no line under `src/`
   contains `eslint-disable` with `no-restricted-syntax`.
4. `npm run catalog`; commit `docs/catalog.md` if it moved.
5. README close-out: fill the batch checkboxes; append the summary the
   autonomous protocol requires (tasks done vs planned, decisions count and
   flags, gate results, follow-ups). Record the 39 → 0 count in the
   journal.

## Write-set
- `eslint.config.ts`
- `src/core/annotations/coord-shift.ts` (ONLY the two `${name}="…"` branches at ~:162-163 → `attrs()`; journal B3)
- `tests/architecture/attribute-sink-rule.test.ts` (create)
- `tests/architecture/svg-emission-seam.test.ts`
- `docs/catalog.md`
- `plans/svg-attribute-escaping-audit/README.md`

## Read-set
- `eslint.config.ts` (whole file, 60 lines)
- `tests/architecture/svg-emission-seam.test.ts` (86 lines)
- `tests/architecture/catalog.test.ts:1-30` (test style)
- ESLint docs: selectors (`https://eslint.org/docs/latest/extend/selectors`) and `no-restricted-syntax`
- `decisions.md#d5`

## Architecture decisions
D5 (locked). Stop 7 if an allowlist or >2 disables is needed.

## Acceptance criteria
- Given fixture (a), when linted, then exactly one error with the D5 message
- Given fixtures (b) and (c), when linted, then zero errors
- Given `src/`, when `npm run lint` runs, then zero violations and the seam
  test's zero-disable assertion passes
- Given `npm run catalog`, when run, then no drift

## Quality bar
All four gates; `npm run lint` is the one under test — run it twice, once
with a deliberately re-introduced sink to see it fail, then reverted.

## Boundaries
- Never: scope the rule to `tests/`; add an allowlist

## Observability
N/A.

## Rollback
Reversible.

## Commit
`ci(saea-T7): lint rule forbids template attribute sinks under src/`
