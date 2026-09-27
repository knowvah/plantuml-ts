# T7b — route executed theme state; retire the summary (D3)

**Task.**
1. Using T7a's journaled measurement, find every renderer field that is fed
   by the summary (`Theme.colors.*`, `fontFamily`, `diagramMargin`, the
   hand-carried aws-orange entries in `compile-themes.py` MANUAL).
2. For each field, confirm that the executed skinparam/style reaches the
   same consumer the jar's does. Quote the Java consumer. Route it where it
   does not.
3. When all 25 `!theme` fixtures are no worse in every engine, delete the
   summary path (`themes-builtin*`, `compile-themes.py`, the resolve call)
   and remove DIVERGENCE 2 from `TContext.ts`. If some fixture is worse,
   keep the summary for that field only, with a comment citing the
   mechanism, and journal it.
4. Survey every engine; mizupo is the target. Stop 9 is waived (D3);
   every mover needs a mechanism.

**Acceptance.**
- Given mizupo, then conformant (gradient header, dpi 100 scale, `$PRIMARY`
  colours), or a residual with a mechanism.
- Given the 25 `!theme` fixtures, then 0 conformant losses.
- Given `src/`, if the summary was retired, then nothing references
  `BUILTIN_THEMES`.

**Observability** N/A. **Rollback** Reversible.
