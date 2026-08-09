# plantuml-ts — Project Notes

## Feature Catalog — read before writing any code

`.claude/catalog.md` lists every existing module (file paths + public API) and
every planned-but-unbuilt feature. **Check it before implementing anything:** if
a module is Done, use it — don't reimplement. Agents routinely forget these
exist: `skinparam.ts` (resolveSkinparam, parseStyleBlock), `latex.ts` (KaTeX),
`auto-layout.ts` (engine selection), all eight layout engines, `svg-sanitize.ts`,
`include-resolver.ts`, and the dot pipeline in `src/core/dot/`.

**Before drafting a `/plan-mission` prompt:** read `planning/mission-guide.md` —
exact Java packages, reuse targets, architecture constraints, and common agent
mistakes per remaining phase.

## READ THE JAVA FIRST. Not the package list — the method.

Before you implement, change, or explain any behavior, **open the Java that
implements it and read it.** Not the table below, not a filename, not a
remembered summary: the method body, and the constructor that built its inputs.
This is the single most-violated rule in this repo, and every violation has
cost hours.

**Never derive a value by fitting.** Changing a constant, re-measuring, and
keeping whatever shrank the error is forbidden even when the error shrinks —
especially then. A fitted number matches today's corpus and encodes nothing, so
the next fixture re-opens it. Every constant ships with the upstream
`file:line` it came from, in a comment. If you cannot cite one, you have not
finished.

**Output measurements cannot reveal mechanisms.** They tell you *that* you are
wrong, never *why*. A mechanism lives in a branch, a constructor, a sentinel
string — none of which appear in a rendered SVG. Three from one 2026-08-09
session, all invisible to measurement and all three lines of Java:

- `JsonDiagram.java:78-88` replaces an empty object **or array** with a
  `JsonArray` holding one empty string, and wraps a primitive root in a
  `JsonArray`. Hours were spent fitting `MIN_WIDTH`/`MIN_HEIGHT` against a
  10×18 box that no minimum produces.
- `TextBlockJson.java:127-134` builds array rows with the one-arg `Line`
  constructor — value in `b1`, `b2` null. A `DIVERGENCES.md` entry had argued
  from "upstream leaves the column blank", which is not what the code does.
- `smetana/core/Macro.java:1294` decodes a `_dim_` sentinel that bypasses text
  measurement entirely. Nothing in any SVG hints that labels carry dimensions.

**"I read the Java" means you can quote it.** If you are about to write "matches
upstream", "as upstream does", or "faithful to the Java", the `file:line` goes
in the same sentence. Relaying someone else's claim — a subagent's, a brief's,
your own from earlier — is not reading it; three such claims were falsified
against the code in a single prior mission.

**Grep `src/main/java/`, never just `net/sourceforge/plantuml/`.** See the
warning below: the Smetana transpile (`gen/`, `smetana/`) and `net/atmp/` are
outside that subtree, and scoping a search to it produces confidently wrong
conclusions.

## @knowvah/dot-engine issue tracking

Verified @knowvah/dot-engine library findings live in `docs/graphviz-issues/` — one
`.md` per issue, self-contained: the finding, its census impact, a minimal
repro (ideally the exact DOT text that reproduces it) plus any
prompt/procedure needed to observe the divergence, and a pointer to the
evidence trail. `docs/graphviz-issues/TRACKER.md` is the status list: a
plain checklist with exactly one item per issue file, nothing else. Check a
box only when the fix has landed in the pinned @knowvah/dot-engine `.tgz` and the
affected fixtures re-measure clean. Any iteration that verifies a NEW
library finding must file it here (issue file + tracker line) before the
iteration closes — a finding that exists only in a mission ledger is not
filed.

## License

MIT, per the MIT license option in upstream PlantUML's LICENSES.md (maintainer decision 2026-07-11). Keep dependencies MIT-compatible.

## Reference Implementation

