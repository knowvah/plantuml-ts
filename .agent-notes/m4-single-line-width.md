# Root cause: we measure the RAW SOURCE label; upstream measures a
# PRE-PROCESSED `Display` with prepended blocks

Diagnosed 2026-08-16 (mission `edge-label-box-backlog`, T4) on
`component/berelu-46-namo819`, `class/canuti-20-jotu614`,
`class/gikipi-69-pepo172`, `class/xopuku-46-nefa571`.

## Mechanism

`SvekEdge.java:441` sizes the DOT label table from
`labelText.calculateDimension(stringBounder)`. `labelText` is **not** built
from the label as written in the `.puml`. Between source and measurement,
upstream does four things this port does at most partially:

| # | upstream step | origin |
|---|---|---|
| A | strip a leading visibility char (`-#+~*`) off line 0 | `Display.java:415-416` via `LinkArg.build`, `LinkArg.java:71` |
| B | prepend a visibility ICON block, **+12 px wide** | `SvekEdge.java:302,363-374`; `VisibilityModifier.java:100-102` returns `(size+1, size+1)` with `size = classAttributeIconSize()` default **10** (`SkinParam.java:555`); `TextBlockUtils.withMargin(v,0,1,2,0)` (`TextBlockUtils.java:75-78`) adds 1 more → **11 + 1 = 12** |
| C | `<<x>>` → `«x»` | `Display.java:418` → `Guillemet.GUILLEMET.manageGuillemet`, `Guillemet.java:78-88` |
| D | strip a `<`/`>` magic-arrow token and prepend a triangle block **fontSize px wide (13)** | `StringWithArrow.java:56-91` (strip) + `SvekEdge.java:304` → `TextBlockArrow2.java:57,87` — `calculateDimension` returns `(size, size)` where `size = font.getSize2D()`; the `.80` factor at `TextBlockArrow2.java:65` is **draw-only** |

A and C are the same upstream method, `Display.manageGuillemet(boolean)`,
reached from `LinkArg.build(label, length, classAttributeIconSize() > 0)`
(`AbstractClassOrObjectDiagram.java:74`, `CommandLinkElement.java:320-321`,
`CommandLinkStateCommon.java:202` — every cuca engine).

Creole inline markup is also consumed, not measured: `create0(...
CreoleMode.SIMPLE_LINE ...)` (`SvekEdge.java:300`) — `SIMPLE_LINE` gates only
BLOCK constructs (`CreoleStripeSimpleParser.java:119,128,138`), so
`**bold**` still parses to a bold run with no literal asterisks.

## The numbers — 22/22 oracle values reproduced exactly

`model` = this port's own `WidthTableMeasurer` at size **13**, applying the
upstream steps above and the `2 * marginLabel` + `(int)` floor
(`SvekEdge.java:372`, `502-506`). No fitted constant: 12 and 13 are read off
the Java cited in the table.

| slug | source label | oracle | ours | Δ | model | |
|---|---|---|---|---|---|---|
| class/gikipi-69-pepo172 | `+parameter` | 73 | 68 | +5 | 73 | A+B |
| class/canuti-20-jotu614 | `-entries` | 53 | 45 | +8 | 53 | A+B |
| class/canuti-20-jotu614 | `#factory` | 52 | 48 | +4 | 52 | A+B |
| class/canuti-20-jotu614 | `+parent` | 50 | 46 | +4 | 50 | A+B |
| class/gixesa-28-feri809 | `-var1` | 39 | 31 | +8 | 39 | A+B |
| class/gixesa-28-feri809 | `+var2` | 39 | 34 | +5 | 39 | A+B |
| class/gixesa-28-feri809 | `#var3` | 39 | 34 | +5 | 39 | A+B |
| class/gixesa-28-feri809 | `~var4` | 39 | 34 | +5 | 39 | A+B |
| state/susena-02-gusa448 | `+OK` | 32 | 28 | +4 | 32 | A+B |
| state/susena-02-gusa448 | `-ok` | 27 | 20 | +7 | 27 | A+B |
| state/susena-02-gusa448 | `+marche pas` | 78 | 73 | +5 | 78 | A+B |
| state/susena-02-gusa448 | `-marche pas` | 78 | 70 | +8 | 78 | A+B |
| class/xopuku-46-nefa571 | `<<delegate>>` | 66 | 82 | −16 | 66 | C |
| class/xopuku-46-nefa571 | `<<create>>` | 52 | 68 | −16 | 52 | C |
| class/tebore-53-tese080 | `<<alias>>` | 43 | 59 | −16 | 43 | C |
| class/tedeba-19-lisi250 | `<<implement>>` | 76 | 92 | −16 | 76 | C |
| component/berelu-46-namo819 | `> up arrow **missing**` | 106 | 120 | −14 | 106 | D+creole |
| component/berelu-46-namo819 | `> left arrow **missing**` | 108 | 123 | −15 | 108 | D+creole |
| component/berelu-46-namo819 | `< up arrow works` | 95 | 90 | +5 | 95 | D |
| component/berelu-46-namo819 | `> right arrow works` | 106 | 101 | +5 | 106 | D |
| component/berelu-46-namo819 | `> down arrow works` | 112 | 107 | +5 | 112 | D |
| component/berelu-46-namo819 | `< left arrow works` | 98 | 93 | +5 | 98 | D |

