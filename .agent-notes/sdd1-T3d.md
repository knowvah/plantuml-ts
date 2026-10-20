## Observation: a dotted autonumber ignores its format
- **Context**: sdd1 T3d, autonumber bold (2026-10-20).
- **Finding**: `DottedNumber#format` returns `"<b>" + toString() + "</b>"` for any number with more than one segment, whatever FORMAT was written (`DottedNumber.java:106-111`); only a single plain number goes through the `DecimalFormat`, whose default is `<b>0</b>` (`CommandAutonumber.java:119`). Jar-verified: `autonumber 1.1 1 "[000]"` draws a bold `1.1`.
- **Impact**: the autonumber is bold by default; a quoted format is the only way to get a plain number, and only for an undotted start.
- **Confidence**: High (Java read + jar probe).

## Observation: a message label's #?light:dark colour resolves against the document background
- **Context**: sdd1 T3d, label font from the arrow style.
- **Finding**: the arrow component draws its text block on a `ug` with no back colour (`ComponentRoseArrow.java:179`), so `adjustColorForBackground` (`FontConfiguration.java:349-356`) falls to `ug.getDefaultBackground()`, the document style's `BackGroundColor`. `HColorSet` still throws for `HColorScheme` (unported), so any `paint.font` read over a `#?…` FontColor throws unless the caller resolves it first. `sequence-arrow-paint.ts#appropriateTextColor` and `sequence-participant-paints.ts#appropriateTextColor` are now two copies of the same resolution.
- **Impact**: a new sequence text reader must resolve the scheme colour itself or route through one of those two; consolidating them is a cleanup candidate (the participant file is outside T3d's write-set).
- **Confidence**: High (four corpus rows went to error until it was handled).

## Observation: a left-border exo label is not reserved left of its participant
- **Context**: sdd1 T3d jar probes (`[-> A : exo`, `[-[#blue]> A ++ : in`).
- **Finding**: the jar shifts every participant right by the exo label's width; this port draws the participant at the left margin and the exo arrow overlaps. Every x on those probes differs; y, colour and font all match.
- **Impact**: geometry, pre-existing; any probe that contains a FROM_LEFT exo with a label will show x diffs that are not the subject under test.
- **Confidence**: Medium (observed on two probes; mechanism not traced).
