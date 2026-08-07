# Findings — `icon` bucket (T7)

One fixture. Records follow [SCHEMA.md](SCHEMA.md) verbatim.

### murava-69-tago286

- **bucketLabel:** `icon` (classifier hypothesis only, ADR-3 — matched on
  `CAUSE_PATTERNS`' `/<&[\w-]+>|<:[^:>\n]+:>/`. The fixture is the `<:…:>`
  EMOJI half of that regex, not the `<&…>` OpenIconic half.)
- **delta:** 0.181655 (re-measured this task; unchanged from the baseline pin)
- **status:** resolved
- **mechanism:** Our port draws a `<:name:>` emoji atom as a platform-glyph
  `UText` (a 21×21 square, font size `36*factor`) instead of upstream's
  Twemoji SVG artwork, so the `Footprint` point-collector that fits the
  usecase ellipse sees the wrong shape *and* the wrong vertical origin. The
  emoji's DECLARED box is correct everywhere — only the DRAWN footprint is
  wrong, which is why the defect appears exclusively on ellipse-fitted
  (usecase) leaves.
- **originFileLine:** `src/core/klimt/creole/atom/AtomEmoji.ts:61`
  (`emojiRenderRun` — the substitution site; its own doc comment at
  `AtomEmoji.ts:56-60` records the artwork as deliberately unported).
  Consumed into the ellipse fit at
  `src/core/svek/image/EntityImageDescriptionTextBlock.ts:325-329`.
- **causalChain:**
  - Fixture: `usecase "<:rocket:> Implement the changes"` + `[Company]`.
    `svek-1.dot` node `sh0006` (the ellipse) carries the whole delta; the
    `[Company]` rect `sh0007` is exact (`1.388021 × 0.611111`, dw = dh = 0).
    Ours `2.858848 × 0.638436` vs jar `2.677193 × 0.602105` →
    **dw = +13.079px = +0.181655in**, exactly the recorded delta; dh = +2.616px.
  - `USymbolUsecase` (K4) fits `TextBlockInEllipse` → `Footprint#getEllipse`
    → `ContainingEllipse`. The fit consumes only (a) `alpha` from the DECLARED
    block dim and (b) the corner points of every shape the block DRAWS.
  - (a) is right: the declared block is `158.6375 × 22.75` in both, so alpha
    clamps to `ALPHA_MIN = 0.2` in both (measured: both fits return h/w = 0.2).
  - (b) is wrong. Instrumented via a prototype patch on
    `ContainingEllipse#append`, our point set is
    `emoji (0,−3.1667)-(21,17.8333)` + `text (21,7.1389)-(158.6375,21.1389)`.
    The emoji box is our glyph `UText` measured 21×21 and placed by
    `Footprint.drawText`'s baseline rule `yy = y − (h − 1.5)`.
  - Upstream instead runs `AtomEmoji.drawU` → `Emoji.drawU` →
    `SvgNanoParser.drawPath` → one `UPath` per `<path>`/`<circle>` of
    `emoji/data/1f680.svg`, and `Footprint.drawPath`
    (`J/svek/image/Footprint.java:149-152`) adds exactly TWO points per shape —
    `(minX,minY)` and `(maxX,maxY)` — where `UPath`'s min/max include CONTROL
    points (`J/klimt/UPath.java:83-95`). Vertical origin is y = 0, from
    `Sea.doAlign` + `translateMinYto` (`J/klimt/creole/Sea.java:73-88`):
    emoji `y = −36f − 3f = −22.75`, text `y = −14`, min is the emoji, so after
    the shift emoji top = 0 and text top = +8.75.
  - Derived that point set by hand from `1f680.svg` (6 shapes, scaled by
    `factor = 14/24`), fed it into OUR `ContainingEllipse` at alpha 0.2 with
    our own (unchanged) text-run points, and got **192.7579 × 43.3516px =
    2.677193 × 0.602105in — the jar's node, exact to 4 decimals.** Mechanism
    reproduced from the Java, not fitted.
  - Two intermediate point sets confirm both halves are load-bearing:
    declared 21×21 box at the correct origin y=0 → 196.6231 (removes ~70% of
    the width error); full artwork ink BBOX (4 corners) at y=0 → 196.1511;
    per-shape `(min,min)/(max,max)` → 192.7579. The 4-corner bbox is NOT the
    same point set as 12 per-shape corner points — that last 3.4px is upstream
    never emitting the `(minX,maxY)`/`(maxX,minY)` corners.
