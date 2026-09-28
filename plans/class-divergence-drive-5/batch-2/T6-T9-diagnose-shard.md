# T6–T9: diagnose one shard of non-conformant CLASS rows

You are diagnosing, not fixing. Return only the diagnosis file and a short
structured report: no preamble, no trailing summary.

## Context
plantuml-ts (repo `~/git/knowvah/plantuml-ts`) is a faithful TypeScript port of
PlantUML. The Java at `~/git/plantuml`
(branch `dot-output`, upstream `97a5992a`) is the **specification**. Read the
project's `CLAUDE.md` first, especially "READ THE JAVA FIRST" and "Never fit a
value". The oracle cache was just recaptured from the matching 1.2026.8beta1 jar
(batch 0).

Your shard is the rows in `plans/class-divergence-drive-5/fixtures.md` with
`shard = <SHARD>`. Each row is a CLASS-typed fixture (tree `class` or `unknown`)
whose production render (`renderSync`) differs from the jar's `in.svg` at
`test-results/dot-cache/<tree>/<slug>/`.

## Task
For every row in your shard:
1. Run `npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`,
   and read `measurements/out/<tree>__<slug>.{ours,jar}.svg` at the first
   differing element.
2. Find the upstream Java that draws that element. Open the method body and the
   constructor that built its inputs. Grep `src/main/java/net/`, not only
   `net/sourceforge/plantuml/`. Quote the decisive line(s).
3. Find the port's counterpart (Serena `find_symbol` / `search_for_pattern`, or
   ast-grep) and quote the line where it departs.
4. State the mechanism in 1–2 sentences: WHY the output differs, not WHICH
   attribute. Instrument (temporary logging in a scratch copy, never committed)
   if you are not certain.
5. Assign a **family id**: short kebab-case, shared by every row with the same
   mechanism. Reuse ids across your rows. Before inventing a family, check the
   other shard files if they exist.
6. Estimate the fix's write-set (port files) and size (S < 30 lines, M < 150,
   L ≥ 150).
7. A row whose jar output looks like a deliberate divergence candidate (upstream
   crash, `!pragma layout elk`, rasterised payload): set family
   `accept-candidate:<reason>`. Never assert it is accepted (D7).
8. A row where real `dot` is implicated: run `dot -Tdot` on the cached `svek-N.dot`
   before blaming dot-engine (memory: dot-engine-blame-needs-real-dot). The family is
   then `dot-engine:<short>`.

## Write-set
`plans/class-divergence-drive-5/diagnosis/<SHARD-FILE>.md` only. **Never edit
`src/`, tests, `fixtures.md`, or any other shard file.** Scratch work goes in
`/private/tmp/...` or your session scratchpad.

## Output format (`diagnosis/<SHARD-FILE>.md`)
Top of the file: a table with one row per family,
`| family | rows | Java file:line | port file:line | size | write-set |`.
Then one section per fixture:

```
### <tree>/<slug> — <family>
- first diff: <path @attr>, ours=<v> jar=<v>
- Java: `<file>:<line>` — "<quote>"
- port: `<file>:<line>` — "<quote>"
- mechanism: <1–2 sentences>
- confidence: HIGH (instrumented) | MEDIUM (read, not instrumented) | LOW
```

A row you cannot resolve: `mechanism: unknown — instrument <what> next`.

## Report (returned text)
One line per family: `family · rows · size · confidence`. Then the count of
unknown rows.

## Boundaries
- Always: quote the Java; cite `file:line` in the same sentence as any "matches
  upstream" claim.
- Never: propose a fitted constant, or edit anything outside your write-set.
- Never call a row "out of scope" or "hard". Hard is a trigger to verify.

## Observability · Rollback
N/A: read-only diagnosis, no new observable operations. Reversible (the file is deletable).
