# Batch 3 — Port the Body classes

One task. `BodyEnhanced1` and `BodyEnhanced2` share `BodyEnhancedAbstract`
and are constructed by the same factory, so splitting them would mean two
agents writing the same conceptual unit.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2b-1 | Port `BodyEnhanced2` + `BodyFactory.create3` | typescript-pro | `src/core/cucadiagram/BodyEnhanced2.ts`, `BodyFactory.ts` | T9c | [ ] |
| ~~T2b-2~~ | ~~`BodyEnhanced1` + `create2`~~ — **MOVED TO MISSION SI1 (ADR-10)** | — | — | — | n/a |

Still not wired in. Ratchets must remain EXACTLY unchanged after this
batch — T4 is where behaviour moves.

## T2b was split — ADR-10

T2b stopped in its first attempt because both concrete bodies bottom out in
unported code. Batch 3a then ported the whole creole `Display`/`Sheet`/
stripe layer (~2,300 lines, T7–T10g), which unblocks **`BodyEnhanced2`** —
its `getTextBlock` is `display.create9(...)`.

**`BodyEnhanced1` is still blocked and now belongs to SI1.** Its
`buildTextBlock` constructs `MethodsOrFieldsArea`, whose cascade measures
**≈12,100 Java lines** across two levels and pulls in `net/atmp/CucaDiagram`
(953) and `cucadiagram.Bodier` — SI1's own scope per `CLAUDE.md` and this
mission's README. See ADR-10 for the full accounting.

**What that costs this mission.** T6 narrowing #1 (folder/package, 8
fixtures) routes `name` → `create2` → `BodyEnhanced1`, so it is deferred.
Narrowings #2 and #3 already landed in T3. `decorate`'s margin arithmetic
is ported (T2a), so SI1 inherits a working separator/margin layer.
