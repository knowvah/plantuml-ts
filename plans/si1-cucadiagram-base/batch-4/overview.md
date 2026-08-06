# Batch 4 — Assembly (parallel)

| ID | Description | Writes | Depends On | Done |
|----|-------------|--------|------------|------|
| T9 | BodyEnhanced1 (getArea separator loop :123-177, buildTextBlock :189-195 → MethodsOrFieldsArea) + BodyEnhancedAbstract.decorate alignment check (:106-118 already ported — verify marginX=6 path) + BodyFactory create1/create2 (:74-77)/createLeaf/createGroup (:58-84) added to the existing BodyFactory.ts | src/core/cucadiagram/BodyEnhanced1.ts, BodyFactory.ts (extend) + tests | T7, T8 | [ ] |
| T10 | net/atmp/CucaDiagram.java (953): quark mgmt (quarkInContext :246-287, quarks :918-923), createLeaf/reallyCreateLeaf (:220-243, :824-839), group mgmt (gotoGroup :344-365, endGroup, getCurrentGroup :177-186, currentTogether :188-194), link mgmt (addLink :896-901, containsSimilarLink :903-909, removeLink), hides/shows collections (:123-127) | src/core/cucadiagram/CucaDiagram.ts + tests | T5, T6, T7 | [ ] |

CucaDiagram's TitledDiagram/ISkinParam supertype surface: port as the
minimal consumed interface (ADR-2 closure trace), not the whole diagram
stack — journal the boundary drawn.
