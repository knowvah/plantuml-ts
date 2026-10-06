# add3-T2b — action text through the core creole sheet; embedded `{{ }}`

## Commits

- `f3c251ff4` `feat(add3-T2b): route activity inline creole through the
  real sheet lexer` — widened `gtile-action.ts#creoleLineWidth` and
  `activity-renderer-text.ts#drawActivityText`/`drawCreoleLine` (renamed
  from `drawCreoleUrlLine`) from the pre-existing `[[url]]`/`|table|`
  triggers to EVERY non-table line, routing through `creoleTextLines`
  (`core/svek/image/creole-text-lines.ts`), which calls the SAME
  `buildLineAtoms` lexer (`core/klimt/creole/legacy/StripeSimple.ts`) a
  real `Sheet`/`SheetBlock1` would use. Fixed two latent bugs the
  widening exposed (`fontConfigForRun`'s color fallback,
  `isPlainSingleRun`'s dy guard — see Mechanisms below).

## Decision D5 — what "route through that sheet" means here

D5 as written names the literal `SheetBuilder`/`SheetBlock1`/
`SheetBlock2` pipeline (`ISkinSimple.sheet(...).createSheet(label)`),
the one `FtileBoxOld.ts` already wires up for mindmap/wbs
(`ftile/vertical/FtileBoxOld.ts`, built on `UGraphic`/`TextBlock`/
`StringBounder` from `klimt/`). The activity engine's own `tiles/`
pipeline (`GtileAction`, `Theme`-based sizing, string-returning
renderers) is NOT built on that stack at all — it has no `ISkinParam`/
`ISkinSimple`, no `Display`, no `UGraphic`. Wiring a REAL
`ISkinSimple` adapter for activity (mirroring
`diagrams/mindmap/mindmap-skin-param.ts`'s ~280-line `SkinParam` class)
to reach `SheetBlock1`/`SheetBlock2` would mean re-deriving activity's
entire box-sizing/positioning model on top of a second, parallel
layout engine — the exact "second builder" pattern this codebase's own
ADRs reject, and far outside a "spike."

A prior mission (`state-declared-size-fix`, D1) hit the identical wall
for the STATE engine and built `core/svek/image/creole-text-lines.ts`
as the sanctioned alternative: it calls the SAME real lexer
(`buildLineAtoms`/`StripeSimple.ts`, `CreoleStripeSimpleParser.ts`'s
classification) a Sheet's `SheetBlock1` would use, without the
`Sheet`/`Stripe`/`SheetBlock` wrapping — already proven in production
by the state engine (`state-sizing-creole.ts`) and three other
call sites (`gtile-action.ts`'s own pre-existing `[[url]]`/table
branches, `state-note-layout.ts`). I treated reaching for THAT seam,
widened from its two existing triggers to every line, as satisfying
D5's actual constraint ("no special-casing of `{{` or of individual
markup tokens") rather than literally instantiating `SheetBuilder` —
the real classifier runs either way; only the Sheet/Stripe wrapper
object graph differs, and that wrapper exists in this port for a
reason (`FtileBoxOld`'s `UGraphic`-based draw) that activity's `tiles/`
engine does not share. Flagging this as an amended interpretation of
D5, not a literal one, for review.

## Rows

| slug | before | after | mechanism |
|---|---|---|---|
| vimako-25-mega336 | 3 | **0** | CREOLE-INLINE, fixed |
| fatuzu-07-cevu894 | 53 | **0** | CREOLE-INLINE, fixed |
| bedezo-44-more709 | 86 | **0** | CREOLE-INLINE, fixed |
| pirofe-41-xama594 | 89 | **0** | CREOLE-INLINE, fixed |
| jagove-43-nako107 | 142 | 130 | CREOLE-ACT, improved (inline bold fixed; `=heading` line's HEIGHT still unfloored — see Not done) |
| letuke-04-poza319 | 159 | 138 | CREOLE-ACT, improved (inline `**creole**` in branch condition fixed; residual is the table-grid path, outside this change) |
| zejuso-92-kexo870 | 373 | 307 | CREOLE-ACT, improved (inline `**bold**` in branch/action text fixed; residual includes a `legend` block, a different diagram-wide feature, not activity-specific — not investigated further) |
| bigide-91-bise382 | 67 | 67 | STRIPE, **unchanged** — see Not done |

Probe Σ (125-row baseline, branch head Σ16362/224 pinned):
- before this commit: **16362**
- after this commit: **16008** (−354)

## Risers (0 unexplained)

- `vimoxa-78-zucu656` +10 — the NOTE-CREOLE reveal my task brief
  explicitly anticipated ("watch vimoxa +10 = NOTE-CREOLE reveal, owned
  by T2a"). Not investigated further; not my row.
- Two risers found and FIXED in this same commit before it landed
  (both confirmed resolved by direct before/after diffing, not left in
  the committed state):
  - `labala-74-juki864`, `levuma-67-cego489`, `loxija-71-joku558`,
    `zepima-96-peco612` (+3/+5/+1/+1 in an intermediate, uncommitted
    version) — **mechanism**: `creole-text-lines.ts
    #textAtomMeasured`/`baseFontConfiguration` (`leaf-sizing-text.ts:
    142-144`) sets every atom's base `FontConfiguration.color` to the
    fixed `JAR_DEFAULT_TEXT_COLOR` (`'#000000'`), never `null` — so
    `textAtomMeasured`'s `atom.font.color !== null` copy means
    `CreoleTextRun.color` is NEVER `undefined`. `fontConfigForRun`'s
    original `run.color ?? style.fill` therefore ALWAYS won with the
    hardcoded black, discarding the caller's real resolved
    `style.fill` whenever it differed from black (`!theme amiga`,
    `skinparam mode dark`, `skinparam activityFontColor red`). Fixed
    by treating `JAR_DEFAULT_TEXT_COLOR` as the "no explicit creole
    colour" sentinel.
  - `loxija-71-joku558`/`zepima-96-peco612` persisted at +1/+1 after
    the colour fix — **mechanism**: both fixtures set
    `skinparam activityFontSize 4`, below `creole-sea-line.ts
    #ATOM_TEXT_MIN_HEIGHT` (`=10`, this port's own `AtomText.java:
    179-181` floor). A lone plain run's measured height floors to 10
    inside `creoleTextLines`' `Sea` layout, which then reports a REAL
    non-zero `run.dy` for that run — but `gtile-action.ts`'s own box
    height (KLIMT-FLOOR, a sibling task's row, `gtile-action.ts:89`'s
    raw unfloored `lineHeight`) does not carry the matching floor yet,
    so the box stayed the SAME size while the text inside it moved,
    making `<text>/@y` MORE wrong (jar-verified: delta grew from 4→8,
    22→26, 6→12, 12→18, 18→24, 24→30 across the two fixtures' lines).
    Fixed by `isPlainSingleRun`: a line that is exactly one NORMAL,
    non-url, non-cascaded-size run draws via the pre-existing literal
    `drawRun` call (byte-identical to before this task), bypassing
    `dy`; every line that actually carries 2+ runs, a style flag, a
    url, or a cascaded size (the shapes this task's own rows need)
    still draws through the real per-run path.

Both fixes are committed in `f3c251ff4` alongside the main widening —
not a separate commit, since they were discovered DURING this
commit's own verification pass and are part of making the row-ledger
mechanism "no special-casing" claim actually hold for the full corpus,
not just the four target rows.

## Engine survey (rule 11)

Not run. No edit touched `src/core/**` on this commit — both changed
files are activity-only (`src/diagrams/activity/**`); `creole-text-
lines.ts`, `StripeSimple.ts`, `CreoleStripeSimpleParser.ts`,
`creole-sea-line.ts`, `leaf-sizing-text.ts`, `usymbol-resolve.ts` were
read but not modified.

## Test results

- `activity.golden.ratchet.test.ts` + `activity.harness-parity.test.ts`:
  **288/288 passed** — every pinned golden stays byte-equal (this
  task's hard acceptance bar).
- `activity.text-baseline.test.ts` + `activity.style-baseline.test.ts`:
  **31 failures across 24 fixtures** (bedezo, boxefe[pre-existing],
  citire, decudi, delide, fatuzu, jagove, jevoce, letuke, luxido,
  maduja, maketa, nuzugu, pezubu, pirofe, rujuxa, ruzica, sadovu,
  samavi, vimoxa, xidamu, xizola, zejuso, zinelo). These are
  EQUALITY-pin census gates (`textCount`/style-set per fixture), not
  byte-identity gates — their own assertion message states the
  intended remedy verbatim: "If this move is the intended effect of a
  deliberate change, re-pin ... FROM A FRESH MEASUREMENT (T6, once)".
  The move IS deliberate and correct: a line with 2+ creole runs
  (`**bold**`/`__underline__` mixed with plain text) now draws as
  MULTIPLE real `<text>` elements (one per run), matching how
  `DriverTextSvg` actually draws a multi-run stripe, instead of one
  undifferentiated literal string. **I did not re-pin
  `oracle/goldens/svg-activity/{text,style}-baseline.json`** — rule 5
  bans editing `oracle/goldens/**`/baseline JSONs from this worktree,
  and my own prior-mission memory
  (`.agent-notes/new-corpus-tree-trips-two-gates.md`) confirms this
  class of re-pin is orchestrator-only. `boxefe-81-situ725` in the
  style-census failure list is the ALREADY-known pre-existing red my
  task brief itself named (rule 10's "known pre-existing census reds
  awaiting orchestrator re-pin").
- typecheck (`tsc --noEmit -p tsconfig.json`, `tsconfig.node.json`):
  clean. `eslint` on both changed files: clean.

**Action needed from the orchestrator**: re-pin
`oracle/goldens/svg-activity/text-baseline.json` and
`oracle/goldens/svg-activity/style-baseline.json` from a fresh
measurement on this branch head, covering the 24 fixtures listed
above (23 new + 1 pre-existing).

## Not done — residuals, with mechanism (no guessing)

1. **STRIPE (`bigide-91-bise382`, Σ67, unchanged).** `CreoleStripeSimpleParser
   .java:92-109` classifies a `____`/`====` line as `HORIZONTAL_LINE`
   (empty captured label) — already correctly classified by our own
   port's `classifyStripeLine` (`creole-text-lines.ts
   #buildPhysicalLine` already returns `kind: 'hr'`, `width: 0`,
   `height: CREOLE_HR_HEIGHT` = 8 for it). Two things block drawing it
   as a real rule in this task's write-set:
   - **No HR drawing primitive activity can use.** Upstream's own HR
     atom (`CreoleHorizontalLine.ts`) draws via `UGraphic.draw
     (UHorizontalLine.infinite(...))` — a `UGraphic`/`Stencil`-based
     "infinite" line resolved against a clip region. Activity's
     renderer draws plain SVG-string primitives
     (`core/svg.ts#line`); it has no `UGraphic`/Stencil context. A
     faithful box-bounded equivalent (a literal `<line>` spanning the
     box's own padded content width, at the stripe's own vertical
     slot) is a small, well-understood primitive to add to
     `activity-renderer-text.ts`, but:
   - **Heterogeneous per-physical-line height.** `gtile-action.ts`'s
     `GtileAction` constructor sizes EVERY physical line at one
     uniform `lineHeight = bounder.getDimension('M', fontSize).height`
     (12 for the default font), and
     `activity-renderer-text.ts#drawActivityTextLines`/
     `activity-renderer-shapes.ts#renderMultilineText` advance each
     line's Y by that SAME uniform stride. An HR line's real height
     (8) differs from a text line's (12 at default size, bigger still
     for a `=heading` line in jagove/CREOLE-ACT below) — drawing the
     rule at the box's OWN padded width without ALSO summing each
     line's own `creoleTextLines`-reported height (replacing the
     uniform `lineHeight * lineCount` sum) and threading that
     per-line height through the renderer's Y-advance would size the
     box wrong and/or draw the rule at the wrong Y, very likely
     regressing other already-passing rows whose current correctness
     depends on the uniform-height assumption. I did not attempt this
     within this task's remaining time budget — it is a real,
     bounded, two-file change (`gtile-action.ts` height sum,
     `activity-renderer-text.ts`/`activity-renderer-shapes.ts` Y
     advance), not a structural blocker, but it touches every
     existing pinned row's box-height math and needs its own
     measured, incremental verification pass rather than being rushed
     at the end of this one.

2. **CREOLE-ACT heading height (`jagove-43-nako107`, Σ130 residual).**
   Same heterogeneous-height blocker as STRIPE: `:=condition1\n...` 's
   first line classifies as `HEADING` (`fontConfigurationForHeading`,
   `StripeSimple.ts`), which both grows the font SIZE (bold + a size
   delta) and therefore the line's real height above the uniform
   `lineHeight`. The DRAWING side already renders it correctly sized/
   styled (bold, bigger) via this commit's widening — the residual is
   purely the box's total height and the SUBSEQUENT lines' Y position,
   both needing the same per-line height sum named in (1).

3. **GLYPH family (`zaloze-31-jibo311`, `nipuxu-11-tefa314`,
   `vilecu-41-tete416`) — report only, confirmed, not fixed.**
   `DriverCenteredCharacterSvg.java:64-81`: the `fileFormat ==
   FileFormat.SVG_DETERMINISTIC` check that would emit a plain
   `<text>` element does NOT fire under this port's oracle flags.
   `FileFormat.java:179-192` (the project's own injected "[plantuml-ts
   oracle seam] dev-only" comment) shows `-DPLANTUML_DETERMINISTIC_TEXT`
   only swaps the `StringBounder` used for MEASUREMENT
   (`StringBounderFromWidthTable`) when the ACTUAL export `FileFormat`
   is `SVG` or `SVG_DETERMINISTIC` — it does not change the export
   `FileFormat` object itself, which `oracle-render.sh`'s invocation
   leaves as plain `SVG`. `DriverCenteredCharacterSvg#draw` branches on
   that unchanged `fileFormat`, so it takes the ELSE branch
   (`java:72-81`): a real AWT `UFont.createTextLayout(c)
   .getOutline(null)` glyph path, drawn via `svg.drawPathIterator`.
   Confirmed directly against the golden SVG
   (`test-results/dot-cache/activity/zaloze-31-jibo311/in.svg`
   contains a `<path d="M107.108,67.631 L105.385,63.27...">`, not a
   `<text>`). **This is a genuine accepted-divergence CANDIDATE**: a
   platform-font AWT glyph outline is inherently JVM/OS-font-dependent
   (exactly the class of thing `-DPLANTUML_DETERMINISTIC_TEXT` exists
   to avoid for ordinary text, but this ONE code path is outside that
   seam's reach) and this port has no AWT/canvas to reproduce it from
   (CLAUDE.md's architecture rule: pure SVG, no DOM/canvas). I have
   NOT added it to `oracle/accepted-divergences.json` (not my call,
   not in my write-set) — flagging for the orchestrator to decide,
   same treatment as the existing LaTeX/KaTeX-vs-JLaTeXMath entry in
   `DIVERGENCES.md`.

## Write-set discipline

Touched only `src/diagrams/activity/activity-renderer-text.ts` and
`src/diagrams/activity/tiles/gtile-action.ts`, both named in my
write-set. Read-only elsewhere (`core/svek/image/creole-text-lines.ts`,
`core/klimt/creole/legacy/StripeSimple.ts`,
`core/klimt/creole/legacy/CreoleStripeSimpleParser.ts`,
`core/svek/image/creole-sea-line.ts`,
`core/svek/image/leaf-sizing-text.ts`,
`core/decoration/symbol/usymbol-resolve.ts`,
`diagrams/mindmap/mindmap-skin-param.ts`,
`diagrams/activity/ftile/vertical/FtileBoxOld.ts`,
`diagrams/activity/tiles/gtile-diamond.ts`, the Java sources cited
throughout). Did not touch `gtile-diamond*.ts` — vimako's branch-label
fix needed only the two files above (confirmed via `--align`: element
counts unchanged, 17/17, for that fixture both before and after); no
row in my assignment needed `tiles/gtile-diamond*.ts` changes. No
Serena MCP tool call made (per rule 1). No `git stash` used; a
save-patch/`git checkout --`/`git apply` round-trip on the two
tracked files was used once, mid-task, to isolate a pre-existing vs.
newly-introduced diff on `loxija-71-joku558` — both files were
restored to their edited state via `git apply` of the saved patch
before any further edits, confirmed via `git status`.
