# Findings — bucket `sprite` (T2)

Five fixtures, **five records, six distinct mechanisms** (`nobiza-91` carries
two). The bucket label held for only two of the five (ADR-3): `kofuca-08` is a
stereotype **font-size** bug with no sprite in it at all (its `<$…>` markup is
an `<img data:…>` PNG), and `vivido-49`'s dominant node is an **OpenIconic**
`<&cloud>` glyph, not a sprite.

Every number below is a measured DOT node dimension. Jar probes used the pinned
oracle (`java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<d> -jar
oracle/dist/plantuml-oracle.jar -tsvg -o <d> <f.puml>`), always two elements +
one edge (a single-entity diagram emits no DOT). Port side measured through
`WidthTableMeasurer` + `setLayoutInputObserver` + `dotInputToStructural`, the
same seam the goldens were captured through. Inches ×72 = px.

## The six mechanisms

| # | mechanism | origin | fixtures |
|---|---|---|---|
| M1 | stereotype-as-sprite: neither upstream branch is implemented | `EntityImageDescriptionDelegates.ts:337` | `turasu-73`, `nobiza-91` (node 0) |
| M2 | no internal `/sprites/` bundle, so a stdlib-less `<<$archimate/…>>` can never resolve | `sprite-commands.ts:132` | `turasu-73` (stacked on M1) |
| M3 | sprite inside a `[[url label]]` gets the `fontSize/13` factor upstream deliberately omits | `StripeSimple.ts:221` | `bivira-53`, `vivido-49` (nodes 0,1) |
| M4 | OpenIconic glyph table has 6 of upstream's ~223 names; an absent name emits no atom | `creole-atoms-openicon.ts:44` | `vivido-49` (node 2) |
| M5 | per-element `StereotypeFontSize` never reaches the sizer | `layout.ts:436` | `kofuca-08` |
| M6 | note height is `lineCount × 13`, blind to a line whose run font is the hardcoded img-fallback 14 | `leaf-sizing.ts:224` | `nobiza-91` (node 1) |

---

### bivira-53-boja685

- **bucketLabel:** sprite
- **delta:** 0.064447
- **status:** resolved
- **mechanism:** A `<$sprite>` that sits inside a `[[url label]]` is scaled by
  `fontSize/13` in our port but NOT in the jar — upstream builds the URL-label
  sprite through a second, separate constructor
  (`AtomTextUtils#createAtomTextForUrl`, `java:120`) that passes the RAW parsed
  scale, deliberately skipping `CommandCreoleSprite`'s `* fc.getSize2D()/13.0`
  (`java:83`). Our creole scanner emits one undifferentiated sprite token for
  both contexts, so `spriteScale` applies the factor unconditionally.
- **originFileLine:** `src/core/klimt/creole/legacy/StripeSimple.ts:221` (the
  `{ kind: 'inline', atom, ambientFont }` push — no url provenance is attached,
  so no downstream consumer can drop the factor; the factor itself is applied
  at `src/core/creole-atoms-measure.ts:77`)
- **causalChain:** The `$maxime` sprite is declared `[48x48/16z]`. Outside a
  link the jar scales it `48 × 14/13 = 51.6923` — our `spriteScale` agrees
  exactly (node 1, `usecase (map)`, jar = ours = `3.510711 × 1.248840`, and a
  bare `rectangle "<$maxime>"` is `71.692 × 71.692` on both sides). Inside the
  link the jar uses `48` flat. Isolated on the LINEAR path to remove the
  ellipse from the arithmetic: `rectangle "You can click\n[[http://www.google
  .com <$maxime>]]"` → jar `1.316840 × 1.138889` (94.812 × **82**), ours
  `1.316840 × 1.190171` (94.812 × **85.692**); `85.692 − 82 = 3.692 = 51.6923 −
  48` exactly, and the width matches because line 1 (`You can click`) is wider
  than either sprite. Fixture node 2 is the same display on a `usecase`, so the
  3.692 goes through `TextBlockInEllipse`'s refit and comes out as
  `+4.640 w / +3.712 h` (jar `1.485102 × 1.204748`, ours `1.549549 × 1.256306`)
  — `4.640/72 = 0.064447` = the reported delta.
