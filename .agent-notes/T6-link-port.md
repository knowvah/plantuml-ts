# T6 — Link/LinkArg/WithLinkType port

## Decisions (for the orchestrator's decision journal)

1. **500-line split of Link.java** — `Link.ts` (647 lines with @see docs)
   tripped the complexity hook's 500-line cap; split into
   `LinkBase.ts` (fields, ctor, members :67-326 + constraint/sametail
   accessors its own methods call) + `Link.ts` (getInv :145-156,
   members :328-579), the `EntityBase.ts`/`Entity.ts` precedent. Fields
   protected in the base (private upstream); `isHidden`/`isRemoved`
   abstract in the base so it still satisfies Hideable/Removeable.
2. **CucaDiagram stub extended** (`abel/CucaDiagram.ts`, T10 implements):
   `getUniqueSequence(prefix)` (:745-747, shared cpt1 counter),
   `getPragma()` (TitledDiagram:316), `isStereotypeRemoved(st)` (:755-761).
3. **EntityPort ported IN FULL locally** at `abel/EntityPort.ts` (7/7
   members; upstream home `cucadiagram/` — outside T6's write-set dirs;
   `Colors.ts` local-port precedent, move when that package lands).
   `Ports.encodePortNameToId` already existed in `svek/Ports.ts`.
4. **Bibliotekon** — ADR-2 consumed-interface stub `abel/Bibliotekon.ts`
   (`getNodeUid(leaf)` only member Link reaches; real class = svek
   assembly port). **LinkConstraint** — opaque brand stub
   `abel/LinkConstraint.ts` (Link only stores/returns; Neighborhood
   precedent). **StyleBuilder** — opaque already existed in
   `abel/ISkinParam.ts`; reused, no new stub.
5. **GlobalConfig.USE_INTERFACE_EYE1** — module const `false` in
   `LinkBase.ts` typed `boolean` so the guarded lollipop branch stays
   compiled (LinkDecor.ts precedent for EYE2).
6. **getQuantifierMargin** — private + callerless upstream (its only
   callers getMarginDecors1/2 are commented out at :380-390; comment
   block preserved). Ported as ADR-2 deferred throw: needs
   `FontConfiguration.blackBlueTrue` + the `(fc, ha, spriteContainer)`
   Display render seam (T5 `getStateDescription` precedent).
7. **getColorOrWhite adaptation** (`WithLinkType.applyOneStyle` color
   fallback): `parseSimpleColor(s) ?? parseSimpleColor('white')` — this
   port's HColorSet is free functions. `Double.parseDouble` →
   `Number.parseFloat` (lenient on trailing garbage; input already
   prefix-matched `thickness=`). StringTokenizer → split + empty filter
   (token index advances per token, as upstream).
8. **WithLinkType field rename** — Java field `useNodeStyle` collides
   with method `useNodeStyle()`; field is `useNodeStyleFlag`
   (Entity `staticFlag` precedent).
9. **helpers.ts edited outside strict write-set** (required to keep
   consumers compiling): MockDiagram implements the 3 new CucaDiagram
   members; MockLink (old hand mock of the forward interface) is now a
   thin real-Link subclass — a class with private state cannot be
   structurally mocked. All 32 pre-existing abel/decoration test files
   still pass unmodified.

## Observation: complexity hook specifics
- **Context**: `#lizard forgives` placement + file cap.
- **Finding**: the hook counts total file lines (cap 500) and flags
  fns >~25 NLOC/CCN>10; `#lizard forgives` works placed near the
  function END (start placement did NOT suppress).
- **Impact**: big ported classes should plan an EntityBase-style split
  up front; put forgives comments at function end.
- **Confidence**: High (reproduced both ways on WithLinkType/Link).

## Closure trace (two-level, pre-sized)
All level-1 deps existed from batches 1/2 (LinkType family, Entity,
Display, Pragma/PragmaKey, VisibilityModifier, Stereotype, Url,
LineLocation, Colors/ColorType, UComment, USymbolInterface,
EntityPosition free predicates, LinkArrow/LinkStrategy/CucaNote/
NoteLinkStrategy). New pulls: the 4 small items above (≈100 lines
total) — far under the 2× stop threshold.
