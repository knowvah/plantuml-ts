# R2a (A2s round 2) — creole monospace / emoji-unicode / sprite diagnosis

## Observation: class NAME headers never route through the creole engine
- **Context**: curupe-50/lecelo-92/rotisi-30 diagnosis; header widths measured raw.
- **Finding**: `class-layout-header-geo.ts:104` measures each header line with
  `measurer.measure(l, headerFont)` directly — no `buildLineAtoms` call, so no
  creole commands, no inline atoms, no `resolveTextEscapes` decode. Upstream
  routes the name through `Display#create8(..., CreoleMode.FULL_BUT_UNDERSCORE,
  ...)` (EntityImageClassHeader.java:107-108).
- **Impact**: every creole/escape feature in entity names (monospace, `<U+...>`,
  `&#N;`, emoji, sprites) is a header-consumer gap, not a creole-engine gap.
  The creole side now exposes `buildLineAtoms(line, font,
  CreoleMode.FULL_BUT_UNDERSCORE)` ready for that wiring.
- **Confidence**: High (jar probe + golden derivation to 0.0001px).

## Observation: member rows use the FULL creole map; upstream uses OTHER
- **Context**: porting the FULL/OTHER map split (CommandCreoleBuilder.java:69-70,
  StripeSimple.java:112-115).
- **Finding**: upstream MethodsOrFieldsArea passes `CreoleMode.SIMPLE_LINE`,
  which selects the OTHER map (no creole-pure `__underline__` command). This
  port's `class-member-creole.ts#buildMemberAtoms` calls `buildStripeAtoms`
  with the default FULL map, so `__text__` in a member row underlines here but
  not in the jar. Pre-existing; zero ledgered fixture depends on it today.
- **Impact**: when touching member-row creole, pass
  `CreoleMode.SIMPLE_LINE` to `buildStripeAtoms` to match the jar.
- **Confidence**: High (upstream source), untested against a jar probe.

## Observation: quoted `"DISPLAY" as CODE` capture rejects inner quotes
- **Context**: curupe-50 foo4/foo6 display text wrong before measurement.
- **Finding**: `class-declaration-extractors.ts:254` uses
  `/^"([^"]+)"\s+as\s+(\S+)$/` — `[^"]+` can't capture displays that CONTAIN
  quotes (`class ""Test"" as foo4` → jar display `"Test"`;
  `class "REST resource\n""url""" as foo6` → jar strips outer quotes). Java's
  NameAndCodeParser accepts inner quotes (lazy any-char content). Our fallback
  keeps the whole raw token (quotes and all) as display.
- **Impact**: parser-side half of curupe-50; file is owned by no round-2 task
  (R2d owns parser.ts but not class-declaration-extractors.ts) — orchestrator
  scope decision needed.
- **Confidence**: High (AST dump + golden width derivation).