- **ruledOut:**
  - *Sprite ink vs declared box* (the `inkSprites` / SI14–SI15 family). Node 1
    carries the SAME sprite outside a link and is exact to six decimals; a
    dims-resolution bug could not be link-position-dependent.
  - *Ellipse-fit / `Footprint` divergence.* Reproduced the identical 3.692 on a
    `rectangle`, where no ellipse is involved.
  - *`raster − 1` / `Math.round(declared)`.* 48 and 51.6923 are both integral-
    or-exact under either rule; the gap is 3.692, not 1.
  - *Link-label extraction.* `buildLineAtoms("aa[[http://p.com <$maxime>]]")`
    returns exactly `[text "aa", inline sprite]` — the url text is correctly
    dropped from the measured content, and the rectangle probe's width is exact.
- **sharedCauseWith:** `vivido-49-nisu863` (nodes 0 and 1 — same bucket, same
  mechanism, arithmetic in that record)
- **proposedWriteSet:** `src/core/creole-atoms.ts` (add url provenance to
  `InlineAtomToken` / `AtomSpan`, or a `LineAtom` flag),
  `src/core/klimt/creole/legacy/StripeSimple.ts` (set it on the url branch),
  `src/core/creole-atoms-measure.ts` (`measureInlineAtom` skips `spriteScale`'s
  font factor when set), `src/diagrams/description/render-atoms.ts` +
  `leaf-sizing-entity.ts` (both resolvers must agree, per
  `planning/sizer-renderer-parity.md`).
- **sizeEstimate:** ~5 files; blast radius is every engine that measures creole
  atoms (class/state/object share `creole-atoms*`), so the ratchets to re-run
  are description + class + state + object, not description alone; verification
  = 3 jar probes already written up here + full `npm test`.
- **confidence:** high

---

### kofuca-08-pafi749

- **bucketLabel:** sprite — **wrong label.** `$AWSImg()` expands to
  `<img data:image/png;base64,…>`, an IMG atom, and the classifier's `sprite`
  regex fired on the `!include <awslib14/…>` half of its alternation. No
  `<$sprite>` and no img-sizing bug is involved.
- **delta:** 0.305903
- **status:** resolved
- **mechanism:** `awslib14/AWSCommon.puml:37-39` sets `skinparam rectangle {
  StereotypeFontSize 12 }`. The sizer resolves exactly ONE font size per leaf —
  `ClassifyCtx.fontSizeFor` asks only for role `'title'` — so the stereotype
  block measures at the element font 14 while the jar (and our own renderer)
  draws it at 12.
- **originFileLine:** `src/diagrams/description/layout.ts:436`
  (`fontSizeFor: (sname) => resolveElementFontSize(theme, sname, 'title')` —
  the `'stereotype'` role the renderer resolves at `renderer-entity.ts:185` has
  no sizer channel; `leaf-sizing-entity.ts:146` then fills `fontStereo` from the
  title font)
- **causalChain:** Both nodes expand (via `AWSEntity`) to `rectangle "==Label\n
  <img data:…>\n//<size:12>[Technology]</size>//\n\n Optional Description"
  <<Service>> as alias`. The jar's own SVG confirms the stereotype text and its
  size: `«WorkDocs»` `textLength=68.7 @12` and `«SimpleStorageService»`
  `textLength=132.15 @12`.
  - **Height, both nodes:** stereo line 14 (ours) vs 12 (jar) → `2.138889` vs
    `2.111111` in = **+2px on each**.
  - **Width, node 2:** the stereotype is the widest line. Jar `20 + (132.15 +
    2) = 154.150`; ours measures `«SimpleStorageService»` at 14 =
    `154.175`, `20 + (154.175 + 2) = 176.175` → **+22.025px = 0.305903in**, the
    reported delta. (`+2` is `TextBlockUtils.withMargin(stereo, 1, 0)`.)
  - **Width, node 1:** `«WorkDocs»@14 = 80.15`, +2 = 82.15 — still narrower
    than the 142.238 label block, so the same error is invisible there. Ours
    matches the jar exactly on node 1's width, which is why this looked like a
    per-node bug rather than one setting.
  - **Minimal isolation:** `rectangle "X" <<SimpleStorageService>>` with
    `skinparam rectangle { StereotypeFontSize 12 }` → jar `2.140972 ×
    0.638889`, ours `2.446875 × 0.666667` = **+22.025 w, +2 h**, i.e. the
    fixture's exact deltas from two lines of source. Without the skinparam,
    jar = ours = `2.446875 × 0.666667`.
