# T1b — bracket shorthand URL (Family A)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `dur/T1b`.

## Context
component/jazabe-68-bica131 declares `[Component1] << Stereotype >> [[http://Component1]]` and
`() Interface << Other Stereotype >> [[http://Interface]]`; the jar attaches each url to its entity.
Port: `element-grammar.ts:30-44` `BracketDeclaration` has no url; `:74-110` `parseBracketDeclaration` never
extracts the token; callers `command-table-shorthand.ts:76,106-109` (and `command-table-containers.ts:58,195`,
which is T1a's — merged). Use T1a's `extractUrlToken` and `makeNode(…, { url })`. Quote the Java command
that matches each shorthand form (`CommandCreateElementFull`'s `[…]`/`()` alternatives).

## Write-set
`src/diagrams/description/element-grammar.ts`, `command-table-shorthand.ts`; `tests/unit/description/**`.

## Acceptance
- Given jazabe's two lines, when parsed, then `Component1.url === '[[http://Component1]]'` and
  `Interface.url === '[[http://Interface]]'`, stereotypes unchanged.
- Given every existing shorthand test, then all pass unchanged.

**Observability:** N/A. **Rollback:** Reversible.
