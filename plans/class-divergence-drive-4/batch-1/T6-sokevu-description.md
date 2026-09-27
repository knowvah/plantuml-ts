# T6 — sokevu: E3-9 patch + E3-10b (D4)

**Context.**
- `plans/class-divergence-drive-3/decision-journal.md` rows 52–53: the maintainer split E3-9 out,
  and it now comes back in (D4).
- Patch: `plans/class-divergence-drive-3/measurements/e3-9-description-measurer.patch` (description
  render-measurer; touches `description/{index,layout-helpers-types,renderer}.ts`
  + new `tests/unit/description/description-render-measurer.test.ts`).
- In cdd3 it moved 246 non-class fixtures upward.
- E3-10b: `ClusterDotString#hasPort` branch is unported
  (`net/sourceforge/plantuml/svek/ClusterDotString.java:136-141,177-184,254-280`;
  TS emitter `src/core/svek-dot-emit-clusters.ts`).

**Task.**
1. `git apply` the patch. Read the Java behind every hunk and confirm it
   ports the WHOLE method.
2. Port E3-10b, TDD, quoting the Java.
3. Survey EVERY engine against `../measurements/b0-eng/`. Journal every
   verdict mover and `dotEqual` flip with a mechanism, grouped by mechanism.
   Stop 9 is waived; an unexplained rise or a conformant loss is still stop
   4/5.
4. Commit per logical change (the patch; E3-10b).

**Acceptance.**
- Given sokevu, when surveyed, then conformant, or a residual with a
  mechanism.
- Given every engine, then 0 conformant losses without a mechanism, and
  every mover journaled.
- Given the gates, then green, with DOT parity (class, state, description)
  green.

**Observability** N/A. **Rollback** Reversible.
