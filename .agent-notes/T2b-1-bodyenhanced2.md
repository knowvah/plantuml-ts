# T2b-1 — BodyEnhanced2 + BodyFactory.create3

## Observation: `getTitle` was portable this time — Display now exists

- **Context**: T2a's `BodyEnhancedAbstract.ts` dropped
  `BodyEnhancedAbstract#getTitle(String, ISkinSimple)` because `Display`
  did not exist yet at that time.
- **Finding**: `Display` landed in T9c, and THIS task is `getTitle`'s one
  real caller (`BodyEnhanced2.java:98`). Per the ADR-8 corollary ("not
  ported yet is never unreachable"), it must be ported now. Since
  `BodyEnhancedAbstract.ts` is off-limits for this task's write-set,
  `getTitle` was ported as a PRIVATE method on `BodyEnhanced2` instead of
  the shared base — a scope-forced duplication (only one subclass exists
  today), not a design choice. Flagged for whoever ports `BodyEnhanced1`
  (SI1/T2b-2) to consolidate onto one shared owner per ADR-7's "one owner"
  preference.
- **Impact**: `BodyEnhanced1`'s eventual port will need the identical
  method; SI1 should either import a promoted shared copy or accept a
  second (currently unavoidable) duplicate.
- **Confidence**: High — read `BodyEnhancedAbstract.java:56-62` directly.

## Observation: `rawBody.iterator()` must be `asList()`, not `[Symbol.iterator]()`

- **Context**: Porting the separator loop's element iteration
  (`BodyEnhanced2.java:88`).
- **Finding**: Java's `Display#iterator()` (`Display.java:551-553`) returns
  `displayData` VERBATIM (a `ListIterator<CharSequence>` over the raw
  list). This port's `Display#[Symbol.iterator]()` intentionally COERCES
  a `MessageNumber` element to a plain string (`Display.ts`'s own module
  doc comment) — using it here would silently diverge from upstream for
  any `Display` containing a `MessageNumber` element. `Display#asList()`
  is the faithful, uncoerced equivalent, walked by index so the embedded-
  diagram helper can share the same cursor position (Java passes the same
  `Iterator` object by reference; TS returns `{display, index}` pairs
  instead — behaviorally identical, no `ListIterator` to alias in TS).
- **Impact**: A future port bottoming out in `Display#iterator()` should
  check this note before reusing `[Symbol.iterator]()` reflexively.
- **Confidence**: High — read `Display.java:551-553` and `Display.ts`'s
  own doc comment directly; cross-checked no `MessageNumber` divergence
  risk remains.

## Observation: `create1`/`Body3` reconfirmed permanently out of scope

- **Context**: Task instructions required re-verifying (not re-trusting)
  the earlier T2b attempt's finding.
- **Finding**: `BodyFactory.BODY3 = false` (java:56) is read only by
  `BodierLikeClassOrObject.java:212` (`if (BODY3) ...` — permanently dead
  since the flag is a compile-time-constant `false`). `create1`'s only
  real callers, grep-verified against `~/git/plantuml` fresh in this task,
  are the SI1-excluded `Bodier*` classes. Confirmed unchanged from
  `.agent-notes/T2b-body-classes.md`'s finding — not merely re-asserted.
- **Confidence**: High.

## Prerequisites check

- `TextBlockVertical` — EXISTS (`src/core/klimt/shape/TextBlockVertical.ts`),
  used as-is.
- `TextBlockUtils.withMinWidth` — EXISTS, used as-is.
- Neither needed porting; both were read in full before use.
