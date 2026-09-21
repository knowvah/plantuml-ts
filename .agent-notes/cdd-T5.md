# T5 — relationship AST/grammar fields

## Which end REDEFINES/EXTENDS bind to for `foo <||--^ bar`

Step 8 asked to confirm-or-correct step 1's assumption from `LinkDecor.java`.

**Java derivation** (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/`):

- `decoration/LinkDecor.java:71`: `EXTENDS(decors1("<|","^"), decors2("|>","^"),...)`.
  `^` is a member of BOTH `decors1` and `decors2` — it resolves to `EXTENDS`
  regardless of which side it sits on.
- `decoration/LinkDecor.java:73`: `REDEFINES(decors1("<||"), decors2("||>"),...)`
  — `<||` is `decors1`-only.
- `classdiagram/command/CommandLinkClass.java:492-494`:
  `decors1 = lookupDecors1(getArrowHead1(arg))` (ARROW_HEAD1, nearest ENT1/
  source), `decors2 = lookupDecors2(getArrowHead2(arg))` (ARROW_HEAD2, nearest
  ENT2/target). For `foo <||--^ bar`: `decors1 = REDEFINES` (from `<||`),
  `decors2 = EXTENDS` (from `^`).
- `CommandLinkClass.java:494`: `LinkType result = new LinkType(decors2, decors1)`
  — note the SWAP: `LinkType.decor1 = decors2 = EXTENDS`,
  `LinkType.decor2 = decors1 = REDEFINES`.
- `svek/SvekEdge.java:677-709`: `extremity1` (drawn at the START point, i.e.
  near `cl1`/entity1/source) is built from `linkType.getDecor2()`;
  `extremity2` (END point, near `cl2`/entity2/target) is built from
  `linkType.getDecor1()`.

**Conclusion**: extremity1 (source) = `LinkType.decor2` = REDEFINES.
extremity2 (target) = `LinkType.decor1` = EXTENDS.

So for `foo <||--^ bar`: **source (`foo`) = REDEFINES, target (`bar`) =
EXTENDS** — matching `core/svek/extremity/link-decor.ts`'s own doc comment
("`decor1` is the HEAD-side decor (near entity 2) and `decor2` the
TAIL-side (near entity 1)").

## Correction to the task brief's acceptance criterion

Step 1 of the brief says "REDEFINES/EXTENDS at opposite ends — confirm which
end from `LinkDecor.java` before asserting" (correct). The Acceptance
Criteria section then says "one end's decor is `redefines` and the other
`arrowTriangle`" — **this is wrong**. `^` is `LinkDecor.EXTENDS`, not
`LinkDecor.ARROW_TRIANGLE` (a distinct enum member, glyphs `<<`/`>>`, which
this port's arrow grammar cannot even parse — see class-arrow-decor-map.ts).
This port already has a decor named `'triangle'` for EXTENDS's ordinary
glyphs (`<|`/`|>`); `^` reuses that SAME member. Implemented and tested as:
`sourceDecor: 'redefines'`, `targetDecor: 'triangle'` (NOT `'arrowTriangle'`,
which is not part of the widened `LinkDecor` union at all — see below).

## `arrowTriangle`/`circleFill`/`circleConnect`(head)/`halfArrowUp`/`halfArrowDown`: NOT added

The Interface-out block lists 8 new `LinkDecor` members. Only `redefines`
and `definedBy` were added. The other 5 are members of `LinkDecor.java` whose
glyphs (`<<`/`>>` for ARROW_TRIANGLE, `@` for CIRCLE_FILL, head-position
`0)`/`(0` for CIRCLE_CONNECT, `\\`/`//` for HALF_ARROW_UP/DOWN) are not
reachable through this port's current `HEAD1_SAFE`/`HEAD2_CHARS` arrow
grammar in `class-relationship-parser.ts` — confirmed by reading both
regexes character-by-character. Adding table entries for glyphs no input can
ever produce would be dead, untestable code (TDD: don't write code with no
test path). `class-arrow-decor-map.ts`'s own doc comment records the same
reasoning in-source.

## `middleDecor`: 'circleConnect' (brief) vs 'circleCircled1' (implemented)

The brief's Interface-out names the `-0)-` mechanism's value `'circleConnect'`.
Per `CommandLinkClass.java:498-507`, the `INSIDE` regex group's four forms map
to `LinkType#withMiddleCircle()/withMiddleCircleCircled1()/
withMiddleCircleCircled2()/withMiddleCircleCircled()` — i.e. Java's
`LinkMiddleDecor` enum (CIRCLE / CIRCLE_CIRCLED1 / CIRCLE_CIRCLED2 /
CIRCLE_CIRCLED), a COMPLETELY DIFFERENT Java type from `LinkDecor` (which is
where `CIRCLE_CONNECT` lives, as a HEAD decor, glyphs `0)`/`(0`, itself
unreachable per above). `"0)"` as the `INSIDE` token is `CIRCLE_CIRCLED1`,
never `CIRCLE_CONNECT`. Implemented `Relationship.middleDecor` with values
`'circle' | 'circleCircled' | 'circleCircled1' | 'circleCircled2'`
(class-arrow-middle-decor.ts) — the faithful Java-derived names — and the
`cenubi-27-xova754` probe asserts `middleDecor === 'circleCircled1'`, not
`'circleConnect'`. Flagged for maintainer review.

## `url.href` (brief) vs `url.url` (implemented)

The brief's acceptance criterion reads `url.href === 'http://x'`. The reused
`UrlInfo` type (`class-url.ts`, explicitly named for reuse by the brief
itself) has a `url` field, not `href`. Implemented/tested as
`rel.url.url === 'http://x'`. Flagged for maintainer review.

## Corpus check for INSIDE forms beyond "0)"/"(0" (boundary requirement)

`grep -rE -- '-\(0\)-|-\(0-|-0\)-' test-results/dot-cache/class/*/in.puml
oracle/goldens/svg-class/*/in.puml` returns only `cenubi-27-xova754`
(the `"0)"` form). No fixture uses `"0"`, `"(0"`, or `"(0)"`. All four forms
are still implemented (one small lookup table, direct 1:1 port of
`CommandLinkClass.java:498-507`'s four-armed method) with hand-authored
probes, per the CLAUDE.md instruction not to drop enumerated Java behavior —
this is a faithful whole-method port, not a speculative extension.

## Write-set extension beyond the brief's declared four files

To satisfy the REQUIRED, explicitly-tested acceptance criterion
"`constraint on links: enten/eller` → `linkConstraint.text === 'enten/eller'`",
the widened `linkConstraint` type required threading the captured text
through two files outside the declared write-set:

- `class-notes.ts`: `applyConstraintOnLinks(ast, text)` now takes the
  regex-captured text (was `(ast)`, discarding `CONSTRAINT_ON_LINKS_RE`'s own
  group 1) and sets `{ text }` instead of `true`.
- `class-command-containers.ts`: one dispatch-table line now passes
  `match[1]` through (`execute: (state) => ...` → `execute: (state, match) =>
  ...`).
- `class-layout-edge-labels.ts:371`: mechanical `rel.linkConstraint === true`
  → `!== undefined` (pre-authorised by the brief's corrections item 5).

Neither `class-notes.ts` nor `class-command-containers.ts` is a T6/T7
rendering file (the corrections' named STOP examples were
`class-dot-edges.ts`/`class-edge-geo.ts`/`renderer-edge.ts`); both are
parse/AST-population sites, in keeping with T5's "AST-only" charter. Also
touched: `renderer-arrowhead.ts`'s `DECOR_TO_NAME` table (added `redefines`/
`definedBy` — a mechanical exhaustiveness completion of an existing
`Record<Exclude<LinkDecor,'none'>, LinkDecorName>`; both extremity factories
already existed in `core/svek/extremity/link-decor.ts`).

## 500-line-cap splits (pre-authorised)

- `class-arrow-grammar.ts` → `class-arrow-middle-decor.ts` (MiddleDecor type +
  extractMiddleDecor + invertMiddleDecor).
- `class-relationship-ast.ts` → `class-relationship-decor-ast.ts`
  (RelationshipType + LinkDecor).
- `class-relationship-parser.ts` → `class-relationship-label-decompose.ts`
  (decomposeLabel) and → `class-relationship-field-builder.ts`
  (resolveRelationshipEndpoints/resolveRelationshipLabel/
  buildRelOptionalFields).

## Complexity-hook artifact: `parseRelationshipLine` pre-existing oversize

`parseRelationshipLine` was ALREADY ~69 real code lines / high CCN in the
committed baseline (`d50b8dec`) — verified by manually counting non-comment
lines in both the committed and working-tree versions (identical, 69 lines).
`lizard` (with this project's `-T nloc=30 -C 10` thresholds) silently failed
to report it as a violation at HEAD, almost certainly the same
brace/regex-character tokenizer confusion this file's own `arrowLength` doc
comment already documents (`{`/`}`/`<`/`>` glyphs inside string literals
throughout this grammar-heavy file). Any edit that changes the file enough
to resync lizard's parse state causes it to (correctly) start reporting the
function, which the hook then classifies as "new" (no baseline entry exists
to compare against) and blocks. Tested and confirmed the documented
`#lizard forgives`/`// #lizard forgives` escape hatches do NOT suppress it
(matches this project's own `check-complexity.py` docstring, which records
the same finding on a different large function). Resolved by genuinely
extracting `parseRelationshipLine`'s body into
`class-relationship-field-builder.ts`'s three pure helpers — real complexity
reduction (39 NLOC → 20-ish for the caller, each extracted helper
individually under the 30/10 caps), not a suppression. Worth fixing at the
tooling level (or grandfathering by function signature+approximate line
count rather than exact line-shift-sensitive matching) as a follow-on.
