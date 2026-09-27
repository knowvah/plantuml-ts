# lecelo-92-loma110 — diagnosis (cdd4-T5)

Measured on `a21795294`: diverged, 6 S / 5 N, all in `g[3]`. That group is the
classifier `"<:label:> label\n<:wrench:> wrench\n<:hammer_and_wrench:> …"`.

## Mechanism

The cdd3 lead said "the jar drops `<:label:>`". **That is false.** The jar draws
each `<:name:>` emoji as its Twemoji vector artwork: 7 `<path>` elements in
`g[3]` (1 + 3 + 3), with fills `#FFD983`, `#D99E82`, `#C1694F`, `#8899A6`,
`#F4900C` and `#66757F`. The class creole-atom resolver always renders an emoji
atom as a platform-glyph `<text>` run at font 36·factor (`🏷`, `🔧`, `🛠`), even
when the artwork is available. The diffs follow from that: `childCount` 11 vs 7,
and every `<text>` index shifts by one.

## Java (quoted)

- `klimt/creole/legacy/StripeSimple.java:245-264`, `addEmoji`
  (`final Emoji emoji = Emoji.retrieve(emojiName); … atoms.add(new AtomEmoji(emoji, scale, fontConfiguration.getSize2D(), col));`).
- `klimt/creole/atom/AtomEmoji.java:66-68`
  ```java
  public void drawU(UGraphic ug) {
      emoji.drawU(ug, this.factor, this.color);
  }
  ```
- `emoji/Emoji.java:154-181`. `loadIfNeed` reads `Dummy.class.getResourceAsStream(unicode + ".svg")`
  and builds `this.parser = SvgSpriteParserFactory.create(data, null, null);`
  (`:172`). Then:
  ```java
  public void drawU(UGraphic ug, double scale, HColor colorForMonochrome) {
      try { loadIfNeed(); } catch (IOException e) { Logme.error(e); }
      parser.drawU(ug, scale, colorForMonochrome, colorForMonochrome);
  }
  ```
- The `<U+1F3F7>` and `&#127991;` forms are not `<:name:>` atoms. The jar keeps
  them as text glyphs, and `ent0001`/`ent0002` are byte-equal in both SVGs.

## TS origin

- `src/diagrams/class/class-member-atom-resolve.ts:161-169`, `resolveEmojiAtom`:
  `const run = emojiRenderRun(atom); return { atom: { kind: 'text', … } … }`.
  It takes no artwork resolver, and its doc comment says "the Twemoji SVG
  artwork upstream draws (`Emoji#drawU`) is not ported".
- `src/diagrams/class/class-member-creole.ts:306`
  `if (atom.kind === 'emoji') return resolveEmojiAtom(atom);`. The
  `sprites: SpriteRegistry` (which carries `.emoji`,
  `core/sprite-registry.ts:67`) is in scope but not passed.
- The description engine already ports the artwork draw
  (`core/svek/image/EntityImageDescriptionEmoji.ts#drawEmojiAtom`:
  `new SvgNanoParser(artwork).drawU(ug, atom.factor, undefined, undefined)`).
  The class path never reached it.

## Causal chain

The class name `Display` → creole `<:label:>` → an `emoji` atom →
`resolveEmojiAtom` → a `text` render atom. Where the jar emits 3 artwork
`<path>`s plus the `label` text, we emit one glyph `<text>` plus the `label`
text. Sizing is already right (rect 162.363 × 78.25, and the `label`/`wrench`
text x/y match the jar's text[1]/text[2]), so only the drawn shape differs.
The artwork arithmetic confirms it. The first `M` of `assets/emoji/1f3f7.svg`
is (32.017, 20.181), which is (18.677, 11.772) at factor 14/24. The jar path
starts at (81.527, 135.772), so the implied origin is (62.850, 124.000), which
is exactly our atom's x.

## Ruled out (with evidence)

- **"The jar drops it"** (cdd3 T23, `fixtures.md`): the jar `ent0003` has
  7 `<path>`s (dumped in this diagnosis).
- **A missing asset store alone:** `scratch/lecelo-emoji-store.mts` renders with
  the survey store (sprites only) and with sprites + `buildEmojiAssetsStore()`.
  Both give 6 S / 5 N, and `ent0003` is `[rect,text,…]` both times, so the class
  path ignores the artwork.
- **Emoji sizing / `Sea` altitude:** the box and the text positions are equal to
  the jar.
- **The `<U+…>` and `&#…;` forms:** byte-equal, so they are out of scope for
  the fix.

## Probe

`npx jiti plans/class-divergence-drive-4/diagnosis/scratch/lecelo-emoji-store.mts`
(output in `scratch/lecelo-emoji-store.out`):
```
sprites-only (survey): structural=6 numeric=5 ent0003 tags=[rect,text,text,text,text,text,text]
sprites+emoji: structural=6 numeric=5 ent0003 tags=[rect,text,text,text,text,text,text]
```

## Harness gap (same fixture)

The class survey (`scripts/svg-parity-survey.ts:274,298`, both render modes)
and `render-diff.mts` pass only `buildSpriteAssetsStore()`. The class ratchet
(`tests/oracle/class.golden.ratchet.test.ts`) and the census pass no asset
store at all (T4 adds the sprite store to the census). Even a correct renderer
would draw the fallback glyph under the survey. The jar always has its emoji
artwork, the same argument as the survey's own sprite comment
(`svg-parity-survey.ts:265-271`). The description ratchet already combines both
stores (`tests/oracle/description-parity.ratchet.test.ts:105`).

## Fix shape

- Write-set: `src/diagrams/class/class-member-atom-resolve.ts`,
  `src/diagrams/class/class-member-creole.ts`, and
  `class-member-render-atom.ts` / `class-member-sprite-render.ts` only if the
  `drawable` atom needs it. Harness: `scripts/svg-parity-survey.ts`,
  `plans/class-divergence-drive/tools/render-diff.mts`,
  `scripts/svg-conformance-census.ts`, and
  `tests/oracle/class.golden.ratchet.test.ts`, all combining the emoji store.
  Plus tests.
- Task: batch-2 T9.

## Confidence

HIGH on the mechanism and origin. MEDIUM that the fix reaches 0/0: the Sea `dy`
of a `drawable` emoji (36·f box, −3·f altitude) is not probed.
