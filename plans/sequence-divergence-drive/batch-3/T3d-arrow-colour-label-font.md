# T3d — per-message arrow colour; message label font from the style

Agent: `typescript-pro`, worktree `sdd1-T3d`. Added 2026-10-20 from T2c's
stop 1 (journal row 27). Two commits:
`fix(sequence): carry the per-message arrow colour into the style`,
`fix(sequence): measure and draw message labels with the arrow style font`.
**Read [../batch-2/family-contract.md](../batch-2/family-contract.md) first —
it is part of this prompt.**

## 1. Per-message colour
`A -[#red]> B` sets the arrow colour (`AbstractMessage.java:69-70`:
`eventuallyOverride(PName.LineColor, arrowColor)`). The port drops it in the
PARSER: `command-arrow.ts#applyStyle` discards the colour token and
`ArrowConfiguration` (`sequence-arrowhead.ts`) has no colour field; the exo
and return commands have the same gap. 11 corpus fixtures use the form.
T2c already threads `arrowColor` through `messagePaint` /
`messageStyle(b, stereo, arrowColor)` and pinned the case as `it.fails` in
`tests/unit/sequence/sequence-arrow-paint.test.ts`: flip it. Read
`CommandArrow.java` (how the colour is parsed and stored),
`ArrowConfiguration.java` (`withColor`/`getColor`), `MessageExo`, and the
return command's Java before changing the port. Measure the 11 fixtures
(T2c named some: dugeki-47-celo546, TeozTimelineIssues_0002/0007,
bexoce-95-vibe195, gacujo-48-leto751, kukeja-88-zida141, mapeji-83-sebu002,
matoke-25-kidu719).

## 2. Message label font
The label is measured in `text-block-geo.ts#messageLabelBlock` via
`sequence-layout-shared.ts#arrowFontSpecOf` and drawn in
`renderer-message.ts` with `theme.fontFamily`, `theme.colors.text` and
`ARROW_FONT_SIZE`. Upstream the label is a text block built with the arrow
style's font (`AbstractComponentRoseArrow` / `AbstractTextualComponent.java:
80-89`: `style.getFontConfiguration(...)`). Measure and draw from the same
merged style, so a `<style> arrow { FontSize 20 }` or `skinparam
sequenceArrowFontColor` moves both measurement and drawing. Delete the theme
reads you replace (D5); report a field left with no reader for T3c.

## 3. Added at the b2 close (journal row 37)
- **Autonumber bold.** 9 open paint-only rows (boguvi-37, bopizu-70,
  gadasu-04, kaporo-80, lavaba-76, luxiti-90, sameli-92, vetuvo-45,
  ziloke-42) draw the autonumber without the jar's `font-weight 700`. Read
  how upstream formats and draws the number (`AutoNumber`/`DecimalFormat`
  default format, the message label text block) and port it.
- **Arrow `FontColor`.** bovuda-87, jutexi-93, dicizi-85, fakifa-13,
  fazubu-21, fojagu-59, munuje-51, xarifa-42: the label colour from
  `arrow { FontColor }` (item 2 covers the mechanism; these are the rows).
- **`!!` destroy marker** (T2f stop 1). `sequence-parse-helpers.ts#
  activationFlags`, called from `command-arrow.ts:412`, turns `!` into
  `deactivates = to` with no destroy flag; comelo-49 and nofola-68 draw a
  jar cross we lack. Set `MessageEvent.destroys` (the optional field already
  declared in `ast.ts` by the orchestrator; `ast.ts` itself is T3e's) so `messageDestroyCrosses`
  (`sequence-layout-life-event.ts` / `sequence-layout-message.ts`) counts it
  as a bound destroy. Self `!!` must not read as a deactivate.

## Write-set
`src/diagrams/sequence/{command-arrow,command-arrow-endpoints,
command-exo-arrow,command-exo-arrow-activation,command-return,
sequence-arrowhead,sequence-arrow-paint,sequence-layout-message,
sequence-layout-exo,renderer-message,text-block-geo,
sequence-layout-shared,sequence-parse-helpers,sequence-layout-life-event}.ts`, their tests under `tests/unit/sequence/`.

## Acceptance
- The `it.fails` in `sequence-arrow-paint.test.ts` passes; the 11 fixtures'
  arrow `@stroke` / polygon `@fill` diffs are gone or each remaining one has
  a mechanism.
- `<style> arrow { FontSize 20 }` changes both the label's measured width
  and its drawn `font-size` (jar-verified).
- Every riser vs your start has a mechanism.

Quality bar and boundaries: per `family-contract.md`. Observability: N/A.
Rollback: Reversible.
