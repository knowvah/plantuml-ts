# cdd-T34 — newpage, mainframe, topurl, `<>` n-ary diamond

Status: **executed + closed**, worktree `cdd-t34` (branch `cdd/t34`, based
on `e7a96725` — T31 round 2 + T32 + T33 merged in). Four commits, one per
mechanism (`c448f495` newpage, `0620712b` mainframe, `b4daa603` topurl,
`250a10e0` diamond + refusal). Full suite green throughout (`npm test`
805-807 files passed depending on which commit, only `docs/catalog.md`
drift between mechanisms, regenerated each time), typecheck (both
tsconfigs)/lint/build clean at every commit. DOT parity 711/711
non-oracle-blind, unchanged across all four commits (none of these
mechanisms reaches DOT construction except degenerately: bufogi/gevuci
are 2-degenerate-page newpage fixtures with 0 `svek-N.dot` before and
after).

## Before -> after (render-diff.mts, structural+numeric)

| fixture | mechanism | before | after |
|---|---|---|---|
| bufogi-69-naba929 | newpage | 4+48 | **0+0 exact** |
| gevuci-69-fafe469 | newpage | 4+48 | **0+0 exact** |
| jakaja-15-faze022 | mainframe | 1+86 | **0+0 exact** |
| jinoba-14-firi471 | topurl | 4+0 | **0+0 exact** |
| laluve-92-raxu863 | topurl | 4+0 | **0+0 exact** |
| cukaze-78-zija070 | `<>` diamond | 1+104 | 0+109 (structural fixed; numeric is a confirmed PRE-EXISTING, unrelated residual — see below) |
| luzive-62-zote562 | jar refusal | 2+4 | 11+21 (background/childCount now exact; residual is the error page's own already-documented gaps) |

## Mechanism 1 — `newpage` (D3's exit bar: page 1 only via renderSync)

`ClassGeometry.pageBoundaries` (`class-geo-geometry-types.ts`) records
each page's stacked `y`/`width`/`height`; `class-layout-multipage.ts
#sliceClassGeometryPage` is the render-time inverse (band-filter by `y`,
shift back by `-y`), verified byte-identical to a standalone
`layoutSinglePage` render of page 0 alone (matches the pre-existing
`render-fixture-class.ts`/G2-N28 harness's OWN independent "strip
`.pages`, re-layout" verification of the identical equivalence).
`classPlugin` wires `getNbPages`/`renderPage`/`pageAst`
(`core/dispatcher.ts`'s `PaginatedPlugin`, sequence's own established
precedent). `render()`/`renderSync()`/`renderAll()` now emit page 1 only;
`renderPages()`/`renderPagesSync()` still return every page.
`CHANGELOG.md`'s T7 entry amended in the same commit (D3).

## Mechanism 2 — `mainframe` (shared seam, gate: every engine's suite)

`core/klimt/shape/big-frame.ts` ports `BigFrame.java` (rect + folder-tab
title cutout) as plain-Dim-in/SVG-fragment-out functions (chrome.ts's own
"eager arithmetic, not the OOP TextBlock tree" convention, documented in
that file's header). `chrome.ts#addMainframe` wraps the whole diagram body
BEFORE legend/title/caption/header/footer apply (`DiagramChromeFactory
.create`'s own step order). Constants cited to `plantuml.skin:85-89`
(Padding `1 5`, Margin `10 5`, LineThickness `1.5`) — CSS-shorthand-parsed
(`ClockwiseTopRightBottomLeft.read`, 2-value case: `top=bottom=a,
left=right=b`) and independently verified against `jakaja-15-faze022`'s
own rect (`x="5" y="10"`) and padding-derived offsets.

**Fill-color mechanism** (the one non-obvious finding): mainframe's
`BackGroundColor` is unset in `plantuml.skin` and does NOT inherit
`root{}`'s own `BackGroundColor: var(--common-background)` the way
`LineColor`/`FontColor`/`RoundCorner` do — `annotation-defaults.ts`'s
mainframe entry already carries `backgroundColor: null` (an EARLIER
mission's own verified value). Empirically probed (three renders via
`scripts/oracle-render.sh`: default, `skinparam BackgroundColor
lightblue`, `skinparam BackgroundColor white`): the frame's fill tracks
the DOCUMENT's own canvas background exactly (`#ADD8E6` for lightblue,
`#FFF`/`#FFFFFF` shortened for white/default) — `chrome.ts` resolves this
as `style.backgroundColor ?? style.documentBackground`, and `rect()`'s
existing `shortenColor` (already general, `svg-format.ts`) reproduces the
jar's 3-digit shorthand for the white case automatically, with zero new
code.

**Cross-engine movers, checked (stop 4):** `grep -rl '^mainframe'
test-results/dot-cache/*/*/in.puml` found 5 sequence + 3 unknown-bucket
fixtures beyond `jakaja`. None is equality-pinned (checked `oracle/
goldens/` + `tests/`; the sequence ones sit in `svg-sequence/diff-
baseline.json`/`diff-census.json`, a RATCHET not an equality pin — full
suite re-run before/after, zero new failures). Isolated via stash/pop on
`gunecu-53-jebu067` (worst case, +1 structural): its OWN structural
childCount mismatch (31 vs 27, present BEFORE this fix) is now RESOLVED;
the one NEW-looking structural diff (`stroke-dasharray exp=2,2 act=`) is
a pre-existing sequence-engine dasharray gap on a frame/activation box,
previously MASKED by the 137px/175px coordinate offset mainframe's
absence caused (compareSvg pairs elements positionally — D2's own
mechanism) and now correctly surfaced once real positions line up.
decace-28-majo724/miveni-64-rexo238 show a small numeric RISE (+2 each) —
also isolated: both are the SAME "1-8px residual, was 35-52px" shrinkage
pattern as every other mover, not a new defect. All 8 movers: net
improvement, zero unexplained risers.

## Mechanism 3 — `topurl` (`UrlBuilder.ts`'s prefix rule, wired not touched)

`class-url.ts#applyTopUrl` (the one-line `withTopUrl` rule, cited to
`UrlBuilder.ts:190-191`/`UrlBuilder.java:140-146`, NOT imported —
`UrlBuilder.ts` itself is unedited per the task's own boundary).
`parseUrlBracket` widened with an optional `topurl` param (every existing
caller unaffected, `topurl` stays `undefined`). `layout.ts
#layoutSinglePage` applies it to already-parsed classifier urls once
`theme.topurl` is available (this port resolves skinparam globally, D4's
`scale`/`dpi` pattern — the class PARSER has zero skinparam access,
confirmed: `class-command-directives.ts:50` matches and DISCARDS every
`skinparam` line outright).

**A real bug caught mid-task:** `theme-merge.ts#OPTIONAL_SCALAR_KEYS` is
an EXPLICIT whitelist `deepMergeTheme` reads by name — `dpi` is listed,
`topurl` was not. `SkinparamAccumulator.topurl`/`buildThemePartial`'s
`partial.topurl` were BOTH already correct in isolation; `theme.topurl`
came back `undefined` after a full `resolveSkinparam` round-trip until
this was found (probed with 6 scratch scripts narrowing from
`renderSync` output down to this one array). Fixed by adding `'topurl'`
to that array (one line).

**Tooltip/label re-derivation:** `Url.java`'s ctor defaults `tooltip`
to `url` when omitted, and upstream resolves that default AFTER
`withTopUrl` prefixes (`CommandCreateClass.java:219-221`). This port
parses before `topurl` is known, so a defaulted tooltip/label is still
the UNPREFIXED url at parse time — `class-url.ts#applyTopUrlToClassifiers`
re-derives it from the newly-prefixed url ONLY when `tooltip === url`
(the "was this defaulted" signal, since an explicit `{tooltip}` is never
equal to the bare url by construction of `buildUrl`). Caught by the
`title`/`xlink:title` residual on `jinoba-14-firi471` after the `href`
fix alone landed exact.

**Write-set extension (flagged):** `theme.ts`, `theme-merge.ts`,
`skinparam-accumulator.ts`, `skinparam-theme-builder.ts` are outside
T34's literal write-set (which names only `skinparam-key-handlers-
table-a.ts`) but are the SAME single-field wiring T30 already
established for `dpi` — same class of extension T29/T30/T32 already used
this batch.

## Mechanism 4 — `<>` n-ary diamond (cukaze-78-zija070)

**Instrumented first, per the task's own instruction — the real
mechanism was NOT "unimplemented n-ary diamond".** Parsing, `kind:
'association'`, and 24x24 sizing (`measureAssociationDiamond`) were
already correct and jar-exact (confirmed: our rect/box sat at the exact
jar coordinates, just drawn as the WRONG shape). The one structural diff
was `svg/g[1]/g[3] exp=polygon | act=g` — jar draws
`EntityImageAssociation#drawU`'s bare `UPolygon` (no `<g>`, no `id`, no
`<!--class...-->` comment — an `AbstractEntityImage` with no name/badge/
body), while this port's `renderClass` classifier loop had no dispatch
branch for `kind === 'association'` at all and fell through to the
generic classifier box (rect+ellipse-badge+icon-path), drawing a
mini-interface glyph instead of a diamond.

**Fix:** `renderer-assoc-lollipop.ts#renderAssociationDiamond` (new,
unwrapped like the existing `renderAssocPoint` precedent), a 4-point
polygon derived from `geo.x/y/width/height` (not a re-declared `SIZE`
constant, so it stays correct under `scale`), reusing `classifierFill`/
`classBorderLine`/`classBorderStrokeWidth` — the SAME resolution every
other classifier box already uses (no separate `diamond` StyleSignature
exists in this port; the jar's own `fill="#F1F1F1"`/`stroke="#181818"`/
`stroke-width="0.5"` are byte-identical to a plain class box's own
defaults, confirmed directly against `jakaja`/`Station`'s own rect in the
same fixture).

**Residual (109 numeric, structural now 0):** a uniform ~0.87px offset on
EVERY coordinate in the whole document (not diamond-specific) plus an
11px total-height gap. Confirmed PRE-EXISTING via stash/pop: byte-
identical before and after this fix (the numeric diff list, including
the exact `svg/@height exp=85 act=96 (d11)` line, was present in the
BASELINE render-diff captured before any T34 diamond work touched
anything). Named as a whole-document ink-shift/margin residual, NOT
traced to a specific Java `file:line` — filed in `planning/
next-missions.md` as a follow-on candidate (needs a second `<>`-diamond
fixture to isolate which element's ink the shift constant is keying
off).

## Mechanism 5 — jar refusal for a name collision (luzive-62-zote562)

`<> StationCrossing` where `StationCrossing` is ALREADY `class
StationCrossing {...}`. Upstream's `CommandDiamondAssociation.executeArg`
own `explainArg` comment: "Unlike most creation commands, executeArg
fails if the name already exists" — `quark.getData() != null -> error`,
UNCONDITIONALLY, regardless of whether the existing entity came from an
explicit declaration or an earlier relationship-endpoint auto-vivification
(`java:73-84`). `ensureClassifier(state, name, 'association')` always
passes `kind: 'association'` at CREATE time, so a freshly-minted
classifier already has that kind the instant it's created — nothing else
in this port ever mints a classifier with `kind === 'association'`, so
`classifier.kind !== 'association'` after the call is exactly upstream's
`quark.getData() != null` for every reachable corpus case (verified: the
pre-existing "force kind even if a relationship endpoint auto-created it
as a class" comment on rule 5c was itself describing a scenario upstream
would ALSO refuse — not special-cased, replaced).

Routes through the SAME `(state.ast.errors ??= []).push(...);
state.ast.errorLine = ...` mechanism `class-descriptive-leaf-command.ts`'s
allowmixing gate already established, reaching `classPlugin.render`'s
existing `DiagramRefusal` throw (`index.ts`) and T32's error-page path
(`error-renderer.ts` -> `assembleDocumentShell`) unchanged. `luzive`:
`svg/@background` now `#000000` (was `#FFFFFF`), `childCount` now exact
— residual (11 structural, 21 numeric) is the error page's OWN
pre-existing, already-documented gaps (version string, `[From in.puml]`
vs `[From string]` source-name, `textLength` — all three named in T32's
own `.agent-notes/cdd-T32.md` for `sadamo-18-siva346`, unaffected by
T34).

## Write-set extensions summary (all flagged inline, above)

- `theme.ts`/`theme-merge.ts`/`skinparam-accumulator.ts`/
  `skinparam-theme-builder.ts` — topurl wiring (T30's own dpi precedent).
- `class-layout-multipage.ts` — the pre-existing split-file of `layout.ts`
  (T29's own precedent: `layoutMultiPage` already lived there before
  T34); `sliceClassGeometryPage`/`classPageAst`/`classPageCount` added
  there, re-exported from `layout.ts` unchanged.
- `renderer-assoc-lollipop.ts` — the pre-existing split-file of
  `renderer.ts` housing the OTHER "draws unwrapped, no `wrapEntity`"
  leaf kinds (`assoc-circle`); `renderAssociationDiamond` is a third.
- `docs/catalog.md` — regenerated after every commit (drift-gated).

## Not filed as separable (resolved within this task)

Neither `<>` diamond mechanism warranted a separate mission: cukaze's
structural fix and luzive's refusal fix are both small, single-file
changes in the SAME rule (5c), landed in one commit.
