# T1 — Hardcode the `<img>` fallback font; delete the seam

## Context

`AtomImg.create` (`AtomImg.java:105-107`) hardcodes the font every
cannot-decode path uses:

```java
final UFont font = UFontFactory.monospace(14);
final FontConfiguration fc = FontConfiguration.blackBlueTrue(font);
```

The previous mission's ADR-3 instead threaded an `imgFallbackFont` from
`buildTextBlock`, believing the fallback should draw at the diagram default.
It should not. The jar's 100.362×14 measurement was this constant.

## Task

1. Reproduce `monospace(14)` + `blackBlueTrue` at the fallback site.
2. **Delete the `imgFallbackFont` seam entirely.** Current sites (verify by
   reading — this list is a starting point, not gospel):
   `StripeSimple.ts` (9 references), `EntityImageDescriptionSupport.ts` (2),
   `leaf-sizing-legacy-fallback.ts` (1).

`leaf-sizing.ts` also references it but belongs to **T3** — do not touch it.

## Write-set

- `src/core/klimt/creole/legacy/StripeSimple.ts`
- `src/core/svek/image/EntityImageDescriptionSupport.ts`
- `src/diagrams/description/leaf-sizing-legacy-fallback.ts`
- co-located tests

## Read-set

- `~/git/plantuml/.../klimt/creole/atom/AtomImg.java:105-200` — the constant and every path using it
- `~/git/plantuml/.../klimt/font/UFontFactory.java` — `monospace`
- `~/git/plantuml/.../klimt/font/FontConfiguration.java` — `blackBlueTrue`
- `src/core/klimt/creole/legacy/StripeSimple.ts:110-113, 167-170, 276-288`
- `decisions.md#adr-1--hardcode-the-img-fallback-font-do-not-thread-one`

## Acceptance criteria

- Given a cannot-decode `<img>`, when measured, then it uses `monospace(14)` traceable to `AtomImg.java:106`
- Given ANY per-element font, when a cannot-decode `<img>` is measured, then the result is identical — the element font must not reach it
- Given the codebase, when `imgFallbackFont` is grepped, then zero references remain outside T3's `leaf-sizing.ts`
- Given the suite, then it is green and no diff-count baseline RISES

## If a seam site turns out to have a live consumer

**STOP.** ADR-1's premise is that this seam is dead. A live consumer means it
is not, and the deletion must not proceed on assumption.

## Observability

N/A — no new observable operations. This is a synchronous library.

## Rollback

**Reversible** — one commit, code and tests together.

## Quality bar

All four gates (run `npm run lint` separately). Ratchets: description
>= 320/351 w0, DOT 262/90/708 EQUAL, class 219/708 w0. No diff-count rise.