`~/git/plantuml` (Java) is the canonical spec. **Read it before you write —
see "READ THE JAVA FIRST" above; this table is an index for finding the method,
never a substitute for reading it.** Key packages under
`src/main/java/net/sourceforge/plantuml/`:

| Package | Purpose |
| --- | --- |
| `klimt/` | Drawing primitives — `UGraphic`, shapes, `DotPath`, geometry, fonts |
| `svek/` | Node/edge/cluster layout + SVG assembly (`SvekEdge`, `Cluster`) |
| `cucadiagram/` | Shared entity/group model across most diagram types |
| `descdiagram/` | Descriptive/deployment diagrams (component, usecase, node, …) |
| `classdiagram/` | Class diagram parser/AST |
| `sequencediagram/` | Sequence diagram |
| `activitydiagram3/` | Activity (beta) diagram |
| `statediagram/` | State diagram |
| `command/` | Command grammar — how each keyword line is parsed and dispatched |
| `style/`, `skin/`, `theme/` | skinparam / style / theme resolution |
| `preproc/`, `preproc2/` | Preprocessor (`!include`, `!define`, …) |
| `tim/` | TIM preprocessor — `!define`/`!procedure`/`!function`/`!foreach`, 76 builtins, `CodeIterator` chain, expression evaluator |
| `dot/`, `sdot/` | dot emission; `sdot` = Smetana (Java transpile of graphviz dot) |
| `svg/` | Low-level `SvgGraphics` emitter — the SVG-conformance oracle |

### ⚠ Not everything lives under `net/sourceforge/plantuml/`

**Grep `src/main/java/net/`, never just `src/main/java/net/sourceforge/plantuml/`.**
Scoping a search to the table above will silently miss code and produce
confidently wrong conclusions. This has already cost one multi-hour dead end:
`WithLinkType.isSingle` was declared "dead code upstream" on the strength of a
"full-tree grep" that was actually scoped to `net/sourceforge/plantuml/` — the
live call site is in `net.atmp`, and the real mechanism went undiagnosed
(`.agent-notes/silito-78-definelong.md`).

| Root | Contents |
| --- | --- |
| `net/atmp/` | **`CucaDiagram.java`** — the shared base of the whole cuca family (`ClassDiagram`, `StateDiagram`, `DescriptionDiagram`, object all inherit it via `AbstractEntityDiagram`). Owns `addLink`/`containsSimilarLink`. The single most load-bearing class outside the table above, and the target of mission SI1. Also `PixelImage`, `SpecialText`, `SvgOption`. |
| `gen/lib/`, `smetana/` | The graphviz→Java transpile (Smetana). Read the graphviz **C** instead — see Reference Corpora. |
| `h/`, `zext/`, `jcckit/`, `com/`, `org/` | Vendored third-party + transpile support. |

For the dot layout algorithm itself, prefer the graphviz C source (see Reference
Corpora below) over `sdot`/Smetana's mangled transpile — this port's dot pipeline
is @knowvah/dot-engine. Every ported symbol carries a JSDoc `@see` to its Java origin,
e.g. `/** @see .../svek/SvekEdge.java#solveLine */`.

## The long tail is the deliverable (YAGNI does not apply)

This port's value lives almost entirely in PlantUML's accumulated special cases —
arrow styles, label positions, layout quirks, rendering decisions that took 16
years to discover and encode. The simple, general implementation of any diagram
type is worth ~nothing: users already have it from upstream via Java. The
trailing 20% of behavior IS the product.

So the 80% solution is not a milestone — it's the starting condition before real
work begins. This inverts normal practice, and it overrides YAGNI / KISS /
"simplify / clean up" for **diagram behavior, rendering, and parser edge cases**.
(Those principles still apply to the infrastructure around the port — build
tooling, test harness, CI.)

- Never propose skipping an edge case, deferring an obscure feature, or
  simplifying away a special-case branch. If a behavior appears in upstream's
  fixtures or docs, it is in scope.
- Upstream's `.puml` corpus is the spec and the work queue, not a post-hoc
  validation suite — every fixture encodes a real case someone hit.