- **ruledOut:**
  - *The `<img data:…>` PNG.* Both nodes embed a 64×64 data-URI PNG and the jar
    emits `<image width="64" height="64">` for both; node 1's width is exact,
    so IHDR decoding and img scaling are correct.
  - *A sprite/ink mechanism.* There is no `<$…>` sprite atom in the expansion at
    all — `$AWSImg` returns `<img data:image/png;base64,…>`.
  - *`skinparam wrapWidth 200`* (also set by AWSCommon). Node 1's width is exact
    and both nodes wrap identically; the residual is entirely the stereotype
    line, which is not wrapped in either engine.
  - *Different sprite dimensions between the two services.* Both declare
    `[64x64/16z]` and both PNGs are 64×64; the only text differing between the
    two nodes is the stereotype NAME.
- **sharedCauseWith:** `loroto-06-fano471`, `toxine-81-xofo986` (bucket
  `element-font`) — **cross-bucket, exact same origin.** Those records already
  name `leaf-sizing-entity.ts:146` and `layout.ts:436` and state the fix needs a
  SECOND `BoxSizingOpts` slot rather than repointing the existing one. This
  fixture exercises their **tier 1 only** (base `<element>StereotypeFontSize`,
  no per-stereotype-NAME selector), so it is closed by tier 1 alone.
- **proposedWriteSet:** identical to `loroto-06`'s tier 1 —
  `src/diagrams/description/layout.ts`, `layout-dot-tree.ts`,
  `leaf-sizing-consts.ts` (`BoxSizingOpts.stereotypeFontSize`),
  `leaf-sizing.ts`, `leaf-sizing-entity.ts`.
- **sizeEstimate:** 5 files, description engine only, no cross-engine blast
  radius; verification = the two `element-font` fixtures + this one + the
  description ratchet. Batch it with `loroto-06`/`toxine-81` — one change closes
  three fixtures across two buckets.
- **confidence:** high

---

### nobiza-91-fimo741

**Two independent mechanisms, one per node. Both must be fixed for this fixture
to become conformant** — the note residual is 0.013889in, still over the 0.01in
bar.

- **bucketLabel:** sprite
- **delta:** 0.276910
- **status:** resolved
- **mechanism:** (a, dominant) `rectangle "First" <<$Net>>` — a stereotype whose
  whole content is a `<$sprite>` token. Upstream's `StereotypeDecoration
  #buildComplex` REWRITES the label to `""` when `circleSprite` matches with an
  empty `LABEL` group (`java:156-160`), so with `$Net` unresolvable
  (`Stereotype#getSprite` → null) `getLabels()` returns an EMPTY list and
  `EntityImageDescription` takes its `TextBlockUtils.empty(0,0)` branch
  (`java:194-197`) — the stereotype contributes nothing at all. Our parser keeps
  the raw inner text as a label and `buildStereo` renders `«$Net»` as an
  ordinary text line. (b, residual) The `<img:…>` cannot-decode fallback is
  billed the NOTE line height 13 although its run font is the hardcoded
  monospace **14**.
- **originFileLine:** `src/core/svek/image/EntityImageDescriptionDelegates.ts:337`
  (`buildStereo` — implements only upstream's third branch; its own file header
  at `EntityImageDescription.ts:81` records `stereotype.getSprite(...)` as
  dropped). Residual (b): `src/diagrams/description/leaf-sizing.ts:224`
  (`lineCount(display) * NOTE_FONT_SIZE + … + atomHeightBonus(...)`).
