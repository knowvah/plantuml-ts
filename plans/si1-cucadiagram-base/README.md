# Mission SI1 — the shared cucadiagram base (`src/core/plasma|abel|cucadiagram`)

Port upstream's shared cuca-family foundation ONCE — the Quark/Entity/Link
model, `CucaDiagram` (net/atmp — OUTSIDE net/sourceforge/plantuml), the
Bodier/body layer through `BodyEnhanced1`+`BodyFactory.create2`, and the
consumed slice of `skin/` — then wire the two measured payoffs: the shared
`-[single]->` add-time dedup (class/state lack it; latent) and the folder/
package un-narrowing (closes gujigi-63; T6 narrowing #1). Existing engines
are NOT migrated onto the base (ADR-1); the Track SI-1 typed contract is a
deliverable for the G-1..G-7 rebuilds.

**Measured size (2026-08-05 re-trace; ADR-10's 12.1k was stale):** ~13.6k
Java lines full-faithful, bounded by ADR-2's consumed-slice skin scoping.
Top items: skin/ 8,225 unported (only the closure ports), abel model
~1,755, CucaDiagram+support ~1,642, body classes ~1,400.

## Branch

`feature/si1-cucadiagram-base` from main @ `34e885a5`. Merge `--no-ff`.
Orchestrator commits after each batch; agents NEVER run state-mutating git.

## Quality gates — ALL must pass before every batch commit (rc captured DIRECTLY, never piped)

```sh
npm test              # cold-tree at batch close: rm -rf packages/*/assets first
npm run typecheck && npm run lint && npm run build
```

Ratchets — a regression in ANY is a STOP:

```sh
npx tsx scripts/measure-class-size-deltas.ts        # 709/711, widened 0 (held or improved)
npx tsx scripts/measure-description-size-deltas.ts  # 321/351, widened 0 (T12 should IMPROVE)
npx tsx scripts/measure-state-size-deltas.ts        # 147, widened 0
npx tsx scripts/dot-sync-report.ts class component usecase   # 710/262/93 EQUAL
npx vitest run tests/architecture/sizer-renderer-parity.test.ts
```

## Stop conditions

1. Any ratchet WIDENED — never re-baseline.
2. A skin-slice import closure exceeding the task's two-level estimate by
   >2× measured lines — escalate with the measured cascade.
3. Faithful porting requires editing engine files beyond the two declared
   wiring sites (T11's three parsers, T12's two narrowing sites).
4. A fitted constant; 2 consecutive gate failures on one check; the same
   location changed 3× without resolving the same failure.
5. Wiring behavior contradicting a jar probe.
6. An authored fixture's jar oracle disagreeing with a ported-base unit
   expectation — spec conflict; probe before code.

## Push-forward (journal each)

Porting members with NO caller today (MANDATORY — ADR-8 corollary, see
decisions.md); pulling in-estimate skin files into a closure; 500-line-cap
splits along upstream file boundaries; stale test expectations at the two
wiring sites; deleting pins T12 improves.

## Method constraints (earned — same set as A2s)

- NEVER a fitted constant; every number traceable to an upstream expression.
- Preserve upstream names; do not refactor while porting; `@see` provenance
  on every ported member.
- Verify a subagent's load-bearing claim before acting on it.
- Grep `~/git/plantuml/src/main/java/net/` — the WHOLE root (net/atmp/,
  abel/, plasma/ live outside net/sourceforge/plantuml).
- Jar probe: `java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir>
  -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <file.puml>`. Traps:
  DOT node order ≠ declaration order (ONE element of interest per probe);
  single-entity diagrams emit NO DOT (add a throwaway second element+edge).
- Trace TWO dependency levels before sizing any closure (one-level
  estimates were wrong 3× in this repo; ADR-10 itself was a 3× miss).

## Batches

| # | Focus | Tasks | Status |
|---|-------|-------|--------|
| 1 | Leaf foundations (parallel) | T1 Quark/Plasma · T2 abel enums · T3 VisibilityModifier/CharHidder/Url · T4 PlacementStrategy family | [ ] |
| 2 | Entity | T5 Entity + Together + EntityUtils/Gender | [ ] |
| 3 | Link + body interfaces (parallel) | T6 Link/LinkArg · T7 Bodier family · T8 TextBlockLineBefore + MethodsOrFieldsArea | [ ] |
| 4 | Assembly (parallel) | T9 BodyEnhanced1 + BodyFactory create1/create2/createLeaf/createGroup · T10 CucaDiagram | [ ] |
| 5 | Wirings (parallel) | T11 shared `-[single]->` dedup (3 parsers + authored fixtures) · T12 folder un-narrowing (gujigi) | [ ] |
| 6 | Contract + close | T13 Track SI-1 contract doc + guard · C1 close-out | [ ] |

## Index

- [decisions.md](decisions.md) — ADR-1..5 + ops readiness
- [batch-N/overview.md] per batch; task specs `batch-N/TN-*.md`
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md) — append during execution

## Key upstream map (verified 2026-08-05; file:line in task specs)

`net/atmp/CucaDiagram.java` (953): addLink :896-901, containsSimilarLink
:903-909 (dedup via `Link.sameConnections`), gotoGroup :344-365, endGroup
:367-374, getCurrentGroup :177-186, quarkInContext :246-287, createLeaf
:824-839 (constructs Entity with `BodyFactory.createLeaf`). Subclass chain:
CucaDiagram → AbstractEntityDiagram → {DescriptionDiagram, StateDiagram,
AbstractClassOrObjectDiagram → {ClassDiagram, ObjectDiagram}}.
`abel/Entity.java` (775) fields :89-135; `abel/Link.java` sameConnections
:462-470, getInv :145-156; `LinkArg` fluent builders; `plasma/Quark`
:48-94 (parent/name/qualifiedName/children/data). `LeafType` 51 values
(isLikeClass :85-96); `GroupType` 8 values. `BodyFactory.create2` :74-77 →
`BodyEnhanced1`; `BodyEnhancedAbstract.decorate` :106-118 (withMargin
marginX=6 — THE folder-title margin, T6 narrowing #1). `DotData` ctor
:85-96 (entityFactory, topParent, links, leafs, groupHierarchy,
portionShower) = the svek bridge contract.

Wiring sites (verified): `src/diagrams/description/leaf-sizing.ts:128-135`
(folder narrowing), `src/diagrams/class/class-layout-generic-classifier.ts:70-86`
(gujigi exclusion), `src/diagrams/description/parse-state.ts:168-183`
(inline dedup to swap), class/state parsers (no dedup — grep-verified).