- **The corpus is a starting point, not a ceiling — author fixtures to cover
  gaps.** The ~5600 upstream fixtures are what someone happened to hit and
  file; real PlantUML features have zero coverage there (e.g. the bundled skins
  `reddress`/`sonyxperiadev` are exercised by NO upstream fixture). When a
  feature has no fixture, do NOT skip it or verify only synthetically — WRITE
  new `.puml` fixtures that exercise it and generate their jar oracles (`java
  -DPLANTUML_DUMP_DOT=<dir> -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir>
  <puml>`, the pinned oracle jar; `scripts/oracle-corpus.ts#runOracle`), then
  implement and verify against them. Skins change colors/fonts (SVG), not
  structure (DOT), so byte-exact SVG golden comparison is the right gate for
  them, not DOT-parity. "One can do better" than upstream's coverage.
- The bar is "pleasing aesthetic alignment with upstream," not "produces a
  correct diagram." Layout, spacing, label placement, edge routing, and styling
  all count; a structurally-correct diagram that looks worse than upstream is a
  regression.
- Don't optimize for time or space. The Java's complexity reflects the problem,
  not accident — match it unless a behavior is verified preserved.

### "Hard" and "out of scope" are triggers to VERIFY, not to skip

We do the hard things because they are what give the audience a faithful
reproduction of the Java. They get that functionality, or the port has failed
them. So when you catch yourself about to recommend descoping, deferring, or
naming a divergence because something "looks hard," "is out of scope," or
"needs a separate feature" — stop. That reflex is wrong here by default. The
first move is to size the real work, and the strong default is to do it.

- **Verify a scope claim against the code before repeating it.** A subagent's
  (or your own) "the port has no support for X" is a hypothesis to check, not a
  finding to relay. Grep for the infrastructure, read the analogous path that
  already works, and size the actual change yourself. Real example: "no
  shadowing anywhere" actually meant "the state render path never wired in
  shadow support that already exists in the svek Cluster path" — a bounded fix,
  not a missing subsystem. Relaying the unchecked claim nearly dropped a
  reproducible feature.
- **A named divergence is not an escape hatch.** `DIVERGENCES.md` is only for a
  DELIBERATE decision to render something differently from (or better than)
  upstream — see "Preserve behavior; diverge only deliberately" below. A
  feature upstream ships and you could reproduce, but found hard, is a gap to
  close, never a divergence to declare. If your reason for the divergence is
  effort or difficulty rather than a considered product choice, it is not a
  divergence.
- **"Bounded but in another file / render path / subsystem" is still in
  scope.** Crossing a module boundary to reach the fix is the work, not a
  reason to stop. When the change genuinely exceeds a task's declared write-set,
  escalate for the scope decision — but lead with the plan to do it and its
  measured size (files, blast radius, verification cost), not with the option
  to skip.
- **Only "genuinely large AND separable" earns a deferral** — and you prove
  both with measurement, not adjectives. Then it becomes its own tracked
  mission that WILL be done, not a permanent hole.

## Porting discipline: working with an accreted codebase

Standard porting practice — translate, clean up, modernize — destroys the value
being ported at this scale. These rules override general code-quality instincts.

### Upstream architecture is authoritative — and rewrites are allowed

Upstream's **architecture** is authoritative, not just its output and names:
which engine owns which syntax, where parser/module boundaries sit, how diagram
types dispatch. When plantuml-ts split or merged engines differently from
upstream, that structural divergence is itself the bug — re-mirror upstream's
structure rather than patch symptoms with more special-case branches.

Example: upstream routes every descriptive/deployment keyword (`actor component
usecase node package interface rectangle entity …`) through one engine
(`DescriptionDiagramFactory` → `CommandCreateElementFull.ALL_TYPES`). plantuml-ts
scattered these across separate `component` + `usecase` plugins with incomplete
coverage, so `class`/`sequence` `accepts()` steal the leftovers and deployment
diagrams collapse into the class renderer. The fix is consolidation to match
upstream's engine boundary — not more `accepts()` patterns on the diverged
structure.