- **ruledOut:**
  - *Emoji WIDTH/height constants (`emojiBoxDim`, `36f`/`39f`)* — jar-probed:
    `rectangle "<:rocket:> Implement the changes"` measures `2.481076 ×
    0.593750` in the jar and **byte-identically in our port**;
    `rectangle "Implement the changes"` likewise (`2.189410 × 0.472222`, both).
    The box delta is +21.0px wide / +8.75px tall = exactly `36f` / `39f − 14`.
    The declared-dimension path is correct.
  - *The usecase/K4 sizing branch itself* — `usecase "Implement the changes"`
    (same fixture, emoji deleted) is `2.227990 × 0.512265` in the jar and
    **exact in our port**. The ellipse branch is right for pure text.
  - *`ContainingEllipse` / `SmallestEnclosingCircle` arithmetic* — the same
    implementation reproduces the jar exactly for the emoji-free case AND for
    the emoji case once fed upstream's point set (above). The fit is not the
    defect.
  - *Text-atom placement inside the mixed line* — `Sea.doAlign` predicts the
    text atom's top at +8.75 relative to the line; our instrumented points are
    `y ∈ [7.1389, 21.1389]` = `8.75 + [−1.6111, 12.3889]`, and `[−1.6111,
    12.3889]` is precisely the emoji-free case's own (jar-exact) span. Our
    text placement is upstream-exact; only the emoji shape is not.
  - *`skinparam wrapWidth` / `guillemet` / `MinimumWidth` / per-element font*
    (the known `sizer-renderer-parity.md` GAP set) — none appear in the
    fixture source, and the emoji-free variant is already exact, so no threaded
    setting is implicated.
  - *The sprite ink channel (`inkSprites`, `inlineFootprintBox`,
    `sizingAtomImageResolverFor`)* — an `emoji` atom is its own `CreoleAtom`
    kind (`atom/Atom.ts:82`) and never reaches `measureInlineAtom` or the
    `AtomImageResolver`; the resolver is not consulted for it at all
    (`EntityImageDescriptionTextBlock.ts:325` returns before the resolver
    branch at `:332`). T4's proof that sprite ink is jar-exact therefore does
    not transfer, and neither does its defect.
  - *The `<&…>` OpenIconic half of the bucket label* — not present in this
    fixture's source; `<:rocket:>` is `StripeSimple.addEmoji`
    (`StripeSimple.ts:188`).
