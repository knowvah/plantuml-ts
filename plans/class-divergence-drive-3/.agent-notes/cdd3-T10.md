# cdd3-T10 — link note paint (S-4t, S-11, S-6, note ink walk, gradient stop)

## Observation: trailing link colour spec is a full Colors tokenizer
- **Context**: S-4t (xoxuni, nuvake).
- **Finding**: `CommandLinkClass.java:368` stores `Colors(spec, set, LINE)`
  (`Colors.java:95-124`); the label's font is muted with the TEXT entry
  (`SvekEdge.java:260-262`, `FontConfiguration#mute` `:195-201`), which also
  colours the magic-arrow glyph (same `font`). `name:value` tokens key by
  `ColorType.getType` (part before `.`), so `line.bold:purple` sets LINE and
  `arrow:X` wins over LINE at draw time (`SvekEdge.java:884-885`
  `getColor(ARROW, LINE)`). Ported as `class-relationship-colors.ts`
  `#parseRelColors`; the old bare-token-only resolver is gone.
- **Impact**: the `line.dashed|dotted|bold` stroke half of the same spec
  (`Colors.java:118-123`, applied at `SvekEdge.java:903-904`) is still not
  carried. The port keeps its pre-existing "bracket `-[#c]->` wins over a
  trailing LINE colour" rule; upstream's precedence (`SvekEdge.java:
  883-892`, with `ColorParser#getColor` returning `Colors.empty()`, never
  null) was not re-verified — no fixture carries both.
- **Confidence**: High (xoxuni conformant).

## Observation: EntityImageDescription url is portable now
- **Context**: S-11 (rakuci). The descriptive container's `[[url]]` was
  never captured; capturing it fixed the non-empty cluster, but the EMPTY
  container collapses to a leaf drawn by `EntityImageDescription`, whose
  port threw on a non-null url ("D3-prime" deferral).
- **Finding**: `UGraphicSvg#startUrl`/`closeUrl` are ported (cdd-T28), so
  the deferral no longer holds. `drawU` now brackets the inner draw with
  them inside the entity group (`EntityImageDescription.java:304-305,
  327-328`). `collapseEmptyNamespace` carries `ns.url` to the leaf (same
  entity after the mute). `CommandPackageWithUSymbol` also stores a BACK
  colour (`:215-216`) — now captured via `setNamespaceColor`.
- **Impact**: description's own `renderer-entity.ts` and
  `leaf-sizing-entity.ts` still pass `url: null` — a description-engine
  entity `[[url]]` is still unwrapped there (not in this write-set).
- **Confidence**: High (rakuci conformant).

## Observation: guxode Δ0.014 is graphviz SVG coordinate quantization
- **Context**: S-6's second half (guxode g[14], `AF-backto-CF2`).
- **Finding**: the jar parses graphviz's `-Tsvg` text, whose coordinates
  are 2-decimal (`dot -Tsvg` on the cached `svek-1.dot`: `M671.11,-380.67`);
  the port takes dot-engine `getLayout()` floats (671.106). The extension
  arrowhead's extremity move amplifies the 0.004 input gap to 0.014.
  Probe (temporary, reverted): rounding `edgeResult.points` to 2 dp in
  `class-edge-geo.ts` (`rawPts`) made guxode fully conformant. Not
  dot-engine's defect (its render() already matches real dot byte-exact,
  gvi 01 RESOLVED) — the consumer never quantizes.
- **Impact**: a shared primitive (every class edge); open for a dedicated
  task with a corpus-wide measurement. Not applied here.
- **Confidence**: High (probe + real dot).

## Observation: the note-on-link polygon is (int)-truncated
- **Context**: note ink walk (lipazi, nuvake, lozego).
- **Finding**: `ComponentRoseNote#drawInternalU` paints `x2 = (int)
  getTextWidth`, `textHeight = (int) getTextHeight` (`:107-109,118`) — the
  jar path runs 264.92 -> 408.92 (144), ours ran 144.582. `inkBox` is now
  truncated at `class-edge-note-box.ts`, feeding both the paint and the new
  `buildInkBox` walk (`LimitFinder#drawUPath`, plain bbox).
- **Impact**: remaining residual on all three fixtures is the MAIN label's
  position inside the merged note+label block: the port places the label
  at graphviz's label centre, ignoring `mergeLR`/`mergeTB`
  (`SvekEdge.java:318-325`, `TextBlockHorizontal`/`TextBlockVertical`),
  while `noteOffset` already offsets the note. lipazi's Δ26 canvas width
  is that label's ink. Open.
- **Confidence**: High (render-diff: only label x/y + canvas remain).

## Observation: gradient stop shortening moved to its producer
- **Context**: lozego `stop-color #00FFFF` vs jar `#0FF`.
- **Finding**: `svg.ts#resolvePaint` already shortened stops
  (`shortenStopColors`), but callers of `paint.ts#paintToSvg` directly
  (e.g. `renderer-note-link-box.ts`) did not. Shortening now lives in
  `paintToSvg`'s stop writer (`SvgGraphics.java:398,401,545-554`) and the
  svg.ts pass-over was deleted as redundant.
- **Impact**: every direct `paintToSvg` gradient caller now matches.
- **Confidence**: High.