- **causalChain:**
  - **(a)** `"First"` measures 27.2125. Jar node 0 = `0.655729 × 0.472222` =
    `47.2125 × 34` = `27.2125 + 20` wide, `14 + 20` tall — one line, stereo
    block 0×0. Ours = `0.932639 × 0.666667` = `67.150 × 48` = `(45.15 + 2) + 20`
    wide (`«$Net»` = 45.15, `+2` = `withMargin(stereo,1,0)`), `14 + 14 + 20`
    tall. Width error `67.150 − 47.2125 = 19.9375px = 0.276910in` — **the
    reported delta, exactly.** Jar probes pinning the three branches:
    `<<$Net>>` (unknown sprite) `0.655729 × 0.472222`; `<<$archimate/interface>>`
    (resolvable) `0.655729 × 0.736111`; `<<Net>>` (plain text) `0.824479 ×
    0.666667`.
  - **(b)** Note node: width `9.661458` on BOTH sides (695.625 = the long-form
    `(Cannot decode: <url>)` string at monospace **14** = 674.625, + 21) — so
    the *width* half of the historical `<img>` finding is genuinely closed.
    Height: jar `0.513889` (37px), ours `0.500000` (36px). Note-height algebra
    measured against the jar: padding 10 + 13 per note-font line + **14** per
    img-fallback line. Jar probes: 1 text line 23 / 2 lines 36 / 3 lines 49 (ours
    matches all three); 1 img line 24 vs ours 23; 2 img lines 38 vs 36; img+text
    37 vs 36; img+2 text 50 vs 49 → **exactly +1 per `<img:…>` line**, never
    more. The fallback's font is fixed at monospace 14 by `AtomImg.create`
    (`java:106-107`) and by our own `IMG_FALLBACK_FONT` (`StripeSimple.ts:85`);
    it is INDEPENDENT of `noteFontSize` on the jar side (probed at 8/21/30: the
    img note stays 24px). A leaf at font 14 shows no error at all
    (`rectangle "aaa\n<img:/nope/missing.png>"` = `1.671701 × 0.666667` on both
    sides), which is why this only surfaces on notes: the excess is
    `14 − lineFont`, and `lineFont` is 13 only for notes.
