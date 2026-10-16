# T1a report

## Commit
5b9104d1d feat(description): capture entity [[url]] token in the parser
Files: src/diagrams/description/{ast,parse-helpers-strings,parse-helpers,command-table-containers,command-table-helpers}.ts; tests/unit/description/dur-t1a-entity-url.test.ts (new); docs/catalog.md (regenerated, exports changed). No type move / split.

## Render-diff
No target rows. Nothing in render/layout reads node.url, so output is unchanged by construction.

## Diagnosis artifact
- Mechanism: the inline [[url]] is removed by stripUrl / stripTrailingUrl in parseNameSection and never stored; NameSection, makeNode and DescriptiveNode have no url field.
- Origin: Java CommandCreateElementFull.java:113 (UrlBuilder.OPTIONAL group), :333-337 (urlString = arg.get(URL_KEY); entity.addUrl). Port parse-helpers.ts parseNameSection (stripUrl call, ~:263).
- Chain: token stripped -> no field -> T4 cannot build the Url -> no <a> wrapper in SVG.
- Ruled out: token inside a quoted display or [ ... ] code (display text, not URL; extractUrlToken skips both and stereotype spans, same walk as stripUrl). stripUrl output unchanged (test pins `A [[u]] #red` -> `A #red`).
- Trace of element-grammar-nosymbol.ts DECORATION: the regexes admit the [[url]] token and pass the whole rest to the command-table executors -> parseNameSection (leaf keywords, containers, :actor:, (usecase) bare forms all reached). Confirmed by tests; no change needed there.

## Interface
DescriptiveNode.url?: string (raw token); NameSection.url?: string; extractUrlToken exported from parse-helpers-strings and re-exported from parse-helpers; makeNode(..., decorations?: { url?: string | undefined }) (`| undefined` needed for exactOptionalPropertyTypes at call sites).

## Sites
Passed: command-table-containers.ts keyword containers (two), keyword leaf (~207), colon-actor, paren-usecase/actor (~229,244); command-table-helpers.ts shorthandNode.
Not passed (T1b, bracket shorthand): command-table-containers.ts :61 and :198 (parseBracketDeclaration results). Endpoint auto-creates: none.

## Surveys (component, usecase), before = base f7f152d95
component: 180/12/74 conformant/structural/diverged, 0 timeout -> 176/12/71, 7 timeout
usecase: 54/2/29, 8 timeout -> 54/2/27, 10 timeout
Every per-slug verdict mover involves a `timeout` on one side (machine load from parallel agents): component 7 (all -> timeout), usecase 10 (e.g. fosito/fotisa/fumitu timeout -> conformant, kijufe conformant -> timeout). No conformant<->diverged or other non-timeout verdict change. No verdict movers attributable to this change; 0 losses.
Files: /private/tmp/claude-501/dur-T1a/{component,usecase}-{before,after}.json

## Tests
Targeted run: 79 files collected, 79 passed; 1513 tests passed (tests/unit/description, tests/architecture, tests/oracle/svg-conformance/description.*.test.ts). typecheck, eslint, prettier clean. Catalog drift test failed once before `npm run catalog`, passes after.

## Residuals / write-set extensions
None. Note: `url` capture takes the FIRST top-level token only; a second is dropped (matches the single URL group).
