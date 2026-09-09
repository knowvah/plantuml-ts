# Architecture decisions — `activity-min-box-width`

Confirmed 2026-09-09 before decomposition. Treat every one as **locked**.
If a task discovers a conflicting constraint, amend the decision here and
halt for review — do not silently override it.

## D1 — Minimum width resolves through the shared cascade, to 0

**Context.** The floor must come from `PName.MinimumWidth`
(`FtileBox.java:87`, applied at `:237-243` as `atLeast(minimumWidth, 0)`),
whose unset value is 0 (`style/ValueNull.java:61-63`). The bare
`skinparam minClassWidth` converts with an EMPTY signature
(`FromSkinparamToStyle.java:241`, `:396-407`), and an empty key matches
every signature (`StyleStorage.java:106`) — so it floors activity boxes too.

**Decision.** `activityMinimumWidth(theme)` =
`resolveElementMinimumWidth(theme, 'activity') ?? 0` — bucket → bare
`minClassWidth` → 0. `ACTION_MIN_WIDTH` is deleted, not lowered.

**Consequences.** A `<style> activity { MinimumWidth N }` and a bare
`skinparam minClassWidth N` both floor the box, bucket first. Rejected:
bucket-only, which would ignore a converter upstream applies to everything.

## D2 — Text is positioned by `x`, never by `text-anchor`

**Context.** The jar emits no `text-anchor` on any activity text.
`FtileBox#drawU` (`:220-233`) places the text block at `padding.left`
(LEFT — the root `HorizontalAlignment left`, `plantuml.skin:12`), at
`(W − textW)/2` (CENTER) or right-aligned; `horizontalAlignment =
style.getHorizontalAlignment()` (`:80`) through
`skinParam.getDefaultTextAlignment` (`:89`). `FtileDiamondInside.java:94-96`
centres its label by geometry.

**Decision.** A per-shape x computation: `activityHorizontalAlignment(theme)`
(bucket → `skinparam defaultTextAlignment` → root left) drives the box's
three branches; diamond/hexagon centre by geometry; a multi-line block
aligns each line on its own width, as the creole `Sheet` does (read and
cite `SheetBlock1`/`Sheet` before choosing per-line vs per-block).

**Consequences.** `renderMultilineText`'s `(cx, anchor middle)` contract
becomes an explicit left x; every caller changes in the same task. Rejected:
keeping the anchor where centring is equivalent — one diff unit per text.

## D3 — One text-colour cascade for all activity text

**Context.** 1869 of the jar's 1915 activity texts are `#000`, the root
`FontColor black` (`plantuml.skin:9`); no activity block, `note` included,
declares its own FontColor.

**Decision.** `activityFontColor(theme, sname)`, shaped like
`swimlaneTitleFontColor` (bucket font → root black via
`resolveColorToSvgHex`), at every activity text site: action, diamond,
note, arrow label, connector label. `theme.colors.text` leaves the activity
renderer entirely.

**Consequences.** A `<style> activityDiagram { activity { FontColor red } }`
colours action text and nothing else. Rejected: per-site constants.

## D4 — The `element` tier is the line-thickness fallback

**Context.** `element { LineThickness 0.5 }` (`plantuml.skin:91-93`) is
merged in file order with `OVERWRITE_EXISTING_VALUE`
(`StyleStorage.java:102-116`), so it beats the root 1.0 for every
signature containing `SName.element` — which every activity SName does
(`StyleSignatureBasic.activity()`, `:267-268`).

**Decision.** `ELEMENT_LINE_THICKNESS = 0.5` replaces `ROOT_LINE_THICKNESS`
in `LINE_THICKNESS_DEFAULTS` for each activity SName whose upstream
signature contains `element` and declares no own LineThickness. T3 reads
each signature (`activity`, `activityBar`, `diamond`) in the Java and cites
it; arrow, composite, circle, end, note and swimlane keep their declared
values.

**Consequences.** `ROOT_LINE_THICKNESS` may become unused and is then
deleted. Rejected: special-casing the action box.

## D5 — A text census pins fill, anchor and box inset before anything moves

**Context.** `style-baseline.json` histograms font-size, stroke-width, rx,
text count and canvas; `swimlane-baseline.json` the lane chrome. Neither
sees `fill`, `text-anchor` or where a text sits inside its box, so D2 and
D3 would be individually unattributable.

**Decision.** T0 adds a pure `text-census.ts` and an equality-pin gate over
the 268 fixtures (both sides): `fill` histogram, `text-anchor` histogram
with `(absent)`, and the "box inset" histogram (`text.x − rect.x` for a
text whose immediately preceding sibling is a `<rect>`, 3 dp). Every task
is measured with the aggregate probe; baselines re-pin once at T6.

**Consequences.** A task may not land while any fixture it raised lacks a
named mechanism — T2's two `split … detach` risers must be diagnosed first.
