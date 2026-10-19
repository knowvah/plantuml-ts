# T5a — xagonu: `\r` in link labels and the missing link child (item 29)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout.

## Context
`unknown/xagonu-36-sudi116` (45/887) has `skinparam defaultTextAlignment right`,
`skinparam linetype ortho` and `left to right direction`. Layout is equal to native (codd T9 emits the
self-loops). Link labels such as `A.Interact with app` render as `\rA.Interact with app`: the text node
carries a literal `\r`, and `textLength` grows by about 7.88. Each affected link `<g>` also has 3 children
where the jar has 4. Find where the jar consumes a leading `\r` in a link label (creole/`Display` line
alignment markers: `\l`, `\r`, `\n`), and which element the jar draws that we omit.

## Task
Write two diagnosis artifacts (label text; childCount). Fix both at their origin, with tests.

## Write-set
`src/diagrams/description/{link-grammar.ts,link-grammar-regex.ts,link-grammar-endpoints.ts,renderer-edge.ts,link-edge-attrs.ts}`,
`tests/unit/description/**`. If the `\r` handling belongs in shared `Display`/creole code in `src/core/**`,
that is stop 1: report the origin.

## Acceptance
- Given a link label `"\rA. text"` under `defaultTextAlignment right`, when rendered, then the `<text>`
  content and `textLength` equal the jar's.
- Given xagonu, then every `g[26..29]`-family label and childCount diff clears. Report the remaining count.
- Given the description surveys, then there are no losses.

**Observability:** N/A. **Rollback:** reversible.
