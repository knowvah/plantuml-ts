# T13–T20 — command coverage, one engine per task

**Shared specification.** Substitute your engine throughout. Your task ID and
engine come from your batch overview.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec.

Before this mission, an unrecognised line was silently dropped, so a diagram
using a command this port never implemented still rendered — just missing that
element. Nothing detected it. T4–T11 made parsers strict, and T0's gate now
reports exactly which fixtures we error on that the jar rendered.

**Every one of those fixtures is a command this port does not implement.** That
is the finding; this task is the fix. It is the first time this port has been
able to measure command-table coverage at all.

## Task

Take your engine's bucket from the refusal-coverage gate and close it by
porting the missing commands.

For each fixture in your bucket:

1. Find the line the parser refused.
2. Find the upstream `Command` that handles it — start from your engine's
   factory registration list, and remember `CommonCommands.java` applies to
   every factory.
3. **Read that command's method body**, including its regex and its
   `executeArg`. Port it faithfully.
4. Confirm the fixture leaves the bucket.

**If your bucket is empty when you start, close the task as a measured no-op.**
Record the measurement and stop. Do not invent work.

## Write-set

Your engine's directory only (`src/diagrams/<engine>/**`) plus its tests. Your
bucket may point at a shared module in `src/core/` — if so, that is a
cross-task write and a [stop condition](../README.md#stop-conditions). Record
it and stop; the orchestrator will assign it.

## Read-set

- your engine's bucket from the refusal-coverage gate baseline (filter on
  `engine`)
- your engine's upstream factory command registration
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommonCommands.java`
- each specific `Command` class you port — **the method body, not the filename**
- `docs/catalog.md` — check whether a module already implements what you need.
  Agents routinely rebuild what exists

## Architecture decisions in force

- [D7](../decisions.md#d7) — a newly-erroring fixture is a **defect**, not
  accepted baseline movement. Do not re-pin it away
- **The long tail is the deliverable.** YAGNI does not apply to diagram
  behaviour. A command that looks rarely used is in scope if upstream has it

## Acceptance criteria

1. *Given* your engine's bucket, *when* the refusal-coverage gate runs after
   your change, *then* the count is 0 — **or** every residual carries a
   journaled mechanism naming the unported `Command` and its upstream
   `file:line`
2. *Given* each newly-ported command, *when* its fixture renders, *then* the
   routing gate is unchanged and no promoted zero-diff fixture is de-promoted
3. *Given* each ported command, *when* reviewed, *then* it carries a JSDoc
   `@see` to its Java origin, per repo convention
4. *Given* a fixture in your bucket that errors for a reason **other** than an
   unported command, *when* found, *then* **stop and report** — that is
   evidence the refusal contract itself is wrong
   ([stop condition 4](../README.md#stop-conditions))
5. *Given* an empty bucket, *when* the task starts, *then* it closes as a
   measured no-op with the measurement recorded

## Observability

Report your engine's SLI 2 count before and after. If it did not reach 0, list
each residual with its mechanism.

## Rollback

Reversible — revert the commit. Each ported command is independently
revertible.

## Quality bar

All four gates green; routing gate unchanged; no unexplained baseline
movement. Every ported command cites its upstream `file:line`.

## Boundaries

- **Always:** read the upstream `Command`'s method body before porting it;
  check `docs/catalog.md` before building anything
- **Ask first:** a fix that needs a shared `src/core/` module
- **Never:** re-pin a fixture to make the count fall; weaken your engine's
  refusal instead of porting the command; fit a constant; run Prettier

## Commit

`feat(T<n>): port missing <engine> commands surfaced by strict parsing`
