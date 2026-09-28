# T1b: creole-font-hyperlink-and-sprite-stroke

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md`
(cdd5 + T0d columns) and `diagnosis/verify.md`.

## Task (TDD)
1. **hyperlink colour (D3).** `StripeSimple.java:224-225` builds a URL atom from the
   built `FontConfiguration`, whose hyperlink colour comes from
   `style.value(PName.HyperLinkColor)` (`FontConfiguration.java:213-219`). Add optional
   `hyperlinkColor` to `UText.ts`'s `FontConfiguration`, `getHyperlinkColor` to
   `src/core/style/ISkinSimple`, populate it in the three skin-simple builders, and
   read it in `CommandCreoleUrl.ts` (today a hard-coded `#0000FF`). Include the
   stereotype-scoped `.normal`/`.otro { HyperlinkColor }` case jixipo/zivenu use.
2. **sprite ambient stroke.** cdd5 T4c disproved the diagnosed mechanism:
   `svg-nanoparser-shapes.ts` matches `SvgNanoParser.java:187-215`. The jar's unset
   sprite `stroke-width` inherits the caller's ambient stroke (0.5 in state/card
   body rows, 1 in a note; oracle experiments); the port's
   `creole-atoms-image-resolver.ts:181` seeds `UStroke.simple()`. Find where upstream
   sets the ambient stroke for those body rows (read the body/member-row drawers),
   thread it into the collector, and prove it with both rows.

## Rows
- `unknown/jixipo-21-mefu703` (creole-url-hyperlink-color-hardcoded)
- `unknown/zivenu-37-nace681` (creole-url-hyperlink-color-hardcoded)
- `unknown/jefidu-98-gisu131` (sprite-ambient-stroke)
- `unknown/sprite-SVG-Fill-Stroke-Combinatory-1` (sprite-ambient-stroke)

## Write-set
- `src/core/klimt/shape/UText.ts`
- `src/core/style/ISkinSimple.ts`
- `src/core/klimt/creole/command/CommandCreoleUrl.ts`
- `src/core/svek/image/EntityImageDescriptionDelegates.ts`
- `src/core/svek/image/EntityImageDescriptionName.ts`
- `src/core/annotations/blocks-creole.ts`
- `src/core/creole-atoms-image-resolver.ts`
- their unit tests under `tests/`

## Read-set
`.agent-notes/cdd5-*.md` (T5a, T4c notes in cdd5 journal rows 73, 81); the Java above.

## Interface contracts
none (optional fields only).

## Acceptance
- Given jixipo/zivenu, when rendered, then every `a/text/@fill` equals the jar's.
- Given a `[[url]]` with no style override, then the colour is still `#0000FF` (upstream default) — no mover elsewhere.
- Given jefidu and sprite-SVG-Fill-Stroke-Combinatory-1, then sprite path stroke-width equals the jar's, or the upstream site is quoted and the residual stated.
## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D3, D7. dot-engine is off limits.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over the tests
covering changed modules plus: `tests/unit/class/`, `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`, `tests/oracle/class-dot-parity.test.ts`, `description.golden.ratchet.test.ts`, `state.golden.ratchet.test.ts`, `object.golden.ratchet.test.ts`, `sequence.diff-baseline.ratchet.test.ts`, `activity.diff-baseline.ratchet.test.ts`, `activity.style-baseline.test.ts`, `activity.text-baseline.test.ts` (non-class movement: report it with the mechanism, never re-pin) (report the collected file count). `npm run
typecheck`; `npx eslint <changed files>`. No full `npm test`. New src module ⇒
`npm run catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per
function, CCN ≤10, ≤5 params, ≤500-line files. Worktree rules: README "Execution
rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; cite `file:line` on every ported
  symbol (`@see`) and constant.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move), or Java that contradicts the stated mechanism.
- Never: fit a value, touch the oracle or dot-engine, push.

## Commit
`fix(<scope>): <what, lowercase, ≤72 chars>`, one per family; body with mechanism,
upstream citation, rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
