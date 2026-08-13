# A4 Phase L iteration 13 — grouped transition-grammar singles (2026-07-11)

## Observation: lizard misattributes a whole file's tail to a helper
  function containing a plain regex literal, when that helper directly
  precedes a large array-of-objects-with-methods
- **Context**: Splitting state-commands.ts's declaration rules into
  `state-commands-declarations.ts` under the 500-line file cap. The new
  file's `parseTags` helper (2 lines of real logic, `raw.split(/\s+/)`)
  was reported by the complexity hook as `NLOC=38, length=152`, spanning
  from its own definition all the way to EOF — swallowing every
  subsequent `execute` function's line count into its own span (though
  each `execute` was STILL correctly individuated with the right NLOC —
  only the aggregate `length`/reported span of the PRECEDING helper was
  wrong).
- **Finding**: Root cause isolated by bisection (NOT the double-quote
  desync documented in `complexity-hook-workarounds.md` — that was ruled
  out first: the file had zero literal `"` glyphs and still failed).
  Replacing the plain `/\s+/` regex literal with `new RegExp('\\s+')`
  fixed it completely (`parseTags` correctly reported as NLOC=5,
  length=10, no misattribution). The existing "Lizard-safe (no regex
  literals)" convention in this codebase was previously understood to be
  about `<`/`>`/`{`/`}` chars inside the literal; this shows a REGEX
  LITERAL OF ANY SHAPE immediately preceding a big array-of-methods can
  trigger the same class of bug — `state-commands-notes.ts`'s
  `linkNotePosition` helper (no regex literal) sits in the exact same
  position relative to `NOTE_COMMANDS` and is parsed correctly.
- **Impact**: When adding a helper function ahead of a `Command[]`-style
  array literal (or any array of object literals with method shorthand)
  in this codebase, build any regex the helper needs via `new
  RegExp(...)` from a string, never a `/…/ ` literal — even a trivial one
  like `/\s+/`. Verify with `~/.claude/hooks/.venv/bin/lizard <file> -C
  10 -T nloc=30` before relying on the Write/Edit hook (which only fires
  on Write/Edit/MultiEdit tool calls, not on Bash-based file edits — a
  file edited only via Bash can silently accumulate this violation
  undetected until the next real Write/Edit).
- **Confidence**: High — isolated via direct bisection with `/tmp` test
  copies, confirmed by both introducing and removing the regex literal
  independently of the double-quote question.

## Observation: single-equals `=X=` sync bars are a parse ERROR upstream,
  not a lenient acceptance — was NEVER jar-verified when first ported
- **Context**: Gap 2 (bapoja-80-lori225, `===B1===`) required loosening
  the sync-bar ENT alternative from exactly-one `=` per side. Before
  changing it, checked whether upstream's actual minimum was 1 (any
  count) or 2 (upstream's `getStatePattern` literally reads `(?:==+)`,
  which is one mandatory `=` plus `=+`, i.e. minimum 2).
- **Finding**: `-DPLANTUML_DUMP_DOT` against the real jar confirms:
  `=X=` (single `=` each side) is `Error line 2 in file` — a hard parse
  failure, the whole transition line is rejected. `==X==` and `===X===`
  both parse successfully AND unify to the exact same entity (only one
  sync-bar node appears in the DOT dump when both forms reference the
  same stripped name in different lines) — `removeEquals()` strips ALL
  leading/trailing `=` before the `quarkInContext` lookup, so the
  equals-count is not part of the entity's identity. This means this
  port's pre-existing T2-era single-equals `=fork1=` support
  (`state-pseudostates.test.ts`, `state-global-resolution.test.ts`) was
  encoding a NEVER-jar-verified guess that turned out to be wrong —
  updated those tests to `==fork1==`/`==X==` and to assert on the
  STRIPPED canonical id (`'fork1'`, not `'=fork1='`), since `ensureState`
  now canonicalizes.
- **Impact**: Any future grep for `'=fork` or similar single-equals sync
  bar literals elsewhere in the corpus/tests is now suspect — the
  correct minimum is 2. If a fixture is ever found using literal single
  `=name=` and rendering successfully upstream, that would contradict
  this finding and needs re-verification (not expected — no such fixture
  exists in ~/git/pdiff for state diagrams as of this iteration).
- **Confidence**: High — jar-verified directly (not inferred from the
  Java source's regex string alone), with three separate probes (1-equal
  fails, 2-equal succeeds, mixed 2-vs-3-equal unifies).

## Observation: CommandRemoveRestore/`$tag` is SHARED base-class machinery,
  not something to reimplement per-diagram-type
- **Context**: Gap 3 (xoravu-40-gebe122, `state "A" as a $tagA { }` +
  `remove $tagA`).
- **Finding**: `StateDiagramFactory.java:87` registers
  `net.sourceforge.plantuml.classdiagram.command.CommandRemoveRestore`
  directly — the exact same class the class engine uses, not a
  state-specific command. `CommandCreateState`/`CommandCreatePackageState`
  both carry TAGS1/TAGS2 `Stereotag` slots (verified via grep for the
  `Stereotag` import across every `statediagram/command/*.java` file);
  `CommandCreatePackage2` (`frame`) does NOT import `Stereotag` at all —
  frame declarations genuinely have no `$tag` grammar upstream, not an
  oversight to "complete."
- **Impact**: `state-directives.ts` mirrors `class-directives.ts`'s
  matching semantics ($tag/`<<stereotype>>`/`@unlinked`/wildcard) almost
  verbatim, adapted only for the state engine's NESTED entity tree
  (`State.children`/`.concurrentRegions`) vs. class diagrams' flat
  `classifiers` list, and for transitions living either at the top scope
  or inside a composite's own `.transitions` (never hoisted). Any future
  "does diagram-type X support directive Y" question for this port
  should start by checking which Java command class the diagram-type's
  `*Factory` actually registers — it is very often a SHARED class from a
  different package, not a type-specific one.
- **Confidence**: High — verified via direct grep of every
  `statediagram/command/*.java` file, not assumed from behavioral
  similarity alone.