So it's explicitly OK to look at a plantuml-ts file, say "hell no," and rewrite
it from scratch to mirror upstream. "Do not refactor while porting" (below)
guards *faithfully-ported* behavior from loss; it does not protect local code
that was never faithful. Verify upstream's real boundary in `~/git/plantuml`
before proposing the new structure.

### Do not refactor while porting

Port the Java faithfully, including code that looks redundant, awkward, or dated.
**Don't propose cleanups, simplifications, or modernizations during the port.** A
branch that looks redundant probably handles a case that surfaces in the corpus
months from now; refactored away it's gone, undetectable, and reappears later as
an unattributable regression. The asymmetry is severe: preserving awkward code
costs little now; losing a special case costs a lot later. Refactor only once
tests exist that would catch the loss — in practice, well past the initial port,
if ever.

Example: `DotPath#simulateCompound` (spline↔cluster clipping, `spline-clip.ts`)
finds the boundary crossing with 8 fixed midpoint subdivisions
(`XCubicCurve2D#subdivide`), discarding the straddling sliver. That looks
replaceable by a cleaner bisection-to-convergence — but the oddity is
load-bearing: the jar computes *that* 1/256-granular point, so a more precise
crossing fails the ±0.01pt conformance bar. When an upstream algorithm looks
replaceable, first check whether the jar's exact numeric output depends on its
granularity.

### Preserve upstream names, including the ugly ones

Match upstream class/method/variable names and file organization. Names like
`CommandActivityLegacy1` or `EntityDescriptor` are load-bearing — they're how the
maintainer thinks and how 16 years of commits, issues, and forum posts reference
the code. Renaming severs that: grepping upstream's source and tracker for the
same identifier is the difference between a 10-minute and a multi-day
investigation. **Don't rename for clarity, idiom, or style.**

### Build deep before wide

Complete one diagram type end-to-end (parser → preprocessor → layout → renderer →
output) before starting the next; don't build by horizontal layer. Special cases
cluster at *layer interactions*, not within layers — building vertically surfaces
each in context where it's diagnosable, instead of all at once during late
composition. The first type also hardens the harness and agent rules; later types
go faster for it.

### Test for layer interactions, not just features

Most complexity is "what happens when feature A meets feature B in context C with
skinparam D," not "does A work." Per-feature tests pass while the diagram is
broken because the bug lives in the interaction. **Prefer upstream fixtures over
synthesized inputs** — upstream's are combinatorial (they came from real
combinatorial bugs); fresh single-feature tests give false confidence.

### Preserve behavior; diverge only deliberately

The goal isn't faithful reproduction — it's **lower-friction PlantUML for the
JS/TS ecosystem.** Upstream is the behavior reference, not the quality ceiling.
Split upstream behavior into two kinds:

- **Information-carrying output — preserve.** Diagram structure, label placement
  that disambiguates, layout that reflects source order, colors that distinguish
  element types — anything carrying what the user put there. Users depend on it,
  sometimes for years; diverging silently breaks their diagrams. This includes
  behavior that *looks* like a bug but produces output (a weird arrow when two
  stereotypes combine may be load-bearing). Default to "intentional" when unsure.
- **Incidental rendering — may improve, deliberately.** Clunky default styling,
  awkward spacing, dated visuals that accumulated rather than were designed are
  the friction this port exists to reduce. Diverging here is the project doing
  its job — but it's a conscious, documented decision (`DIVERGENCES.md`, a code
  comment, or the commit message), never an opportunistic mid-port cleanup.

Never fix apparent upstream bugs case-by-case inline: each fix looks defensible,
but the aggregate is a port that silently differs for unpredictable inputs —
worse than either a faithful port or a deliberate fork. A bug worth fixing
becomes a named divergence flagged for the human maintainer, not a quiet
correction. Test: *would a long-time PlantUML user be surprised?* Surprise at
reduced friction is the point; surprise at changed meaning is a regression.

