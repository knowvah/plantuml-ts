# T3f: class-singles-verified

(Re-balanced at the b2 close, journal row 41: nadedo moved to T3g. Also on fokudi
(T2a residual, row 39): `class-namespace-folder-outline.ts#FolderTabPaint` has no
dasharray field — add it, `emptyPackagePaint` already computes `dash`; and dezobu's
TYPE1 colour (`class-multiline-element.ts:196` `applyDecorations(..., false)` vs
`CommandCreateElementMultilines.java:117,233-234`) + the `<<$archimate/…>>` sprite
dropped by `extractNodeStereotype` — both added below.)

Added at the b2 close (journal rows 36–37). T2e diagnosed its four rows to HIGH
confidence and stopped: none is fixable in T2e's write-set. This task carries the
diagnosed write-sets. Independent families, one commit each; a family whose fix
grows beyond its listed files is reported `open -> cdd7` with the file named, not
edited further.

Return only the structured report: commit sha(s), files changed, per-row
render-diff structural/numeric before → after, residuals with mechanisms (Java +
port `file:line`), write-set extensions, test counts. No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992`) is the specification. Read `CLAUDE.md`
first ("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting",
"Preserve upstream names"). The oracle is the 1.2026.8beta1 jar; caches at
`test-results/dot-cache/<tree>/<slug>/in.svg`. Row mechanisms: `fixtures.md` and
journal row 36 (T2e's diagnosis, every `file:line`).

## Task (TDD)
1. (Moved to T3g at the b2 re-balance, journal row 41: nadedo's MaximumWidth bucket
   shares T3g's bucket files.)
2. **reversecolor mapper (tozizu).** `TitledDiagram.java:301-312` `muteColorMapper`:
   `reversecolor dark` → `ColorMapper.LIGTHNESS_INVERSE` (`ColorMapper.java:74`,
   `ColorUtils.getReversed`, `ColorUtils.java:139-166`), which round-trips through
   `HUSLColorConverter` (HSLuv); other values → `ColorMapper.reverse(ColorOrder)`.
   Port `HUSLColorConverter.java` and `ColorOrder.java` as new modules under
   `src/core/klimt/color/` (upstream names), model the mapper beside `monochrome`
   in `theme.ts`, and apply it at the same post-process point as
   `applyMonochromeToFragment` (`renderer.ts:451`). This is NOT the grayscale of
   `class-monochrome.ts`. Unit-test the converter against values computed from
   the Java (quote the constants).
3. **descriptive leaf with visible members (felixe).**
   `CommandCreateElementMultilines.java` TYPE1 (regex ending `\[(.*)`, `executeNow`)
   collects the bracket lines into the entity's multi-line DISPLAY
   (`lines.toDisplay()`, `addFirst(descStart)`, `add(lineLast)`) and creates a
   `LeafType.DESCRIPTION` entity that `GeneralImageBuilder.java:158-166` routes to
   `EntityImageDescription` (desc block `:181-191`). The port's declaration parser
   attaches `a`/`b`/`c` as `members`, so `tryMeasureDescriptionLeaf`
   (`class-layout-generic-classifier.ts:79-110`) declines. Re-mirror at the parser
   (display lines, not members) — never a sizing-time special case.
4. **nuveji clearArea + note title rows.** (a) `UHorizontalLine.java:154-166`
   `drawTitleInternal(..., clearArea)` draws a pre-clear rect when `true`; only
   `USymbolDatabase.java:111` / `USymbolNode.java:116` pass true, by wrapping the
   BODY draw. The port's `UHorizontalLine.ts:120-133` no-ops and the desc-body draw
   is never wrapped by `MyUGraphicDatabase` (`USymbolDatabase.ts:166` wraps only
   `asSmall`). Wrap the desc-body draw for database/node in the class entity
   renderer and port the clear rect. (b) The note's `==Title==` / `--Another
   title--` lines draw nothing (`note-layout-measure-rows.ts:62-76` names them an
   unbuilt remainder): port the titled separator rows (`CreoleHorizontalLine.java`,
   `UHorizontalLine.java` title arm). The thickness half (element 0.5) is T2b's
   (journal row 37); measure after the b2 close.

5. **colede table cell alignment (T2d residual, journal row 45).** A `|<r>...|`
   cell's alignment marker is parsed and stripped but never applied to the drawn x
   (`NoteTableCell` doc in `note-layout-measure-table.ts`); port `AtomTable.java`'s
   per-cell horizontal alignment (quote the lines). Δ1.462 on one text x.

## Rows
- `unknown/colede-79-give418` (class-note-table-bespoke; alignment residual only)
- `unknown/fokudi-24-limo685` (package-borderstyle-unported; folder-leaf dash, T2a row 39)
- `unknown/dezobu-62-vuzu421` (embedded-skinparam-hoisted; TYPE1 colour + stereotype sprite, T2a row 39; embed size is T2b's)
- `unknown/tozizu-96-voka262` (reversecolor-mapper-unported)
- `unknown/felixe-38-dilu011` (descriptive-leaf-with-members)
- `unknown/nuveji-19-jabi587` (desc-separator-thickness-cleararea; (b)(c) here)

## Write-set
- new `src/core/klimt/color/HUSLColorConverter.ts`, new `src/core/klimt/color/ColorOrder.ts`, `src/core/theme.ts`, `src/diagrams/class/class-monochrome.ts`, `src/diagrams/class/renderer.ts` (item 2)
- `src/diagrams/class/class-declaration-parser.ts`, `src/diagrams/class/class-parse-state.ts`, `src/diagrams/class/class-layout-generic-classifier.ts` (item 3)
- `src/core/klimt/shape/UHorizontalLine.ts`, `src/diagrams/class/renderer-usymbol-entity.ts`, `src/diagrams/class/note-layout-measure-rows.ts`, `src/diagrams/class/note-layout-measure.ts`, `src/diagrams/class/renderer-note-lines.ts` (item 4)
- `src/diagrams/class/class-namespace-folder-outline.ts` (fokudi), `src/diagrams/class/class-multiline-element.ts` (dezobu)
- `src/diagrams/class/note-layout-measure-table.ts` (colede)
- their unit tests under `tests/`

## Read-set
journal row 36; T2e's transcript is gone — the mechanisms above are the record; `.agent-notes/cdd5-*.md`; T1a's `tests/unit/core/style-map-buckets-cdd6.test.ts` (bucket pattern).

## Interface contracts
none (the bucket model is T3g's).

## Acceptance
- Given tozizu, then every mapped colour equals the jar's (`svg/@background` #010101 …) or the residual is stated.
- Given felixe, then the leaf is 72 high (or the residual is stated).
- Given nuveji, then the clear rect and the titled separators are drawn (childCount 14 / 12).
- Given the non-class ratchets (theme.ts, UHorizontalLine.ts, style buckets are shared), then every mover is reported with its mechanism.

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
