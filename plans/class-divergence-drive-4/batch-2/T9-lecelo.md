# T9 — lecelo: draw `<:name:>` emoji artwork in class creole (D8)

**Context.** Diagnosis: `../diagnosis/lecelo-92-loma110.md` (HIGH mechanism).
- The jar does NOT drop `<:label:>`. It draws the Twemoji artwork:
  `StripeSimple#addEmoji` (`klimt/creole/legacy/StripeSimple.java:245-264`) →
  `AtomEmoji#drawU` (`klimt/creole/atom/AtomEmoji.java:66-68`,
  `emoji.drawU(ug, this.factor, this.color)`) → `Emoji#drawU`
  (`emoji/Emoji.java:154-181`: `SvgSpriteParserFactory.create(data, null, null)`
  then `parser.drawU(ug, scale, …)`).
- `src/diagrams/class/class-member-atom-resolve.ts:161-169` (`resolveEmojiAtom`)
  always emits a platform-glyph `text` atom. `class-member-creole.ts:306` does
  not pass it the emoji artwork (`SpriteRegistry.emoji`,
  `core/sprite-registry.ts:67`).
- The description engine already draws the artwork
  (`core/svek/image/EntityImageDescriptionEmoji.ts#drawEmojiAtom`). Reuse that
  decomposition seam; do not re-port it.
- Harness gap: the class survey (`scripts/svg-parity-survey.ts:274,298`) and
  `render-diff.mts` pass only the sprite store. The class ratchet and the census
  pass none. The jar always has its artwork, the same argument as the survey's
  own sprite comment (`:265-271`). The description ratchet already combines
  both stores (`tests/oracle/description-parity.ratchet.test.ts:105`).

**Task.** TDD.
1. Resolve a `<:name:>` atom to a `drawable` built from the artwork
   (`SvgNanoParser(artwork).drawU(collector, factor, …)`) when the store has it.
   Keep the glyph fallback when it does not. Keep sizing unchanged (36·f box,
   −3·f altitude).
2. Place it in the `Sea` exactly as the jar does. The first `M` of `1f3f7.svg`,
   scaled by 14/24, lands on the jar at origin (62.850, 124.000), which is our
   atom's x. Quote the `Sea`/`drawable` `dy` you rely on.
3. Harness: combine `buildEmojiAssetsStore()` into the class survey (both
   modes), `render-diff.mts`, the census (after T4) and the class ratchet.
   Journal this as a harness decision.
4. Survey every engine against `../measurements/b0-eng/`. Adding the store moves
   description/usecase emoji fixtures too. Journal each mover with its
   mechanism.

**Write-set:** `src/diagrams/class/class-member-atom-resolve.ts`,
`src/diagrams/class/class-member-creole.ts`, and
`src/diagrams/class/class-member-render-atom.ts` /
`class-member-sprite-render.ts` only if needed; `scripts/svg-parity-survey.ts`,
`plans/class-divergence-drive/tools/render-diff.mts`,
`scripts/svg-conformance-census.ts`, `tests/oracle/class.golden.ratchet.test.ts`,
tests.
**Depends on:** T5, T4 (census file).

**Acceptance.**
- Given lecelo, when surveyed with the emoji store, then `ent0003` draws 7
  `<path>`s and the verdict is conformant, or a residual with a mechanism.
- Given the `<U+…>`/`&#…;` classes (`ent0001`, `ent0002`), then unchanged.
- Given no emoji store, then the glyph fallback is unchanged (unit test).
- Given every engine, then 0 conformant losses, and every mover is journaled.

**Observability** N/A. **Rollback** Reversible.
