# T1 — Audit table, oracle fixtures, probe matrix

## Context
plantuml-ts is a TypeScript port of PlantUML; the Java at `~/git/plantuml`
is the spec. The 2026-09-19 CodeQL pass proved one injection by rendering a
payload through `renderSync` and grepping the SVG (`.agent-notes/
codeql-2026-09-19.md`); reading the emitter had missed it because the
taint sat two modules upstream. This task turns that method into the
mission's evidence: one row and one green probe test per user-text path,
plus jar renders for the three decisions that need oracle bytes.

## Task
1. For each path below, render a probe with the payload
   `x"onload="alert(1)` (and, where a comment is involved,
   `x--><script>evil()</script><!--`) through `renderSync`, find EVERY
   occurrence in the SVG, and classify it: inside a tag (attribute),
   text content, or comment. Record `path · sink file:line · escaped-where
   · verdict` in `findings/audit-table.md`. Verdicts: `escaped` (entity
   present), `swapped` (font-family `"`→`'`; find and cite the swap site),
   `raw` (defect), `synthetic` (ids not derived from user text), `n/a`
   (unported feature, say why), `dot-audit-only`.
   Paths: element names and aliases (class, state, component, usecase,
   object, participant/actor) into `id=`/`class=`/comments; `[[url]]`,
   `[[url{tooltip}]]`; creole `<img:path>`, `<img:path{scale=…}>`;
   sprites `<$name>`; creole `<color:…>`, `<back:…>`, `<font:…>`,
   `<size:…>`; inline `#color` on every command that takes one, including
   `#red/blue` and `#?light:dark`; skinparam string values reaching
   non-color attributes (`defaultFontName`, `classFontName`,
   `svgLinkTarget`, `linetype`, `dpi`); `<style>` block values; `!theme`
   and `skin` files; `@startdot` labels; title/header/footer/caption/
   legend; note and message text with `"`, `<`, `&`; activity labels and
   swimlanes; `@startjson` keys/values; DOT emission in
   `src/core/svek-dot-emit*.ts` (`hex()` and label tables — ONE row,
   `dot-audit-only`, describe what escaping exists, change nothing).
2. Write the probes as tests in `tests/unit/core/attribute-injection.test.ts`
   (two tests exist; keep them). Add a helper `parsesAsXml(svg)` using
   `DOMParser` from `@xmldom/xmldom` with an `onError` that records; every
   probe asserts it. The font-family `a&b<c` case is a known `raw` defect:
   write it as `it.todo` with the expected assertion in the title, so T3a
   turns it on. Every other probe must be green now.
3. Oracle fixtures with `scripts/oracle-render.sh <out-dir> <puml>` (never
   a hand-typed `java -jar`), saved under `findings/oracles/<name>/`
   as `in.puml` + `jar.svg`:
   - `tooltip-gt`: `A -> B : [[http://e.com{a>b} t]]` — D3's gate
   - `quoted-alias`: `class "n" as "a b"` plus a link to it — D4's record
   - `font-name-chars`: `skinparam defaultFontName a"b&c<d` — what the jar
     does with each character (swap? escape? drop?)
   Quote the relevant attribute bytes from each `jar.svg` into the audit
   table.

## Write-set
- `plans/svg-attribute-escaping-audit/findings/audit-table.md` (create)
- `plans/svg-attribute-escaping-audit/findings/oracles/**` (create)
- `tests/unit/core/attribute-injection.test.ts` (extend)

## Read-set
- `.agent-notes/codeql-2026-09-19.md` (the method and the first probe)
- `tests/unit/core/attribute-injection.test.ts` (existing shape)
- `tests/oracle/svg-conformance/normalize.ts:20-40` (xmldom usage)
- `src/core/svg.ts:139-215` (the escapers and `formatAttrValue`)
- `src/core/klimt/drawing/svg/xml-writer.ts:82-110, 215-240`
- `src/index.ts:361` (`renderSync`)
- `scripts/oracle-render.sh`
- `decisions.md#d3`, `#d4`, `#d7`

## Architecture decisions
D3, D4, D7 (locked). This task gathers evidence; it changes no `src/`.

## Interface contracts
Table columns exactly: `| Path | Sink (file:line) | Escaped where | Verdict | Note |`.
Oracle directories named as above; consumed by T3a.

## Acceptance criteria
- Given every path listed, when probed, then the table has a row and the
  test file has a probe that parses as XML (font-family case as `it.todo`)
- Given `tooltip-gt/jar.svg`, when read, then the table quotes the `title=`
  value verbatim and states whether `>` is raw or `&gt;`
- Given `quoted-alias/jar.svg`, when read, then the table quotes the `id=`
  or comment the jar emits for the quoted alias
- Given the DOT emitters, when listed, then exactly one `dot-audit-only`
  row and `git diff --stat src/core/svek*` is empty

## Quality bar
`npx vitest run tests/unit/core/attribute-injection.test.ts` green (todo
allowed only for the font-family case); `npm run lint`; `npm run typecheck`.

## Boundaries
- Always: render probes; never conclude a path is safe from reading alone
- Never: edit `src/`; re-baseline anything; hand-type `java -jar`

## Observability
N/A — no new observable operations.

## Rollback
Reversible (tests and plan documents only).

## Commit
`test(saea-T1): audit table, oracle fixtures and probe matrix for attribute escaping`
Body: why probes, not reading; the three oracles and what each gates.
