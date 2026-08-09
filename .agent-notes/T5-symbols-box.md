## Observation: lizard's TS parser mis-tokenizes `(expr - x.getWidth()) / N`, breaking `#lizard forgives` for the containing function

- **Context**: Porting the box family (`USymbolRectangle`/`Card`/etc.),
  every `asBig` needs `// #lizard forgives` for its unavoidable 7-param
  signature (matches `USymbol#asBig`'s abstract signature). The marker
  intermittently failed to suppress the violation even when placed on
  the line directly before the final `return` (the documented-working
  pattern, `style-map-theme.ts:498`).
- **Finding**: bisected empirically (repeated `~/.claude/hooks/.venv/bin/
  lizard file.ts -T nloc=30 -C 10 -a 5 -w` + `python3 -c "import lizard;
  ..."` printing `forgiven_metrics` per function) down to a single
  minimal trigger: a parenthesized arithmetic expression that wraps a
  zero-arg method call, e.g. `(width - dimStereo.getWidth()) / 2`. This
  EXACT shape — `(<expr> - <ident>.<call>()) <op> <n>` — breaks the
  forgive-flag association for whichever function contains it, even
  though the expression is trivial (no real complexity). The equivalent
  `width - dimStereo.getWidth()` (no wrapping parens) does NOT trigger
  it. First suspected the wrong cause (nested-function CCN) — that was a
  bisection artifact from truncating files mid-brace, not the real
  cause; the parenthesized-call-expression pattern is the actual and
  only confirmed trigger, reproduced in isolation multiple times.
- **Workaround** (mechanical, NOT a behavior change): extract the
  zero-arg call to a local variable BEFORE using it in the parenthesized
  expression:
  ```ts
  // triggers the bug:
  const posStereo = (width - dimStereo.getWidth()) / 2;
  // fix:
  const dimStereoWidth = dimStereo.getWidth();
  const posStereo = (width - dimStereoWidth) / 2;
  ```
  Apply this to every `(x - y.getWidth()/getHeight()) / N`-shaped
  expression inside any function that also needs a `#lizard forgives`
  marker (every family's `asBig`, given the shared `(width -
  dim.getWidth()) / 2` centering idiom recurs constantly across
  USymbol* symbols). `USymbolRectangle.ts` instead extracted the whole
  branch into a named top-level helper (`computeStereoPos`/
  `computeTitlePos`) — also works, but the local-variable extraction is
  simpler when there's no `if`/`else` to justify a helper.
- **Impact**: every T5–T9 family task will hit this identical wall in
  its own `asBig` — worth flagging to the orchestrator for a shared note
  or a lizard-version bump if one becomes available.
- **Confidence**: High (bisected via lizard's own Python API, isolated
  to a single minimal 1-line repro, confirmed both trigger and fix in
  scratch files — not guessed).

## Observation: sibling task T6 added `UGraphic#getStringBounder()`

- **Context**: T3's landed base (`UGraphic.ts`) deliberately dropped
  `getStringBounder()` — every `USymbol*asSmall/asBig` drawU body needs
  it to (re)compute label/stereotype/title dimensions at draw time.
- **Finding**: A concurrent sibling task (self-identifies as "T6",
  `USymbolComponent1.ts`/`USymbolDatabase.ts` etc.) already performed the
  write-set expansion: `UGraphic.getStringBounder(): StringBounder` is
  now on the interface, `AbstractCommonUGraphic` provides a throwing
  default, and `UGraphicSvg` overrides it by adapting its own
  `DriverTextSvg`-scoped `{width}`-only bounder into a full
  `klimt/font/StringBounder` (height always `0` — real height must come
  from a caller-supplied `TextBlock#calculateDimension` override, e.g. a
  test double with a hardcoded jar-measured height).
- **Impact**: Every T5–T9 family class should call `ug.getStringBounder()`
  directly, matching upstream exactly — do NOT reinvent a
  constructor-injection workaround (an earlier draft of this task did,
  before discovering the sibling's fix; reverted). If `UGraphic` ever
  regresses to lacking this method, `asSmall`/`asBig` will fail to
  type-check, which is the correct, visible failure mode.
- **Confidence**: High (read directly from `git diff` on
  `src/core/klimt/UGraphic.ts`/`AbstractCommonUGraphic.ts`/
  `drawing/svg/u-graphic-svg.ts`).

## Observation: `TextBlockUtils.mergeTB`/`TextBlockVertical` not ported — every T5-T9 family duplicates a local copy

- **Context**: T3's base has no `TextBlockUtils`. Every `USymbol*` in
  every family (T5-T9) calls `TextBlockUtils.mergeTB(stereotype, label,
  alignment)`.
- **Finding**: Sibling task T6 independently reached the same
  conclusion and duplicated a local `mergeTB` in `USymbolComponent1.ts`
  (exported for its own family's other files to reuse). This task
  (T5) does the same in `USymbolRectangle.ts`.
- **Impact**: A follow-up task should consolidate all T5-T9 local
  copies into a real shared `src/core/klimt/shape/TextBlockUtils.ts` +
  `TextBlockVertical.ts` once every family has landed — flagging for
  the orchestrator, not for this task to solve (write-set collision
  risk while families run in parallel).
- **Confidence**: High.
