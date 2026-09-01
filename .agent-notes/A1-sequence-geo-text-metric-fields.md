## Observation: A1's three-scalar text-metric contract does not fit four of the
six sequence geos it names

- **Context**: `plans/sequence-text-and-y-convergence` batch 1 (A1), adding
  `textWidth`/`textAscent`/`textLineHeight` as REQUIRED fields to
  `ParticipantGeo`, `MessageGeo`'s runs, `NoteGeo`, `FrameGeo`, `DividerGeo`
  and `NewpageGeo` in `src/diagrams/sequence/ast.ts`.

- **Finding**: measured by adding the three fields verbatim and running
  `tsc --noEmit -p tsconfig.json` (48 errors). Four distinct problems, none
  visible from the type declarations alone:

  1. **`DividerGeo.textWidth` already exists, with a different meaning.**
     TS reports `Duplicate identifier 'textWidth'` at `ast.ts:548` and `:566`.
     The existing field is `AbstractTextualComponent#getTextWidth` — the text
     block PLUS the component's `topRightBottomLeft(4,4,4,4)` — and
     `renderer.ts#renderDividerLabel:242-246` uses it to size the label's
     background `<rect>`. It differs from a measured glyph width by 8.
     `DividerGeo.textHeight` is the same story on the other axis.
  2. **`NewpageGeo` carries no text at all.** Its fields are `y`, `height`,
     `bandX`, `bandWidth`. Upstream agrees: `ComponentRoseNewpage
     #drawInternalU` is three statements ending in
     `ug.draw(ULine.hline(dimensionToUse.getWidth()))` — one line, no text
     (`~/git/plantuml/.../skin/rose/ComponentRoseNewpage.java:57-62`), and
     `renderer.ts#renderNewpage` mirrors it. There is nothing for a text
     metric to describe, and batch 2's "newpage titles" (A5) has no source.
  3. **One scalar cannot describe a multi-line geo.** `NoteGeo.text` is split
     on `\n` at `renderer.ts:76` and `DividerGeo.lines` is already an array;
     `ParticipantGeo` has `display` plus N `stereotypeLines`. Each line has
     its own width, and `sequenceText` needs a per-line width to emit
     `textLength`. A per-geo scalar is only correct for the single-line case.
  4. **Required fields force edits outside A1's declared write-set.** The
     five construction sites are `sequence-layout-events.ts:331,402,443,558`
     (A4's file) and `sequence-layout-participants.ts:526` (A3's file), plus
     ~20 hand-built literals across six test files. A1's own gate is
     `git diff --name-only` listing exactly its four write-set files.

- **Impact**: the shape that actually fits is a per-RUN metric, not a per-GEO
  one — i.e. the three fields belong on `TextRun` (`text-block-geo.ts`, A2's
  file), with each geo carrying placed runs the way `MessageGeo.labelLines`
  and `FrameGeo.refBody` already do. That is a batch-2 interface change, so it
  is the maintainer's call, not a task-local one.

- **Confidence**: High — each of the four measured, not inferred: (1) and (4)
  from `tsc` output on the real edit, (2) from the upstream Java and both
  renderers, (3) from the renderer split sites.

## Observation: the sequence text emitter needs spread-conditionals for its
optional style fields

- **Context**: Same task, writing `src/diagrams/sequence/sequence-text.ts`.
- **Finding**: this project compiles with `exactOptionalPropertyTypes: true`,
  so `fontWeight: spec.fontWeight` (where `spec.fontWeight` is
  `'bold' | '700' | undefined`) is NOT assignable to `TextStyle.fontWeight`.
  Plain pass-through of an optional field to an optional field fails; the
  form that compiles is
  `...(spec.fontWeight !== undefined ? { fontWeight: spec.fontWeight } : {})`.
- **Impact**: every A2-A5 caller building a `TextStyle`-adjacent literal from
  optional inputs hits this. It is a compile error, not a silent one.
