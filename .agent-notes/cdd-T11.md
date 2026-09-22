# T11 — namespace url/color/usymbol AST fields

## Storage choice (step 4): usymbol copy, not read-through

`state.descriptiveContainers` (ParseState, transient) stays the SOURCE OF
TRUTH the EMPTY-collapse path (`closeContainer`) reads to stamp the
synthesized Classifier's `usymbol` — unchanged. `Namespace.usymbol` is a
**copy** taken at the SAME call site the value first becomes known
(`applyNamespaceUsymbol`, called from `setNamespaceStereotype`'s gated
branch), not a lazy read-through.

Chose copy-at-source over "read `state.descriptiveContainers` directly in
T12" because:
- `ParseState` is parser-internal and transient (one per `parseClass`
  call); a render module (T12) reaching into it would cross the
  parse/render seam the AST exists to enforce (Dependency Inversion —
  render depends on the AST abstraction, not parser internals).
- The copy is O(1) at a call site that already has both the keyword and
  the Namespace object in hand (`openNamespaceBlock` always runs
  immediately before `setNamespaceStereotype` at every call site in this
  codebase, so `ns` is always found).
- `Namespace.color` already had to make the analogous choice (see below)
  for its OWN reason; keeping usymbol's storage on the same object (copy,
  not indirection) is the more consistent shape for T12 to consume.

The descriptive-container KEYWORD path (`rectangle X {`/`node X {` etc.,
`class-command-containers.ts`'s `state.descriptiveContainers.set(...)`
call in rule 5b') was deliberately NOT touched — the task's step 4 scopes
this to `setNamespaceStereotype`'s gated branch only (the `<<Node>>`-on-
`package`/`namespace` mechanism, A2s F-G mechanism A8). Wiring the
keyword-form container's own usymbol onto `Namespace.usymbol` too is a
natural follow-on but out of this task's literal scope.

## Namespace.color: resolved at parse time, NOT raw like Classifier.color

`Classifier.color` stores the RAW compound colour spec
(`class-declaration-extractors.ts#extractDecorations`) and
`resolveBareOrBackColor` runs at RENDER time
(`renderer-classifier-colors.ts:127`, `renderer-note.ts:75`) — confirmed
by reading both call sites before deciding. `Namespace.color` instead
resolves via `resolveBareOrBackColor` at PARSE time
(`setNamespaceColor`, `class-namespace-decorations.ts`), storing only the
bare/`back:` half.

Chosen because the namespace fill consumer (`class-namespace-shape.ts`,
T12) only ever needs a single background colour, never the
`line:`/`text:`/`line.bold` remainder `resolveBareOrBackColor`'s own doc
comment names as unconsumed for the classifier path (M1) — pre-resolving
here keeps T12 to one field read, no re-parsing. Documented as a
deliberate divergence from `Classifier.color`'s storage convention in
`Namespace.color`'s own doc comment (`ast.ts`), not a silent
inconsistency.

## `<style> package {}` cascade (step 6): no code change needed

Searched `src/core/style-cascade-class.ts` for a package/namespace
selector branch — none exists (only `CLASS_SNAMES`/`HEADER_SNAMES`/
`ARROW_SNAMES`/`SPOT_SNAMES`/`NOTE_SNAMES`, none ending in
`package`/`group`). Read the Java to find upstream's real selector:
`svek/Cluster.java:293` (`getDefaultStyleDefinition`) —
`{root, element, classDiagram, package_, group}` for `GroupType.PACKAGE`.

`resolveStyleCascade` (`style-map-element.ts:399`) is already fully
selector-agnostic (accepts any `snames` array, no `package`-specific code
path required) — its subset-match algorithm just needs the caller to
supply the right snames tuple. Verified empirically:
`resolveStyleCascade(parseStyleBlock(xitobuStyleText), ['root','element',
'classdiagram','package','group'], 'backgroundcolor')` returns
`'palegreen'` (and `'2'`/`'red'` for linethickness/linecolor) with ZERO
code changes to `style-cascade-class.ts`.