All heights are 15 = `fontSize 13 + 2 * marginLabel`; **only width diverges**.
The gate prints both sides as SORTED lists, so pairing was recovered by
computing each label independently rather than by sort position (`susena`'s
`+OK`/`-ok` pair swaps under sorting; `berelu`'s six were paired through the
`color=` edge id shared by both DOT dumps).

The deltas are NOT one number wearing several hats: +4…+8 is
`12 − width(prefix char)` (`-` = 4.31, `#` = 7.23, `~` = 7.58, `+` = 7.64 at
13 px, ±1 from the floor), −16 is `2·w('<') + 2·w('>') − w('«') − w('»')`, and
the +5 on berelu is `13 − 7.64` (arrow block minus the `> ` we measured but
upstream stripped — the space measures 0).

## Controlled experiment isolating cause A/B

`class/bugeli-63-mixa543` is `class/gixesa-28-feri809` **plus one line**,
`skinparam classAttributeIconSize 0`. gixesa FAILS `labelSizeOk`; bugeli
PASSES all structural checks. That is exactly the
`classAttributeIconSize() > 0` argument at
`AbstractClassOrObjectDiagram.java:74` turning steps A and B off, at which
point measuring the raw string is the correct answer.

## Do the four share one mechanism?

**No — it is a bucket of three, from one family.** Verified by construction:
each row above is reproduced by applying one named upstream step, and the
steps are independent (canuti/gikipi need A+B only, xopuku needs C only,
berelu needs D only). What they share is the shape: the port measures
`rel.label` / `link.label` as written.

## Reach — every slug below gate-confirmed, not inferred

| cause | slugs |
|---|---|
| A+B visibility strip + 12 px icon | `class/canuti-20-jotu614`, `class/gikipi-69-pepo172`, `class/gixesa-28-feri809`, `state/susena-02-gusa448` |
| C guillemet — **class engine only** | `class/xopuku-46-nefa571`, `class/tebore-53-tese080`, `class/tedeba-19-lisi250` |
| D magic arrow, class engine: glyph is 10, should be 13 | `class/lojepe-37-liri985` (28/25), `class/bitove-03-sanu160` (56/53), `class/jakapi-64-tine258` (35/32 ×3), `class/class-inheritance-interface-assoc` (45/42), `class/dorelu-66-lixu637` (43/40), `class/xamule-03-jeda376` |
| D magic arrow, description engine: unported entirely | `component/berelu-46-namo819`, `usecase/funeme-74-tenu200` (21/16, 22/16) |
| inline creole in a link label measured literally | `component/berelu-46-namo819` only (corpus-wide scan of link-label lines for `**…**`/`//…//`/`__…__` returns this one slug) |

The description engine already gets C right by a **different route**: its
parser lifts a post-colon `<<x>>` into `link.stereotype` and
`link-edge-attrs.ts:170` re-wraps it as `«x»`. Hence `usecase/cevuji-49-bile305`
(`GET ..> author: <<includes>>`) passes with 64 = `«includes»`+2 on both
sides. That route cannot represent a mid-string `<<x>>`; upstream's
`GUILLEMET_PATTERN` (`Guillemet.java:76`) matches anywhere and also eats one
optional space inside the brackets (`<< a >>` → `«a»`).

### Two sub-cases found while confirming D, both in `class/xamule-03-jeda376`

- **Bare `>` / `<` label** (9 edges): oracle `13x13`, ours `12x12`. Upstream
  takes the `Display.isNull` arm (`SvekEdge.java:281-285`) which prepends the
  arrow but never calls `addVisibilityModifier`, so there is **no**
  `marginLabel` at all — `13 + 0`. We emit `ARROW_GLYPH_SIZE(10) + 2`. Two
  errors partly cancelling.
- **`<size:30>to Foo >`**: oracle `91x32`, ours `101x15` — a per-run font
  change inside a label, which `edge-label-box.ts:60-64` already names as the
  one case a string measurer cannot represent. Out of this bucket.

## Verdict on `class-layout-edge-labels.ts:34`'s font claim: STALE