- **Confidence**: High — observed as TS2379 and fixed.

## Observation: a participant label's baseline is `cy - lineHeight/2 + ascent`,
and converting to it moves head and foot labels in OPPOSITE directions

- **Context**: A3, replacing `text-anchor="middle"` + `dominant-baseline="middle"`
  at a centre with the jar's left edge + baseline.
- **Finding**: the exact conversion from the centre this port already computed
  is `baseline = cy - textLineHeight / 2 + textAscent`, i.e. a shift DOWN of
  `ascent - lineHeight/2` = 3.889 at 14pt. Verified on two oracles rather than
  derived: `jobadi-87-jegi648` (box y=10 h=28, baseline 27.889) and
  `birocu-87-xubi808` box 1 (box y=46 h=42, rows at 63.889 and 77.889 from row
  centres 60 and 74).
  Corpus-wide that shift IMPROVES every head label and WORSENS every foot
  label by the identical 3.889, because this port's head boxes sit above the
  jar's (the 10px vertical document margin is not applied yet) while its foot
  boxes sit below them (accumulated body-height error). Net `y` distance rose
  121 while `x` fell 32 612.
- **Impact**: a `y` rise of this shape after any baseline conversion is
  expected and is Phase C's vertical terms, not a defect in the conversion.
  Do not "fix" it by biasing the baseline; the arithmetic is jar-exact at both
  oracles.
- **Confidence**: High — both oracles checked digit for digit, and the
  head/foot cancellation computed explicitly.

## Observation: the jar italicises a participant's stereotype row; this port
does not

- **Context**: A3, comparing `birocu-87-xubi808` row by row.
- **Finding**: the jar emits `font-style="italic"` on the `«APIGateway»` run
  and not on the name run beside it. This port emits neither — the gap
  pre-dates A3 (the old `renderLabel` set no font style either), so A3 neither
  introduced nor closed it.
- **Impact**: a real, separable feature: it needs the style lookup that decides
  stereotype italics, and `SequenceTextSpec` has no `fontStyle` field yet.
  Worth its own task; it is NOT a placement bug and will not show up in the
  distance instrument, which scores numeric attributes only.
- **Confidence**: High — visible in the cached oracle, absent from our output
  both before and after A3.

## Observation: chaining the diff-census CLI into the same shell as `npm test`
races the stdlib build

- **Context**: A4 close-out, running
  `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts && npm run
  catalog && npm run lint && npm run typecheck && npm run build && npm test`
  as one chain.
- **Finding**: eight test FILES failed, seven of them unrelated to the change
  (`split-sprite-bundle`, `sprite-split-prefetch`, `stdlib-package-files`,
  `with-stdlib-build-lock`, `refusal-coverage`, `routing-conformance`,
  `description-parity.ratchet`). Re-running `npm test` on its own, with no
  other command in the chain, left exactly ONE failing file — the sequence
  ratchet, which is red by design this mission. The census CLI renders the
  whole corpus and touches the same generated `assets/stdlib` that the suite's
  global setup builds.
- **Impact**: never read a `npm test` result from a chain that also renders the
  corpus. The failure set looks alarming and names files the change never
  touched, which is exactly the signature that should prompt a clean re-run
  rather than a diagnosis. Same family as
  `.agent-notes/stdlib-run-isolation`'s findings.
- **Confidence**: High — 8 failing files chained, 1 standalone, same tree.

## Observation: three sequence text kinds are measured at the wrong font, and
each one only becomes VISIBLE once `textLength` is emitted

