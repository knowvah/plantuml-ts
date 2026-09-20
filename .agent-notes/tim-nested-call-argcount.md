# Preprocessor: a user `!function` called with nested call arguments is "Unknown built-in function"

Found 2026-09-20 while capturing the c4 oracle (follow-on to
`parity-dashboard-refresh`). Not fixed here; filed for a preprocessor fix.

## Observation: nested call arguments break user-function resolution
- **Context**: `c4/favasu-27-fesa452` and `c4/xizifu-87-siti076` error at
  `<C4/C4> (line 649)`: `!$mask = $mask + $orFlags(%substr($mask1, 0, 1),
  %substr($mask2, 0, 1))` inside `!function $combineMasks`. `$orFlags` is
  defined at line 623, before the call, so it is not a forward reference.
- **Finding**: a four-case probe through `renderSync`:
  `$f("a", "b")` → ok; `$f(%substr("ab",0,1), %substr("cd",0,1))` →
  `Unknown built-in function $f`; `$f($g("a"), $g("b"))` → same; the same
  inside a function body → same. The lookup itself is identical on both
  sides (`ReversePolishInterpretor.ts:74` vs `ReversePolishInterpretor.java:95-99`:
  `knowledge.getFunction(new TFunctionSignature(name, nb))` with
  `nb = parseInt(OPEN_PAREN_FUNC surface) - named.size`), so the `nb` the
  shunting-yard wrote onto the OPEN_PAREN_FUNC token is wrong for calls whose
  arguments are themselves calls — the signature `$f/<wrong nb>` does not
  exist. Origin is in `src/core/tim/expression/ShuntingYard.ts`'s argument
  counting versus `ShuntingYard.java`.
- **Impact**: every stdlib that calls a user function with nested call
  arguments fails at include time — C4's `$combineMasks` is one; there are
  likely more in `assets/stdlib/`. Pinned in `refusal-baseline.json` as
  `known-gap` for the two c4 fixtures; the routing gate pins them
  `known-misroute` (DESCRIPTION → NONE) on the same reason.
- **Confidence**: High (reproduced in isolation; flat call works).
