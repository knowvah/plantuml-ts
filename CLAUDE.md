# plantuml-ts — Claude Code Instructions

A faithful TypeScript port of PlantUML. The Java at `~/git/plantuml` is the
**canonical specification**. Ships as a browser-safe library.

## READ THE JAVA FIRST — the method, not the package list

Open the Java that implements the behavior; read the method body and the
constructor that built its inputs. Not a filename, not a table, not a
remembered summary. Most-violated rule here.

It is rarely forgotten — it is out-competed by a measurement harness, because
a fast numeric loop feels like evidence. **Stop and open the Java** before you
(1) state *why* something differs, (2) act on a number you just measured,
(3) repeat a mechanism from a ledger/brief/subagent/your own earlier message,
(4) call something unported, unreachable, or out of scope.

- A diff says WHICH fixture and attribute, never why. Mechanisms live in
  branches, constructors and sentinels that appear in no SVG.
- **Never fit a value** — keeping whatever shrank the error is forbidden
  *especially* when it shrinks. Every constant carries its upstream
  `file:line`; no citation means unfinished.
- "I read the Java" means you can quote it: "matches upstream" puts
  `file:line` in the same sentence.
- Grep `src/main/java/net/`, never just `net/sourceforge/plantuml/` — that
  scope silently misses `net/atmp/`, `gen/`, `smetana/`.
- Render oracles with `scripts/oracle-render.sh <out-dir> <puml>`, never a
  hand-typed `java -jar`: it sets `-DPLANTUML_DETERMINISTIC_TEXT=true`, and
  without it every text-derived number measures the flag, not the port.

## Porting discipline

- **Upstream architecture is authoritative** — engine boundaries, dispatch,
  parser seams. A structural divergence IS the bug: re-mirror rather than
  patch with special cases. Rewriting a never-faithful local file is allowed.
- **Do not refactor while porting.** Redundant-looking branches handle cases
  the corpus surfaces months later; losing one costs far more than keeping it.
- **Preserve upstream names**, ugly included — 16 years of commits reference
  them. **Build deep before wide**: one diagram type end-to-end at a time.
- **Test layer interactions, not features.** Prefer upstream fixtures to
  synthesized ones; theirs are combinatorial because real bugs were.
- **Preserve information-carrying output** — structure, disambiguating labels,
  source order, meaningful colors — including behavior that looks like a bug.
  **Incidental rendering may improve, deliberately**, documented in
  `DIVERGENCES.md`/a comment/the commit message. Never fix an apparent
  upstream bug inline. Test: would a long-time user be surprised?

## The long tail is the deliverable (YAGNI does not apply)

The trailing 20% of behavior IS the product; the 80% solution is the starting
condition. Overrides YAGNI/KISS for diagram behavior, rendering and parser
edge cases — not for build tooling, harness, CI.

- Never skip an edge case or simplify away a special case. In upstream's
  fixtures or docs ⇒ in scope.
- The corpus is the work queue **and not a ceiling**: when a feature has no
  fixture, author `.puml` fixtures and generate oracles rather than verifying
  synthetically.
- The bar is pleasing aesthetic alignment, not "produces a correct diagram."
- **"Hard" and "out of scope" are triggers to VERIFY, not skip.** Check a
  scope claim against the code before repeating it — yours or a subagent's.
  A divergence is a considered product choice, never an effort excuse.
  Crossing a module boundary is the work. Only "genuinely large AND separable"
  earns a deferral, proven by measurement, as a tracked mission.

## One layout engine: dot-engine, never Smetana (ruling 2026-08-09)

Where upstream calls Smetana we call `@knowvah/dot-engine` and accept the
geometry delta. Settled; not re-argued per case.

- **Never chase a Smetana-specific number** — record the delta and move on.
- Still mirror upstream *structure* (graph, attributes, engine boundary); only
  its arithmetic is not a target. Does not license fitting.
- On these paths only: readability first, SVG fidelity second.
- Smetana paths: `@startjson`/`@startyaml`/`@starthcl` (all via `JsonDiagram`),
  `@startgit` (`SmetanaForGit`, unbuilt), and `!pragma layout smetana`. None
  emits `svek-N.dot`, so none has a DOT-parity gate; everything else shells
  out to real graphviz, where the jar's geometry IS a target.

## Where things live

- `net/atmp/CucaDiagram.java` — shared base of the cuca family, OUTSIDE
  `net/sourceforge/plantuml/`. `gen/`, `smetana/` are the graphviz transpile:
  read the C instead, at `~/git/graphviz/lib/dotgen/` (`rank.c`, `mincross.c`,
  `position.c`, `dotsplines.c`, `acyclic.c`).
- `~/git/pdiff/` — 5600+ `.puml`, one per upstream issue. `tests/corpus/` —
  classified, gitignored (`python3 scripts/populate-corpus.py`).
- `.claude/catalog.md` — every module + public API. **Check before
  implementing anything**; agents routinely rebuild what exists.
  `planning/mission-guide.md` before drafting a `/plan-mission` prompt.
- Ported symbols carry a JSDoc `@see` to their Java origin.
- Verified `@knowvah/dot-engine` findings: a self-contained `.md` in
  `docs/graphviz-issues/` + a `TRACKER.md` line, filed before the iteration
  closes — living only in a mission ledger is not filed.
- MIT, per upstream's LICENSES.md. Keep dependencies MIT-compatible.

## Translation (Java → TypeScript)

`int`/`long`/`double`/`float` → `number` (mind precision > 2^53); `String` →
`string`; `byte[]` → `Uint8Array`; plain-data `class` → `interface`,
behavioral `class` → `class`; `static final` → module-level `UPPER_SNAKE`;
`Optional<T>` → `T | undefined`; checked exception → thrown `Error` or a
`Result` return. Prefer immutable where the Java builds-then-reads; mirror
in-place mutation where it mutates, and document the contract.

## Quality gates — all four before any commit lands on main

`npm test` (vitest + 90/90/90 coverage) · `npm run typecheck` (both tsconfigs)
· `npm run lint` · `npm run build`

## Architecture

- Pure SVG: no DOM/async/canvas. In `src/`, no Node built-ins, `process.env`,
  `require()` or blocking I/O — file reads become parameters/callbacks
  (`include-resolver.ts`, the measurer seam). No `Date.now()`/`Math.random()`
  in rendering paths; seed every non-determinism.
- Pipeline: `parse → layout (dot engine) → render (SVG string)`.
- `CONTAINER_KINDS` is duplicated in `layout.ts`/`renderer.ts` — keep in sync;
  childless containers are leaves for both. `svgRoot` (`src/core/svg.ts`)
  embeds arrowhead `<defs>` automatically.

## Diagrams — PlantUML, never Mermaid

Every diagram is PlantUML in a ` ```plantuml ` fence, overriding any skill or
template default (including `/plan-mission`'s). No viewer renders it yet, so
the source must actually parse — render and check. Two traps when the subject
IS PlantUML markup: `<$name>` is sprite syntax, `<latex>` is a creole tag —
describe them in prose inside diagrams, keep literal markup outside.