- **Context**: A4 and A5, routing every sequence `<text>` through the emitter.
- **Finding**: three declared style buckets carry their own `FontSize` and this
  port used the ambient 14 for all three.
  - `reference { FontSize 12 }` (`plantuml.skin:145-151`) — the `ref` body.
    `cekora-30-diso384`: jar `textLength="26.625"`, ours 31.063.
  - `referenceHeader { FontSize 13, FontStyle bold }` (`:153-160`) — the `ref`
    keyword, which `refBodyWidth`'s `max(body, header)` also measures.
  - `note { FontSize 13 }` (`:312-316`) — the note body. `bocusa-16-ciju126`:
    jar emits `font-size="13" textLength="36.075"`.
  All three were merely displacing text before; emitting a `textLength`
  computed at the wrong size turns the same defect into glyph DISTORTION,
  because the viewer stretches the run to a width the font never produces.
- **Impact**: whenever a text kind starts carrying `textLength`, check its
  style bucket's `FontSize` FIRST. The corpus will not tell you: a wrong font
  shows up as an ordinary coordinate delta in the distance instrument,
  indistinguishable from a positioning error. Correcting the note font alone
  moved total distance 90k, most of it in `viewBox` and `height`, because the
  box was sized from the same wrong measurement.
- **Confidence**: High — each read from the skin and confirmed against a
  cached oracle's own emitted `font-size`.

## Observation: `note right` is positioned on the wrong side, and centring was
hiding it

- **Context**: A5, after left-aligning note bodies per
  `ComponentRoseNoteBox#drawInternalU:105`.
- **Finding**: 58 fixtures rose in the distance instrument, every one of them a
  note fixture. The largest, `xatotu-85-tusi683`, puts its `note right` body at
  x=70.319 where the jar puts it at 449.319 — the note is on the wrong side of
  the diagram entirely, not merely mis-padded. The error is in
  `computeNotePosition`, not in the text: it was there before A5, and centring
  the lines inside the wrongly-placed box happened to land them nearer the
  jar's numbers than left-aligning them does.
- **Impact**: a metric REGRESSION can be the removal of an accidental
  compensation. Do not revert the alignment; it is jar-verified
  (`bocusa-16-ciju126`'s box spans 105.9..162.9 around a 36.075-wide line, and
  the jar draws it at 111.9 where centred would be 116.36). Fix the position.
- **Confidence**: High — 58/58 risers are note fixtures, and the largest was
  read line by line against its oracle.

## Observation: a note's BOX padding and its TEXT inset are different upstream
quantities

- **Context**: Same task, checking the residual note-x delta.
- **Finding**: on `bocusa-16-ciju126` the jar's note box is 20.925 wider than
  its text (this port uses 2 x 10, which agrees), but the jar insets the text
  by only 6 from the box's left edge. Upstream uses `getPaddingX()` for the box
  and `getOldPaddingX1() + diffX / 2` for the text (`:96-105`), where `diffX`
  is the slack between the drawn area and the component's preferred width. This
  port has one `notePadding = 10` doing both jobs.
- **Impact**: correcting the inset needs `ComponentRoseNoteBox
  #getPreferredWidth` and its `Area` modelled so `diffX` can be derived.
  Guessing 6 would be fitting a constant, which this project forbids — the
  number happens to be 6 on this fixture and is `4 + diffX/2` in general.
- **Confidence**: High — both numbers read off one oracle.

## Observation: a `box` group label is 13 bold in the jar, 11 plain here

- **Context**: A5, routing `renderBoxBackground`'s label through the emitter.
- **Finding**: `box { FontSize 13, FontStyle bold }` (`plantuml.skin:162-167`);
  `binupo-93-begi656` emits `font-size="13" font-weight="700"` for all three of
  its labels. This port uses `BOX_LABEL_FONT_SIZE = 11`, plain.
- **Impact**: deliberately NOT fixed in A5. Correcting it moves the label's x
  and reopens how NESTED boxes lay out, which that same fixture exercises and
  this engine does not port. The routing change keeps the label internally
  consistent (its `textLength` matches its own font), so nothing is distorted;
  it is simply the wrong size. A task of its own.
- **Confidence**: High — skin read, oracle confirmed.
