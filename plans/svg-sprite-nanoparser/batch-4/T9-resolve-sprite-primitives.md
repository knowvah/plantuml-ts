# T9 — `resolveSpriteAtom` returns `drawable` primitives

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

`resolveSpriteAtom` (`src/diagrams/description/render-atoms.ts:63-92`)
currently re-emits an SVG sprite verbatim as a base64 `image/svg+xml` data
URI:

```ts
const href = `data:image/svg+xml;base64,${toBase64(new TextEncoder().encode(svgSprite.svg))}`;
return { href, width: dims.width, height: dims.height };
```

One opaque `UImage`, one dimension channel. Upstream instead decomposes via
`SvgNanoParser` into per-`<path>` primitives, which is what gives `Footprint`
an ink signal independent of the declared box.

T6/T8 built the parser; T4 widened the resolver type; T7 taught `drawAtoms`
to draw primitives. This task connects them — and it is where rendered output
changes for the first time.

## Task

Change `resolveSpriteAtom` so an SVG sprite returns
`{kind: 'drawable', primitives, width, height}` with `width`/`height` the
**declared** (scaled) box, and `primitives` the decomposition from
`SvgNanoParser`. Leave monochrome PNG sprites, `<img>`, and openiconic on the
`image` path unchanged.

## Write-set

- `src/diagrams/description/render-atoms.ts` (modify)

Tests colocated per `~/.claude/rules/naming-conventions.md`.

## Read-set

- `src/diagrams/description/render-atoms.ts` (whole file, ~120 lines)
- `src/core/creole-atoms.ts:118-145` — T4's union
- `src/core/klimt/sprite/SvgNanoParser.ts` — T6/T8
- `src/core/klimt/sprite/SpriteSvg.ts:95-137` — the registry entry, its
  `svg` source and declared `width`/`height`
- `src/core/svek/image/EntityImageDescriptionSupport.ts:331-359` — T7's
  consumer, to confirm the shape matches
- `plans/s1l-leaf-sizing/ledger.md` § S1L-f part 2b — how SVG-form sprites
  reach the registry

## Architecture decisions (locked)

- [ADR-2](../decisions.md#adr-2) — `width`/`height` are the DECLARED box.
  Ink lives ONLY in `primitives`. Do not put ink in the dimension fields;
  that is precisely the collapse this mission removes.
- [ADR-4](../decisions.md#adr-4) — the full parser is available; use it.

### Non-goal

Do not add ink/measurement fields to `AtomImageResolver`
([ADR-2's non-goal](../decisions.md#adr-2)) → STOP.

## Interface contract

Consumes T4's union and T6/T8's parser. Produces the `drawable` variant.
The `spriteScale(atom.scale, font.size)` factor (`CommandCreoleSprite`'s
`fc.getSize2D() / 13.0`) must apply to the decomposition exactly as it
applies to the declared dims today — drawn and measured geometry cannot
drift (S1L-f).

## Acceptance criteria

1. Given an SVG sprite, when resolved, then it returns `kind: 'drawable'`
   with the declared scaled box in `width`/`height` and no base64 data URI.
2. Given a monochrome PNG sprite, an `<img>`, or an openiconic atom, when
   resolved, then it still returns `kind: 'image'` with byte-identical
   behavior to before.
3. Given an unknown sprite name, then `undefined` — the existing
   "contributes nothing" rule (`StripeSimple.addSprite`) is unchanged.
4. Given the 389 SVG goldens, then **byte-identical**. None contains a
   sprite; any diff is collateral damage → STOP.
5. Given `bootstrap-0`, when rendered, then the emitted SVG contains `<path>`
   elements for the sprite and no `image/svg+xml` data URI. Record
   before/after output size in the journal.

## Quality bar

All four gates exit 0. SVG goldens 310/22/57 byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` exits 0.

**Expected non-closure:** the 0.029321in widening does NOT close here —
`fitToInk` still substitutes on the sizing side until T10. If it appears to
close early, journal it and verify the mechanism before accepting it.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — revert the commit; sprites return to the data-URI path.

## Boundaries

**Always:** keep the scale factor identical between drawn and measured
geometry. Record the user-visible output change in the commit message.
**Never:** touch `leaf-sizing.ts` (T10's write-set) or re-pin
`size-backlog.json` (STOP).

## Method rules

1. **Trace two dependency levels** — `render-atoms.ts`'s consumers are
   `renderer-entity.ts:225,293`; check THEIR consumers before ruling on
   blast radius.
2. **Verify any "already fixed / already wired" claim against the CURRENT
   call graph**, not the commit that introduced it.

## Commit

One commit: `feat(T9): decompose SVG sprites into drawable primitives`

Body must note the user-visible change: SVG sprites now emit `<path>`
elements rather than a base64 `image/svg+xml` data URI, matching upstream's
`SvgNanoParser` decomposition.
