## Observation: CommandLinkLollipop's LOL_THEN_ENT/ENT_THEN_LOL branches are
  asymmetric in a non-obvious way — the "existing" side is the one AWAY from
  the paren glyph, and the paren-glyph-adjacent side supplies only the new
  lollipop leaf's DISPLAY text, not an entity lookup
- **Context**: Porting `CommandLinkLollipop` (`Name ()-- Existing` /
  `Existing --() Name`), iteration 5 of the class-dot-sync mission
  (`src/diagrams/class/class-lollipop.ts`).
- **Finding**: In `ENT1 ()-- ENT2` (LOL_THEN_ENT — glyph directly follows
  ENT1), upstream's `executeArg` looks up ENT2's quark as the "existing"
  entity (errors "No class X" if absent) and creates a BRAND NEW leaf whose
  *display text* is ENT1's text — ENT1 is never looked up as an entity at all,
  just used as a label. Symmetric for `ENT1 --() ENT2` (ENT_THEN_LOL): ENT1 is
  the "existing" lookup, ENT2 supplies the new leaf's display. First read of
  the Java misassigned this (assumed the glyph-adjacent side was the existing
  one), which produced a backwards initial test (`class Bar` + `Bar ()- Foo`
  expecting Bar to stay a class) — corrected after re-tracing
  `CommandLinkLollipop.java:181-213` line by line twice.
  Also: the two paren-glyph alternatives are NOT symmetric in which doubled
  form is valid. LOL_THEN_ENT's group is always `[()]\)` (glyph + literal
  `)`) → only `()` (full) or `))` (half) are valid; `((` never appears there.
  ENT_THEN_LOL's group is always `\([()]` (literal `(` + glyph) → only `((`
  (half) or `()` (full) are valid; `))` never appears there.
- **Impact**: Any future work touching this command (or SVG rendering of
  `lollipopKind`) must re-derive from the Java line-by-line, not from
  pattern-matching the surface syntax — the "which side is which" mapping is
  easy to get backwards, and only 2 of the 4 glyph-doubling combinations are
  reachable per direction.
- **Confidence**: High — verified against
  `~/git/plantuml/.../CommandLinkLollipop.java:169-213`, and against all 16
  unit tests in `tests/unit/class/class-lollipop.test.ts` (initially 3 failed
  from the same misreading, fixed after re-derivation).

## Observation: the new lollipop leaf does not update `lastEntity` or
  `classifierIndex` (matches a pre-existing gap in class-assoc-couple.ts)
- **Context**: `class-lollipop.ts`'s `createLollipopLeaf` takes `ast` +
  `activeNamespace` directly rather than the parser's `ParseState` — needed to
  avoid an import cycle (parser.ts → class-commands.ts → class-lollipop.ts →
  parser.ts).
- **Finding**: Because it does not have `ParseState`, it cannot update
  `state.lastEntity` or `state.classifierIndex` the way `ensureClassifier`
  does. This exactly mirrors `class-assoc-couple.ts`'s `makeCoupleCircle`,
  which has the same gap for its `assoc-circle` leaf (pushes directly to
  `ast.classifiers` with no `registerInNamespace`/`lastEntity` update either —
  actually one level worse: it also skips `registerInNamespace`, which
  `class-lollipop.ts` does NOT skip).
- **Impact**: A `note left` with no explicit `of <Entity>` immediately after a
  `()--`/`--()` line will not attach to the new lollipop leaf (falls back to
  whatever `lastEntity` was before). Not fixed here — out of this task's
  write-set/scope, and no target fixture exercises it. A follow-up task
  touching both `class-assoc-couple.ts` and `class-lollipop.ts` could thread
  `lastEntity` back via a return value instead of full `ParseState` access
  (avoids re-introducing the import cycle).
- **Confidence**: High — read directly from both modules' source.

## Observation: `class-lollipop.ts` is a new file outside the task's literal
  write-set, added deliberately
- **Context**: The task's write-set listed only
  `class-commands.ts, class-relationship-parser.ts, class-dot-graph.ts,
  ast.ts, class-declaration-parser.ts` + a new test file — no new source
  module.
- **Finding**: `class-relationship-parser.ts` was already 413/500 lines;
  inlining the lollipop regex + branch/creation logic there would have pushed
  it past the file-size cap. `class-assoc-couple.ts` is direct precedent for
  exactly this situation (a classifier-synthesising relationship shorthand
  split into its own module, imported by `class-commands.ts`), so
  `class-lollipop.ts` mirrors that pattern rather than being a novel
  structure.
- **Impact**: None expected — flagging only so a reviewer knows this
  deviation was a deliberate, precedented call under the file-size
  constraint, not scope creep.
- **Confidence**: High.
