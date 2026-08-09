# R2i (A2s round 2) — class creole wiring (headers, emoji, row heights, badge sprite)

## Observation: header creole routing is measurement-identity-safe
- **Context**: item 1 cutover (class-layout-header-geo.ts → buildLineAtoms FULL_BUT_UNDERSCORE).
- **Finding**: for plain names, `buildLineAtoms` + width-table measure is byte-identical to the
  raw `measurer.measure(l, headerFont)` call (verified 12 names × 3 sizes pre-cutover, then
  full ratchet: 707/711 conformant, widened 0). The width table is family/weight-agnostic, so
  ignoring headerFont.bold/italic in the FontConfiguration changes nothing.
- **Impact**: future header consumers can route through the creole pipeline without a
  measurement audit; the invariant test lives in tests/unit/class/class-creole-emoji-r2i.test.ts.
- **Confidence**: High.

## Observation: emoji line height is 39×factor, not 36×factor
- **Context**: AtomEmoji port (lecelo-92-loma110).
- **Finding**: `AtomEmoji` draws a 36×factor square but `getStartingAltitude` = -3×factor, so the
  effective line height is 39×factor (jar: 3 emoji lines at 14pt → 3×22.75+10 = 78.25px exact).
  factor = scale × fontSize / 24 (`MAGIC`).
- **Impact**: any future Sea/SheetBlock port must model the negative altitude, not just the box.
- **Confidence**: High (golden-exact on lecelo + R2a probe).

## Observation: stereotype sprite badge scales by DECLARED scale only
- **Context**: rotisi-30 `class zz <<($bug16,red)>>`.
- **Finding**: `Stereotype#getSprite` passes `decoration.spriteScale` (default 1) — NOT the
  font-relative `fontSize/13` factor creole `<$sprite>` atoms use. Badge box = dims×scale
  wrapped withMargin(4,0,5,5) → w+4, h+10 (15×15 sprite → 19×25 → node 39×41px exact).
- **Impact**: the two sprite scaling regimes must not be conflated.
- **Confidence**: High (golden-exact).

## Observation: rotisi-30 Toto residual = one 14/13 unit in the enhanced-body path
- **Context**: rotisi-30 remains non-conformant at 0.014957in (Toto only; other 3 nodes exact).
- **Finding**: ours 186px vs jar 184.9231px — the difference is exactly 1.0769px = 14×(14/13−1),
  i.e. one row whose height appears sprite-scale-inflated (or a 14 vs 14×14/13 mixup) inside
  class-body-enhanced-layout.ts (outside R2i's write-set, and concurrently modified this session).
- **Impact**: the remaining rotisi close-out belongs to whoever owns the enhanced-body path.
- **Confidence**: Medium (arithmetic fingerprint, not instrumented to the line).

## Observation: description now sizes emoji atoms (core/svek, not diagrams/description)
- **Context**: registering CommandCreoleEmoji in the shared command maps changed description
  behavior for `<:name:>` markup; a drop-only guard WIDENED murava-69-tago286 (0.347→0.449).
- **Finding**: real AtomEmoji sizing in EntityImageDescription{TextBlock,Delegates}.ts (the only
  CreoleAtom consumers there) flipped bubemi-25-noxu873 conformant (¿name? fallback width exact)
  and improved murava to 0.182 (residual is the usecase icon/ellipse model, cause bucket "icon").
- **Impact**: emoji in description labels is sized, drawn as platform glyph; Twemoji artwork not ported.
- **Confidence**: High (ratchet 321/351, widened 0).
