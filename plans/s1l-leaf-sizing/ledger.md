# Size-conformance ledger — description diagrams (S1L)

Honest-accounting close of mission **S1L** (maintainer-selected 2026-07-27).
Every non-`conformant` description fixture is carried here by a named
root-cause family, each routed to a tracked follow-on sub-mission or a
`DIVERGENCES.md` entry — satisfying the standing rule *"every conformance bar
is 100% minus known divergences."*

Measurement: `scripts/measure-description-size-deltas.ts` over the 351 committed
`oracle/goldens/description/<slug>/` goldens (all structurally EQUAL). Captured
2026-07-27. A fixture is size-`conformant` when its `maxSizeDeltaIn` ≤ 0.01in.

## Result

| | count | share |
|---|---|---|
| structurally EQUAL goldens | 351 | — |
| size-`conformant` (≤0.01in) | **236** | **67.2%** |
| non-conformant (carried below) | 115 | 32.8% |
| — of which inherent-tolerance DIVERGENCE (LaTeX) | 2 | |
| conformant excluding the LaTeX divergence | 236 / 349 | **67.6%** |

**Updated 2026-07-27 (S1L-b close):** +5 conformant vs the initial S1L close
(231→236). The description `[ … ]` display-body expansion (S1L-b) flipped
`dexigu-24`/`kenece-24`/`zifaji-87` (the `node [ foo1 ==== foo2 ]` HR-height
trio) plus `butebe-90`/`zavitu-69` (creole-formatting width), and shrank
`zotiru-33` (scoped `<style> MinimumWidth`, T5). See the min-width /
display-expansion rows below and the fariba-82 residual section.

Every non-conformant fixture is a keyed entry in
`oracle/goldens/description/size-backlog.json`, pinned at its current delta,
shrink-only. The parity ratchet (`tests/oracle/description-parity.ratchet.test.ts`)
asserts `maxSizeDeltaIn ≤ pin + 1e-6` per fixture and ≤0.01in for any fixture
absent from the backlog — so sizes are regression-proof and a fixture flips to
asserted-`conformant` the moment a sub-mission drops it to ≤0.01 (its entry is
then deleted).

## Non-conformant by cause → routing (120)

Families from `detectCause` (`scripts/measure-description-size-deltas.ts`),
which detects containers (a container keyword opening `{`, or a bare `{` line)
BEFORE the leaf checks — so a `package X { … }` is cluster sizing (S1L-e), not a
leaf tab. First-match wins on compounding fixtures. Representative slugs shown;
the full per-fixture set is `size-backlog.json`. (Re-bucketed 2026-07-27 for
accuracy — the first cut over-counted package-tab/display and under-counted
containers.)

