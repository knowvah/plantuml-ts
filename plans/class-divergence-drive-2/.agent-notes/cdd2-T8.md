# cdd2-T8 — S paint / text singletons

## Fixtures closed (6/6 mechanisms addressed; 4/6 fully conformant)

- **fumalu-64-vude116** (S-5) — CLOSED, conformant. `<style> classDiagram.class
  .header { BackgroundColor } }` had no cascade lookup at all (only FontColor
  existed). Added `classCascadeHeaderBackground` field + `cascadeHex(styleMap,
  HEADER_SNAMES, 'backgroundcolor')` call in `applyColorCascadeOverrides`;
  consumed in `resolveClassHeaderFill` ahead of the legacy
  `classHeaderBackground` skinparam field.
- **gabejo-44-juki791** (S-3) — structural CLOSED (conformant on structure),
  1 numeric residual open (see below). `classbordercolor<<X>>`/
  `classfontcolor<<X>>` had no stereotype-qualified handler at all. **Java
  citation corrected from the diagnosis doc**: this is NOT `SkinParam
  #getColor(ColorParam, Stereotype)` (SkinParam.java:371-378 — traced and
  ruled out, that method is unreachable from `EntityImageClass`'s LineColor/
  FontColor resolution). It is the SAME "stereotype re-signed style"
  mechanism `classBackgroundColorByStereo` already models:
  `FromSkinparamToStyle`'s ctor splits `<<X>>` off the key (java:292-302),
  `addStyle` re-signs the `{element,class_[,header]}` Style at
  `DELTA_PRIORITY_FOR_STEREOTYPE` (java:396-408). Implemented
  `classBorderColorByStereo`/`classFontColorByStereo` mirroring
  `resolveClassBackgroundByStereo`'s exact shape (raw storage, `parseColor`
  at consumption, `cleanStereotypeToken` key matching), consulted at the
  SAME precedence slot (after `.tagname` cascade, before the plain
  ancestor-cascade default).
