# cdd-T6FU — batch-6 follow-up round (five located residuals)

## Observation: `classHeaderBackgroundColor` does NOT outrank
`classBackgroundColor` — the two merge by SOURCE ORDER

- **Context**: item 1. After wiring `classHeaderBackgroundColor` into
  `resolveClassHeaderFill`, four fixtures that were conformant or
  structural-match regressed (`cunavo-77-filo788` 0 -> 2,
  `ziromu-57-mima164` 0 -> 4, `dofima-22-kofe334`/`jireze-84-loti743`
  4 -> 8): the port drew the 4-shape header split where the jar draws
  ONE rect.
- **Finding**: the `{element, class_, header}` signature is NOT more
  specific than `{element, class_}` for this query.
  `EntityImageClass#getStyleHeader` (java:174-177) asks for `{root,
  element, classDiagram, class_, header}`, and BOTH styles match it.
  `StyleStorage#computeMergedStyle` (java:102-116) iterates every
  matching style in REGISTRATION order and folds them with
  `MergeStrategy.OVERWRITE_EXISTING_VALUE`; `Style#mergeWith`
  (java:121-135) -> `ValueImpl#mergeWith` (java:62-73) ->
  `DarkString#mergeWith` (java:50-66) keeps whichever value has the
  bigger priority, and `ValueImpl.regular(value, counter)` takes that
  priority from an `AutomaticCounter`. On equal specificity the LAST
  skinparam written therefore wins. Jar-probed both orders directly
  (`oracle-render.sh`): `classHeaderBackgroundColor` then
  `classBackgroundColor` draws ONE rect; the reverse draws the split.
- **Impact**: ported by having the `classbackgroundcolor` key handler ALSO
  write `acc.classHeaderBackground`, so source order alone decides which
  value survives -- no priority machinery needed. Any future
  `<sname>Header*` skinparam pair needs the same treatment; "the nested
  signature wins" is a wrong default in this codebase.
- **Confidence**: High (jar-probed in both orders; all four fixtures
  returned to their exact baselines).

## Observation: the STEREOTYPE tier (+1000) outranks the header style too

