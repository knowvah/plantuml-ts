## Observation: `[[[url]]]` — the creole url command's inner class admits `[`, so a frame's bracketed comment eats the bracket

- **Context**: `plans/sequence-creole` C5, routing the header tab's
  `[comment]` through `sequence-creole.ts`. `cedeti-10-bufu072` writes
  `alt [[https://www.plantuml.com]]`, and
  `ComponentRoseGroupingHeader.java:89` wraps it as `"[" + strings.get(1) +
  "]"`, so the display line reaching creole is `[[[https://…]]]`.
- **Finding**: upstream's `CommandCreoleUrl.pattern` is
  `Pattern2.cmpile("^(" + UrlBuilder.getRegexp() + ")")`
  (`CommandCreoleUrl.java:56`), and every alternative of `getRegexp()` whose
  first capture is a LINK or a LABEL excludes `[` and `]` from that capture —
  `S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL`'s link is
  `([^%s%g\[\]]+?)` (`UrlBuilder.java:77`). At pos 0 of `[[[https://…]]]` the
  third `[` therefore fails every alternative, `matchingSize` returns 0, the
  literal `[` is consumed as plain text, and the command matches at pos 1.
  The jar's three runs follow: `[`, the linked url, `]`.
  This port does not use `getRegexp()` on that path. `core/klimt/creole/
  command/CommandCreoleUrl.ts:39` carries a deliberately simplified grammar,
  `'\\[\\[([^\\]]*(?:\\][^\\]]+)*)\\]\\]'`, whose inner class admits `[`. It
  matches at pos 0, capturing `[https://www.plantuml.com`, and emits ONE run
  plus a stray `]` — with `<a href="[https://www.plantuml.com">`, a broken
  link.
- **Impact**: measured fix (applied, verified, reverted as out of C5's
  write-set — stop condition 8): exclude `[` from both halves of the inner
  class, `'\\[\\[([^\\[\\]]*(?:\\][^\\[\\]]+)*)\\]\\]'`. With it,
  `cedeti-10-bufu072`'s alt comment becomes the jar's three runs exactly —
  `[` at x, the url at +3.025 with `textLength="125.194"`, `]` at +125.194,
  against the jar's 86.731 / 89.756 / 214.95. Only one corpus sequence
  fixture puts a url in a frame condition, but the defect is general to any
  `[[…]]` nested one character inside a `[`, which is every bracketed
  creole display: the `else` `[condition]` (C5's deferred half) and any
  `[[…]]` inside a class member's `[url]` bracket reach it identically.
- **Confidence**: High — both Java methods read, the port's regex read, and
  the fix applied and measured against the jar before being reverted.

## Observation: `branchSeparators[].run` is singular, and one line of `scale-geo.ts` is what keeps it that way

- **Context**: same task. C5's brief lists `branchConditionRun` in its
  write-set and requires `cedeti-10-bufu072`'s `else [[…]]` to emit its own
  `<a>`, which needs the separator to carry SEVERAL runs.
- **Finding**: `geo-frame.ts`'s `branchSeparators[].run?: TextRun` has two
  consumers outside the frame functions. `sequence-page.ts:235-237` spreads
  (`{ ...s, y: shift(band, s.y) }`) and is transparent to the field's type;
  `scale-geo.ts:202-204` names it — `...(s.run !== undefined ? { run:
  scaleRun(s.run, k) } : {})` — and `scaleRun` takes a `TextRun`, not an
  array. Widening the field to `readonly TextRun[]` is therefore a type
  error in `scale-geo.ts` until that one line becomes a `.map(...)`.
  There is no in-set alternative: `tabRuns` and `refBody` are already
  arrays (so the tab and the `ref` body needed no shape change at all), but
  a per-separator array has nowhere else to live — parking the runs on
  `tabRuns` would draw them with the header instead of in document order,
  and a second un-scaled field would break under `skinparam scale`.
- **Impact**: the else-condition half of C5 costs exactly one line in a
  file no C-task's write-set names. A brief that widens a geo field must
  budget `scale-geo.ts` alongside `geo-*.ts`; the scale pass is a second,
  non-obvious consumer of every geometry type.
- **Confidence**: High — both consumers read, and the type error confirmed
  by construction (`scaleRun`'s parameter is `TextRun`).

## Observation: `text-block-geo.ts#textBlockRuns` is now callerless

- **Context**: same task. `buildTabRuns` was its last caller.
- **Finding**: C5 replaced it with a creole-splitting equivalent inline in
  `sequence-layout-events.ts#buildTabRuns`, because `textBlockRuns` emits
  exactly ONE run per line and cannot split a line into atoms. `grep` over
  `src`, `tests` and `scripts` now finds only its own definition
  (`text-block-geo.ts:108`) and one doc reference. Its own doc comment still
  claims "three call sites now need exactly this".
- **Impact**: it is dead code in a file C5 may not touch (hard boundary 2).
  Either delete it with its doc, or — better — move the creole-splitting
  block loop into it, which is the same function one atom-splitting level
  down and would give C6's note/divider blocks a shared producer.
- **Confidence**: High — grep over the whole repo, and lint is silent on
  unused exports so nothing else will surface it.
