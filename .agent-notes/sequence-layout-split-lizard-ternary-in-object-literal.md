## Observation: lizard's TS reader swallows all functions after a `<`/`>`
comparison ternary used as an object-literal property value

- **Context**: Splitting `src/diagrams/sequence/layout.ts` (577 lines) into
  `layout.ts` + `sequence-layout-participants.ts` +
  `sequence-layout-events.ts` + `sequence-layout-shared.ts` to satisfy the
  500-line file cap and per-function complexity limits
  (params ≤5, NLOC ≤30, CCN ≤10).
- **Finding**: `~/.claude/hooks/.venv/bin/lizard` (used by
  `check-complexity.py`) completely stops detecting function boundaries
  after a return statement shaped like
  `return { ..., key: a < b ? 'x' : 'y' };` — i.e. a ternary whose
  condition uses `<`/`>` inlined as an object-literal property value.
  Everything textually after that line gets silently dropped from the
  report (not even merged into the preceding function's NLOC — it just
  vanishes from both the per-function list and the file's total NLOC),
  until a `function` declaration at column 0 happens to resync the
  reader (observed resync point: the next top-level `function` keyword,
  many lines later).
  - Isolated with a 10-line repro
    (`{ fromX, toX, arrowDirection: fromIdx < toIdx ? 'right' : 'left' }`
    followed by a second function `afterFunc`): `afterFunc` disappears
    from lizard's output entirely with the ternary inlined; reappears
    the moment the ternary is hoisted to its own `const` statement
    before the `return`.
  - Root mechanism (inferred from behavior, not read from lizard source
    this time): the reader appears to treat `<` after `{` as the start of
    a generic type-argument list (`Type<...>`) and never finds a matching
    `>` it accepts, corrupting brace-depth tracking for the rest of the
    file/class it's scanning.
  - The hook's reported violation in this failure mode looks like ONE
    function with implausibly large NLOC/CCN/token/length values that
    span from the true offending line to end-of-file (e.g. reported
    "resolveMessageEndpoints has 175 NLOC, 28 CCN... length 228" when the
    real function is ~20 lines) — a strong tell that this bug, not a
    real complexity problem, is in play.
- **Impact**: Any future agent hitting a complexity-hook violation whose
  reported NLOC/CCN/length is wildly larger than the function actually
  spans (check with
  `~/.claude/hooks/.venv/bin/lizard <file> -T nloc=1000 -C 1000 -a 100`
  to see real per-function boundaries and locations) should suspect this
  bug rather than assume the function truly needs decomposition. Fix: hoist
  any `a < b ? x : y` (or `a > b ? x : y`) ternary used as an object-literal
  property value out to its own `const` statement before the literal. This
  is now the case in `sequence-layout-events.ts`'s
  `resolveMessageEndpoints` — see the inline comment there.
- **Confidence**: High (reproduced in isolation with minimized repro files
  in `/private/tmp/.../scratchpad/repro8.ts` / `repro9.ts`, and against the
  real file before/after the fix; typecheck/tests/lint all pass after the
  hoist).
