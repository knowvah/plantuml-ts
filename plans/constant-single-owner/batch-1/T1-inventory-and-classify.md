# T1 — make the duplication countable, then classify it

## Context

plantuml-ts is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the specification. This mission removes duplicate
declarations of the SAME upstream constant, and — equally — leaves alone the
ones that merely hold the same number.

Read `plans/constant-single-owner/README.md` (the rule and the six
collisions) and `decisions.md` (D1–D6) before starting.
`src/core/svek/SvekResult.ts` is the worked example, and its doc comment
states the distinction the whole mission turns on.

## Task, part 1 — the harness

Write `scripts/constant-inventory.ts`: scan module-level
`const NAME = <number>;` declarations under `src/`, group by name, and
report.

Requirements the mission depends on:

- **Compare values NUMERICALLY, not as strings.** `ROOT_LINE_THICKNESS` is
  `1` in one module and `1.0` in two others — the same number. A
  string-compare inventory reports it as a collision, which is wrong and
  would send Batch 4 to rename something that should be shared.
- Emit, per duplicated name: every declaration's `file:line`, its value,
  and whether the six lines above it mention `.java` / `upstream` / `@see`
  (the citation signal — weak but useful for ranking).
- Emit a summary: duplicated names, redundant declarations (copies beyond
  the first), same-value names, different-value names.
- Support `--known-exceptions` handling so `HACK_X_FOR_POLYGON` reports as
  `known-exception` rather than as outstanding work (decision D5). Keep the
  exception list IN the script with its reason inline, not in a side file.
- Deterministic output — sorted, no clock, no map-iteration order.

The redundant-declaration count is this mission's ratchet: later batches
must strictly lower it, so the number has to be stable and reproducible.

## Task, part 2 — the classification

Produce `.agent-notes/constant-inventory.md`: for each of the ~61 same-value
names, one row classified as

- **share** — one upstream field, N readers. **Requires a Java `file:line`.**
  Name the proposed owner module under D1's rule (mirror the upstream
  package/file).
- **coincidence** — N upstream fields, or no upstream origin and no shared
  purpose. Stays duplicated. Say why in one line.
- **intra-engine** — duplicated entirely within one engine (decision D3),
  with the owner module inside that engine.
- **unknown** — could not establish the origin in reasonable time. This is a
  legitimate answer; do NOT guess a classification to avoid it.

Rank the **share** and **intra-engine** rows by redundant-declaration count,
so Batches 2 and 3 work highest-value-first.

**Do not consolidate anything in this task.** Classification only.

## Read-set

- `src/core/svek/SvekResult.ts` — the worked example and the rule.
- `plans/constant-single-owner/README.md`, `decisions.md`.
- `scripts/measure-composite-declared-size.ts` — a recent script in this
  repo; mirror its CLI/reporting shape rather than inventing another.
- `~/git/plantuml/src/main/java/net/` — for every `share` claim. Grep the
  whole of `net/`, never just `net/sourceforge/plantuml/`: that narrower
  scope silently misses `net/atmp/`, `gen/`, `smetana/`.

## Write-set

- `scripts/constant-inventory.ts` (create)
- `.agent-notes/constant-inventory.md` (create)

Nothing under `src/`.

## Interface contract (consumed by Batches 2–4)

```
{"name":"NOTE_FONT_SIZE","value":13,"count":5,"class":"share",
 "owner":"src/core/<pkg>/<File>.ts","upstream":"<Java file:line>",
 "sites":[{"file":"…","line":N}]}
{"summary":{"names":N,"redundantDecls":N,"sameValue":N,"diffValue":N,"knownExceptions":N}}
```

`upstream` is REQUIRED on every `share` row and empty on every other class.
A `share` row without it is not a share row.

## Acceptance criteria

1. Given the current tree, when the harness runs, then it reports 67
   duplicated names / 117 redundant declarations / 61 same-value / 6
   different-value — or names, per constant, why it differs.
2. Given `ROOT_LINE_THICKNESS`, when classified, then it is NOT reported as
   a value collision (`1` and `1.0` are one number).
3. Given `HACK_X_FOR_POLYGON`, when reported, then it is
   `known-exception` with D5's reason, and is excluded from the redundant
   count the ratchet uses.
4. Given every `share` row, when reviewed, then each carries a Java
   `file:line` and a proposed owner path.
5. Given two runs on an unchanged tree, then byte-identical output.
6. Given the whole suite, then no rendered output changes — this task
   writes no `src/`.

## Quality bar

All four gates exit 0. `scripts/` may use Node built-ins; the browser-safety
rule binds `src/` only. The complexity hook BLOCKS on file length 500 /
function 30 NLOC / CCN 10 / 5 params.

**Heads-up on that hook:** a bare `<` in an object-literal property VALUE
makes lizard swallow the rest of the file and report a wildly inflated
NLOC/CCN on the enclosing function while hiding every later one. Extract the
comparison into a named predicate. See
`.agent-notes/lizard-lt-in-object-literal.md` — this bit the last script
written in this repo.

## Boundaries

- **Always:** cite a Java `file:line` for every `share`; compare values
  numerically.
- **Ask first:** any change under `src/`.
- **Never:** run a git command. Never classify `share` on equal values
  alone — that is the mission's central failure mode, not a shortcut.
