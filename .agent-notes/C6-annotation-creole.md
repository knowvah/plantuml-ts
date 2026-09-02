## Observation: the box-label widening is blocked by `scale-geo.ts` exactly as C5's separator was

- **Context**: `plans/sequence-creole` C6, whose write-set names
  `layout.ts#boxLabelRun` and `geo-annotation.ts` but not `scale-geo.ts`.
- **Finding**: a box label is an `AbstractTextualComponent` `Display` like
  every other sequence label — `ComponentRoseEnglober` extends it and builds
  its block through the same `create0`
  (`skin/rose/ComponentRoseEnglober.java:57-60`, `AbstractTextualComponent
  .java:89-92`) — so routing it through the seam turns `BoxGeo.labelRun?:
  TextRun` into an array. `scale-geo.ts:150` names that field
  (`...(b.labelRun !== undefined ? { labelRun: scaleRun(b.labelRun, k) } :
  {})`) and `scaleRun` takes a `TextRun`, not an array, so the widening is a
  type error in a file outside the write-set. There is no in-set alternative:
  keeping the field singular either drops runs or needs a second whole-line
  fallback, which `sequence-creole.ts`'s own doc forbids.
- **Impact**: this is the SECOND C-task blocked on the same one line
  (`.agent-notes/C5-frame-creole.md` records the first, for
  `branchSeparators[].run`). Any future brief that widens a sequence geo field
  must budget `scale-geo.ts` in the same write-set. Measured reach if it is
  done: **zero** corpus fixtures — all 59 `box` declarations in the 1,141-case
  sequence corpus carry a plain label, none with creole markup. C6 did route
  the box label through the renderer's shared per-run emitter, so the STYLE
  half is already in place and only layout's producer is left.
- **Confidence**: High — both Java classes read, the field's consumers
  grepped, and the corpus's `box` lines enumerated.

## Observation: routing a note/divider through the seam must ALSO resize its box, or the box is sized from a string that is never drawn

- **Context**: same task. The brief asked for runs; the sizing was not named.
- **Finding**: `AbstractTextualComponent#getTextWidth` is
  `getPureTextWidth(stringBounder) + getOldPaddingX1() + getOldPaddingX2()`
  and `getPureTextWidth` is `textBlock.calculateDimension(stringBounder)
  .getWidth()` (`:100-108`) over the block `create0` built FROM the creole
  `Display` (`:89-92`). So the reserved width is the creole block's, never the
  raw display string's. `moxope-92-roco972` is the proof: the jar's note box
  for `<b>bold</b>` is 86.163..131.163 = 45, i.e. the 24.619-wide run plus
  padding, not the ten markup characters. Leaving the sizing on the raw string
  while the runs come from creole draws a 24.619-wide label inside a
  64-wide box.
- **Impact**: `text-block-geo.ts#refBodyWidth` (C5's) still measures the raw
  line and is the remaining instance of this: a `ref` body with markup gets a
  box sized for its markup. One follow-on, one function.
- **Confidence**: High — Java method bodies read; jar box measured against the
  jar's own run width.

## Observation: `\t` in a note body becomes a REAL tab at the seam, and did not before

- **Context**: same task. `midipu-78-meva271` changed although its source has
  no creole tags at all.
- **Finding**: `buildLineAtoms` runs `resolveTextEscapes` per atom
  (`StripeSimple.ts:404`), whose `\\` branch rewrites `\t` to U+0009
  (`core/text-escapes.ts:21`, upstream `StringUtils.java:140-145`). A note
  body reaching creole for the first time therefore stops emitting the literal
  two characters `\t`: `1\t2\t3` went from `textLength="35.994"` over six
  literal characters to `21.694` over `1<TAB>2<TAB>3`, which is the jar's own
  glyph total for `123`. `\t4` becomes `4` — the leading tab is inside the
  width but trimmed out of the emitted string by `trin`
  (`DriverTextSvg.java:125`).
- **Impact**: the jar draws tab stops — three `<text>` at 52px intervals
  (x=214.925/266.925/318.925) — where this port draws one run holding real
  tabs. That is a NEW named remainder of the same family as
  `.agent-notes/C1-sequence-creole-seam.md`'s: sequence has no tab-stop
  geometry. Content moved toward the jar, placement did not. Nothing about it
  is C6-specific; it will surface on any surface newly routed through the
  seam.
- **Confidence**: High — decoder read to `file:line`, reproduced through
  `sequenceCreoleRuns` directly, and the jar's tab stops measured.

## Observation: four ratchet rises, all benign by the C2 rule, alongside four descents

- **Context**: same task. The sequence ratchet is 76 red slugs before AND
  after, but the membership moved by four.
- **Finding**: every one of the four new reds still short-circuits at
  `svg/g[1][childCount]` on both sides, and every one moved TOWARD the jar:

  | fixture | ours before | ours after | jar | score |
  |---|---|---|---|---|
  | `migodo-28-fodi331` | 16 | 22 | 24 | 331 -> 376 |
  | `nibiju-55-kavu710` | 25 | 26 | 31 | 452 -> 469 |
  | `popoda-09-xavi089` | 27 | 31 | 37 | 507 -> 536 |
  | `xujavu-00-xodi798` | 22 | 26 | 194 | 1383 -> 1412 |

  `compare.ts:396-406` charges a `[childCount]` short-circuit
  `sumUnits(actual) + sumUnits(expected)` — a function of the two subtrees'
  SIZES, not of how close their counts are — so adding elements the jar also
  has raises the charge. The four that left the red set did so by DESCENDING:
  `gacujo-48-leto751` 1335 -> 317, `masibi-28-tidi862` 1033 -> 389,
  `pomoxu-05-luco302` 3738 -> 1161, `vuniba-19-repo187` 524 -> 154.
- **Impact**: confirms `.agent-notes/C2-newline-split.md`'s benign-rise rule
  on a second, independent change, and gives the parent mission the four pairs
  it needs to re-pin without re-deriving them.
- **Confidence**: High — measured with `compareSvg` at both refs.