- **sharedCauseWith:** none (checked deliberately against the whole `sprite`
  bucket — nearest neighbours below; neither is this mechanism)
  - `bivira-53-boja685` — measured per node: the diverging node IS a usecase
    ellipse (`sh0008`, +4.64px w / +3.71px h), i.e. the same *seam* (an inline
    atom's ink inside `Footprint`), but the atom is a `[48x48/16z]` compressed
    monochrome sprite on the `href:''` + `rasterWidth/Height` fallback, and its
    SIBLING ellipse `sh0007` (same sprite, outside the link) is EXACT. So
    bivira's variable is the link wrapper, not the atom artwork. Related
    family, different mechanism — do not batch as one fix.
  - `vivido-49-nisu863` — its diverging node `sh0008` is the `<&cloud>`
    OpenIconic RECT and ours is **11.33px NARROWER** (a declared-width gap on
    the linear box path), the opposite sign and the opposite path from this
    finding, whose box widths are exact. Same "inline vector icon atom" family
    (upstream `AtomOpenIconic` also draws `SvgPath` shapes), different defect.
  - `kofuca-08-pafi749`, `nobiza-91-fimo741`, `turasu-73-zoni468` — no `<:…:>`
    emoji in source; not this mechanism.
- **proposedWriteSet:**
  - NEW emoji artwork asset module (1177 files / 1.75 MB uncompressed in the
    pinned jar at `net/sourceforge/plantuml/emoji/data/*.svg`) — must NOT go
    into `src/` as a literal (browser/no-fs constraint + the repo's per-file
    line cap); the existing `packages/stdlib/assets` + `includeStore`/asset-
    store seam is the precedent to follow.
  - `src/core/klimt/creole/Emoji.ts` — add the `Emoji#drawU` half (artwork
    lookup by codepoint); today it is the name registry only.
  - `src/core/klimt/creole/atom/AtomEmoji.ts` — replace `emojiRenderRun`
    (`:61`) with a `drawU` that feeds the artwork through the ALREADY-PORTED
    `src/core/klimt/sprite/SvgNanoParser.ts` (the same decomposition
    `render-atoms.ts#resolveSvgSpriteAtom` uses for SVG sprites).
  - `src/core/svek/image/EntityImageDescriptionTextBlock.ts:325-329` and
    `src/core/svek/image/EntityImageDescriptionDelegates.ts:191` — the two
    `emojiRenderRun` call sites.
  - `src/diagrams/class/class-member-atom-resolve.ts:96` — third call site
    (class engine); must move in lock-step or class emoji rows keep the glyph.
- **sizeEstimate:** 4 source files + 1 new asset channel; blast radius is
  every `<:…:>` in every engine (sizing AND rendered SVG output changes from a
  platform glyph to Twemoji vector artwork — a visible, intended change).
  The asset payload (1.75 MB) is the real design decision, not the code. The
  `SvgNanoParser` + `Footprint` machinery is already ported and jar-verified
  on the sprite path, so the geometry work is wiring, not new algorithm.
  Verification: this fixture goes conformant; re-run the description size
  ratchet plus the class-engine emoji goldens (`lecelo-92-loma110` and the A2s
  R2a emoji probes) as the regression guard.
- **confidence:** high — the jar's node is reproduced to 4 decimals from
  upstream source semantics, with no fitted constant.

---

## Adjacent defect found while instrumenting (NOT this fixture, no golden yet)

Recording it here rather than losing it — it is the same file and would be
touched by the same fix.

An emoji-ONLY creole line measures 3×`factor` too tall. Jar probe
`rectangle "<:rocket:>"` (+ throwaway `usecase "qq"` + one edge) is
`0.569444 × 0.569444` = **41 × 41px**; our port returns **41 × 42.75px**.

Mechanism: `EMOJI_LINE_HEIGHT_FACTOR = 39` (`AtomEmoji.ts:38`) is applied
unconditionally at `EntityImageDescriptionTextBlock.ts:189`, but upstream's
`39*factor` is an EMERGENT property of `Sea.doAlign` + `translateMinYto`
(`J/klimt/creole/Sea.java:73-88`) when a TEXT atom shares the line:
`emoji y = −1.5S − 0.125S`, `text y = −S`, min is the emoji, so the line
bottom lands at `1.625S = 39*factor`. With no text atom on the line the max
is the emoji's own `1.5S = 36*factor` = 21px, giving the jar's 41. The
constant is correct for the mixed case and 3×`factor` (= 1.75px at font 14)
too tall for the emoji-only case.

No fixture in `oracle/goldens/description/` exercises it today (murava-69's
line is mixed, so it is unaffected). Per `CLAUDE.md`'s "corpus is a starting
point", the fix mission should author a fixture + jar oracle for it rather
than leave it uncovered.
