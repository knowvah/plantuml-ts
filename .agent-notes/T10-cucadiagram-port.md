# T10 — net/atmp/CucaDiagram.java full port

## Decisions (for the orchestrator's decision journal)

1. **Three-file split** — 953 Java lines exceed two 500-cap TS files;
   split at upstream member order: `CucaDiagramBase.ts` (:111-395,
   fields+ctor), `CucaDiagramBase2.ts` (:397-644, export pipeline +
   hide/show recording), `CucaDiagram.ts` (:646-953). Cross-file calls
   use abstract declarations (EntityBase precedent).
2. **Supertype boundary (ADR-2, batch-4 mandate)** — minimal consumed
   `TitledDiagram` slice as a REAL abstract class at its upstream home
   `src/core/TitledDiagram.ts`: namespaceSeparator, type/getDiagramType,
   skinParamUsed±setter, useElk/useSmetana±setters+FORCE statics,
   getPragma (via getSkinParam — upstream reads the same object's
   field), getDefaultMargins, getWarningOrError (full body; `lastInfo`
   is never assigned upstream — its only write :361 is commented out).
   ONLY `getSkinParam()` is abstract (SkinParam.create unported).
   Ctor keeps the faithful 4-param signature; `UmlSource`/`Previous`
   are opaque brands declared there (LinkConstraint-stub precedent);
   `DiagramType` (T5 local decl) moved there from the retired stub.
3. **Stub replacement mechanics** — `abel/CucaDiagram.ts` DELETED; the
   real class re-exports `DiagramType`/`UmlSource`/`Previous`; import
   re-points in Entity.ts/EntityBase.ts/LinkBase.ts (the stub's only
   src consumers) + tests. Every stub signature is preserved.
4. **T9 seam** — `createLeaf`/`createGroup` reach `BodyFactory`
   dynamically (`BodyFactoryT9Surface` optional-member cast + deferred
   throw when absent). T9 landed mid-task, so the seam dispatches to
   the real members at runtime; a batch-close cleanup may inline the
   direct calls once both tasks are committed.
5. **Closure pulls (all faithful, upstream homes)** — HideOrShow,
   EntityPortion (+free `asSet`), Failable (gantt/), ParserPass +
   CommandExecutionResult (command/; AbstractDiagram opaque brand;
   getStackTrace adapted to `Error#stack`), Magma/MagmaList/SquareMaker/
   SquareLinker, LinkConstraint (real class replacing T6's opaque stub —
   its doc scheduled the move; drawMe = deferred throw; abel stub
   deleted, Link.ts re-pointed), BodierJSon (JsonValue opaque brand) /
   BodierMap (getBody = deferred throws: TextBlockCucaJSon/TextBlockMap
   unported). ≈1.4× the task's CucaDiagram+support estimate — under the
   2× stop line.
6. **ISkinParam consumed-slice growth** — `strictUmlStyle()` (live:
   showPortion) and `getValue(key): string | null` (typed to match the
   existing `ISkinSimple.getValue` it shadows upstream). Ripple: 1-line
   additions in MockSkinParam + the two `fakeSkin` literals in
   tests/unit/core/cucadiagram (T9's test dir — coordinate at merge).
7. **helpers.ts MockDiagram** — now extends the real CucaDiagram
   (MockLink precedent); `removed` set renamed `removedEntities` (base
   private field shadowing); `makeWorld` uses the diagram's own
   plasma/root; test sites updated to `addLink`/`getLinks`/
   `setSkinParamUsed`. All 33 abel/decoration test files pass.
8. **Root-entity construction** — Java passes null styleBuilder/bodier;
   T5's merged ctor types them non-nullable, so the one null-passing
   site casts (`undefined as unknown as ...`), documented at the ctor.
   `Entity#setTogether` param widened to `Together | undefined`
   (Java-nullable; reallyCreateLeaf passes `currentTogether()`).
9. **Merged overloads (runtime-discriminable, unlike T5's ctor case)** —
   `isGroup(string|Quark)` typeof-dispatch; `HideOrShow.apply/
   isApplyable` instanceof-Entity dispatch; `gotoGroup` optional
   usymbol; `Failable.error`/`CommandExecutionResult.error` default/
   union params.
10. **Export pipeline** — createFiles*/export*/getTextBlock/
    dotIsAvailable are ADR-2 deferred throws with `unknown` param types
    (OutputStream/FileFormat/ImageData unported); getTextBlock keeps
    the faithful `eventuallyBuildPhantomGroups(null)` prefix.
    `InstallationRequirement` declared locally (DiagramType precedent).

## Observation: engine-facing magma.ts coexists with faithful Magma
- **Context**: applySingleStrategy needs Magma/MagmaList/SquareMaker.
- **Finding**: `src/core/magma.ts` is a dot-id adaptation (jar-verified)
  of the same upstream algorithm; the faithful abel-model classes now
  live at `src/core/cucadiagram/Magma*.ts`.
- **Impact**: engine migrations (G-rebuilds) should consume the
  faithful classes and retire magma.ts then; don't "dedup" them now.
- **Confidence**: High.

## Observation: complexity hook accepts `#lizard forgives` before final return
- **Context**: quote-strip branch matrix (CCN 14) in CucaDiagramBase.ts.
- **Finding**: forgives comment placed just before the function's final
  return suppressed the block; file-level 500-line cap has no override.
- **Confidence**: High.