So: **no write-set extension was needed for step 6** — `style-cascade-
class.ts` is untouched. The test
(`tests/unit/class/class-command-containers.test.ts`, "xitobu-41-lame230's
<style> package {} cascade") calls the existing generic
`resolveStyleCascade`/`parseStyleBlock` pair directly and asserts on the
three resolved values, per the acceptance criterion's "assert on the
cascade's resolved value, not on rendered SVG." Wiring this into
`Theme`/`class-namespace-shape.ts` (new Theme fields +
`renderNamespaceFolder`/`renderNamespaceRect` consumption) is explicitly
T12's job — doing so here would cross from "minimal selector match" into
full render-consumer wiring, which the brief's stop condition forbids.

## 500-line split

`class-container.ts` hit 504 lines after adding `setNamespaceUrl`/
`setNamespaceColor`. Split those two functions into a new sibling
`src/diagrams/class/class-namespace-decorations.ts` (43 lines),
re-exported from `class-container.ts` so `import { setNamespaceUrl } from
'./class-container.js'` call sites are unaffected — mirrors `ast.ts`'s
own established split-and-re-export convention (member/relationship/note
types moved to sibling files, re-exported for the same reason).

## Regex backtrack defect found and fixed (diagnosis)

Instrumented (not guessed): the `package` command's rewritten regex
initially failed to capture `#DDD` in `package foo #DDD {` even though
the capture group was syntactically correct. Root cause: the trailing
catch-all `(?:[#<][^{]*)?` sat directly against the literal `\{` with no
`\s*` gap. When `NOTE_COLOR` consumed `#DDD` (not the trailing space
before `{`), the literal `\{` failed to match the leftover space,
forcing the engine to backtrack `NOTE_COLOR` to zero-width and let the
catch-all (whose `[^{]*` tolerates the space) consume `#DDD ` instead —
so the capture group came back `undefined` despite matching text existing
in the input. Fixed by inserting `\s*` between `NOTE_COLOR` and the
catch-all. Verified via an isolated regex probe (both before-fix
`undefined` and after-fix `'#DDD'` captured) before touching the real
file, then via the actual failing test.

## Test-fixture ordering correction

My first draft of the "url+color+usymbol together" test used
`package foo [[http://x]] #DDD <<Node>> {` (stereotype LAST). Read
`command/CommandPackage.java:70-88`'s `getRegexConcat()` before
"fixing" the implementation — upstream's real token order is
`VISIBILITY TYPE NAME AS TAGS1 STEREOTYPE TAGS2 URL COLOR {`, i.e.
stereotype precedes url/color, matching the TS regex's existing group
order. The test fixture was wrong, not the port; corrected to
`package foo <<Node>> [[http://x]] #DDD {`.

## Coverage: two branches left uncovered, both provably unreachable

`setNamespaceUrl`/`setNamespaceColor`'s `if (ns !== undefined)` guards
(the FALSE arm) are untested. Traced every call site in the codebase:
`openNamespaceBlock` always creates/finds the Namespace immediately
before these setters run (both the `package` command and both
`NAMESPACE_COMMANDS` variants), so `ns` is never `undefined` at the point
they execute today. This is the SAME situation as the pre-existing
`setNamespaceStereotype` ungated branch's own `if (ns !== undefined)`
guard (also untested, pre-dating this task) — kept for defensive symmetry
with that established convention, not chased to 100% since it would
require constructing a synthetic `ParseState` by hand (no precedent
anywhere in `tests/unit/class/` for doing so — every existing test drives
these helpers through the real `parseClass()` pipeline).

The one GENUINELY reachable gap (`setNamespaceUrl`'s "bracket present but
fails every `parseUrlBracket` grammar alternative" branch) IS covered —
added a test with `[[a[b]]` (the bare-link charset excludes `[`, so it
matches the outer command regex but fails all 5 `parseUrlBracket`
alternatives).