| Family | n | Root cause | Routed to |
|---|---|---|---|
| container / cluster | 40 | container box + child-cluster sizing (`computeContainerBbox` subsystem); not a leaf fix. e.g. fepuvo-06-rugi981, tuliba-37-liza126, berufi-69-dara369 | **S1L-e** |
| uncategorized | 16 | small residuals (≤~0.9in) not yet attributed by the heuristic; per-fixture triage folds each into the family a sub-mission's re-run identifies. e.g. nixura-77-bina738, dopova-50-digo290 | triage |
| sprite / stdlib-macro / icon | 10 | **Largely DONE (S1L-f, 2026-07-28)** — see the S1L-f sections below. The bucket's premise was wrong three times over: kofuca-08's 478in was ENGINE MISROUTING, the shared residual was a missing `fontSize/13` scale on EVERY sprite kind, and the bundles are SVG-sprite based (a form the grammar did not parse at all). Remaining: the use-case ink-bounds question (ruziru-69/bootstrap-0, **S1L-k**) plus openiconic/`<img>` residuals. | **S1L-k** + triage |
| interface shield | 0 | **DONE (S1L-c, 2026-07-28)** — see the S1L-c section below. Bucket empty: 9 of the 11 flipped conformant, and the other 2 were misattributions the same mission corrected (turasu-73-zoni468 → sprite, cukafa-49-fona812 → element-font). | — |
| element font (per-USymbol) | 2 | `skinparam <element>FontSize/FontName/FontStyle` never reaches `measureLeafNode`: `fontSpec` is a single diagram-wide value threaded down `layout-dot-tree.ts`, with no per-USymbol resolution (contrast `resolveElementMinimumWidth`, which S1L-g already threads per-element). cukafa-49-fona812 (components measure 117×44 vs the jar's 139×48 under `componentFontSize 18`), gogamo-72-pibo470 | **S1L-h** |
| min-width floor | 1 | **S1L-b/S1L-g DONE.** `skinparam minClassWidth` (S1L-g) + the `[…]` HR-height fix (S1L-b) made dexigu/kenece/zifaji **conformant** (deleted). `zotiru-33`'s scoped `<style> package { MinimumWidth 300 }` is now wired (S1L-b T5, `resolveElementMinimumWidth`): its `not_nested` package is exact at 4.583in, delta 2.655→0.914. Its remaining 0.914 is the `nested` package **cluster** floor. | **S1L-e** (nested-cluster residual) |
| display-text expansion | 4 | **Bracket-body + creole-`====` HR DONE (S1L-b); codepoint decode-ordering DONE (S1L-b-unicode T1).** `[ … ]` bodies reach `measureLeafNode`; creole HR renders + sizes at 8px; `<U+…>`/`&#…;` now decode per-line at measure time (AFTER the `\n` split), so codepoint newlines are inline — heights no longer over-split. The 4 pinned fixtures are now DIAGNOSED, NAMED residuals (not simple bracket cases): **gafico-37-cuma657 (5.68→3.75)** + **nujito-06-neca370 (3.35→3.12)** — both driven by node c's UNPORTED `<code>` block (S1L-b-unicode T2, deferred E2r L2), NOT quoted-title literalness (Rule 2 corrected); **lurupu-11-fubo915 (2.05→CONFORMANT)** — was a sizer↔renderer creole-lexer divergence on `<font Name>`/unclosed-`<b>` (S1L-b-unicode T3), RESOLVED by creole-lexer-unification (2026-07-27, below); **xufexu-38-fola855 (1.46→0.153)** — bracket-body + container (S1L-e). See the three S1L-b-unicode sections + the creole-lexer-unification section below. | `<code>` (E2r L2) / ~~creole-lexer sync~~ DONE / **S1L-e** |
| package / folder tab (leaf) | 0 | **DONE (S1L-a, 2026-07-28)** — see the S1L-a section below. Bucket empty: cobuju-30-paxo591 flipped, and the other two were misattributions (a leading `artifact`/`package` keyword) that the same mission re-bucketed → creole-titled-separator / multiline-display. | — |
| creole titled separator | 2 | **PARTIAL — bodyenhanced-atom-seams, 2026-07-30.** `--title--` / `==title==` draw a rule CARRYING their title text, so the line contributes the TITLE's width, not the raw markup's. **codabo-50-mupa164 is now delta 0 / conformant** (ADR-4's `decorate` + `TextBlockLineBefore` port, then T4 routing `desc` through `BodyFactory.create3`; its svg diff-count also fell 388→11). Remaining: `nixura-77-bina738` (1.273091) and `xufexu-38-fola855` (0.152778 — mixed-cause, also this ledger's S1L-e container residual). **Blocker is known and deliberately withheld:** `CreoleStripeSimpleParser.ts:95` classifies a non-empty separator capture as `LITERAL` where upstream classifies BOTH empty and non-empty as `HORIZONTAL_LINE` (`BodyEnhancedAbstract.isBlockSeparator`, java:67-82). Flipping it changes LIVE rendering, so ADR-6 requires a separately gated commit. | **S1L-i** (still open) |
| multi-line quoted display | 2 | a quoted display left open at end of line — upstream's `CommandCreateElementMultilines` joins the continuation lines; we stop at the first, leaving the id literally `foo2 as "This artifact` (tajadu-40-juro990; its other three nodes are exact). | **S1L-j** |
| latex (DIVERGENCE) | 2 | KaTeX ≠ JLaTeXMath — see below. gevozu-46-sasu860, sunuju-01-pote718 | DIVERGENCES |
| wrapWidth | 0 | **DONE (S1L-a/S1L-d, 2026-07-28)** — `Fission` was already ported and already used by the RENDERER; only the sizer never called it. See the S1L-d section below. | — |

Container/cluster (40) is the dominant description-sizing gap. The 16
uncategorized are small and pinned; each is attributed to one of S1L-a..h as
those missions re-measure. Nothing here except LaTeX is excluded — all count
against the bar until conformant.

## S1L-k — sprite ink footprint in use-case ellipses (2026-07-28)

**Mechanism.** A use-case ellipse is not fit to the text block's declared
dimension. `TextBlockInEllipse`'s ctor takes only `alpha` from
`text.calculateDimension(stringBounder)`, then calls
`Footprint#getEllipse(text, alpha)` — which DRAWS the block onto a
point-collecting `UGraphic`. A drawn path contributes just two points, its
min/max corners (`Footprint.java:147-150`), and those come from
`UPath#addInternal` (`UPath.java:82-94`), which records **only the endpoint**
of a `SEG_ARCTO` and **every** coordinate pair — Bézier control points
included — of everything else. The box is therefore the *control-polygon*
box: a true-extrema box would be wrong, and no curve flattening is needed.

**Why bi-globe ≠ bi-bootstrap-fill.** Both declare `<svg width="16"
height="16">`. bi-globe's outer circle is an ARC, so it contributes only its
endpoints and the sprite inks **16 × 13.846**; bi-bootstrap-fill inks the
full **16 × 16**. At scale 2.5 that is 69.458×56.766 vs 74.957×61.165 — the
exact jar numbers, from identical declarations. This is what S1L-f left open.

**Port.** `core/klimt/sprite/svg-path-bbox.ts` implements the `UPath` rule
(command coverage per `SvgPath#toUPath`, with `H`/`V` and the `S`/`T`
reflections normalised inline); `SpriteSvg` carries `inkWidth`/`inkHeight`
beside its declared box; `spriteInkDimsLookupFor` is the registry view the
use-case footprint measures against, while `alpha` keeps using the declared
dimension. Encoded sprites draw as a full image, so their ink IS their box
and the view returns identical numbers — every non-SVG display measures
byte-identically to before.

**Result.** 5 of ruziru-69's 6 nodes are EXACT (b/c/d/e/f);
ruziru-69-xixo434 + bootstrap-0 shrank 0.124042 → **0.069047**. 286/351
(81.5%) holds, zero widened, class ratchet unmoved.

**Residual — CLOSED (2026-07-28), by porting the real fit.** The mixed case
could not be expressed as a bounding box because the ellipse is not fit to
one: `ContainingEllipse` maps `y → y/alpha` and takes the SMALLEST ENCLOSING
CIRCLE of the collected points (`width = 2r`, `height = 2r·alpha`). The old
closed form is exactly right for two opposite corners or a rectangle's four
— hence every text-only and sprite-only fixture matching it — but wrong for a
mixed block, where the fit also becomes ORDER-DEPENDENT (jar:
`"<$bi-globe>\nbi-globe"` = 66.026×43.587 vs `"bi-globe\n<$bi-globe>"` =
69.791×45.945, same lines swapped).

Two positional details were **derived, not fitted**:

- a TEXT run's box is `[y + ypos − h + 1.5, y + ypos + 1.5]`, where
  `Footprint#drawText` applies the `−(h − 1.5)` shift and `AtomText#drawU`
  draws at `ypos = height − descent`, with `StringBounder#getDescent`
  defaulting to `size / 4.5`. At size 14 that is 10.888…, so the box starts
  **1.611 above** its line's top — and that asymmetry is exactly what makes
  line order matter. (A numeric scan independently landed on 10.9 before the
  `/4.5` constant was found, which is what confirmed it.)
- a SPRITE contributes its INK box at its own OFFSET inside the declared line
  box, not the declared box.

Stereotype lines are merged ABOVE the label before the fit
(`EntityImageUseCase.java:96-109`), so they contribute points too —
mopimi-10-jaco443 / lunexo-59-fupo775 are entirely stereotyped use-cases and
were the proof.

Verified against the jar on SEVEN shapes (sprite; text; text×2; sprite+text;
text+sprite; sprite+text×2; sprite×2) to within **5e-4 px**.

**One more over-reach fixed en route** — same class as S1L-f's
stereotype-in-a-quoted-display bug, reached through a different path:
`stripUrl` removed a `[[url]]` from INSIDE a quoted display. Upstream's
`UrlBuilder.OPTIONAL` is anchored AFTER the CODE/DISPLAY alternatives, so
inside the quotes `[[…]]` is ordinary Creole link content. Stripping it
dropped real display text — bivira-53 lost a whole URL, and its sibling lost
a sprite NESTED in one. `stripUrl` is now quote-aware.

**Result.** 286 → **291/351 (81.5% → 82.9%)**, zero widened.
ruziru-69-xixo434 + bootstrap-0 (the S1L-k targets) CONFORMANT, along with
mopimi-10, lunexo-59, fosito-02; bivira-53 shrank 1.884532 → 0.073842.

## S1L-f — sprite sizing (parts 1, 2a, 2b — 2026-07-28)

Three passes, each of which found the bucket's stated premise wrong.

**Part 1 — engine misrouting, not sprite sizing.** kofuca-08-pafi749's 478in
was a `skinparam <selector><<stereo>> {` block leaking its body (that line
matched neither block-open regex and fell through to the single-line form,
which read the VALUE as `{`). Every awslib/tupadr3 include ends in an
`AWSEntityColoring(x)`-style `!definelong` expanding to exactly that block,
so 53 orphan lines buried the element declarations past
`descriptive-keywords.ts`'s `SCAN_LINE_LIMIT`; `accepts()` declined and
`dispatcher.ts#resolve` handed an AWS deployment diagram to the CLASS
engine, which measured the raw `<img data:…base64…>` markup as label text.
478.94 → 0.306in.

**Part 2a — the `fontSize/13` scale, and three fixes it unmasked.**
`CommandCreoleSprite.java:82` scales a creole `<$name>` by
`Parser.getScale(...) * fc.getSize2D() / 13.0`. The factor lives in the
creole COMMAND, so it applies to every sprite kind; this port used raw dims
× requested scale, i.e. assumed font 13. Jar-verified at two font sizes and
two sprite kinds. Fixing it exposed, in order: per-atom font sizes (the
sizer measured whole lines at the base font, wrong for `==heading` and
`<size:N>`), a stereotype extracted from INSIDE a quoted display (+lineH
+STEREO_MARGIN), and `<<x>>` → `«x»` display-text guillemets
(`CreoleParser.java:175`). 280 → 284/351.

**Part 2b — SVG-form sprites.** `sprite N <svg …>` was not in the grammar at
all, and bootstrap AND archimate are both SVG-sprite bundles, so every
`<$name>` from them measured 0. Ported `CommandSpriteSvg` +
`CommandSpriteSvgMultiline` and `UImageSvg#getData`'s dimension rule: a
**viewBox wins outright** (3rd/4th numbers, `Math.ceil`'d), else the
`width=`/`height=` attribute. That precedence is why archimate's
`width="19.995mm"` never needs unit handling. `getSpriteMonochrome` now
declines an SVG sprite (it was an unchecked cast); the renderer re-emits the
element as an `image/svg+xml` data URI, untinted, matching upstream's
`SpriteSvg`. `stripSpriteRegions` learned the SVG form too — bootstrap is
~7200 lines of sprites, the same burial the encoded form already needed
stripping for. Also closed the gap `measureUsecase`'s doc comment had
flagged: the ellipse footprint now includes `atomHeightBonus` on the HEIGHT
axis. 284 → **286/351 (81.5%)**; tatori-66-kaci883 and
sprite-SVG-fill-management-3 conformant; ruziru-69/bootstrap-0 shrank
0.682747 → 0.124042.

**Open, precisely characterised → S1L-k.** A sprite's USE-CASE footprint is
not always its declared box. Jar-measured: `bi-globe` at scale 2.5 is
**43.077 inside a rectangle but 39.642 inside a usecase**, while
`bi-bootstrap-fill` is 43.077 in BOTH — identical `<svg width="16"
height="16">` declarations, identical scale, and both scale syntaxes
(`,scale=` / `{scale=}`) agree. So the ellipse path uses something
content-dependent, most plausibly `SvgNanoParser`'s drawn-ink bounds rather
than the declared box. That is an SVG path-bbox subsystem and gets its own
mission — it is a GAP, not a divergence.

## S1L-d — `skinparam wrapWidth` in the sizer (DONE 2026-07-28)

**Mechanism.** The Neutron word-wrap (`Fission#getSplitted`) was **already
ported** (`src/core/klimt/creole/Fission.ts`) and **already wired into the leaf
RENDERER** (`EntityImageDescriptionSupport.ts#buildWrappedLines`).
`leaf-sizing.ts` simply never called it, so a diagram setting `wrapWidth`
measured its boxes at the unwrapped single-line width while the renderer drew
them wrapped — the same sizer↔renderer divergence family as
creole-lexer-unification.

**Fix.** `leaf-sizing-text.ts#measureTextBlock` reuses `getSplitted` (it never
re-derives break positions — that shared call IS the lock-step invariant),
threaded `theme.wrapWidth` → `ClassifyCtx.wrapWidth` → `BoxSizingOpts
.wrapWidth`. `maxWidth === 0` — upstream's own default, it sets
`PName.MaximumWidth` nowhere — delegates to the unwrapped helpers unchanged,
so this is zero-diff for every diagram that does not set the skinparam.
Applied to the entity DESC only, matching upstream (`BodyFactory.create3`
passes the strategy to `desc`; `name`/`stereo` never receive it) and matching
what the renderer already wraps.

**A second bug the fix isolated.** Wiring wrap made mejoxi-96-cegu294's
HEIGHTS exact immediately (58 / 72 — so the break positions were right), with
widths still **4.9875** short on both nodes. That constant is one `"` glyph:
the `["…"]` bracket shorthand was stripping quotes upstream KEEPS. Upstream's
`eventuallyRemoveStartingAndEndingDoubleQuote` (java:311) sees the display
with its **brackets still attached**, so the first char is `[`, the strip
no-ops, and the bracket wrapper comes off afterwards — our
`parseBracketDeclaration` passed the ALREADY-unbracketed body through
`stripFullWrap`. Unwrapped, the gap was exactly twice 4.9875 (both quotes on
one line); wrapped, one quote lands on each of the first and last lines, so
the widest line gains only one. Jar-verified: `[plain]` draws `plain`,
`["quoted"]` draws `"quoted"`, while `component "cq"` and `component cq2 as
"dq"` do strip.

**Result.** mejoxi-96 exact at 238.100×58 / 238.362×72. 279 → **280 / 351
(79.5% → 79.8%)**, zero widened; `fariba-82-xolu802` also shrank 1.024479 →
0.388889 (its jar `file`-body word-wrap half, diagnosed in S1L-b T6, is now
closed — the residual is its awslib sprite, S1L-f). The wrapWidth bucket is
EMPTY.

## S1L-a — folder/package leaf tab geometry (DONE 2026-07-28)

**Mechanism.** `folder` and `package` are the SAME class,
`USymbolFolder(sname, showTitle)` (USymbols.java:79/86), whose `asSmall`
dimension is

    getMargin().addDimension(dimName.mergeTB(dimStereo, dimLabel))

with `getMargin() = Margin(10, 10+10, 10+3, 10)` = `[30 h, 23 v]` and
`dimName = showTitle ? title.calculateDimension() : XDimension2D(40, 15)`
(USymbolFolder.java:146/172/177-183). `mergeTB` takes the MAX width and the
SUM of heights — so the tab is a normal block, not a decoration.

**Origin.** `leaf-sizing.ts` modelled both symbols through `measureBox` with
`SYMBOL_ICON_ALLOWANCE.folder = [0, 15]`. A fixed icon allowance can add the
tab's HEIGHT but cannot express its **width floor**, and it says nothing about
the showTitle form at all. Fix: a dedicated `measureFolderLeaf`.

- `folder` (showTitle=false): width = `max(40, labelW) + 30`. The 40 floor was
  missing entirely — `folder b` measured 37.79 against the jar's 70.00. It
  only bites on a SHORT name, which is why no corpus fixture caught it.
- `package` (showTitle=true): the title is the element **CODE**, the label
  carries the display only when the two differ, and the shown title
  contributes a measured **+12px** (`FOLDER_SHOWN_TITLE_EXTRA_WIDTH`).

Jar-verified on all five forms, all exact: `package "a b c d e f g"`
91.787×37, `package pp as "Display Here"` 106.387×51, `package "Disp Two" as
dd` 84.600×51, `folder "x"` 70.000×52, `folder ff as "Folder Display"`
115.750×52.

**Regression caught mid-mission.** The first `measureFolderLeaf` dropped
`opts.minimumWidth`, which `measureBox` applies — that widened
`zotiru-33-legi180` (S1L-g's `<style> package { MinimumWidth }` consumer) from
conformant to 3.038715. The floor is threaded back in; keep it.

**Result.** 272 → **279 / 351 (77.5% → 79.5%)**, zero widened, 7 pins deleted.
Structure unmoved (component 262/262, usecase 90/90).

**Bucket cleared, two re-bucketed.** `package-folder-tab` is now empty. Its
other two fixtures were misattributions the heuristic made on a leading
`artifact`/`package` keyword, and neither is tab geometry:
codabo-50-mupa164 → **creole titled separators** (S1L-i) and
tajadu-40-juro990 → **multi-line quoted display** (S1L-j). In both, every
node OTHER than the affected one already measures exact.

## S1L-c — interface `hideText` leaf sizing (DONE 2026-07-28)

**Mechanism.** `EntityImageDescription.java:137` sets `hideText = symbol ==
USymbols.INTERFACE`, and `:209-211` then builds `asSmall` from **empty**
name/desc/stereo. `calculateDimensionSlow` returns that `asSmall` dimension, so
an interface (or `circle` — `Entity.getUSymbol` maps `LeafType.CIRCLE` to
`USymbols.INTERFACE` unconditionally) leaf measures the bare
`CircleInterface2` square — `radius * 2 + 2 * margin` = `8*2 + 2*1` = **18px =
0.25in** — *regardless of its label*. The label is drawn OUTSIDE the node;
when the shield is not suppressed, `getShield` reserves room for it as
HTML-table margins around that square (`SvekNode.appendLabelHtml`) rather than
by growing the node. Our port sized these as generic text boxes.

**Origin.** `src/diagrams/description/leaf-sizing.ts#measureLeafNode` — the
symbol switch had no `interface`/`circle` case, so they fell to `measureBox`.
Fix: `INTERFACE_CIRCLE_SIZE` case.

**Ruled out.** The shield itself was NOT the defect: the oracle emits plain
`shape=rect` for these nodes (e.g. cegale-42-loxa672's `sh0007`), i.e.
`getShield` returned `Margins.NONE`, suppressed by a length-1 visible link.
`isInterfaceShielded` already modelled that correctly and every structural
check passed before and after — this was purely the `hideText` dimension.

**Unmasked (and also fixed) — bare quoted alias mutes to ACTOR.** The sizing
fix WIDENED `xacaxe-43-bupe002` 0.555556 → 1.295833, which the shrink-only
ratchet forbids. Diagnosis: a bare quoted `"Display" as Alias` line with no
type keyword is `CommandCreateElementFull`'s DISPLAY2/CODE2 branch with SYMBOL
omitted, and `java:272-275` resolves that to `actorStyle().toUSymbol()` — an
**actor**. That actor then makes `DescriptionDiagram.isUsecase()` true, so
`makeDiagramReady` mutes every remaining `STILL_UNKNOWN` leaf to actor as well.
`RE_BARE_QUOTED_DECL` admitted only the *no-alias* form, so all five of
xacaxe-43's leaves fell through to `resolveStillUnknown`'s interface default —
harmless while interfaces were sized as text boxes, glaring once they became
18px circles. Extending the regex with the `as <plain-alias>` clause
(`element-grammar.ts`) makes all five exact. Decorated aliases (`as (uc4)` /
`as :a:` / `as [c]`) stay with rule 11b, which picks the symbol from the
decoration per `executeArg`'s codeChar dispatch.

**Result.** 239 → **272 / 351 (68.1% → 77.5%)** conformant, **zero widened**,
33 backlog entries deleted, 2 shrank. DOT structure unmoved: component
262/262, usecase 90/90. The +33 exceeds the 11-fixture bucket because
interface leaves also sat inside fixtures bucketed container-cluster/other.

**Measurement-instrument fixes (same mission).** Two `CAUSE_PATTERNS` bugs in
`scripts/measure-description-size-deltas.ts`, both found because they had
parked non-interface fixtures in this bucket:
1. the sprite regex was `<\$[\w-]+>` — no `/` — so every stdlib
   `<$bundle/name>` sprite fell through to the `\binterface\b` catch
   (turasu-73-zoni468 is `rectangle … <<$archimate/interface>>`, a sprite
   fixture with no `interface` keyword at all);
2. no bucket existed for per-element font skinparams, so cukafa-49-fona812
   landed here on its `skinparam interfaceFontSize` line while its actual
   residual is its *components* (117×44 vs the jar's 139×48).

## Inherent-tolerance divergence (excluded from the conformant denominator)

| Slug | Δ (in) | Cause |
|---|---|---|
| gevozu-46-sasu860 | 4.67 | LaTeX label rendered via KaTeX ≠ upstream JLaTeXMath — different math engine, different glyph metrics. Permanent, maintainer-approved (`DIVERGENCES.md`). |
| sunuju-01-pote718 | 4.67 | same |

These 2 are the **only** exclusion. Sprites, OpenIconic, and `<style>` blocks
are ported subsystems (gaps in coverage, not divergences) and stay in the
denominator, routed to S1L-f/S1L-b above.

## S1L-b T6 — fariba-82 documented residual (diagnosed, pinned)

`fariba-82-xolu802` (`file policy <<policy>> [ JSON body ]` + an awslib `User`
sprite) sits at delta **1.024479in** after S1L-b T1–T3 (it *widened* 0.034in
past its prior 0.990278 pin when T2 first routed the `[ … ]` body to the sizer
— expected, not a regression). Diagnosed (evidence, not guess), pinned at its
true delta per ADR-5; **no cheap in-scope fix exists**. Compound of two factors:

1. **awslib `User` sprite (`user` node) — OUT OF SCOPE (S1L-f).** Our sprite
   node measures ~2.18in vs the oracle ~1.46in. Sprite sizing is the S1L-f
   sub-mission, explicitly excluded by T6's boundaries.
2. **`policy` `file` box over-wide — a body-wrap gap, not a leaf-width bug.**
   Our box is ~3.8in, the jar's ~2.4in. The widest body line
   `"Resource": "arn:aws:iam::1:role/role"` measures 229px via our width table
   (`leaf-sizing.ts#maxLineWidth`) — table-correct and weight-agnostic — but
   the jar's `file` body box is far narrower, i.e. the jar constrains/wraps the
   long un-wrapped JSON line in a way this port does not yet reproduce (a
   word-wrap/MaximumWidth behavior, → **S1L-d** territory, not a one-line fix).

**Ruled out (with evidence):** bold-glyph width — the deterministic measurer is
weight-agnostic, `<b>arn</b>` measures exactly as `arn` (ADR-2); tab width —
`WidthTableMeasurer` gives `\t` **0 width**, so the JSON's leading tabs do NOT
inflate our box; creole formatting tags — stripped by T3's `creoleVisibleText`.
Origin: `src/diagrams/description/leaf-sizing.ts#maxLineWidth` (correct per
table) + sprite sizing (`render-atoms.ts`, S1L-f). Kept pinned at 1.024479.

## S1L-b-unicode T1 — codepoint decode-ordering (DONE)

`<U+XXXX>`/`&#NNN;` escapes now decode per-line at measure/render time, AFTER
the `\n` split (ADR-1), mirroring upstream `AtomText.manageSpecialChars`. A
`<U+000A>` is inline, not a line break, so it no longer over-splits leaf boxes.
Output-neutral (dot-sync 262/262 + 90/90 EQUAL, zero widened). HEIGHT residuals
dropped: **gafico-37-cuma657 5.680208→3.752777**, **nujito-06-neca370
3.350521→3.122049** (size-backlog re-pinned, shrink-only). lurupu-11-fubo915
unchanged (its residual is emoji glyph width → T3).

## S1L-b-unicode T2 — gafico-37 documented residual (diagnosed, pinned)

`gafico-37-cuma657` sits at delta **3.752777in** after T1. Diagnosed (oracle
SVG + DOT evidence, not guess); pinned at its true delta; **no in-scope fix
exists**. The pin is driven by node **c** (`node c [ <code> $var </code> ]`) —
NOT the quoted-title node a.

- **Driver — unported `<code>` block (OUT OF SCOPE, E2r L2).** Upstream renders
  `<code>…</code>` as ONE verbatim monospace line: content neither
  creole-parsed nor codepoint-decoded (the oracle SVG shows
  `aaa <U+000A> bbb <U+000A> <u:blue>ccc …` literal, `font-family="monospace"`,
  `textLength=640.582`) → node c box **7.857×0.611in**. The port has not ported
  the `<code>` creole command (no code-block command in
  `src/core/klimt/creole/`; explicitly deferred —
  `EntityImageDescriptionSupport.ts:393` NOT-in-E2r-scope list), so it treats
  the three bracket lines `<code>` / `$var`(expanded) / `</code>` as three
  ordinary lines, creole-stripping and codepoint-decoding the `$var` line →
  **4.104×1.000in** (3 narrow lines). Width delta 3.753 (too narrow) is the max.

- **Rule 2 CORRECTION — the quoted title is NOT rendered literally.**
  `decisions.md` Rule 2 stated node a (`node "$var"`) renders as a single
  literal 77-char `<text>` (7.857in). That is FALSE: the 7.857in literal
  monospace `<text>` is node **c**'s `<code>` block (above), which planning
  mis-attributed to node a. The oracle SVG for node a (y=47.77, one line)
  CREOLE-PROCESSES it — three colored runs (`<u:blue>ccc` underlined blue,
  `<color:green>ddd` green, `<U+000A>` decoded to inline whitespace) — box
  **2.145×0.611in**, identical creole treatment to node b's first line. So
  ADR-2's "scoped quoted-title literal fix" premise does not apply; there is no
  literal-quoted-title behavior to reproduce.

- **Ruled out:** node a and node b are secondary residuals (~1.96 / ~1.93in),
  BELOW node c's 3.753 — a `$var`-content width matter shared by the bracket
  body (the port measures the decoded one-line `$var` ~2× the oracle's run
  layout), NOT quoted-title-specific and unable to move gafico's pin (node c
  dominates the MAX). No cheap in-scope fix; even a perfect node-a fix leaves
  the pin gated by the `<code>` node.

Origin: unported `<code>` creole block (`src/core/klimt/creole/`, deferred E2r
L2) surfaced through `EntityImageDescriptionSupport.ts#buildLine` /
`leaf-sizing.ts` measuring the un-blocked content. Kept pinned at 3.752777;
closing it requires porting `<code>` (a separate deferred feature), not a
quoted-title change.

## S1L-b-unicode T3 — lurupu-11 documented residual (diagnosed, pinned)

`lurupu-11-fubo915` sits at delta **2.045912in** (unchanged by T1). Diagnosed
(port-vs-oracle per-node dims + sizer/renderer visible-text probes); pinned at
its true delta. The driver is **NOT emoji glyph width** (ADR-3's premise) — it
is a **sizer↔renderer creole-lexer divergence** on one node.

- **Emoji width is already correct.** Two of the three usecase nodes match the
  oracle EXACTLY: `Implement` (`<U+1F601>`😁 `<U+1F680>`🚀) 185.8×42.0px ==
  oracle, and `foo` (`&#8734;`∞) 102.8×25.8px == oracle. `WidthTableMeasurer
  .charWidth` already returns the jar-verified fixed 16-pt fallback for astral
  code points (`cp >= 0xFFFF`, `measurer.ts:180`) — so a decoded emoji measures
  at the deterministic oracle's own width. No measurer change is warranted.

- **Driver — node `bar` sizer over-measures unstripped creole tags.**
  `bar` = `"<b>this is also <U+221E> <font Segoe UI Emoji><U+1F680><U+263A>
  </font> long"`. The RENDERER (`buildStripeAtoms`, E2r StripeSimple) strips
  the UNCLOSED `<b>` and the space-form `<font Segoe UI Emoji>`/`</font>` →
  visible `"this is also ∞ 🚀☺ long"` (22 cps) → ~147px, matching the oracle
  (2.042in). The SIZER (`leaf-sizing.ts#maxLineWidth` → `creoleVisibleText` →
  `parseCreole`, `src/core/creole.ts`) strips NEITHER (`parseCreole` leaves an
  unclosed `<b>` and any `<font Name>` tag literal — verified) → 53 cps →
  ~333px box. The DOT box is sizer-driven, so it is oversized by the literal
  tag text the renderer never draws.

- **Ruled out:** emoji/astral width (Implement + foo match exactly); codepoint
  decode (T1 correct — the `<U+…>` decode identically in both paths). The gap
  is purely the two creole lexers disagreeing on unclosed-`<b>` and
  space-form-`<font>`.

Origin: `src/core/creole.ts#parseCreole` (the sizer's lexer) lags the
renderer's `src/core/klimt/creole/legacy/StripeSimple.ts#buildStripeAtoms` for
unclosed `<b>` and `<font Name>`. **Out of T3 scope** (the fix is a
sizer↔renderer creole-lexer sync in `leaf-sizing.ts`/`creole.ts`, not an
emoji-width measurer change) and **high blast radius** (routing the sizer's
visible-text through `buildStripeAtoms` would re-measure every description leaf
— it must be measured, not assumed). **Flagged as a scoped follow-on:
"sizer↔renderer creole visible-text unification."** Kept pinned at 2.045912.
**RESOLVED — see creole-lexer-unification below; lurupu-11 now conformant.**

## creole-lexer-unification (2026-07-27) — the follow-on, DONE

The "sizer↔renderer creole visible-text unification" follow-on (flagged in
S1L-b-unicode T3 above) landed. `plans/creole-lexer-unification/`.

- **T1 (spike, GATE):** `scripts/measure-creole-lexer-delta.ts` measured the
  corpus impact of switching the sizer's visible-text lexer from `parseCreole`
  to the renderer's stripe engine — 28 shrink / 319 neutral / 1 widen across
  348 goldens. It **DISPROVED the brief's premise** that gafico-37/nujito-06
  would shrink: their `<color:green>`/`<u:blue>` tags sit adjacent to a decoded
  `<U+000A>` where `buildStripeAtoms`'s command scanner ALSO leaves them
  literal — both lexers agree, so the unification is a no-op for them. They
  stay pinned, driven by node c's `<code>` block (deferred, unchanged).
- **T2 (unify):** extracted one shared `StripeSimple.ts#buildLineAtoms` helper;
  `EntityImageDescriptionSupport.ts#buildLine` delegates to it (renderer output
  byte-identical) and `leaf-sizing.ts#creoleVisibleText` now calls it (dropped
  `parseCreole`). The sizer strips exactly what the renderer strips. **lurupu-11
  → conformant.**
- **T3 (scope-expanded, user-approved):** T2 un-masked a pre-existing gap on the
  URL-`<img>` cannot-decode fixtures (the old sizer accidentally measured the
  long raw `<img:URL>` markup ≈ the jar's `(Cannot decode: URL)`). Fixed
  faithfully in `creole-atoms.ts#cannotDecodeText`: http/https raster →
  `(Cannot decode: <url>)`, `.svg` URL → `(Cannot decode SVG: <url>)`
  (`AtomImg.java:214/218/226/230`); data-URI/file stay short (megabyte /
  security-profile reasons). That exposed a SECOND pre-existing bug: the
  description parser leaked the `[body] as alias` wrapper into `node.display`
  for the keyword+bracket form (`component [X] as Y`) — fixed in
  `command-table-containers.ts` KEYWORD_RE by routing a leading `[...] as ...`
  through the existing `parseBracketDeclaration`. Together these made
  **pebace-74 and togeke-15 conformant**.

Net (measure re-baseline): **236/351 (67.2%) → 239/351 (68.1%)** conformant,
zero widened, dot-sync 262/262 + 90/90 unchanged. Deleted pins: lurupu-11,
pebace-74, zotiru-33. Shrunk: nobiza-91 1.460→0.669, tuliba-37 6.736→0.521,
gevozu-46/sunuju-01 4.670→0.612, vivido-49 2.520→0.157, jecici-56 3.183→0.315,
xufexu-38 1.458→0.153, nenedo-78 0.865→0.169.

**Residuals still named (separate pre-existing gaps, NOT this mission's):**
nobiza-91 (0.669) — its note cannot-decode text measures at NOTE font 13 vs the
jar's 14 (note-font gap, **tracked: GH #23**); gafico-37/nujito-06 — node c `<code>` block (**tracked: GH #24**; deferred
E2r L2); per-atom font-SIZE width parity (ADR-2, `<size:N>`/`==` headings).

## Size backlog

`oracle/goldens/description/size-backlog.json` — 112 shrink-only per-fixture
pins (incl. the 2 LaTeX fixtures, tracked for non-regression even though
excluded from the reported denominator; 115 → 112 after creole-lexer-unification
deleted lurupu-11/pebace-74/zotiru-33). Its `_doc` records the capture
provenance. Re-measure with `npx tsx scripts/measure-description-size-deltas.ts`
(exit 0 iff zero widened).

## description-leaf-sizing-audit — carried findings (T4, 2026-07-28)

Audit-only mission (ADR-4: findings are FILED, not fixed). Twelve open items,
each one line pointing at the table row that holds its evidence — so they
outlive the mission that found them. Neither table is a golden or a ratchet;
if they are ever deleted, these lines are the surviving record.

**Six sizer↔renderer GAPs** — `planning/sizer-renderer-parity.md`, "The table"
+ "Proofs". A `GAP` = a setting the RENDERER honours (or the jar does) that
never reaches `measureLeafNode`, so the box and the ink disagree.

1. **per-element `Shadowing`** — `resolveElementShadowing` reaches the renderer
   (`renderer-entity.ts:212`) and nothing in the sizer. Actor family only:
   `actor { Shadowing 6 }` 1.027778 → 1.111111in (74→80px), width unchanged;
   size-neutral on component/usecase/control/entity. Row: per-element resolvers,
   `element Shadowing`. Proof: "`Shadowing` — GAP, proven".
2. **diagram-wide `Shadowing`** — same mechanism, second tier
   (`theme.shadowing`, `theme.ts:83`); bare `root { Shadowing 6 }` gives the
   identical 1.111111in. One Batch-4 fix covers both tiers. Row: additional
   settings, `diagram-wide Shadowing`.
3. **per-element `LineThickness`** — `resolveElementLineThickness` →
   `renderer-entity.ts:213` only. `actor { LineThickness 6 }`
   0.498264×1.027778 → 0.527778×1.180556in, i.e. `ActorStickMan`'s `+2×t` term
   (38 = 26+2×6, 85 = 59+2×6+14). Row: per-element resolvers. Proof:
   "`LineThickness` — GAP, proven".
4. **`skinparam wrapWidth`** — threaded into `BoxSizingOpts` but read by
   `measureBox` ALONE; 6 of 7 leaf shapes (folder, package, note, actor,
   entity, usecase) measure unwrapped and render wrapped. Per-shape before/after
   dims in the row. Proof: "`wrapWidth` — GAP, proven".
5. **`skinparam guillemet`** — same one-caller seam (`maxLineWidth`'s
   `guillemet` param, `leaf-sizing-text.ts:197`). T4 upgraded this from INFERRED
   to measured on both sides: jar `entity` 0.843403 → 1.084028in under
   `guillemet false`, ours 0.843403 in both. Proof: "`guillemet` — GAP, proven
   (T4; was inferred)".
6. **`skinparam actorStyle`** — a FIDELITY gap, not a parity drift: both paths
   hardcode STICKMAN identically, but the jar honours the setting (awesome
   0.763889×1.041667, hollow 0.444792×0.652778 vs our 0.444792×1.027778 for
   all). Needs the missing `ActorAwesome`/`ActorHollow` ports FIRST, then a
   `Theme` field both paths read. Proof: "`skinparam actorStyle` — verdict
   CHANGED to GAP (T4)".

**Six USymbol composition MISMATCHes** — `planning/usymbol-composition.md`,
"The table" + "MISMATCH detail — evidence". All six are one root divergence:
`src/core/decoration/symbol/` holds a faithful per-class port that the RENDERER
imports and the leaf SIZER does not, re-deriving the same geometry as flat
tables.

7. **HEXAGON** — composition K5 `width × 2` (`USymbolHexagon.java:79`), not a
   margin: jar 64.05×24.0, ours 52.025×34; the width error grows linearly with
   the label. Row: HEXAGON. Evidence §1.
8. **PERSON** — composition K6, head height `sqrt(w·h) × .42`
   (`USymbolPerson.java:70-73,:101`): jar 52.025×51.664, ours 52.025×34 —
   short by 17.66, scaling with `sqrt(area)`. Row: PERSON. Evidence §2.
9. **USECASE_BUSINESS** — `withMargin(tmp, 7, 0)` before the ellipse fit
   (`USymbolUsecase.java:100`) refits `alpha`, so the error is +19.80px, not
   +14: jar 0.987350in vs our 0.712364in. Row: USECASE_BUSINESS. Evidence §3.
   **T4 addendum (blocks the Batch-4 row):** the pad reaches the fit as a
   `UEmpty` shape (`TextBlockMarged.java:80-88` → `Footprint.java:163-166`),
   NOT as ink, and our `footprintBoxes` has no `UEmpty` concept — widening
   `textW` alone yields 62.071×23.056, not 71.089×25.799. See
   `sizer-renderer-parity.md` Proofs, "`Footprint` and the USECASE_BUSINESS
   pad".
10. **ACTOR_AWESOME** — `ActorAwesome` drawing 55×61
    (`J/skin/ActorAwesome.java:98-104`) under K2; ours hardcodes stickman
    27×60. Same defect as GAP 6 seen from the symbol side. Row: ACTOR_AWESOME.
    Evidence §4-5.
11. **ACTOR_HOLLOW** — `ActorHollow` drawing 26×33
    (`J/skin/ActorHollow.java:105-111`); ours 27×60, i.e. 27px too tall. Row:
    ACTOR_HOLLOW. Evidence §4-5.
12. **ARCHIMATE** — not a sizing bug: the keyword is absent from
    `KEYWORD_SYMBOL_ENTRIES` (`descriptive-keywords.ts:71-103`), so the line
    never becomes a description leaf at all. Sizing is already correct once the
    keyword exists (plain `USymbolRectangle` `[20,20]`, jar 52.025×34). Needs a
    `CommandArchimate` port; `leaf-sizing*.ts` needs nothing. Row: ARCHIMATE.
    Evidence §6.

**Two verdicts T4 CORRECTED, recorded so they are not re-litigated:**
`BoxSizingOpts.inkSprites` is a dead DUPLICATE channel, not a gap — the
use-case footprint is already ink-fit through `spriteDimsLookupFor`'s
`inkWidth`/`inkHeight` (S1L-k, above, is genuinely closed; our port matches the
jar exactly on an ink≠declared sprite, 0.710157×0.584792 vs 1.041066×0.849519
for identical 40×40 declarations). And `skinparam actorStyle` is NOT
size-neutral (item 6). Both corrections carry their measurements in the Proofs
section.

**Also filed, not `MISMATCH` (no output differs today):** `component` and
`cloud` measure right for the wrong reason — a fitted "icon allowance" standing
in for upstream's own `getMargin()` (`usymbol-composition.md`, M-note 1).

## T8 — `archimate` keyword wired (DONE 2026-07-29, batch-4)

**Closes item 12 above.** `archimate` is now in `KEYWORD_SYMBOL_ENTRIES`
(`descriptive-keywords.ts`), so the line becomes a leaf. Maps to the
EXISTING `'rectangle'` USymbol, not a new `'archimate'` tag: upstream's
`USymbols.ARCHIMATE = new USymbolRectangle(SName.archimate)` is the SAME
`USymbolRectangle` class `USymbols.RECTANGLE` uses, differing only in the
`SName` `getSNames()` reads for CSS/stereotype class naming during
`drawU` — verified `USymbolRectangle.ts`'s `asSmall`/`asBig`
`calculateDimension` never reads `this.sname`, so sizing is byte-identical.
Reaching the true `USymbols.ARCHIMATE` singleton (for its distinct CSS
class) needs a new branch in `core/svek/image/
EntityImageDescriptionSupport.ts#fromStringWithSkinParam` — out of T8's
write-set (only `descriptive-keywords.ts`/`parser.ts`); **filed here as a
rendering-fidelity follow-up, not a sizing gap** (mirrors upstream's own
`fromString(String, ISkinParam)`, which also never resolves `archimate` —
`CommandArchimate.java` never calls it, it passes `USymbols.ARCHIMATE`
directly at leaf-creation time; this port's renderer/sizer instead
re-derive the shape from the keyword string at draw/measure time, so the
two architectures need a branch ours doesn't have yet).

**Grammar gap found and fixed (not pre-existing):** `archimate`'s mandatory
`#color` token PRECEDES CODE/DISPLAY — the only `KEYWORD_TO_SYMBOL` keyword
where color is required and leads rather than optional-and-trailing. Feeding
that straight through the generic rule-14 dispatch (`command-table-
containers.ts`) defeated `parseNameSection`'s `splitLeadingQuote` guard
(remainder starts with `#`, not `"`, so the "guillemets inside a quoted
display are literal text" protection never engages) — the exact bug class
the mission brief warned about, reproduced first, then fixed via a
dedicated `tryArchimate` phase in `parser.ts` (runs before the COMMANDS
table) that strips the color token first, so `parseNameSection` always
sees a remainder starting at the quote. Verified against
`archimate #Business "<<inside>> Hello"` (co-located test) and against
jar probes (`archimate #Business "Hello"` → 52.025×34; alias forms;
scratchpad captures, not committed).

**Filed, not implemented (ADR-4) — the other two upstream commands:**

- **`CommandArchimateMultilines`** (`archimate #color CODE [ … ]` body
  block) — jar probe (`archimate #Business Elem1 [` / `desc line one` /
  `]`, plus a throwaway second element): **94.8125×34**. Notably, upstream
  itself creates this leaf with `USymbols.RECTANGLE`, not
  `USymbols.ARCHIMATE` (`CommandArchimateMultilines.java`'s
  `executeNow`) — a real upstream inconsistency between its two archimate
  leaf commands, confirmed by reading the Java, not assumed.
- **`CommandArchimatePackage`** (`archimate #color Name { … }` group) —
  jar probe (`archimate #Business "GroupA" as GA {` / `component Inner` /
  `}`, plus a throwaway sibling): a `GroupType.PACKAGE` cluster,
  `fill="#FFFFCC"` (`#Business` = `0xFFFFCC`, `ColorTrieNode.ts:200`),
  `rx="2.5"` — the SAME `USymbols.ARCHIMATE` shape as the single-line
  leaf form, applied to a container. Neither form is reachable through
  this port's parser today (an `archimate … {` line falls through to the
  generic rule-14 keyword dispatch, same fate as any other non-container
  keyword followed by a stray `{` — not a new failure mode this task
  introduced).

**Result.** `archimate` reachable, single-line form only.
`measure-description-size-deltas.ts`: 316 → 317/351 conformant (+1 from a
concurrent T7 fix, unrelated to this task; archimate itself has no corpus
fixture), zero widened. DOT parity unchanged: component 262/262, usecase
90/90, class 708/708. `measure-class-size-deltas.ts` unchanged: 219/708,
zero widened.

### T8 follow-up — ORCHESTRATOR CORRECTION to the SName characterization

T8 filed the `'rectangle'`-not-`'archimate'` SName mapping as "a
rendering-fidelity follow-up, **not a sizing gap**." That is too narrow, and
the distinction matters because it is the exact path S1L-h fixed.

Traced: `layout-dot-tree.ts:180` passes `ctx.fontSizeFor(node.symbol)`, and
`layout.ts:439` resolves that as `resolveElementFontSize(theme, sname,
'title')`. The `sname` IS the USymbol tag from `KEYWORD_SYMBOL_ENTRIES`. So
an archimate element tagged `'rectangle'` resolves a `<style> rectangle { … }`
bucket, while the jar — which passes `USymbols.ARCHIMATE`, whose `SName` is
`archimate` — resolves `<style> archimate { … }`.

Consequence: `<style> archimate { FontSize 20 }` (or the `skinparam
archimateFontSize` spelling) changes the node's measured SIZE in the jar and
does nothing here. Every per-element resolver keyed on `sname` is affected
the same way, not only fonts.

Unmeasured — no corpus fixture exercises it, and T8's own probes used the
default style — so it stays FILED per ADR-4 rather than claimed or fixed.
But it is filed as a **sizing** gap, not a cosmetic one. Whoever adds the
`fromStringWithSkinParam` branch should probe `<style> archimate { FontSize
N }` against the jar first and record the numbers.

T8's substantive findings stand and are not affected by this correction: the
geometry really is byte-identical (`USymbolRectangle`'s `calculateDimension`
never reads `this.sname` — verified), and upstream's own `fromString(String,
ISkinParam)` really does not resolve `archimate` either, because
`CommandArchimate.java` passes the singleton directly at leaf-creation time
rather than re-deriving the shape from the keyword string as this port does.


## Residual filed by mission `bodyenhanced-atom-seams` (2026-07-30)

### The `Sea`/`SheetBlock1` single-resolved-value gap — SIZING, blocks 2 narrowings

The faithful `create3` → `Sea` → `SheetBlock1` pipeline carries **exactly one
resolved value per atom**, reused for width, line-stacking height, and
footprint fitting alike. It has **no declared-vs-ink channel and no
per-element-vs-diagram-default channel anywhere**.

Two of the previous mission's four narrowings sit on this one hole:

| narrowing | needs | measured cost of routing anyway |
|---|---|---|
| box + `<img>` | the diagram-default font for the cannot-decode fallback | `jecici-56-bimu826` widens 0 → **0.398264in** |
| usecase + sprite, MULTI-LINE | ink height distinct from stacking height | `bootstrap-0` / `ruziru-69-xixo434` widen 0 → **0.029321in** |

Both numbers are from T5 removing the guard for real and reverting, not from
inspection.

**Note the shape.** ADR-2 (ink fields on `AtomImageResolver`) and ADR-3
(`imgFallbackFont` threading) each added exactly such a side channel to the
OLD pipeline. Routing to the faithful pipeline discarded both — T3's fix was
correct on landing and dead once T4 bypassed `buildTextBlock`. **Whoever
takes this must add the channels to `Sea`/`SheetBlock1`/`descAtomOps`, or
these same two narrowings re-open a third time.**

Owner: **SI1** (it already owns `create2`/`MethodsOrFieldsArea`).
