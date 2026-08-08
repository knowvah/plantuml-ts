# RESUME — S1L tail fix, wave 3 (Twemoji artwork)

**Written:** 2026-08-07; **updated 2026-08-07** when wave 3 closed.
**Branch:** `feature/s1l-tail-fix`
**Status:** wave 3 **DONE** — 352/356 (98.9 %), widened 0, the ceiling.

Read this file first, then `README.md`, then `decision-journal.md`'s last rows.

---

## Where conformance stands

**Description: 352 / 356 (98.9 %), widened 0 — the ceiling is reached.** Four
pins remain in `oracle/goldens/description/size-backlog.json`, and they map 1:1
onto the four non-conformant fixtures:

| Fixture | Status |
|---|---|
| `gafico-37-cuma657`, `nujito-06-neca370` | **excluded** — GH #24 `<code>` monospace |
| `gevozu-46-sasu860`, `sunuju-01-pote718` | **excluded** — LaTeX permanent divergence |
| `murava-69-tago286` | **CLOSED** — wave 3, pin deleted (see below) |

Ceiling is **352 / 356**, and it is now reached. No point remains available
at this pin.

Batch 5 (F5-a) no longer needs to chase `kokebo-27` — it closed during the pin
advance. Its remaining value is sweeping the other ~350 goldens for the same
stale-capture defect; six class fixtures (`01-assoc`…`06-package`) were already
found and fixed that way.

---

## WAVE 3 IS DONE — closed 2026-08-07

`murava-69-tago286` is conformant (delta 0.181655 -> **0**). Its pin is
deleted. **Description: 352 / 356 (98.9 %), widened 0 — the ceiling.** The
remaining 4 are the two permanent LaTeX divergences and the two `<code>`
monospace fixtures (GH #24); nothing else is closeable at this pin.

### The blocker this file previously named was MISDIAGNOSED

The earlier draft said the fix was to thread `emojiArtwork` into
`buildTextBlock` -> `drawAtoms`. That is wrong, and re-deriving it costs
hours. Recorded in full in `.agent-notes/s1l-wave3-emoji-sizer-channel.md`;
in short:

- `USymbolUsecase#asSmall(_name, label, stereo, ...)` **discards `name`**, so
  a usecase draws `this.desc` — the `buildDesc`/`descAtomOps` path that was
  ALREADY wired. `drawAtoms` is never reached for this fixture.
- The real gap was in the **SIZER**. `BoxSizingOpts.emojiArtwork` has TWO
  construction sites: `layout-helpers.ts#degenerateSingleLeaf` (wired) and
  `layout-dot-tree.ts#buildDotNodes` (not wired). `murava-69` has a link, so
  it takes the second. `Footprint` fits the ellipse to what is DRAWN, so the
  sizer measured the platform glyph while the renderer drew real artwork.

### What landed

- `ClassifyCtx.emojiArtwork` — a channel separate from `ctx.sprites`, since
  `spriteDimsLookupFor` keeps only sprite dims and drops the emoji store.
- `core/internal-emoji-store.ts#emojiArtworkResolverFor` — one factory both
  sites call, so they cannot drift.
- `layout-types.ts` — `ContainerDesc`/`ClassifyCtx`/`EdgeDotBuildResult`
  moved out of `layout.ts` (mechanical 500-line split; `layout.ts`
  re-exports them, so every import path is unchanged). `layout.ts` was
  EXACTLY at the 500-line cap and had zero headroom for the new field.
- `description-parity.ratchet.test.ts` now wires the emoji asset store.
  **THREE harnesses must wire an identical store**, not the two this file
  previously named — the ratchet was the one left behind, and it still
  asserted 0.181655 after the measure already read 0.

## Verify commands

```sh
npm run typecheck && npm run lint && npm run build && npm test
npx tsx scripts/measure-description-size-deltas.ts   # widened MUST be 0
npx tsx scripts/audit-size-metric-identity.ts        # falseConformant 0
npx tsx scripts/vendor-emoji.ts --verify             # 0 drifted (CC-BY proof)
npx tsx scripts/vendor-sprites.ts --verify           # 0 drifted
```

**Never pipe a gate** — `tail`'s exit code masks the real one. `widened > 0` is
a stop condition.

---

## Landed earlier this session (context for the above)

| Commit | What |
|---|---|
| `ab2a5e6d` | 3 opt-in packages: `sprites-archimate` (MIT), `emoji` (CC-BY 4.0), `all` |
| `b258989b` | Vendored 1174 Twemoji SVGs + CC-BY notice + manifest + `--verify` |
| `b9ee6919` | Licence review: Twemoji artwork is **CC-BY 4.0**, not MIT |
| `0d0d130d` | Advanced oracle pin → `11ed6720`; 346 → 351/356 |
| `48020fb0` | Corrected a wrong finding (pin drift, not a stale jar) |
| `c2b9cc81` | F4-f: stereotype sprites resolve in sizer + renderer |
| `9e8b22dc` | Svek ColorSequence order — `idsAligned` 34 → 317/356 |
| `e5aa5295` | Landed + closed Batch 4 |

---

## Gotchas that cost time — do not rediscover

- **The core package is `files: ["dist"]`.** `assets/**` never ships to npm.
  Moving assets into packages closed a DISTRIBUTION gap, not a licence leak.
- **Emoji assets are bare `<path>`/`<circle>` fragments, no `<svg>` root, no
  viewBox.** `SpriteSvg.from()` will NOT parse them. `SvgNanoParser` handles
  them natively — it ignores `<svg>`/`</svg>` tags outright
  (`SvgNanoParser.ts:216`). Never "repair" them into documents: that modifies
  a CC-BY work AND changes the geometry the oracle measures.
- **`assets/emoji/` and `assets/sprites/` are COMMITTED** (source is a pinned
  local checkout CI cannot regenerate); `packages/*/assets/` are gitignored
  copies made at `prepack`.
- **The reference checkout is 59 commits ahead of the OLD pin** — now
  reconciled in `pin.json`, and `build-oracle.sh` now FAILS on drift instead of
  warning. A pin-drift audit of port work done after 2026-07-26 is still an
  open follow-up (`findings/svg-sprite-ceil-vs-floor.md`).
- **Two harnesses must agree.** `audit-size-metric-identity.ts` silently
  measured a different diagram than the ratchet for want of an `assetStore`;
  the tell was `conformantSorted` 347 vs the measure's 351. If those two
  numbers ever disagree, that is a bug, not rounding.

---

## Open follow-ups beyond wave 3

1. **SVG suites not re-baselined** — 402 byte-compared goldens; two "reduce SVG
   output size" commits are in the pin range. Recorded in
   `oracle/pin.json:previousPin.svgSuitesNotRebaselined`.
2. **Pin-drift audit** — `SpriteSvg`'s `Math.ceil` was ported from post-pin
   source; it may not be the only one.
3. **Batch 5 (F5-a)** — re-scope to the sweep; `kokebo-27` already closed.
4. **F4-a's two tracked gaps** — PNG sprites measure but have no draw path
   (23 of 139 vendored files); only the `jar:` form of `CommandSpriteFile` is
   reachable from browser-safe `src/`.
