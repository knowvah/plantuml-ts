# T0b: survey harness fixes (D9)

Return only the structured report: commit sha, files, before → after per row.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML (Java spec at
`~/git/plantuml`); read `CLAUDE.md` first. The SVG parity survey
(`scripts/svg-parity-survey.ts`, persistent workers in `scripts/svg-parity-workers.ts`)
computes `dotEqual` by capturing every layout graph through
`setLayoutInputObserver` (`src/core/graph-layout.ts`) and comparing them with the
jar's `svek-N.dot` dumps. cdd5 found three instrument defects:
1. **Nested embeds counted** (gubeca-19, jixibu-01): a `{{yaml}}`/`{{json}}` embed's
   own layout runs (3 graphs for gubeca: measure + draw passes) are captured; the
   jar's nested json/yaml go through Smetana and dump no svek DOT.
2. **Pragma in a comment** (xicili-92): the smetana-pragma detector matches a
   `' !pragma layout smetana` comment line (cdd5 S2 diagnosis `harness:pragma-regex-matches-comment`).
3. **Newpage** (racujo-01): a two-page source is compared as if one page (S2
   `harness:newpage-dot-page-count`).

## Task (TDD)
1. Observer: the callback receives `{ graph, nestedDepth }`; `EmbeddedDiagram`
   increments a depth counter around its nested render (try/finally). The survey
   compares only `nestedDepth === 0` graphs. Other observer consumers keep their
   behaviour (read every caller first).
2. Pragma detector: ignore lines whose first non-space char is `'` (and block
   comments `/' … '/`), per `BlockUml`/preprocessor comment handling.
3. Newpage: compare only the graphs of page 1 with the jar's page-1 dumps (read how
   the jar numbers svek dumps across pages; state the rule you found).
4. Put the new comparison logic in `scripts/lib/survey-dot-equal.ts`: the survey
   file is at the 500-line cap.
5. Re-survey class + unknown into a scratch dir; report every verdict/dotEqual
   change with its cause.

## Write-set
`src/core/graph-layout.ts`, `src/core/EmbeddedDiagram.ts`, `scripts/svg-parity-survey.ts`,
`scripts/svg-parity-workers.ts`, new `scripts/lib/survey-dot-equal.ts`, their tests.

## Interface contracts
`setLayoutInputObserver((e: { graph: DotInputGraph; nestedDepth: number }) => void)`.

## Acceptance
- Given unknown/gubeca-19-lemu434, when surveyed, then dotEqual compares only the
  outer graphs (report the value).
- Given unknown/xicili-92-foke737, then the commented pragma is ignored.
- Given unknown/racujo-01-veme537, then only page 1 is compared.
- Given the full class + unknown survey, then no fixture without an embed/newpage/
  pragma changes verdict or dotEqual.

## Quality bar
TDD; `npx vitest run` over touched tests + `tests/unit/scripts/` +
`tests/oracle/class-dot-parity.test.ts` (report the collected count);
`npm run typecheck`; `npx eslint <changed>`. No full `npm test`. Complexity hook.
Worktree rules: README "Execution rules". Commit `fix(survey): …` (no attribution).

**Observability:** N/A. **Rollback:** Reversible.