It says `edgeLabelAttrs` measures with `theme.fontSize` = 14. It measures with
**13**. Two independent proofs:

1. `class-dot-graph.ts:371` builds `{ family: theme.fontFamily, size:
   ARROW_LABEL_FONT_SIZE }` (= 13, `core/klimt/font/FontParam.ts:34`) and
   passes it to `buildDotEdges` → `class-dot-edges.ts:101` →
   `edgeLabelAttrs(rel, ctx.font, ...)`. There is no other caller.
2. Numeric: gikipi emits **68** = `floor(measure('+parameter', 13) + 2)`
   = `floor(68.788)`. At 14 it would be `floor(71.925 + 2)` = **73**.

It was fixed by G5/C0 (`class-dot-edges.ts:44-58`) — whose own comment then
restates the gap as still open, which is how the stale claim propagated. Both
sentences want deleting. The *other* half of the comment is still TRUE:
`skinparam ArrowFontSize` remains unported —
`core/skinparam-element-buckets.ts` has no `arrow` bucket.

`givoli-70-rade072` matching exactly was therefore never evidence against a
font bug — it is evidence the font is *already* right everywhere.

## Question 4: no atom is in play

None of the four labels contains `<img`, `<$sprite>`, `<&icon>`, non-ASCII, or
trailing whitespace. `stripCreoleMarkup`'s deliberate omission of `img`/`$`/`&`
is not implicated. `«`/`»` are outside the 96-entry ASCII table but
`WidthTableMeasurer` has the real Unicode widths (7.2313 at 13 px) — it
reproduced the guillemet oracle exactly, so no measurer gap either.

## Ruled out, with the evidence

- **Font size 13 vs 14** — see the verdict above; two independent proofs. Also
  arithmetically impossible for berelu: its six deltas are a constant ±5 across
  widths 90–123, while a font-scale error is proportional (would be 7–8 px at
  the wide end).
- **Multi-line handling** (`edge-label-box.ts` line splitting) — all 22 labels
  are single-line; heights are uniformly 15 and match the oracle.
- **`marginLabel` 1-vs-6 self-loop rule** — no fixture here is a self-loop, and
  the model reproduces every value with `marginLabel = 1`.
- **The `(int)` truncation** — the model already floors; without the floor
  gikipi predicts 73.24 vs oracle 73, i.e. the floor is present and correct.
- **`labelShield`** (`SvekEdge.java:354-356`, `441`) — 7 only when
  `getMiddleDecor() != NONE`; every fixture here has `LinkMiddleDecor.NONE`, so
  `dimNote.delta(2*0)` is a no-op. Confirmed by the exact matches.
- **Measurer width-table divergence** — 22/22 oracle values are reproduced by
  *this port's own measurer*; if the table diverged, none would land exactly.
- **Description-engine guillemet gap** — ruled out by
  `usecase/cevuji-49-bile305` passing with `<<includes>>`; C is class-only.
- **`stripCreoleMarkup` over-stripping an atom** — no atom present (above).

## Where the port diverges (fix origins, for T12)

The mechanism is stated, so the origins can be named. All are pre-measurement
label preprocessing, none is a measurer or a constant to tune:

- `src/diagrams/class/class-layout-edge-labels.ts:246-260`
  (`computeRelLabelAttrs`) measures `rel.label` raw — no A, no B, no C, and its
  magic-arrow branch uses `ARROW_GLYPH_SIZE` (10) where
  `TextBlockArrow2.calculateDimension` is the font size (13). The bare-`>`
  label additionally must skip `marginLabel` entirely.
- `src/diagrams/description/link-edge-attrs.ts:185-210` (`applyMainLabel`) has
  no A, no B and no D at all; C it gets right by the parser route above.
- The state engine shares `core/edge-label-box.ts` and is missing A and B
  (`state/susena-02-gusa448`).
- Steps A and B are one upstream method pair gated on
  `classAttributeIconSize() > 0` — the `skinparam classAttributeIconSize 0`
  case must keep today's raw-string behaviour (`class/bugeli-63-mixa543` is the
  regression guard, and it passes today).

## Blast radius beyond the label box

The same measurement feeds `computeGraphSpacing` via `computeLinkDzeta`
(description) and the layout box handed to `@knowvah/dot-engine`, so
`ranksep`/`nodesep` and edge placement are off on these fixtures too — not just
the DOT table.

**Confidence: High.** Every number is a direct measurement; every constant (12,
13, 10, 1) is read from cited Java rather than chosen to shrink an error; and
the model was validated *predictively* — it named `gixesa`, `susena`, `tebore`
and `tedeba` as failures before they were run, and named `bugeli` as a pass.
