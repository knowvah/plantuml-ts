# lecelo-92-loma110 — residual after T9 (header multi-line stacking)

Measured on the T9 tree (sprites+emoji store): `structural=0, numeric=159`.
Every structural diff (the artwork-vs-glyph mechanism T9 targets) is gone;
line 1 (`<:label:> label`) is now BYTE-IDENTICAL to the jar (rect, all 3
`<path>`s, and the `label` text). Lines 2/3 (`wrench`, `hammer_and_wrench`)
are each shifted up by a constant 8.75px, cumulative (line 2 by 8.75, line 3
by 17.5 = 8.75×2) — pure numeric diffs, tolerance 0.01.

## Mechanism

`class-stereotype-layout.ts:151-160` (`headerLineY`), the classifier NAME's
per-physical-line `y`:

```ts
const flat = nameTop + i * fontSize + baselineOffset;
if (atoms?.some((a) => a.kind === 'image') !== true) return flat;
return flat + (height ?? fontSize) - fontSize;
```

`flat` steps by a CONSTANT `fontSize` (14) per line index `i`, assuming every
physical line is exactly `fontSize` tall. `lineHeights[i]` (each line's real
height, already computed by `class-layout-header-creole.ts
#buildHeaderLineMetrics` and threaded in as `height`) is read ONLY as a
same-line bottom-anchor correction, gated on `atoms.some(kind==='image')` —
it never accumulates into `flat` for a LATER line. An emoji line (`<:name:>
text`) is `39*factor=22.75` tall (`AtomEmoji.ts`), 8.75px taller than
`fontSize`; every SUBSEQUENT line's `flat` baseline is short by that 8.75,
cumulatively (line 3 is short by 2×8.75).

This is 100% PRE-EXISTING and unrelated to T9's own fix: measured
byte-identical before (glyph fallback, `kind:'text'`) and after (artwork,
`kind:'drawable'`) — NEITHER kind is `'image'`, so `headerLineY`'s
bottom-anchor branch never fires either way, and the `flat` formula (the
actual bug) does not consult `atoms`/`kind` at all. The gate's own `'image'`
scope also means an SVG-sprite (`'drawable'`, `resolveSvgSpriteAtom`) or an
OpenIconic glyph (`'vector'`) in a multi-line NAME hits the identical bug —
this is not emoji-specific.

## Java

Upstream's classifier NAME draws through one `TextBlock` (`HeaderLayout.java
#drawU`, `:100-101`: `name.drawU(ug.apply(new UTranslate(xName, yName)))`),
whose OWN multi-line layout (the generic `Display`/`Sea`-driven `TextBlock`
every creole surface shares) sums each physical line's REAL measured height
— the same "sum, not a flat per-line constant" contract
`class-namespace-title-runs.ts#namespaceTitleLineBaselines` already
generalizes correctly for a PACKAGE/folder title
(`top += line.fontSize` — cumulative, jar-verified `daxeno-00-kasu166`).
`headerLineY` is the CLASS name's own, differently-shaped implementation
that never received the equivalent generalization.

## Ruled out

- **The artwork placement itself**: line 1 is byte-identical (rect + 3
  `<path>`s + `label` text), proving `resolveEmojiAtom`'s `Sea`
  altitude/height math (T9's own fix) is correct.
- **A T9 regression**: the pre-fix (glyph-only) render shows the IDENTICAL
  157.639/171.639 text `y` values for lines 2/3 — confirmed via a direct
  before/after render diff on this exact fixture.

## Fix shape (NOT in T9's write-set — `class-stereotype-layout.ts` is owned
by neither this task nor a listed concurrent one; flagged, not fixed)

`headerLineY`'s `flat` term needs a cumulative sum of `lineHeights[0..i-1]`
(mirroring `class-member-rows.ts#buildSectionRows`'s `rowTop += build.height`
and `namespaceTitleLineBaselines`'s `top += line.fontSize`), and the
bottom-anchor gate needs to widen from `kind === 'image'` to also cover
`'drawable'`/`'vector'` (any atom whose own render position is NOT
`dy`-corrected against a per-line `Sea` reference). Both changes are inside
`buildHeaderRows`'s row-map loop, `class-stereotype-layout.ts` only.

## Confidence

HIGH on the mechanism (file:line cited, before/after render diff isolates it
from T9's own change) and on it being pre-existing/out of scope for T9.
