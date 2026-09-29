# T3g: hyperlink-and-maximumwidth-buckets

Added at the b2 close (journal rows 40–41). Two families that share the D2 bucket
files. The hyperlink-colour family was chased one file short by T1b (seams) and T2f
(chrome + description forward); every producer site is now named with a
`file:line` — this task must land the producers, not stop at the boundary.

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md`,
journal rows 28, 36, 40; `.agent-notes/cdd6-T1b.md`. Seams already landed (read
only): `FontConfiguration.hyperlinkColor?` (UText.ts), `ISkinSimple.getStyleHyperlinkColor?`,
`ChromeTextPaint.hyperlinkColor` + `AnnotationBoxStyle.hyperlinkColor?` (T2f),
`CommandCreoleUrl.ts` reading `saved.hyperlinkColor ?? '#0000FF'`.

## Task (TDD, D2)
1. **HyperlinkColor bucket + classifier/member producer (jixipo, zivenu).**
   Upstream: `Style.java:265` `style.value(PName.HyperLinkColor)` builds the
   `FontConfiguration` (`FontConfiguration.java:213-219`); `StripeSimple.java:224-225`
   draws the URL atom from it. jixipo sets it at `<style> root`, zivenu under
   `.normal`/`.otro` stereotype selectors. Add `hyperlinkColor?` (and a by-stereo
   map, like `fontByStereo`) to `ElementColors` in `theme-graph-colors.ts`, fill it
   in `style-map-element.ts#collectElementStyleBuckets` (T1a's pattern: Java cite on
   the field), resolve it in `style-cascade-class-font.ts` beside the font colour,
   and set `hyperlinkColor` where `usymbol-resolve.ts:169-183#textFont` builds the
   initial `FontConfiguration`.
2. **Title/annotation producer.** `annotation-style-overrides.ts#applyStyleOverrides`
   resolves `fontcolor` (line ~124) but has no `hyperlinkcolor` setter: add it so
   `AnnotationBoxStyle.hyperlinkColor` is populated from `<style> root/title {
   HyperlinkColor }` (jixipo's title `[[test link]]` is 1 of its 4 diffs).
3. **json MaximumWidth (nadedo).** `Style.java:330-332` `wrapWidth()` reads
   `PName.MaximumWidth`; `FromSkinparamToStyle.java:250`; `BodierJSon.java:85`
   passes `style.wrapWidth()` to `TextBlockCucaJSon`, whose `getTextBlock`
   (`:184-190`) wraps BOTH key and scalar-value cells via `Display#create0`. Add a
   `maximumWidth` bucket mirroring `minimumWidth` (`style-map-element.ts:263-270`,
   `theme-graph-colors.ts:150`, `theme-element-resolve.ts:139-141`), read it in
   `class-json-sizing.ts` and wrap the cells.

## Rows
- `unknown/jixipo-21-mefu703` (creole-url-hyperlink-color-hardcoded)
- `unknown/zivenu-37-nace681` (creole-url-hyperlink-color-hardcoded)
- `unknown/nadedo-37-nesa665` (json-leaf-maximumwidth-ignored)

## Write-set
- `src/core/style-map-element.ts`
- `src/core/theme-graph-colors.ts`, `src/core/theme-graph-colors-a.ts`, `-b.ts`, `-c.ts` (whichever declares the bucket)
- `src/core/theme-element-resolve.ts`
- `src/core/style-cascade-class-font.ts`
- `src/core/decoration/symbol/usymbol-resolve.ts`
- `src/core/annotations/annotation-style-overrides.ts`
- `src/diagrams/class/class-json-sizing.ts`
- their unit tests under `tests/`

## Read-set
`.agent-notes/cdd6-T1b.md`; T1a's `tests/unit/core/style-map-buckets-cdd6.test.ts`; T2f's commits cffad2792, ab9b94959; `Style.java:265,330-332`, `FontConfiguration.java:213-219`, `StripeSimple.java:224-235`, `TextBlockCucaJSon.java:184-190`.

## Interface contracts
`ElementColors` gains `hyperlinkColor?`, `hyperlinkColorByStereo?`, `maximumWidth?` only (D2, Java cite on each).

## Acceptance
- Given jixipo and zivenu, then every `a/text/@fill` diff closes (4/0 → 0/0 or a stated residual).
- Given nadedo, then svg width/height equal the jar's (510x100) or the residual is stated.
- Given the non-class ratchets (shared bucket files), then every mover is reported with its mechanism.

## Architecture decisions (locked)
`decisions.md` D1–D12; this task leans on D2, D7. dot-engine is off limits.

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