- **guxode-39-dobi371** (S-6) — NOT fixed; diagnosis's fix shape (swap
  `color`→`paint`, 3rd→4th handler arg) **measured and disproven**: for the
  flat token `"White"`, `resolveColor("White")` and `resolveColorPaint
  ("White")` are BYTE-IDENTICAL ("White", both unresolved) — confirmed by
  direct probe. The swap would be a no-op. Root cause, verified by tracing
  every consumer: `renderFolderPolygon` (`class-namespace-folder-outline.ts`,
  the `skinparam style strictuml` sharp-corner branch this fixture uses) has
  a `stroke: string` parameter used DIRECTLY via `shortenColor` — no
  `resolveColorToSvgHex`/`resolvePaint` call at all, unlike its sibling
  `path()`/`line()` calls (both correctly call `resolvePaint`, which is why
  the DEFAULT rounded-arc folder branch does NOT have this bug). Fix site is
  `class-namespace-folder-outline.ts`/`class-namespace-shape.ts` — explicitly
  out of this task's write-set (diagnosis doc: "another task owns it").
  Stopped, no edit made for S-6. S-9 (numeric Δ0.012-0.014 noise) confirmed
  unrelated per the diagnosis doc itself (dot-engine spline-fit noise,
  Smetana-adjacent — never a target per CLAUDE.md's dot-engine ruling).
- **tuguku-78-zega630** (S-7) — CLOSED, conformant. No `visibilityIcon`
  `<style>` selector existed at all. Added `applyVisibilityIconCascadeOverrides`
  (new file `style-cascade-visibility-icon.ts`, split out because
  `style-cascade-class.ts` is at the 500-line cap) computing
  `visibilityIconLineCascade`/`visibilityIconBackgroundCascade` (keyed by
  cleaned kind token: public/private/protected/package/iemandatory) via
  `cascadeHex` (exported from `style-cascade-class.ts` for this reuse).
  Consumed in `class-visibility-icon.ts#colorsFor`.
  **Precedence correction found via regression, not diagnosis**: initially
  had the `<style>` cascade win over the legacy `icon<Kind>Color` skinparam
  tier (mirroring `classCascadeHeaderFontColor`'s "explicit `<style>` beats
  skinparam bridge" precedent) — this REGRESSED `rakopi-21-sufa571`
  (`skin rose` + `skinparam IconProtectedColor DarkGoldenRod`: 10→16 diff
  count). Root cause: `skin rose`/`debug`/`strictuml` route through the SAME
  `applyStyleMap`/`computeClassStyleCascadeOverrides` machinery as a
  document's own `<style>` block (`skin-loader.ts`'s own doc comment —
  applied as the theme's BASE layer BEFORE the document's skinparam), and
  `rose.skin` bundles its OWN `visibilityIcon { protected {...} } }` block
  with the SAME values as the hardcoded `VISIBILITY_COLORS` default — so my
  new cascade field was unconditionally winning over the document's LATER,
  more-specific skinparam. **Fixed** by flipping precedence: the legacy
  `icon<Kind>Color` skinparam now wins over the cascade for the 4
  non-IEMandatory kinds (mirrors this codebase's own "last skinparam written
  wins" precedent, `skinparam-key-handlers-table-b.ts:87-102`). Verified:
  `rakopi-21-sufa571` returns to its baseline 10 diffs (unrelated,
  pre-existing stroke-width/font-family issues); `tuguku` still conformant.
- **nesivu-99-cexu403** (S-10) — CLOSED, conformant. No
  `defaultmonospacedfontname` skinparam handler existed. This port's creole
  engine has no skinparam thread (`CommandCreoleMonospaced.ts`'s own doc
  comment, out of write-set), so the substitution happens downstream instead:
  added a `defaultmonospacedfontname` handler (raw string →
  `theme.colors.graph.monospacedFontName`, new field in a NEW
  `theme-graph-colors-c.ts` split file since both -a and -b are at/over the
  500-line cap), and `renderer-classifier-rows.ts#resolveAtomFontFamily`
  substitutes the real font name for the logical `'monospaced'` token
  BEFORE it reaches `text()`/`textFontFamily`'s existing rename step. Only
  wired for the class member-row text-emission call site
  (`renderer-classifier-rows.ts:392`, in write-set) — the SAME
  `fontFamily: atom.font.family` pattern also appears in `renderer-note.ts`,
  `renderer-note-lines.ts`, and `class-namespace-title-runs.ts` (all OUT of
  write-set), so a note/namespace-title body using `""monospaced""` +
  `defaultMonospacedFontName` still has the old bug. Flagged as a follow-on,
  not fixed here.
- **nisune-86-faji869** (S-13) — CLOSED, conformant. `classFontColor
  automatic` was an early-return no-op (self-documented deferral). Java is
  `HColorAutomagic#getAppropriateColor(back) = back.opposite()`
  (`HColorSimple.java:211-214`): YIQ luma `(r*299+g*587+b*114)/1000 < 128`
  → white text, else black — traced from `klimt/color/HColorSet.java:85`
  (parses `"automatic"` → `HColorAutomagic`) through
  `FontConfiguration.java:354` (`getColor().getAppropriateColor(backcolor)`,
  the generic per-draw-call text-color resolution). Implemented: the
  `classfontcolor` handler now sets a `classFontColorAutomatic` sentinel
  (accumulator → `theme.colors.graph.classFontColorAutomatic`, new field in
  `theme-graph-colors-c.ts`) instead of silently dropping the value;
  `renderer-classifier-rows.ts#resolveAutomaticFontColor` resolves it at
  RENDER time (a parse-time value can't know a classifier's resolved header
  background) against the NAME row's own local background
  (`resolveClassHeaderFill(...) ?? classifierFill(...)`), gated to
  `isHeader && !isStereoLabelRow` only (mirrors `classFontColor`'s own
  header-only skinparam bridge — `classattributefontcolor automatic`, the
  member-row sibling, is UNCHANGED/still silently dropped, no fixture
  exercises it, flagged as a follow-on). `isDarkHex` is a THIRD local copy
  of the 2-line YIQ formula (established precedent in this codebase —
  `core/klimt/color/HColorSet.ts#isDarkResolved` and `core/tim/builtin/
  color-utils.ts#isDark` are the other two, kept as local copies rather than
  a cross-module-boundary import — `core/klimt/color/` is not in this
  task's write-set).

## Movers outside the list

**Class fixtures (non-target, S mechanisms reaching further than the 6
fixtures):** none observed beyond T7's pre-existing pibifa/begico/vuresa/
xoxuni/nagega (already landed on this branch before T8 started).

**Object-diagram fixtures (8, all improvements, 0 regressions)** — the
`object`/`map`/`json` classifier kinds inside `@startuml` class diagrams
share `classBorder`/`resolveClassBorderByStereo` and `colorsFor`/
visibility-icon rendering with plain `class` classifiers (these functions
are NOT gated on `geo.kind`), so the S-3/S-7/S-13 fixes reach them too:
`kagope-09-kubu001`, `kavako-54-zipa815`, `tujasu-04-nota700`,
`zuvila-56-nuda425`, `tusiri-92-catu943`, `meloxo-38-jeti489`,
`guzojo-14-muxa584`, `nitica-38-cere665` — all `diverged`/`structural-match`
→ `conformant`/`structural-match` (never the reverse). No other diagram
engine imports any file in this task's write-set (verified by grep across
`src/diagrams/*/`); `@startjson`/`@startyaml`/`@starthcl` route through the
entirely separate `src/diagrams/json/` module, unreached.

**Regression found and fixed before commit**: `rakopi-21-sufa571` (S-7's
precedence bug, see above) — 10→16 diff count, now restored to 10 (baseline,
unrelated pre-existing issue).

## Open artifacts (out of write-set, not fixed)

1. S-6 (guxode `White`→`#FFF` for a `strictuml` package border) — real fix
   site is `class-namespace-folder-outline.ts#renderFolderPolygon`'s
   `stroke: string` parameter (needs `resolveColorToSvgHex`), out of
   write-set.
2. gabejo's residual `svg/@height`/`viewBox[3]` Δ1 — rect/text geometry for
   `func1`/`func2`/`func3` is byte-identical between jar and ours; the ONLY
   difference is total canvas height (261 vs 262), an unidentified bottom-
   margin/DOT-sizing mechanism, NOT the originally-hypothesized
   `FontStyle<<Blue>> Bold,Italic` text-height growth (disproven — neither
   jar nor our output applies bold/italic to any row in this fixture; every
   box height matches exactly). Root cause not found; not in this task's
   write-set (no `FontStyle<<X>>` handler exists, and canvas-margin sizing
   isn't a style-cascade/skinparam concern).
3. `classattributefontcolor automatic` (member-row sibling of S-13) — still
   silently dropped, no corpus fixture exercises it.
4. `""monospaced""` + `defaultMonospacedFontName` in a note body or
   namespace-title run (siblings of S-10's fix site) — still shows the old
   `monospace` CSS-generic rename; `renderer-note.ts`/`renderer-note-lines.ts`/
   `class-namespace-title-runs.ts` are out of write-set.

## Precedence design note (for future stereo/cascade work)

Any NEW `<style>`-cascade field that a bundled skin (`rose`/`debug`/
`strictuml`) ALSO populates via its own baked-in `<style>`-shaped defaults
must have the corresponding LEGACY skinparam win over the cascade, not the
reverse — `skin-loader.ts` applies a skin as the theme's base layer BEFORE
the document's own skinparam, and once merged into one Theme field, the
cascade machinery cannot tell "skin's own baked default" apart from "the
document's own explicit `<style>` block". Check `src/core/skins-builtin-
rose-1.ts`/`-debug*`/`-strictuml*` for a matching selector before assuming
the `classCascadeHeaderFontColor`-style "cascade always outranks skinparam"
precedent applies to a NEW field.
