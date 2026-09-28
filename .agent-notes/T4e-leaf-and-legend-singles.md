## Observation: Serena edit tools write to the main checkout, not the worktree
- **Context**: T4e, first edit attempt on `class-layout-description-leaf-ink.ts`
  via `mcp__serena__replace_symbol_body` with a worktree-relative path passed
  through the tool's `relative_path` param.
- **Finding**: the call silently applied to
  `/Users/scottseely/git/knowvah/plantuml-ts/src/...` (the main checkout),
  not the worktree, and left the file in a broken syntax state (duplicate
  `const const ...;;`). Restored immediately via `Write` with the original
  content (verified byte-identical via `Read` before/after). No other Serena
  edit tool was used, so no other main-checkout file was touched.
- **Impact**: in a worktree task, Serena's edit tools (`replace_symbol_body`,
  `insert_after_symbol`, etc.) must never be used at all, regardless of what
  path is passed to them — they resolve against Serena's own project root
  (the main checkout), not the caller's cwd. Use `Read`/`Edit`/`Write` with
  absolute worktree paths for every mutation; Serena read tools
  (`find_symbol`, `get_symbols_overview`, etc.) are fine with absolute
  worktree paths.
- **Confidence**: High (directly observed and reverted).

## Observation: descriptionLeafSymbolInk's correct fix is a denylist mirroring measureLeafNode, not "everything except port"
- **Context**: widening `descriptionLeafSymbolInk`'s ink allowlist to match
  `usesClassUSymbolEntity`'s render-time denylist (port only).
- **Finding**: the render-time dispatch (`usesClassUSymbolEntity`) and the
  sizing-time `Dim` dispatch (`leaf-sizing.ts#measureLeafNode`) are TWO
  separate tables that happen to agree for most symbols but diverge for
  `interface`/`circle` (fixed hideText square), `folder`/`package`
  (`measureFolderLeaf`'s own `mergeTB` geometry), and `hexagon`
  (`EntityImageDescription.drawHexagon` throws at sizing time with no
  polygon supplied — crash-verified via the full `tests/unit/class/` run,
  not just a mismatch). Ink must mirror the SIZING dispatch
  (`measureLeafNode`), not the render dispatch, since ink and box both come
  from measuring, not drawing.
- **Impact**: any future widening of a `symbolInk`-style ink function must
  check `leaf-sizing.ts`'s own switch for non-generic Dim constructions
  before assuming "matches the render dispatch" is sufficient. A jar-number
  regression on `package`/`circle` and a real crash on `hexagon` both
  surfaced only after actually rendering the rows, not from reading the
  render-dispatch doc comment alone.
- **Confidence**: High (jar-verified regressions + reproduced crash + fix
  confirmed via `npx vitest run tests/unit/class/`).

## Observation: enhanced-body visibilityBlockTopDy is blockTop-y, not 0
- **Context**: porting `class-member-rows.ts#iconRowFields`'s
  `visibilityBlockHeight`/`visibilityBlockTopDy` fields into the
  enhanced-body row builder (which never groups wrapped continuation lines,
  so every row is its own one-row "block").
- **Finding**: a first attempt hardcoded `visibilityBlockTopDy: 0`,
  reasoning "single-row block, no offset needed." This is wrong:
  `visibilityBlockTopDy` is consumed as `baselineY + row.visibilityBlockTopDy`
  (`class-visibility-icon.ts#rowIconTopOriginY`), i.e. an offset from the
  row's own BASELINE (`y`) to its TOP, not "no correction." Since `y` is
  baseline-anchored (`rowTop + baselineOffset` for a non-image row), the
  correct value is `rowTop - y = -baselineOffset` — confirmed by the exact
  render-diff signature this bug produces: EVERY OTHER icon row in the
  diagram shifts by the same `Δ` (here `baselineOffset ≈ 10.889`), not just
  the target row, because setting the fields unconditionally engaged
  `rowIconTopOriginY` for rows that previously fell back to a different,
  correct baseline-keyed formula.
- **Impact**: this exact class of bug (a plausible-looking "0" for an
  offset field that's actually relative to a different anchor) is worth a
  specific check next time: if a fix widens which rows carry a field
  unconditionally, and post-fix render-diff shows the SAME delta across
  MULTIPLE unrelated elements (not just the target), that is diagnostic of
  a mis-derived constant, not a partial fix — re-derive from the sibling
  implementation's actual formula rather than from the field's name.
- **Confidence**: High (jar-verified before/after: Δ34 residual specific to
  the target row before the field was ever set; Δ10.889 across 8 unrelated
  ellipses with `blockTopDy: 0`; pass=true with `blockTopDy: rowTop - y`).

## Observation: lizard TypeScript function-boundary desync, triggered by a call inside a nested `.map` closure
- **Context**: replacing an inline conditional-spread in
  `buildRowsBlockRows`'s `.map` callback with a call to a named helper
  function (`iconVisibilityFields`/`buildEnhancedRow`).
- **Finding**: the moment the `.map` callback's body contained a CALL to a
  named function (as opposed to only object literals/inline expressions),
  lizard's TypeScript reader mis-detected the ENCLOSING function's closing
  brace, reporting `buildRowsBlockRows@221-373` instead of its real
  `221-281` span — a ~150-line, ~19-NLOC phantom inflation with zero
  underlying complexity change. Matches the documented pattern in
  `renderer-classifier-box.ts#buildHeaderPrimitive`'s own `#lizard forgives`
  comment (same bug class: "brace-counter bleeds past this function's own
  closing `}` into later code"). Fixed by adding `// #lizard
  forgives(nloc,cyclomatic_complexity)` as the FIRST line of the function
  body (this placement — not "last line" — worked here, differing from
  `O1-lizard-forgive-call-consumption.md`'s finding for a DIFFERENT trigger
  shape; try first-line before assuming a refactor is required).
- **Impact**: extracting a `.map`/`.filter` callback's body into a named
  function call is a specific, previously-undocumented trigger for this
  span-desync bug (distinct from the already-documented "call consumption"
  and "nested closure resets" triggers in `O1-`/`N16-` notes). Isolated
  single-function extraction into a temp file will NOT reproduce it (the
  bug depends on what follows in the FULL file) — always re-check with
  `python3 -m lizard <file> -l typescript` inside the real file.
- **Confidence**: High (reproduced via direct lizard invocation, fixed via
  the documented pragma pattern, hook cleared on the exact same diff).