### One layout engine: dot-engine, never Smetana (maintainer ruling, 2026-08-09)

**Where upstream calls Smetana, we call `@knowvah/dot-engine` and accept the
geometry delta.** Settled, applies everywhere, not a divergence to argue per
case.

The reason is **one implementation of layout**, not a judgement about which is
better. Upstream carries two — a real graphviz binary for most diagram types,
Smetana (its in-JVM Java transpile of graphviz) for a few. Maintaining
agreement with both would mean two sets of layout behaviour to reason about,
test and fix. We keep one. dot-engine is a port of the graphviz C that we
maintain and publish, so it is also the one we can fix.

Smetana additionally makes a poor porting target on mechanics: it cannot
measure text the way graphviz does, so `SmetanaForJson` smuggles cell
dimensions through a `_dim_` sentinel in the record label, decoded by
`smetana/core/Macro.java#hackInitDimensionFromLabel`. Behaviour that exists to
work around a constraint we do not have is not behaviour worth reproducing.

Concretely:

- **Never chase a Smetana-specific number.** If the jar's geometry disagrees
  with dot-engine and the path runs through Smetana, dot-engine's answer
  stands. Record the delta and move on.
- **This overrides "upstream architecture is authoritative" for layout numbers
  only.** Still mirror upstream's *structure* — which graph it builds, which
  attributes it sets, where the engine boundary sits. Its transpile's
  *arithmetic* is not a target.
- **It does not license fitting.** "Accept the delta" means name and measure
  it, never invent a constant to paper over it. "READ THE JAVA FIRST" still
  governs the structure you are porting.

**The bar on these types: readability first, SVG fidelity to upstream second.**
That ordering is inverted from every other diagram type, and it applies only to
the closed set below. Hold them to structure, node sizing, and everything this
port controls; carry the layout delta as a named entry.

**Which paths are Smetana's.** Grep-verified — every consumer outside the
transpile (`grep -rln "SmetanaForJson\|import gen\.lib\|smetana\.core"
src/main/java/net/`):

| upstream | this port | status |
| --- | --- | --- |
| `jsondiagram/SmetanaForJson.java`, via `JsonDiagram` | `@startjson` | A5 |
| same — `YamlDiagramFactory:94` builds a `JsonDiagram` | `@startyaml` | A5 |
| same — `HclDiagramFactory:84` builds a `JsonDiagram` | `@starthcl` | A5 |
| `gitlog/SmetanaForGit.java`, via `GitDiagram` | `@startgit` (`DiagramType.GIT`) | **D6, unbuilt — the rule applies from day one** |
| `sdot/CucaDiagramFileMakerSmetana.java` | any svek diagram under `!pragma layout smetana` | — |

None of these makes an external dot call, which is why the jar emits no
`svek-N.dot` for them and why they have no DOT-parity gate. Everything else
shells out to a real graphviz binary, where the jar's geometry IS a legitimate
target.

Git graph is the easy one to miss: a wholly separate Smetana consumer with its
own `SmetanaForGit`, not a json relative, and unbuilt here — so whoever takes
D6 should read this before deciding what "conformant" means for it.

## Reference Corpora & layout source

`~/git/pdiff/` — primary fixture corpus, 5600+ `.puml` (one per upstream issue),
each a JSON metadata header then the diagram. The work queue: if a behavior
appears here, it's in scope.
- `~/git/pdiff/input/` — ~42 named, curated fixtures
- `~/git/pdiff/dbhum/` — ~5599 hashed fixtures, one per issue

`tests/corpus/` — 4400+ fixtures classified by diagram type from pdiff + the
plantuml nonreg suite. Gitignored (regenerate: `python3 scripts/populate-corpus.py`);
local reference, don't commit.

