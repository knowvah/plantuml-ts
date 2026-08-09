# T2b — STOPPED before writing code: `BodyEnhanced1`/`2` bottom out in
unported `SheetBlock1`/`Display`/`MethodsOrFieldsArea`, not just
`decorate`'s separator loop

## Observation: `BodyEnhanced1.getArea`'s non-separator content construction
requires `MethodsOrFieldsArea` (442 Java lines), which is SI1's member model

- **Context**: Reading `BodyEnhanced1.java:123-187` (`getArea`) to port the
  separator loop per ADR-4.
- **Finding**: For EVERY block of display lines between separators —
  including the common case of ZERO separators (a typical component/
  usecase/state title) — `getArea` calls `buildTextBlock(display, ...)`
  (`BodyEnhanced1.java:189-195`), which unconditionally constructs `new
  MethodsOrFieldsArea(display, skinParam, align, entity, style)`
  (`MethodsOrFieldsArea.java`, 442 lines). This class is NOT ported anywhere
  in this repo (`find ... -iname MethodsOrFieldsArea.ts` → no results). It
  handles: `Member`/`VisibilityModifier`/small-icon layout
  (`hasSmallIcon`/`getUBlock`), `Url` tracing (`TextBlockTracer`),
  `EmbeddedDiagram` stacking, `Ports`/`WithPorts` (port-shortname scoring),
  and `ULayoutGroup`+`PlacementStrategyY1Y2*` placement — i.e. the SAME
  member model T2b's own spec calls "out of scope: mission SI1" for
  `createLeaf`/`createGroup`. `MethodsOrFieldsArea` is reached from BOTH
  `create1` (List<Member>) and `create2` (plain `Display`) — the class does
  not distinguish; it is a REAL, unavoidable dependency of `create2` even
  though `create2`'s actual callers (component/usecase/state/lollipop/
  requirement titles — verified via `grep -rn "BodyFactory.create2"`) never
  pass `Member` CharSequences, only plain title strings.
- **Impact**: A literal, faithful port of `BodyEnhanced1` cannot avoid this
  dependency. The REACHABLE subset (no `Member`, no icon, no embedded, no
  ports — just "each display line -> TextBlock, stack vertically with
  `align`") is small in isolation, but it is genuinely a DIFFERENT Java
  class (442 lines) outside T2b's declared write-set
  (`BodyEnhanced1.ts`/`BodyEnhanced2.ts`/`BodyFactory.ts` only).
- **Confidence**: High — read `MethodsOrFieldsArea.java` in full, confirmed
  no TS port exists, confirmed all 11 real callers of `create2` in
  `~/git/plantuml` via grep.

## Observation: BOTH `BodyEnhanced1`'s per-line rendering AND
`BodyEnhanced2`'s `Display#create9` bottom out in `SheetBlock1` — a
241-line Creole "Sheet" assembly class this port has never built

- **Context**: Tracing what `MethodsOrFieldsArea#createTextBlock` (the
  non-`Member` branch, `Display.getWithNewlines(pragma,
  s).create8(config, align, skinParam, CreoleMode.SIMPLE_LINE,
  style.wrapWidth())`) and `BodyEnhanced2#getTextBlock`
  (`display.create9(titleConfig, align, skinParam, lineBreakStrategy)`,
  `BodyEnhanced2.java:137-140`) actually do.
- **Finding**: `Display.create7/create8/create9` (`Display.java:619-634`)
  all delegate to `create0` -> `getCreole` -> eventually `new
  SheetBlock1(sheet, maxMessageSize, padding, marginX1, marginX2)`
  (`Display.java:699`, `SheetBlock1.java`, 241 lines) — the real Creole
  "Sheet" TextBlock-assembly layer (word-wrap via `LineBreakStrategy`,
  multi-`Stripe` stacking with the Atom-altitude/ascent-descent model).
  `SheetBlock1` is NOT ported (no `SheetBlock1.ts` anywhere in
  `src/core/klimt/creole/`). This is the EXACT gap
  `EntityImageDescriptionSupport.ts`'s own `SEPARATOR_SIZE_HEIGHT` doc
  comment already names: "Upstream's real stacking is `SheetBlock1`/
  `StripeSimple`'s Atom-altitude system... a substantially larger, unported
  creole layout subsystem." `Display` itself (796 Java lines) has no
  `src/core/` owner at all — only the LOW-LEVEL per-line atom pipeline
  (`klimt/creole/legacy/StripeSimple.ts#buildLineAtoms`, E2r/L1) exists,
  which is one layer below `Sheet`/`SheetBlock1`, not a substitute for it.
- **Impact**: A faithful port of `decorate`'s separator loop (ADR-4) is
  achievable using T2a's ported `TextBlockLineBefore` — that part is fine.
  But the CONTENT each separator-delimited block wraps (the actual title/
  description text) requires either (a) porting `Display`+`SheetBlock1`
  (a foundational, ~1000-line subsystem reused far beyond just these two
  classes — not a T2b-sized addition), or (b) building a scoped substitute
  reusing this port's existing per-line atom pipeline
  (`buildLineAtoms`/`TextBlockVertical`) — which is exactly the "invisible
  divergence" `CLAUDE.md` forbids if done without a locked ADR, since it
  would silently diverge from `SheetBlock1`'s real word-wrap/altitude
  behavior while `decorate`'s separator geometry is byte-faithful.
- **Confidence**: High — read `Display.java`'s `create7/8/9`/`create0`
  chain directly, confirmed `SheetBlock1.java` (241 lines) is the
  terminus, confirmed no TS port of `Display` or `SheetBlock1` exists via
  `find`/`grep` across `src/core/klimt/creole/`.

## Why this is a STOP, not a judgment call

- Both dependencies are new files outside T2b's write-set
  (`BodyEnhanced1.ts`, `BodyEnhanced2.ts`, `BodyFactory.ts`, tests, this
  note) — the boundaries section requires "Ask first" for exactly this.
- `MethodsOrFieldsArea` is textually adjacent to the SI1 member model this
  task's own spec excludes, even though the REACHABLE subset for
  `create2`'s real callers is small and Member-free.
- `SheetBlock1`/`Display` is a foundational, cross-cutting Creole subsystem
  (reused by far more than just these two classes) that has never had a
  `src/core/` owner — sizing and scoping it is an architectural decision,
  not a T2b-local one, and CLAUDE.md forbids inventing a scoped substitute
  mid-port when the substitute would silently diverge from upstream's real
  algorithm (the "invisible divergence" antipattern named directly in
  ADR-4's own "Rejected" clause).

No code was written. `BodyEnhanced1.ts`, `BodyEnhanced2.ts`, `BodyFactory.ts`
do not exist yet. `create1`/`Body3` ARE confirmed NOT required
(`BodyFactory.BODY3 = false`, dead flag, `Body3` has no other caller) — that
part of the task is resolved and doesn't need revisiting.
