# T2f: hyperlink-and-sprite-stroke-wiring

Added at the b1 close (journal rows 28–29): T1b landed the D3 infrastructure
(`FontConfiguration.hyperlinkColor`, `ISkinSimple.getStyleHyperlinkColor`,
`ChromeTextPaint.hyperlinkColor`, `SpritePrimitiveCollector.create(ambientStroke)`)
but every producer of a real value sits outside its write-set. This task wires the
producers. Read `.agent-notes/cdd6-T1b.md` first: it holds every `file:line` below
with the Java citation.

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md`
(cdd5 + T0d columns), journal rows 28–29, `.agent-notes/cdd6-T1b.md`.

## Task (TDD, D3)
1. **Classifier/member hyperlink colour (jixipo, zivenu).** Upstream builds the
   text `FontConfiguration` with `Style#getFontConfiguration` (`Style.java:265`,
   `style.value(PName.HyperLinkColor)`), so `<style> { HyperlinkColor }` at root
   (jixipo) and under a stereotype selector `.normal`/`.otro` (zivenu) reach
   `StripeSimple.java:224-225` → `FontConfiguration#hyperlink()`
   (`FontConfiguration.java:253-256`). Port: resolve `HyperlinkColor` through the
   class font cascade (`style-cascade-class-font.ts`, same cascade the font colour
   uses, stereotype-keyed like `fontByStereo`), and set `hyperlinkColor` where
   `usymbol-resolve.ts:169-183#textFont` builds the initial `FontConfiguration`
   from the `Theme`. If the value must be carried on `Theme`, the field lives in
   the existing `ElementColors` bucket (D2, T1a's model; `theme-graph-colors.ts` is
   NOT in this write-set — if a new bucket field is unavoidable, STOP and report).
2. **Title/annotation hyperlink colour.** `chrome.ts#buildMainframeTitleBlock` and
   `blocks.ts#buildAnnotationBlock` build the chrome `FontConfiguration` through
   `chromeFontConfiguration` from an `AnnotationBoxStyle` that has no
   `hyperlinkColor`; add the optional field to `annotation-style-types.ts` and
   populate it from the same resolved style value. Only if a corpus row exercises
   it (check `tests/corpus` for a title/caption `[[url]]` under `HyperlinkColor`);
   otherwise land the field + a unit test and say so.
3. **Sprite ambient stroke (jefidu, sprite-SVG-Fill-Stroke-Combinatory-1).**
   `SvgNanoParser.java:187-215`: a path without its own `stroke-width` inherits
   the caller's ambient stroke; upstream's ambient for a `card`/`state` body is
   `plantuml.skin:93` `element { LineThickness 0.5 }`, a note's is root's `1.0`
   (`plantuml.skin:15`). `description/renderer-entity.ts:252-254` already computes
   `resolveElementLineThickness(theme, node.symbol) ?? ENTITY_STROKE_WIDTH` as
   `paint.stroke`; forward it at `:269` into `makeAtomImageResolverFor(sprites,
   …)` (T1b's optional parameter). This is the DESCRIPTION engine: run its ratchet
   and report every mover with the mechanism (D7).

## Rows
- `unknown/jixipo-21-mefu703` (creole-url-hyperlink-color-hardcoded)
- `unknown/zivenu-37-nace681` (creole-url-hyperlink-color-hardcoded)
- `unknown/jefidu-98-gisu131` (sprite-ambient-stroke)
- `unknown/sprite-SVG-Fill-Stroke-Combinatory-1` (sprite-ambient-stroke)

## Write-set
- `src/core/annotations/chrome.ts`
- `src/core/annotations/blocks.ts`
- `src/core/annotations/annotation-style-types.ts`
- `src/core/decoration/symbol/usymbol-resolve.ts`
- `src/core/style-cascade-class-font.ts`
- `src/diagrams/description/renderer-entity.ts`
- their unit tests under `tests/`

## Read-set
`.agent-notes/cdd6-T1b.md`; T1b's commits 550197266, 3a6594fc2; `src/core/klimt/shape/UText.ts`, `src/core/style/ISkinSimple.ts`, `src/core/creole-atoms-image-resolver.ts` (T1b's seams, read-only here); `Style.java:265`, `FontConfiguration.java:253-256`, `StripeSimple.java:224-235`, `SvgNanoParser.java:187-215`, `plantuml.skin:15,93`.

## Interface contracts
T1b's: `FontConfiguration.hyperlinkColor?: string`; `ISkinSimple.getStyleHyperlinkColor?(): string | null`; `SpritePrimitiveCollector.create(ambientStroke?: UStroke)`; `makeAtomImageResolverFor(sprites, …ambientStroke)`. Do not change them.

## Acceptance
- Given jixipo and zivenu, then the `a/text/@fill` diffs close (render-diff 4/0 → 0/0 or a stated residual).
- Given jefidu and sprite-SVG-Fill-Stroke-Combinatory-1, then sprite `stroke-width` is 0.5 in the card body (5/0 → 0/0 or a stated residual).
- Given the description ratchet, then every mover is reported with its mechanism.

## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D2, D3 (as amended at T1b), D7. dot-engine is off limits.

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