- **Context**: item 5 landed `classBackgroundColor<<stereo>>`, after which
  `tabaxa-70-pomu341` rose 1 -> 2 in the corpus pin-diff (it had measured
  conformant in isolation, BEFORE item 1's merge-order fix existed).
- **Finding**: `FromSkinparamToStyle#addStyle` (java:396-408) registers a
  stereotype-qualified key at `StyleLoader#addPriorityForStereotype`
  (+1000, java:180-186). That beats BOTH plain styles in
  `getStyleHeader()`'s merge, so a stereotyped classifier's
  `headerBackcolor` equals its `backcolor` and draws NO split, whatever
  `classHeaderBackgroundColor` said.
- **Impact**: `renderer-classifier-colors.ts#classStereotypeBackground`
  (new, exported) is consulted FIRST in `resolveClassHeaderFill`. The two
  interacting items had to be measured against the WHOLE corpus, not
  their own fixtures -- tabaxa passed in isolation at every point.
- **Confidence**: High (tabaxa conformant, corpus pin-diff 0 rises).

## Observation: T19's artifact (journal row 65) named the wrong mechanism
for `classbackgroundcolor<<stereo>>`

- **Context**: item 5's brief repeated row 65's claim that this is a
  DIRECT stereotype-qualified value lookup, `SkinParam.java:371-381
  getHtmlColor`, "the shape of the already-ported
  `classBorderThicknessByStereo`, NOT the `<style>` cascade".
- **Finding**: `getHtmlColor(ColorParam, Stereotype, boolean)` is the
  legacy ColorParam path and the class engine does not use it --
  `EntityImageClass.java:207` reads `getStyle().value(PName
  .BackGroundColor)`. `SkinParam#setParam` (java:228-233) runs every
  cleaned key through `FromSkinparamToStyle`, whose ctor peels `<<...>>`
  into `this.stereo` (java:292-301) and whose `addStyle` re-signs the
  style with `sig.addStereotype(s)`. So it IS the style cascade -- the
  same tier `classTagCascade` already models for `<style> class { .tag
  {} } }`, reached by `getStyle()`'s `withTOBECHANGED(getStereotype())`.
- **Impact**: the port consumes it one tier below `classTagCascade` in
  `classifierFill` rather than as an independent `ByStereo` fallback, and
  it participates in the header merge (previous observation). The
  distinction is not cosmetic: the value-lookup framing predicts neither
  the +1000 priority nor the header interaction.
- **Confidence**: High (both call chains read end to end).

## Observation: `Colors.java`'s tokenizer has no notion of a "leading"
token

- **Context**: item 2. The doc comment on `resolveBareOrBackColor` framed
  the grammar as "a bare token IS the background; a compound token needs
  its explicit `back:` part".
- **Finding**: `Colors.java:96-104` strips every `#`, splits on `;`, and
  puts ANY token with no `:` and no `.` under `mainType` -- position is
  irrelevant, and there is one map key, so the last claimant wins. A
  DOTTED token (`line.bold`) is skipped outright as a line style. The old
  short-circuit ("no `;` and no `:` -> the whole token is the colour")
  both missed `#yellow;line:red` and mis-read `#line.bold` as a colour
  name, emitting the literal string `#line.bold` as an SVG fill.
  `ColorType.getType` (java:41-47) additionally truncates a `name:value`
  name at its first `.`, so `line.dashed:blue` keys LINE.
- **Impact**: this function is shared by class classifiers, notes and
  state (`core/color-override.ts`'s own doc comment), so the fix moved a
  NOTE fixture too (`xoxuni-96-fere626` 8/0 -> 4/0) alongside the class
  ones. A grammar ported as prose rather than as the tokenizer will drift
  exactly this way.
- **Confidence**: High (four fixtures, 0 rises corpus-wide).

## Observation: `renderRow`'s wrapped-icon path has no corpus reach yet

- **Context**: item 4 asked for the M6 fix in
  `renderer-classifier-rows.ts#renderRow` and for a fixture proving it.
- **Finding**: `visibilityBlockHeight` is written ONLY by
  `class-member-rows.ts#iconRowFields`, and those rows are drawn through
  `renderer-classifier-box.ts#pushIconRowPrimitives`, never `renderRow`.
  `renderRow`'s icon branch is reached from `renderer.ts:108` and
  `renderer-body-enhanced.ts:90,116`, and `class-body-enhanced-layout.ts`
  does not set the field. So the bug is real but currently unreachable --
  it will surface the moment the enhanced-body layout gains wrapping.
- **Impact**: ported anyway with a unit test on hand-built row geometry,
  and the formula moved to ONE exported helper
  (`wrappedVisibilityIconOriginY`) that both draw paths now share, so the
  two cannot drift. Zero corpus movement, as predicted.
- **Confidence**: High (grepped every writer and every caller).

## Observation: nagega's residual is a link-colour GRAMMAR gap, not a
skinparam one

- **Context**: item 5's target named nagega and asked what remains.
- **Finding**: after the fill fix, nagega's 12 structural diffs are all
  edge strokes (`#48D1CC`/`#00F` vs `#181818`). `CommandLinkClass.java:160`
  puts `color().getRegex()` (`ColorParser.simpleColor(ColorType.LINE)`)
  between ENT2 and the optional URL/stereotype/label, consumed at
  `:368` `link.setColors(...)`. This port's class relationship parser has
  no such slot: probed directly, BOTH `A o-up-> B #MediumTurquoise : lbl`
  and the `!define`d spelling render `#181818`, so the macro is a red
  herring. The 114 numeric diffs are a node-ORDER swap (g[3]/g[4] differ
  by a constant ±169.004), i.e. dot-engine layout, not colour.
- **Impact**: two separate, named follow-ups; neither is a stereotype or
  skinparam mechanism.
- **Confidence**: High (minimal-case probe isolating the `!define`).
