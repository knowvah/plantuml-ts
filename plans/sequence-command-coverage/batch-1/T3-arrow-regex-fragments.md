# T3 — Shared arrow regex fragments

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Upstream builds `CommandArrow`,
`CommandExoArrowLeft` and `CommandExoArrowRight` from **shared** regex
fragments via `RegexConcat`. This port currently has a single hand-rolled
enumerated-token regex (`sequence-commands.ts:399`) that lists arrow tokens
literally (`->`, `-->>`, `->>`, `-->`, `->?`, `?->`). Seven of this mission's
buckets are named groups the enumerated form cannot express.

This task ports the fragments only. Nothing consumes them yet — T7, T12 and T13
do.

## Task

Create `src/diagrams/sequence/sequence-arrow-regex.ts` exporting the fragments
upstream shares, each carrying a JSDoc `@see` to its Java origin:

- `ANCHOR` — `CommandArrow.java:78` (`(\{([%pLN_]+)\}[%s]+)?`)
- the color/style pattern — `CommandArrow.getColorOrStylePattern():81-83`,
  which wraps `CommandLinkElement.LINE_STYLE`
- `ARROW_DRESSING1` / `ARROW_DRESSING2` alternations — `:99-116`
- the `ARROW_BODYA`/`ARROW_BODYB` + style alternation — `:105-113`
- `PART1`/`PART2`'s four alternatives each — `:92-96`, `:118-122`
- `ARROW_SUPPCIRCLE1` / `ARROW_SUPPCIRCLE2` — `CommandExoArrowLeft.java:60,78`
  and `CommandExoArrowRight.java:75`
- `MULTICAST` `:123`, `ACTIVATION` `:126`, `LIFECOLOR` `:128`

**Read the Java method bodies before writing any of these** — not a summary,
not this list. Upstream compiles every command regex with
`Pattern.CASE_INSENSITIVE` (`Pattern2.java`); the TypeScript equivalents need
the `i` flag, and one corpus fixture is pinned on exactly that.

Translate `%pLN_`, `%s`, `%g` to their JavaScript equivalents faithfully —
`[%pLN_.@]` is Unicode letters and digits plus `_ . @`, i.e. `[\p{L}\p{N}_.@]`
with the `u` flag. **Not** `\S+`: see the prior observation below.

## Write-set

- `src/diagrams/sequence/sequence-arrow-regex.ts` (new)
- `tests/unit/sequence/sequence-arrow-regex.test.ts` (new)

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/command/CommandArrow.java:76-133`
- `.../command/CommandExoArrowLeft.java:56-92`
- `.../command/CommandExoArrowRight.java:60-100`
- `.../regex/RegexLeaf.java`, `RegexOr.java`, `RegexConcat.java` — how the
  fragments compose and how group numbering works
- `src/diagrams/sequence/sequence-commands.ts:385-429` — the enumerated form
  being replaced, and the comment explaining why `\S+` was wrong

## Prior observation — bears directly on this write-set

From `.agent-notes/T13-sequence-ratchet-rise-diagnosis.md`: the endpoint token
was once `\S+`, which let a token absorb the arrow's own dash by greedy
backtracking — `C-->B` parsed as participant `C-`, arrow `->`, participant `B`.
It also let an endpoint swallow `[`, inventing a participant named `[`, so 15
exo fixtures drew a **wrong** diagram instead of refusing. Jar-verified both
ways: `C-->B` declares exactly B and C, and `A->oB` really does declare `oB`
(the `o`/`x` decoration is `[%s][ox]` — it needs the space). Any loosening back
toward `\S+` reintroduces this silently.

## Architecture decisions in force

D2 (locked): these fragments exist so `CommandArrow` and both exo commands
share what they share upstream, rather than keeping diverging copies.

## Interface contracts

Consumed by T7, T12, T13. Export each fragment as a **string** (composable into
a larger pattern) plus, where useful, a compiled `RegExp` for direct testing.
Group names must match upstream's names exactly — `PART1CODE`, `ARROW_BODYA1`,
`ARROW_SUPPCIRCLE2` and so on. Downstream tasks address groups by those names.

## Acceptance criteria

- Given each fragment, when tested against the literal forms in
  `CommandArrow.java:88-133`, then each named group captures what the Java's
  group captures.
- Given `C-->B`, when matched with the composed skeleton, then `PART1CODE` is
  `C` and `PART2CODE` is `B` — never `C-`.
- Given `A ->o B` and `A->oB`, then the first yields a circle decoration and
  the second yields a participant named `oB`.
- Given an uppercase form such as `A -[#RED]-> B`, then it matches — the `i`
  flag is present, per `Pattern2.java`.
- Given every exported constant, then each carries a JSDoc `@see` naming its
  Java `file:line`.

## Observability

N/A — no new observable operations. This module has no consumers yet.

## Rollback

**Reversible.** New module with no callers.

## Quality bar

All four gates green. 90/90/90 coverage applies: the test file must exercise
every exported fragment. Do not satisfy coverage with an assertion-free test.

## Boundaries

- **Always**: read the Java method body first; cite `file:line` on every
  constant. No citation means the constant is unfinished.
- **Never**: fit a pattern to make a fixture pass. Never widen a character
  class toward `\S`.
- **Ask first**: if a fragment cannot be expressed in JavaScript regex without
  changing what it matches, journal the difference before encoding it.

## Commit

`feat(T3): port CommandArrow's shared regex fragments`
