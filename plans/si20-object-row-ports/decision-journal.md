# Decision journal — si20-object-row-ports

Appended during execution. Every non-trivial judgment call gets an entry:
if a reasonable developer might have chosen differently, log it.

A diagnosis entry must carry all four parts, per `~/.claude/rules/diagnosis.md`:
**mechanism**, **origin** (`file:line`), **causal chain**, and **what was
ruled out** with the evidence that ruled it out. An empty "ruled out" on a
non-trivial defect means the cause was guessed.

And one rule this mission inherits from SI17's B2, which nearly shipped a
wrong fix without it:

> **An observation that holds only because of the thing you are about to
> remove is not a ruling-out.** Measure the removal in isolation before
> believing the diagnosis.

## Quality-gate log

| Date | Task | test | typecheck | lint | build | frozen counts |
|---|---|---|---|---|---|---|

## Entries
