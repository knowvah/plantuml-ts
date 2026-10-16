# T1a — entity URL capture in the parser (Family A)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `dur/T1a`.

## Context
The jar attaches an inline `[[url]]` on a declaration to the entity (`CommandCreateElementFull.java:113,
333-337`) and on a package to the group (`CommandPackageWithUSymbol.java:125,208-212`); also
`CommandCreateElementParenthesis.java:213-218`, `CommandCreateElementMultilines.java:216-220`. The port
throws it away: `stripUrl` (`parse-helpers-strings.ts:429-462`), `parseNameSection` (`parse-helpers.ts:257`),
no field on `NameSection` (`:80-88`), `makeNode` (`:152-167`) or `DescriptiveNode` (`ast.ts:26-110`).
Seam map: `measurements/seed/seam-map.md` (Family A).

## Task
1. Add `extractUrlToken(rest)` beside `stripUrl`: same quote/bracket walk, returns the first top-level
   `[[…]]` token verbatim (brackets included) or `undefined`. `stripUrl`'s output must not change.
2. `NameSection.url`; `parseNameSection` sets it in both the `stripUrl` and `stripTrailingUrl` branches.
3. `DescriptiveNode.url?: string` (raw token, D4). `makeNode(…, decorations?: { url?: string })` (D8).
4. Pass the url at the `makeNode` sites in `command-table-containers.ts` (`:61,108,140,198,207,229,244`)
   and `command-table-helpers.ts:46`, for leaves and containers. Trace `element-grammar-nosymbol.ts:29-40`
   DECORATION (`RE_BARE_DECORATED_DECL`/`RE_BARE_QUOTED_DECL`, containers `:226-244`) and confirm the url
   reaches `parseNameSection`; if it does not, report it (that file is not in your write-set).
5. Endpoint auto-creates (`parser.ts:220`, `parse-state.ts:278`) get no url. Bracket shorthand is T1b;
   `url of` is T1c.

## Write-set
`src/diagrams/description/{parse-helpers-strings,parse-helpers,ast,command-table-containers,command-table-helpers}.ts`;
`tests/unit/description/**`.

## Interface contract (consumed by T1b, T1c, T4)
- `DescriptiveNode.url?: string` — the raw `[[…]]` token, e.g. `'[[http://www.yahoo.com{This is Dog}]]'`.
- `makeNode(id, display, symbol, …, decorations?: { url?: string })` — optional, last.

## Acceptance
- Given `component foo1 as "My comp" [[My_component_1]]`, when parsed, then `node.url === '[[My_component_1]]'`
  and the display stays `My comp`.
- Given `actor Mamal [[http://www.google.com]]` and `usecase Dog [[http://www.yahoo.com{This is Dog}]]`,
  then both nodes carry their tokens.
- Given `package P [[http://x]] {` and `rectangle R [[http://y]] {`, then the containers carry their tokens.
- Given every existing description parser test, then all pass unchanged (no display changes).
- No render change yet: surveys of component and usecase show no verdict movers (state it).

**Observability:** N/A. **Rollback:** Reversible.
