# T0b — class/state anchor check (read-only)

**Agent:** `debugger`, read-only: Read/Grep/Glob/Bash only; no Write/Edit, no Serena edit tools. Runs in
the main checkout; throwaway scripts only under `/private/tmp/claude-501/dur-T0b/`. Return the report in
the reply; the orchestrator writes `measurements/T0b-anchors.md`.

## Context
D2 wraps every creole text run and inline atom that carries a url in `startUrl`/`closeUrl`
(`AtomText.java:197-198,235-236`) inside the two description drawers, which the class engine also uses.
Class members already wrap at block level (`core/cucadiagram/TextBlockTracer.ts:96-100`). D3: mirror the
jar exactly; nested `<a>` only if the jar nests. See `measurements/seed/seam-map.md` (Family B).

## Task
1. List every `test-results/dot-cache/{class,object,state,unknown}` fixture whose `in.puml` contains
   `[[`. For each, count `<a ` in the jar `in.svg`, whether any `<a>` is nested inside another `<a>`,
   and what each `<a>` wraps (member row, entity, text run, sprite, link label, note).
2. Read the Java for class members with urls (`TextBlockTracer`/`MethodsOrFieldsArea`/`Member` url) and
   creole urls inside member text; quote `file:line`. State whether the jar can produce nested `<a>`.
3. For each such fixture, render ours (`npx jiti plans/class-divergence-drive/tools/render-diff.mts
   <tree>/<slug>`) and list the current `<a>` diffs. Predict which rows a per-run wrap in
   `EntityImageDescriptionDelegates.ts#drawTextAtom` / `EntityImageDescriptionTextBlock.ts#drawAtoms`
   would change, and whether any would gain an `<a>` the jar lacks.
4. For usecase/bivira-53-boja685 and usecase/vivido-49-nisu863, give the jar's element order inside each
   `<a>` (text runs vs sprite `image`/`g`), so T2 can mirror per-atom wrapping.

## Output (tables, no prose)
- `| tree/slug | jar <a> | nested? | wraps | ours today | predicted after per-run wrap |`
- the Java quotes for step 2
- the bivira/vivido element order

## Acceptance
- Given each class/object/state fixture with `[[`, then a predicted-after verdict backed by a re-runnable
  command.
- Given a row the per-run wrap would push away from the jar, then it is named (T2 must handle it).

**Observability:** N/A. **Rollback:** Reversible (no code).
