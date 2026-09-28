# T5d: relationship-and-directive-singles (5 rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
addmethod-space-lenient (zolaza): once fixed the jar routes `A:foo` (no spaces) to STATE, so zolaza LEAVES the CLASS set; re-measure its routing/refusal pins at the close. tim-guessfunctions-pair-order (xuloxo): Java iterates `HashMap<Integer,…>` in ascending key order (`TokenStack.java:162,173`); mirror the ordering explicitly (sort the pair keys), do not rely on JS Map insertion order.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

### remove-group-not-cascaded
Mechanism: `computeRemovedIds` folds directives over classifiers and notes only. Namespaces are never folded, and there is no ancestor cascade (the hide path has `cascadeHidden`, remove has none). Instrumented: `removed = ['P.B']`. So `remove *` never removes group P, and `restore P.A` leaves P.A visible. Upstream removes P, and A goes with it through the parent check.
Upstream: `abel/Entity.java:443-455` — "public boolean isRemoved() { … final Entity parentContainer = getParentContainer(); … if (parentContainer != null && parentContainer.isRemoved()) return true; return this.diagram.isRemoved(this);"
Port: `src/diagrams/class/class-directives-removal.ts:365-378` — "foldClassifiersInto(removed, ast, dirs, unlinked, 'remove', sep); foldNotesInto(…); return removed;"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/jititi-15-maxe512`, confidence HIGH (instrumented).)

### class-circle-decor-unmapped
Mechanism: the `0` head glyph is recognised for type resolution but never mapped to a `LinkDecor`. Instrumented: `a 0--0 b` and `a 0-[dashed]--0 b` both parse `sourceDecor/targetDecor: none`. No circle extremity is drawn (`ExtremityFactoryCircle` already exists in `src/core/svek/extremity/ExtremityCircle.ts`), and `bothNone()` wrongly yields `association`.
Upstream: `decoration/LinkDecor.java:90` — "CIRCLE(decors1(\"0\"), decors2(\"0\"), 0, false, 0.5),"; `decoration/LinkType.java:301-307` — "if (hasAny(LinkDecor.CIRCLE_LINE, LinkDecor.DOUBLE_LINE) || bothNone()) return \"association\"; … return null;"
Port: `src/diagrams/class/class-arrow-grammar.ts:224-227` — "'0': 'none'," (kind only) and `src/diagrams/class/class-arrow-decor-map.ts:59-82` HEAD_TO_DECOR has no `'0'` entry
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/zefefo-37-xigo245`, confidence HIGH (instrumented).)

### tim-guessfunctions-pair-order
Mechanism: this is not a dispatcher or factory-order problem. The block never reaches `registry.resolve` because the preprocessor throws first. `countFunctionArg` reads tokens that earlier iterations already rewrote, and `eatUntilCloseParenthesisOrComma` returns on any `CLOSE_PAREN_FUNC` regardless of nesting level, so iteration order matters. Java's `HashMap<Integer,…>` iterates small int keys in ascending order, so the outer (lower `iopen`) call is counted before the inner one is rewritten (verified: `java H.java` prints `[1, 4]` after inserting 4 then 1). The port's insertion-ordered `Map` visits the inner pair first because it closes first. The outer `$f($g(x), y)` then counts 1 arg, and `getFunction($f/1)` misses. Minimal repro: `!$x = $f($g(1), 2)`. Oracle renders it as CLASS, ours gives "Unknown built-in function $f"; `$f(2, $g(1))` works in both. Here it is classy's `$isDerivedFrom($determineType($actual), $expected)` (`assets/stdlib/classy/plumbing/class-instancing.puml:176`).
Upstream: `tim/expression/TokenStack.java:162-185` — "final Map<Integer, Integer> parens = new HashMap<Integer, Integer>(); … parens.put(open.pollFirst(), i); … for (Map.Entry<Integer, Integer> ids : parens.entrySet()) { … final int nbArg = countFunctionArg(subTokenStack(iopen + 1).tokenIterator(), location);"; `:125-127` — "if (level == 0 && (typech == TokenType.COMMA || typech == TokenType.CLOSE_PAREN_MATH) || typech == TokenType.CLOSE_PAREN_FUNC) return;"
Port: `src/core/tim/expression/TokenStack.ts:172` — "const parens = new Map<number, number>();" and `:182` "for (const [iopen, iclose] of parens) {" (doc comment `:149-156` claims pairing order "has no effect on the final token array")
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/xuloxo-85-vibu502`, confidence HIGH (instrumented + oracle).)

### addmethod-space-lenient
Mechanism: upstream's member-add command needs whitespace on both sides of `:`. The line `https://forum…` matches no class command, the class factory refuses, and the state factory claims it. The port's `\s*` accepts it, so the class engine owns the block. Oracle-verified: `A:foo` routes STATE in the jar, `A : foo` routes CLASS, and ours routes both CLASS. After the fix this row leaves the CLASS set, and every class-corpus fixture with `X:y` must be re-measured.
Upstream: `classdiagram/command/CommandAddMethod.java:63-68` — "new RegexLeaf(1, \"NAME\", \"([%pLN_.]+|[%g][^%g]+[%g])\"), RegexLeaf.spaceOneOrMore(), new RegexLeaf(\":\"), RegexLeaf.spaceOneOrMore(), new RegexLeaf(1, \"DATA\", \"(.*)\")" (`regex/RegexLeaf.java:85-86` spaceOneOrMore = `[%s]+`)
Port: `src/diagrams/class/class-command-relationships.ts:81` — "pattern: /^(\"[^\"]+\"|[\\p{L}\\p{N}_.]+)\\s*:(?!:)\\s*(.+)$/u,"
(Diagnosed in `diagnosis/S3-structure.md`, example row `unknown/zolaza-45-sepi570`, confidence HIGH (instrumented against jar).)

