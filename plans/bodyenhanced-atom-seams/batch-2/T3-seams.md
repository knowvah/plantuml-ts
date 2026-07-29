# T3 — Both pipeline seams

## Context

Two of T6's four narrowings are seam gaps, not port gaps.

**Seam A — ink.** `AtomImageResolver` (`creole-atoms.ts:120`) returns
`{href, width, height}`. The use-case ellipse fits to `Footprint` POINTS,
which must be INK, not the declared box. Routing without ink widened
`bootstrap-0` and `ruziru-69`. Per ADR-2 add OPTIONAL
`inkX/inkY/inkWidth/inkHeight` — mirroring `SpriteSvg`, which already
carries exactly these. Absent fields must mean today's behaviour, byte for
byte.

**Seam B — the font that already exists.** Per ADR-3, **do not add a
seam.** `buildLineAtoms(line, font, imgFallbackFont?)` already exists
(`StripeSimple.ts:279`) and threads end-to-end inside that file — but no
caller outside ever passes it, so the `<img>` cannot-decode fallback always
draws at the line font instead of the DIAGRAM default. Thread the
diagram-default font from `buildTextBlock` down. Verified fact, jar-backed:
`<img:x/y.svg>` measures 100.362×14 with and without a per-element font,
because `(Cannot decode)` renders at the diagram default 14.

## Write-set

- `src/core/creole-atoms.ts`
- `src/core/svek/image/EntityImageDescriptionSupport.ts`
- `src/diagrams/description/leaf-sizing-text.ts`
- co-located tests

## Read-set

- `src/core/klimt/creole/legacy/StripeSimple.ts:110-113, 167-170, 211, 276-288`
- `src/core/klimt/sprite/SpriteSvg.ts` — `inkX/inkY/inkWidth/inkHeight`
- `src/diagrams/description/leaf-sizing-text.ts#inlineFootprintBox` — how
  ink already reaches the footprint via the `sprites` lookup; mirror that
  shape rather than inventing a second one
- `src/core/svek/image/EntityImageDescriptionSupport.ts:397` (`buildTextBlock`)

## Acceptance criteria

- Given a sprite whose ink ≠ declared box, when resolved, then the resolver
  reports ink offsets
- Given a resolver that omits the ink fields, then behaviour is
  byte-identical to today
- Given an `<img>` that cannot decode, then `buildTextBlock` passes the
  diagram-default font as `imgFallbackFont`
- Given the full suite, then **nothing moves** — these are seams, and
  nothing routes through them until T4
- Given ADR-3, then NO new font-seam API is added

## Observability / Rollback

N/A. Reversible.

## Quality bar

All four gates; all three ratchets EXACTLY unchanged. Movement here means a
seam changed behaviour, which it must not do yet.