- **ruledOut:**
  - *ADR-4 re-verification of the prior recorded context (GH #23: "`<img>`
    cannot-decode text rendered at NOTE font 13 where the jar uses 14").*
    **CORRECTED, not inherited.** (i) It is not the fixture's dominant delta —
    the note width is now byte-exact and the 0.276910 belongs to the RECTANGLE
    and its `<<$Net>>` stereotype, an unrelated mechanism. (ii) The 13-vs-14
    claim itself is now only half-live: the fallback's *width* is measured at 14
    (verified: 695.625 = text@14 674.625 + 21; at 13 it would be 626.4375), but
    its *height* is still billed at the note's 13. The recorded 1.4603 → 0.6693
    shrink is consistent with the width half having been fixed; the residual is
    the height half only, and it is 1px, not a font-wide error.
  - *That `<$Net>` might be a resolvable sprite.* `unzip -l` on the pinned
    oracle jar lists 141 `sprites/**` entries; `sprites/Net.svg|png` is absent
    (`sprites/archimate/interface.svg` IS present). Confirmed behaviourally by
    the three-branch probe above.
  - *That the empty stereo comes from `hide stereotype` / `PortionShower`.* No
    `hide` in the fixture; `<<Net>>` (plain) DOES draw a stereotype line in the
    same diagram shape, so the portion shower is not suppressing anything —
    `buildComplex`'s label rewrite is.
  - *`Guillemet` handling.* `«$Net»` vs `<<$Net>>` differ by 17.3px; the
    measured error is 19.9375 and matches `«$Net»+2` exactly, so our guillemet
    substitution is right and the label content is wrong.
  - *Monospace metrics as the source of the +1.* Creole `""abcdef""` (a real
    monospaced run, at the note font) measures 23px on both sides — identical. The +1 is specific to
    the img-fallback run, i.e. to its FIXED 14 vs the note's 13.
- **sharedCauseWith:** `turasu-73-zoni468` (same bucket), `lesori-32-zeve057`
  and `ravodu-50-siso430` (bucket `container-cluster`, T1 — **cross-bucket**,
  see `turasu-73`'s record for the evidence) for mechanism (a). Mechanism (b) is
  unique among the 26 as far as measured here — but note `xufexu-38-fola855`
  (`creole-titled-separator`) and `pivudu-29-pele178` (`other`) already point at
  the SAME line `leaf-sizing.ts:224` for a different reason (the uniform
  `lineCount × lineHeight` model). T8 should treat `leaf-sizing.ts:224` as one
  fix site serving three distinct causes.
- **proposedWriteSet:** (a) `src/core/svek/image/EntityImageDescriptionDelegates
  .ts` (`buildStereo` — add the `getSprite()` branch and the empty-label
  branch), `src/diagrams/description/parse-helpers-strings.ts:264-280`
  (`extractNodeStereotype` must route through the ALREADY-PORTED, currently
  unused `src/core/stereo/StereotypeDecoration.ts#buildComplex` instead of
  pushing raw inner text), `src/diagrams/description/ast.ts` +
  `leaf-sizing-entity.ts` (carry `spriteName` alongside the labels).
  (b) `src/core/creole-atoms-measure.ts` (`lineAtomHeightExcess` must max over
  the line's RUN fonts, not only its atoms) and/or
  `src/diagrams/description/leaf-sizing.ts:224`.
- **sizeEstimate:** (a) ~4 files, description parser + sizer + renderer, and it
  is shared with `turasu-73` + 2 T1 fixtures — do it once. (b) 1-2 files but
  `lineAtomHeightExcess` is cross-engine, so re-run all four size ratchets.
  Verification for (a) = the 3-branch jar probe above; for (b) = the 6-point
  note-height probe table above.
- **confidence:** high

---

### turasu-73-zoni468

- **bucketLabel:** sprite
- **delta:** 1.224826
- **status:** resolved
- **mechanism:** Same M1 as `nobiza-91`(a), plus M2 stacked on top. All three
  nodes carry an `<<$archimate/…>>` stereotype. Upstream resolves it to a SPRITE
  text block (`EntityImageDescription.java:194-195`), 19px tall, and discards
  every other stereotype label on the entity; we measure the literal
  `«$archimate/…»` string. Even with M1 fixed the sprite would still not
  resolve, because `SpriteImage.fromInternal`'s bundled `/sprites/` resource set
  is not ported (`sprite-commands.ts:132-133` says so in its own doc comment)
  and the fixture never `!include`s the archimate stdlib.
- **originFileLine:** `src/core/svek/image/EntityImageDescriptionDelegates.ts:337`
  (M1); `src/core/sprite-commands.ts:132` (M2 — `getSprite` returns the
  per-diagram registry hit only, with no internal-bundle fallback)
- **causalChain:** All three deltas reconcile to the px with no residual.
  Measured text: `Technology Interface` 126.7875, `Technology Function`
  126.175, `Technology Device` 115.325, `«$archimate/interface»` 142.275,
  `«$archimate/technology-function»` 210.000,
  `«$archimate/technology-device»` 201.5125. The bundled sprite measures 19×19
  (its SVG declares `19.995mm × 19.928mm`; the jar's box arithmetic requires
  exactly 19, i.e. the parser truncates — a fix-time detail, not a fitted
  constant). Stereo block adds `+2` width (`withMargin(…,1,0)`) in our path and
  none in the jar's sprite path.
  | node | jar | ours | error |
  |---|---|---|---|
  | TInterface (`rectangle`, margin `[20,20]`) | `20 + max(126.7875, 19.995)` × `20 + 19 + 14` = **146.787 × 53** | `20 + (142.275+2)` × `20 + 14 + 14` = **164.275 × 48** | +17.488 w, −5 h |
  | TFunction (`rectangle`, 2 stereotypes) | `20 + max(126.175, 19.995)` × `20 + 19 + 14` = **146.175 × 53** | `20 + (210.0+2)` × `20 + 14 + 14 + 14` = **232.000 × 62** | +85.825 w, +9 h |
  | TDevice (`node`, margin `[40,30]`) | `40 + max(115.325, 19.995)` × `30 + 19 + 14` = **155.325 × 63** | `40 + (201.5125+2)` × `30 + 14 + 14` = **243.512 × 58** | +88.187 w, −5 h |
  Every jar cell above is EXACT against `svek-1.dot`
  (`2.038715/2.030208/2.157292` × `0.736111/0.736111/0.875000`). The reported
  1.224826in = 88.187px is TDevice's width. TFunction also proves the second
  half of upstream's sprite branch: `<<behavioural>>` is present but the jar
  height is `20+19+14` — when `getSprite()` is non-null the sprite REPLACES the
  whole stereo block and every text label on it is dropped.
- **ruledOut:**
  - *Cluster/container geometry* (the fixture opens three `skinparam …{ }`
    blocks, which is why the classifier nearly bucketed it as
    `container-cluster`). All three entities are LEAVES; the arithmetic above
    closes to 0px using leaf margins only.
  - *`Shadowing False` / `RoundCorner 10` / `StereotypeAlignment right`.* All
    three appear in the source. Shadowing/round-corner are size-neutral on
    rectangles and nodes (`planning/sizer-renderer-parity.md` Proofs — the
    shadow term lives in the ACTOR family only), and alignment cannot change a
    max/sum. Confirmed: replacing the stereotype with a plain `<<Net>>` in the
    same diagram shape reproduces the jar exactly.
  - *`#TECHNOLOGY` colour token.* Colour only; the parity table's
    `resolveElementPaint` row.
  - *Sprite ink/raster resolution (SI14/SI15).* Ours never resolves the sprite
    at ALL here — it measures a string. Confirmed by the exact `«$archimate/…»`
    text widths above.
  - *That the archimate stdlib package would supply the sprite.*
    `packages/stdlib/generated/archimate.js` ships the `!include`-able library,
    but the fixture includes nothing; the jar's hit comes from
    `/sprites/archimate/interface.svg` INSIDE the jar, a channel with no port.
- **sharedCauseWith:** `nobiza-91-fimo741` (node 0, same bucket);
  **`lesori-32-zeve057` and `ravodu-50-siso430` (bucket `container-cluster`,
  T1 — cross-bucket)**: both carry the identical
  `<<$archimate/interface>>` / `<<$archimate/technology-function>>` /
  `<<$archimate/technology-device>>` trio and both carry the identical delta
  0.2429, which SCHEMA rule 3 already requires be reconciled — M1+M2 explain
  both. Also **`tuliba-37-liza126`** (T1, 0.5210): `<<$aComponent>>` /
  `<<$bFunction>>` declared via `sprite $bFunction jar:archimate/business-
  function`, i.e. the same `getSprite()` branch reached through the
  `jar:` sprite form.
- **proposedWriteSet:** M1 as listed under `nobiza-91`, plus for M2 either a
  bundled internal-sprite asset package (mirroring
  `packages/stdlib-aws`/`stdlib-tupadr3`, ~141 files, licence review required)
  wired into `sprite-commands.ts#getSprite`'s fallback, or an
  injectable `internalSpriteResolver` on `RenderOptions` (browser-safe, matches
  the `include-resolver.ts` seam precedent).
- **sizeEstimate:** M1 ~4 files / description engine / verified by the 3-branch
  probe. M2 is the larger piece: 1 new asset package + 1 line in
  `getSprite` + licence/`vendor --verify` work, and it is a prerequisite for
  `turasu-73`, `lesori-32`, `ravodu-50` and `tuliba-37` but NOT for
  `nobiza-91` (whose sprite is unresolvable on both sides). Recommend splitting
  M1 and M2 into separate tasks — M1 alone already moves `nobiza-91` and gets
  `turasu-73` from 1.2248 to the M2-only residual.
- **confidence:** high

---

### vivido-49-nisu863

- **bucketLabel:** sprite — right for 2 of 3 nodes; the DOMINANT node is an
  OpenIconic glyph (`<&cloud>`), which has its own bucket (`icon`) the
  first-match classifier never reached.
- **delta:** 0.157407
- **status:** resolved
- **mechanism:** (dominant) `<&cloud>` is not one of the six glyphs in our
  OpenIconic table, so `buildOpenIconSpan` consumes the markup — removing it
  from the measured text — and emits NO atom; the icon's 11.333px advance is
  lost. Upstream ships the full OpenIconic resource, so `cloud` resolves there.
  (secondary) Nodes 0 and 1 are `bivira-53`'s M3, the URL-label sprite scale.
- **originFileLine:** `src/core/creole-atoms-openicon.ts:44`
  (`if (!isKnownOpenIconicGlyph(name)) return { start, end };` — span consumed,
  atom dropped; the 6-name table is `openiconic-glyphs.ts` `RAW_GLYPHS`:
  `x`, `key`, `ban`, `caret-right`, `link-intact`, `thumb-up`)
- **causalChain:** Per-node against `svek-1.dot`:
  - node 0 (`<$database*0.31>` in a link): jar `2.654931 × 0.678889`, ours
    `2.670828 × 0.694786` → **+1.145 on both axes**. `database` is `[48x48/16]`;
    `48 × 0.31 = 14.88`; `14.88 × (14/13 − 1) = 1.1446`. ✓
  - node 1 (`<$database>` in a link): jar `3.114931 × 1.138889`, ours
    `3.166213 × 1.190171` → **+3.692 on both axes** = `48 × (14/13 − 1) =
    3.6923`. ✓ Identical constant to `bivira-53`'s, from an unrelated sprite —
    which is what confirms the factor rather than the sprite is at fault.
  - node 2 (`<&cloud>` in a link): jar `3.458796 × 0.666667`, ours
    `3.301389 × 0.666667` → **−11.333 width**, `11.333/72 = 0.157407` = the
    reported delta. `openIconicDims(openIconicFactor(1, 14))` =
    `8 × 14/12 + 2 = 11.3333` — exactly the missing advance, i.e. our own
    formula is right and simply never runs.
  - Isolation: `rectangle "aa<&cloud>"` → jar `0.651505` (46.908 = 20 + 15.575
    + 11.333), ours `0.494097` (35.575 = 20 + 15.575 + 0). Instrumented:
    `scanLineForAtoms("aa<&cloud>")` returns `textWithoutAtoms: "aa"` and
    `atoms: []`.
- **ruledOut:**
  - *That the `<&cloud>` error is link-related.* `rectangle "aa<&cloud>"`
    (no link) shows the identical −11.333. The link is incidental.
  - *That `measureInlineAtom` mishandles openiconic.* It has a correct
    openiconic branch returning 11.3333 at font 14; the token never reaches it.
  - *`set separator none`* (line 2 of the fixture). Affects id/qualified-name
    handling, not text metrics; nodes 0 and 1's residuals are fully explained by
    the sprite factor with zero slack.
  - *`title <$database>`.* The diagram title is not a DOT node and does not
    enter `maxSizeDeltaIn`.
  - *A shared cause between node 2 and nodes 0/1 despite one fixture.* Opposite
    SIGNS (−11.333 vs +3.692) and two independently isolated minimal repros.
  - *ADR-4 re-verification of the recorded 2.5199 → 0.1574 shrink at the
    creole-lexer unification.* **Confirmed as a shrink, corrected as a
    mechanism:** nothing `<img>`-related remains here (the fixture has no
    `<img>` markup at all), and the surviving 0.1574 is the OpenIconic glyph
    table — a different subsystem from the one the shrink is credited to. The
    old entry must not be carried forward as this fixture's cause.
- **sharedCauseWith:** `bivira-53-boja685` (nodes 0/1, M3). Node 2 (M4): none
  measured — checked against the `icon` bucket's `murava-69-tago286`, which is
  an `<:emoji:>` atom at `AtomEmoji.ts:61`, a different atom kind and a
  different origin.
- **proposedWriteSet:** M4 — `src/core/openiconic-glyphs.ts` (extend
  `RAW_GLYPHS` toward upstream's full set, sourced from
  `~/git/plantuml` `openiconic/`), and decide the policy for a still-unknown
  name at `src/core/creole-atoms-openicon.ts:44` (upstream's own "unknown ⇒ no
  atom" rule stays correct once the table is complete). M3 — as listed under
  `bivira-53`.
- **sizeEstimate:** M4 is data, not logic: 1 file, mechanical, but the table is
  hand-transcribed path data so budget per-glyph verification (the existing 6
  are jar-verified); a width-only sizer fix would be much cheaper than full
  path data, but would desynchronise sizer and renderer and is NOT recommended.
  M3 is shared with `bivira-53` — one change closes both fixtures' sprite half.
  Verification = the two isolation probes above + all four size ratchets (M3 is
  cross-engine).
- **confidence:** high

---

## Incidental observation — NOT one of the five, not diagnosed

Found while isolating `bivira-53`; reproducible, but no fixture in this bucket
exhibits it, so it is recorded here rather than as a schema record. A display
whose FIRST line is entirely a `[[url label]]` measures the url text as well as
the label:

| probe (single-line display) | jar | ours |
|---|---|---|
| `rectangle "[[http://www.google.com abc]]"` | `0.591319` (= `abc` + 20) | `2.663368` |
| `rectangle "[[http://www.google.com]]"` | `2.242882` | `2.349826` (+7.7 = one extra `[`+`]`) |
| `rectangle "[[http://www.google.com <$maxime>]]"` | `0.944444` | `3.067775` |

`buildLineAtoms` is NOT at fault — it returns `[text "abc" (url)]` for the first
row. The divergence is upstream of it, in the description parser's own
`[[…]]`/display split (`parse-helpers-strings.ts` `RE_URL_TOKEN_G` /
`parseNameSection`). Whoever picks this up should start there, not in creole.
