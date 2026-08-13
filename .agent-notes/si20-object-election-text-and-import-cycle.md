# Observation: the port election's input text is per-PARSER, not per-engine

- **Context**: SI20 T2, wiring object leaves into `classPortRows`
  (`class-port-rows.ts`). SI17 built `toPortCompartments` to recompute each
  member's election text with `formatMemberText(member, false)`, and object
  simply reused it.

- **Finding**: that is wrong for an object leaf. Upstream needs exactly one
  function because it never re-splits the line — `Member#getDisplay(false)`
  returns the stored display verbatim (`cucadiagram/Member.java:146-155`).
  This port splits name/type at parse time and has TWO reconstructors:
  `formatMemberText` (`name: type`, `class-member-parser.ts`) and
  `formatObjectMemberText` (`name = type` plus G3/O4's `\t` unescape,
  `class-object-commands.ts#parseObjectField`). They disagree on real input,
  and `MethodsOrFieldsArea#getScore`'s `.*\bshortName\b.*` tier
  (`java:228-235`) is sensitive to the disagreement: a literal `\t` left
  unescaped puts a word CHARACTER where a real tab would have put a word
  BOUNDARY, dropping that member from score 100 to the CONTAINS tier (50).
  With two members competing for one short name, `Ports#add`'s
  strictly-greater replacement (`svek/Ports.java:70-76`) then hands the band
  to the wrong row. Fixed by `electionTextFor(kind)`; the discriminating
  control is in `tests/unit/class/class-object-row-ports.test.ts`.

- **Impact**: `rozuxo-44-fudi093` — the only object fixture with `::member`
  ports — has bare-word members (`UK`, `USA`, `3`) that BOTH reconstructors
  render identically, so every DOT gate and census passed with the wrong
  formatter wired in. Any future kind added to `isRowPortKind` must supply
  its own parser's reconstructor, and the corpus will not tell it to.

- **Confidence**: High — reproduced as a failing assertion (band at
  position 22 instead of 36) before the fix, with the two score tiers read
  from the ported `MethodsOrFieldsArea`/`Ports`, not inferred.

# Observation: `class-layout-helpers.ts` is in an import cycle with the class engine

- **Context**: SI20 T2, adding an `object`-aware kind set next to
  `memberPortIsP` in `class-shield-helpers.ts`.

- **Finding**: a module-level `new Set([...LIKE_CLASS_KINDS, 'object'])`
  throws `LIKE_CLASS_KINDS is not iterable` at import time. The cycle is
  real: `class-layout-helpers.ts` -> `class-map-sizing.ts` ->
  `class-port-rows.ts` -> `class-shield-helpers.ts` ->
  `class-layout-helpers.ts`, and `LIKE_CLASS_KINDS` is declared near the END
  of that first module, so the binding is still in its temporal dead zone
  when the cycle re-enters. It fails at MODULE LOAD, so it takes down every
  test in any file that touches the class engine, not just the new code.

- **Impact**: anything derived from `LIKE_CLASS_KINDS` (or from any other
  late-declared export of `class-layout-helpers.ts`) outside that file must
  be read INSIDE a function, not at module scope. Prefer a predicate to a
  derived `Set` constant in this neighbourhood.

- **Confidence**: High — cycle path enumerated by BFS over the real import
  graph, and the throw observed before and absent after.