Layout engine — use the graphviz C source directly (authoritative):
```
~/git/graphviz/lib/dotgen/
  rank.c        ← rank assignment (network simplex)
  mincross.c    ← crossing minimization (WMEDIAN + transpose)
  position.c    ← x/y coordinate assignment
  dotsplines.c  ← edge routing (spline / polyline)
  acyclic.c     ← cycle removal
```
Smetana (`~/git/plantuml/.../gen/lib/dotgen/`) is a mechanical Java transpile of
graphviz 2.38 — same algorithm, no comments, mangled names. Prefer the C.

## Translation Rules (Java → TypeScript)

| Java | TypeScript |
| --- | --- |
| `int`, `long` | `number` (mind precision > 2^53) |
| `double`, `float` | `number` |
| `String` | `string` |
| `byte[]` / `char[]` | `Uint8Array` (bytes) / `string` (text) |
| `class Foo` (plain data) | `interface Foo` |
| `class Foo` (behavior/identity) | `class Foo` |
| `enum` | `enum`, `const enum`, or string-literal union |
| generics `Foo<T>` | generics `Foo<T>` |
| `null` | `null` or `undefined` (prefer `undefined` for optional fields) |
| `static final` constant | module-level `const` (`UPPER_SNAKE_CASE`) |
| `Optional<T>` | `T \| undefined` |
| checked exception | thrown `Error` subclass, or a `Result`-style return |

Java and TS share a GC model, so most translation is direct. Prefer immutable
data where the Java builds then only reads a structure (`DotPath` — `addCurve`
returns a new path); where it mutates in place (layout passes), use mutable
objects and document the mutation contract.

## Quality Gates

```sh
npm test              # vitest + coverage (90/90/90 thresholds)
npm run typecheck     # tsc --noEmit (both tsconfig.json + tsconfig.node.json)
npm run lint          # eslint src tests demo
npm run build         # vite library build
```

All four must pass before any commit lands on main.

## Diagrams — PlantUML, not Mermaid

**Every diagram in this repo is PlantUML in a ` ```plantuml ` fence.** This
overrides any skill, template or tool default that says Mermaid — including
`/plan-mission`'s `diagrams/` step, which still says "use mermaid fenced
blocks". When a generated artifact hands you Mermaid, convert it before the
file lands.

We are the PlantUML renderer. Authoring the project's own diagrams in
Mermaid says the tool is not good enough for its own documentation. It is
also free test material: every brief diagram is a real fixture-shaped input.

No general Markdown viewer renders ` ```plantuml ` today. That is expected —
the fence is the commitment, and making it render is work we intend to do.
Until then the source is the artifact, so it must be *correct PlantUML*,
not merely plausible: if you cannot say it parses, render it and check.

**Two syntax traps when a diagram's SUBJECT is PlantUML markup** — both bite
in this repo specifically, because our diagrams describe our own parser:

- `<$name>` is sprite syntax. Writing `<$sprite>` in a label makes the
  renderer look for a sprite named `sprite`.
- `<latex>` is a creole tag and will be typeset, not printed.

Inside a diagram, say "sprite atom" or "latex branch" in prose and keep the
literal markup in the surrounding Markdown, where it is inert.

## Architecture Notes

- Pure SVG renderer — no DOM, no async, no canvas. This library must run in a
  browser: in `src/`, never use Node built-ins (`fs`, `path`, `os`,
  `child_process`), `process.env` (pass a config/options object instead),
  `require()` (ES `import` only), or blocking I/O. If the Java reads a file
  (font metrics, `!include`), expose it as a parameter/callback
  (`include-resolver.ts`, the measurer seam).
- No `Date.now()` / `Math.random()` in rendering paths — every non-determinism
  (uid counters, gradient/shadow ids) is seeded so output is reproducible.
- Layout pipeline: `parse → layout (dot engine) → render (SVG string)`.
- `CONTAINER_KINDS` appears in both `layout.ts` and `renderer.ts` — keep them in
  sync. Container nodes with **no children** are treated as leaf nodes for both
  layout and rendering.
- `svgRoot` in `src/core/svg.ts` embeds all arrowhead marker `<defs>`
  automatically — edges need only `markerEnd: url(#<ref>)`.