## Task (TDD)
1. Write a failing unit test that pins the upstream behaviour at the lowest layer
   that shows it (parser, layout, or render helper). Assert specific values.
2. Port the upstream behaviour at the mechanism's origin (`rules/diagnosis.md`
   scope). Add a JSDoc `@see` to the Java `file:line` on every ported symbol, and an
   upstream citation on every constant.
3. Run `npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree/slug...>`
   on this task's rows. Report each row's structural/numeric counts before and
   after.
4. Gates in the worktree: targeted `npx vitest run <your test files>` (check the
   collected count), `npm run typecheck`, `npx eslint <changed files>`. The
   orchestrator runs the full suite after merge.

## Added at close-b3 (journal row 66)
- `free-note-alias-not-quark-qualified` (moved from T3c, 4 rows): `unknown/pojeje-60-vata579`, `unknown/rexupa-61-nezi165`, `unknown/tamovu-79-fifo533`, `unknown/ticemi-41-laze086`. Upstream `CommandFactoryNote.java:192-197` resolves the alias with `quarkInContext(false, cleanId(idShort))`. T3c measured that qualifying ONLY the note id (class-notes.ts#addFreestandingNote) breaks 8 ratchet pins: the relationship-endpoint matcher (`class-command-relationships.ts` isNoteId callers, `class-assoc-couple.ts`) compares raw strings, misses the note, and auto-creates a phantom classifier that shifts every later uid. Fix both sides together through `class-namespace-resolve.ts#resolveReference`. See `.agent-notes/cdd5-T3c-note-alias-qualification-blocked.md`.

## Rows
- `unknown/jititi-15-maxe512`
- `unknown/xamive-55-lipi586`
- `unknown/xuloxo-85-vibu502`
- `unknown/zefefo-37-xigo245`
- `unknown/zolaza-45-sepi570`

## Write-set
- `src/core/tim/expression/TokenStack.ts`
- `src/diagrams/class/class-arrow-decor-map.ts`
- `src/diagrams/class/class-arrow-grammar.ts`
- `src/diagrams/class/class-command-relationships.ts`
- `src/diagrams/class/class-directives-removal.ts`
- `src/diagrams/class/class-notes.ts`
- `src/diagrams/class/class-assoc-couple.ts`
- `src/diagrams/class/class-namespace-resolve.ts`
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: `abel/Entity.java:443-455`; `net/atmp/CucaDiagram.java:784-797`; `decoration/LinkDecor.java:90`; `decoration/LinkType.java:275-307`; `tim/expression/TokenStack.java:161-185` (+ `:125-127`); `classdiagram/command/CommandAddMethod.java:63-68`
Port: `src/diagrams/class/class-directives-removal.ts:365-378`; `src/diagrams/class/class-arrow-decor-map.ts:59-82` (no `'0'` key); `src/diagrams/class/class-arrow-grammar.ts:224-227,244`; `src/core/tim/expression/TokenStack.ts:172,182`; `src/diagrams/class/class-command-relationships.ts:81`
`plans/class-divergence-drive-5/decisions.md#D5`; the shard sections for every row above.

## Architecture decisions (locked)
`plans/class-divergence-drive-5/decisions.md` D1–D9. dot-engine is off limits
(stop 11). Never sign an acceptance (D7).

## Interface contracts
none

## Acceptance
- Given each row above, when rendered via `renderSync`, then the element named in
  its first diff equals the jar's.
- Given the task's rows, then each is conformant, OR its residual is stated with a
  mechanism (Java and port `file:line`).
- Given the full suite (orchestrator), then all four gates are green and no ratchet
  pin is lost.

## Quality bar
90/90/90 coverage on changed files. Hook complexity limits (30 NLOC functions,
CCN 10, 500-line files).

## Boundaries
- Always: quote the Java before claiming parity.
- Ask first (halt): the write-set is insufficient, or the Java contradicts the
  diagnosis.
- Never: fit a value, edit `~/git/knowvah/dot-engine`, touch the oracle, or push.

## Commit
`fix(class): <what, lowercase, ≤72 chars>` (non-class paths: pick the scope that
fits, e.g. `fix(creole): …`). The body gives the mechanism, the upstream citation,
and the rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
