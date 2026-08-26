# T7 — `CommandArrow` rebuilt compositionally, at behavior parity

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This port's arrow command is a
hand-rolled regex with an **enumerated token set** (`->`, `-->>`, `->>`, `-->`,
`->?`, `?->`). Upstream builds the same command from composed named groups via
`RegexConcat` (`CommandArrow.java:87-133`): PARALLEL, ANCHOR, PART1, DRESSING1,
BODY+STYLE, DRESSING2, PART2, MULTICAST, ACTIVATION, LIFECOLOR, STEREOTYPE,
URL, MESSAGE.

The enumerated form cannot express seven of this mission's buckets. This task
replaces it with the composed form **at behavior parity**, and closes the three
buckets that need only the skeleton. T12 then adds the decorated dressing and
the trailing modifiers.

Note the cut: this is **not** "structure without dressing". `>` IS
`ARROW_DRESSING2`, so a skeleton with no dressing alternation cannot parse
`A -> B` at all. T7 ships the basic dressing (`<`, `>`, `<<`, `>>`); T12 adds
`o`/`x`, the `/`/`\` half-heads, and inclination.

## Task

Rewrite `command-arrow.ts` to build its pattern from T3's fragments, covering:
PARALLEL `(&[%s]*)?`, ANCHOR, PART1 (all four alternatives), basic
ARROW_DRESSING1/2, ARROW_BODYA/B with ARROW_STYLE1/2, PART2 (all four
alternatives), MULTICAST, PART1ANCHOR/PART2ANCHOR, MESSAGE.

Populate the AST fields T6 declared: `arrow` (an `ArrowConfiguration`),
`multicast`, `anchor`, `parallel`. Per D4, `parallel` and `anchor` are
**stored and not drawn** — every upstream consumer of `isParallel()` and
`getAnchor()` is under `sequencediagram/teoz/`, and the classic renderer reads
neither. That is upstream's own behavior, not a divergence.

Port `getMulticasts` (`CommandArrow.java:139-155`) and the reverse-arrow
handling: upstream derives `reverseDefine` from an `<`/`\`/`/` in the LEFT
dressing (`:302,306-314`) and swaps `p1`/`p2` so the message is still
constructed sender-to-receiver ("keep the order", `:322-325`).

## Write-set

- `src/diagrams/sequence/command-arrow.ts`
- `src/diagrams/sequence/sequence-command-registry.ts` — only if a registration
  line changes; the **order must not**
- `tests/unit/sequence/command-arrow.test.ts` (new)

Not `ast.ts`. Not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommandArrow.java:76-133` (regex),
  `:139-155` (`getMulticasts`), `:296-338` (dressing/reverse),
  `:340-430` (`executeArg`). **Read the method bodies.**
- `~/git/plantuml/.../regex/RegexConcat.java`, `RegexOr.java` — group numbering
- `src/diagrams/sequence/sequence-arrow-regex.ts` (T3)
- `src/diagrams/sequence/ast.ts` — the T6 contract
- `../decisions.md#d1`, `#d2`, `#d4`

## Prior observation — bears directly on this write-set

From `.agent-notes/T13-sequence-ratchet-rise-diagnosis.md`: the endpoint token
was once `\S+`, which let greedy backtracking absorb the arrow's own dash —
`C-->B` parsed as a participant named `C-`. It is now upstream's `PART1CODE` =
`([%pLN_.@]+)`. Jar-verified both ways: `C-->B` declares exactly B and C, and
`A->oB` really does declare `oB`, because the `o`/`x` decoration is `[%s][ox]`
and needs the space. **Any loosening toward `\S+` silently reintroduces a bug
that made 15 exo fixtures draw a wrong diagram instead of refusing.**

## Architecture decisions in force

D1 (arrows are `ArrowConfiguration`), D2 (registration order **frozen** — a
reorder is stop condition 2), D4 (`parallel`/`anchor` parsed, stored, not
drawn). All locked.

## Interface contracts

Consumes T6's `MessageEvent` / `ArrowConfiguration` and T3's fragments.
Produces no new interface — T12 extends this same module.

## Acceptance criteria

- Given every arrow form the enumerated table parsed, when re-parsed, then the
  AST is **identical**. This task adds structure, not behavior.
- Given the ~12 fixtures pinned to `ARROW_STYLE1/2`, MULTICAST and ANCHOR, when
  parsed, then no refusal and routing is `SEQUENCE`.
- Given `A -[#red]-> B`, then the style lands on the config; given
  `A -> B & C`, then `multicast` carries `C`.
- Given `C-->B`, then participants are exactly `C` and `B` — never `C-`.
- Given `{anchor1} A -> B`, then `anchor` is stored and nothing new is drawn.

## Observability

N/A beyond the gates. Report the closed-fixture count via the gates' own SLI
lines; read them with `--reporter=verbose`.

## Rollback

**Reversible.** Single command module.

## Quality bar

All four gates green; 90/90/90. Where a ported branch has no corpus fixture,
author a `.puml` fixture and generate its oracle with
`scripts/oracle-render.sh <out-dir> <puml>` — never a hand-typed `java -jar`,
which omits `-DPLANTUML_DETERMINISTIC_TEXT=true` and makes every text-derived
number measure the flag instead of the port. Never satisfy coverage with an
assertion-free test.

## Boundaries

- **Always**: read the Java method body first; cite `file:line` on constants.
- **Never**: fit a pattern to a fixture; never widen an endpoint class toward
  `\S`; never reorder the registry (STOP); never edit `ast.ts`.
- **Ask first**: if behavior parity and the composed grammar genuinely conflict
  on some token, journal it before choosing.

## Commit

`feat(T7): rebuild CommandArrow from composed named groups`
