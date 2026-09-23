# cdd-close-b10 — batch 10 close + mission close-out (class-divergence-drive)

Written 2026-09-23. Survey 548/98/77 → 560/86/77; census 548 → 560;
ratchet 548 → 560 (12 pins); DOT 711/712. Mission total: 412/50/261 →
560/86/77 over 723 fixtures, zero conformant losses at any of eleven closes.

## Observation: the numeric tail is a handful of shared terms, not per-fixture work
- **Finding**: three terms closed 20+ structural-match fixtures in batch
  10: the edge-label `TextBlockMarged` margin missing from the ink walk
  (T35 + B10FU item 3), the marker origin computed from an un-floored
  label width (T37), and `EntityImageProtected`'s inner box (B10FU item
  1). Each was found by re-deriving the jar's number by hand from the
  `LimitFinder`/`SvekEdge` method bodies, never from the fixture list.
- **Confidence**: High.

## Observation: three diagnosis-report premises were disproved by measurement this batch
- **Finding**: A5 M7 (canvas rule imprecise — the rule was right, a term
  was missing), A5's port-row sizing (labels already byte-exact after
  B7FU-R2), and the coordinator's own grouping of pixexi under the label
  margin (zero edges). Brief every residual as "instrument, then name",
  and re-measure the named set on the current tree before assigning it.
- **Confidence**: High.

## Observation: an authored golden already has baseline rows
- **Finding**: the pin script's duplicate check threw on
  `class-inheritance-interface-assoc` (authored, not a corpus fixture)
  after writing ratchet.json but before either baseline. Skip
  already-present golden rows instead of throwing; the count derivation
  is then pins − authored.
- **Confidence**: High.

## Observation: rebuilding the oracle jar is a stop-9 event even when reverted
- **Finding**: T35 patched and rebuilt the jar for a LimitFinder trace.
  The cache made every verdict independent of the rebuilt bytes, but the
  pin (`oracle/pin.json`) already disagreed with the symlink target and
  now also with the build date. Brief "never touch `~/git/plantuml`" by
  name, as the T37 brief did.
- **Confidence**: High.
