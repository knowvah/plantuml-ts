# T5 — Remainder triage

## Context

After T4, `--vs-jar` should read `order-only=0`. If it does not, the
remaining fixtures are where D1's key (entity `creationIndex`) and jar's
quark-registration order disagree, or where T2's recursion misses a
`printGroups` rule. Either way the answer is a diagnosis, not a fit
(`~/.claude/rules/diagnosis.md`). Separately, the 77 OTHER fixtures carry
uid-set divergences this mission does not own; a classified sample feeds
`planning/next-missions.md`.

## Task

1. For EVERY fixture still ORDER-ONLY: dump ours vs jar (`--vs-jar` prints
   the verdict; use `scripts/note-order-report.ts` default mode + jar's
   `in.svg` for the sequences), open its `in.puml`, and state in the journal:
   mechanism, origin (`file:line`, Java AND port), causal chain, ruled out.
   Typical candidates: a forward reference registering a quark before its
   entity (`A --> B` before `class B`), a `package P {}` mentioned before
   declaration, an empty package's slot, a TIPS leader rank. If the fix is
   a T2 recursion bug with a Java citation, fix it in
   `class-leaf-order.ts` (+ test). If it needs a new ordering key
   (quark tick), do NOT build it — that is README stop 4; record and STOP.
2. Sample ≥5 of the 77 OTHER fixtures (pick across the alphabet); classify
   each divergence in one line (missing/extra `<g class="link">`, uid
   numbering, missing entity, …) for next-missions. No fixes.

## Write-set

- `plans/leaf-draw-order/decision-journal.md`
- `src/diagrams/class/class-leaf-order.ts` + its test — ONLY for a
  root-caused, Java-cited ordering rule bug

## Read-set

- `--vs-jar` output after T4; `plans/leaf-draw-order/baseline/order-vs-jar.txt`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/plasma/{Plasma,Quark}.java`,
  `net/atmp/CucaDiagram.java:840-875`, `svek/GraphvizImageBuilder.java:397-435`
- `src/diagrams/class/class-leaf-order.ts`, `class-notes.ts:171-245`
  (creation-index burns), `class-note-decl-ast.ts:110-188`

## Architecture decisions

D1 (no new tick without a ruling), D6.

## Acceptance criteria

- Given each remaining ORDER-ONLY fixture, when triaged, then the journal
  has a row with all four diagnosis fields, and the fixture is either
  cleared (with the Java line the fix mirrors) or named as a remainder with
  the mechanism.
- Given ≥5 OTHER fixtures, when sampled, then each has a one-line
  classification in the journal under a "next-missions feed" heading.
- Given any src change here, then all gates and corpus checks still hold.

## Quality bar

If src changed: all four gates + corpus checks. Otherwise: journal only.

## Observability requirements

N/A.

## Rollback notes

Reversible.

## Boundaries

- Never: adjust an index or add a special case to make a fixture pass
  ("never fit a value").
- No git commands (the orchestrator commits: `docs(T5): ...` or `fix(T5): ...`).
