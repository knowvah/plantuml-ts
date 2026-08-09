# A2s round 2 — R2j observations

## Observation: aws-orange needed classAttributeFontSize 11, beyond R2c's plan
- **Context**: mizupo-59 residual (0.147in) after landing R2c's verified
  defaultFontSize-marker plan (fontFamily Verdana + fontSize/marker 12).
- **Finding**: puml-theme-aws-orange.puml:446 also sets `skinparam class {
  AttributeFontSize 11 }`; via the N32 attribute→header cascade the class
  NAME renders at 11pt too. Derivation from the golden itself: bare-class
  box width = widthTable(name)@11 + 30 (badge zone 24 + name margins 6),
  e.g. AbstractCollection 118.6875 = 96.75*(11/12) + 30. Adding
  `colors.graph.classAttributeFontSize: 11` to the builtin entry closed
  mizupo to 1e-6. compile-themes.py extracts NO font sizes (only
  BackgroundColor/FontColor/FontName) — all three size fields in the
  aws-orange entry are hand-carried; a script regen would drop them.
- **Impact**: other builtin themes with block-scoped FontSize skinparams
  (aws-orange object `AttributeFontSize 11`, state `AttributeFontSize 11`,
  title/legend sizes…) are still uncompiled — same mechanism if a theme
  fixture for those types ever misses.
- **Confidence**: High (mizupo per-node diff 1e-6; unit test pins 118.6875).

## Observation: renderer-side siblings of the two R2j sizer fixes (SVG-only)
- **Context**: R2j's write-set was sizer-side (class-layout-*); the DOT/size
  gate is closed, but two renderer call sites re-derive the same values.
- **Finding**: (a) `renderer-classifier-box.ts:80` calls resolveBadgeRadius
  WITHOUT the new `?? theme.defaultFontSize` tier — under an explicit
  defaultFontSize the drawn badge circle uses radius 11 while the sizer
  reserved 10. (b) `renderer-classifier-rows.ts:71` resolves the member-row
  font size as `classAttributeFontSize ?? fontSize` — no
  `classAttributeFontSizeByStereo` tier, so a stereotype-matched class's
  member TEXT renders at the plain size while the box is sized for the
  stereo size. (c) `class-object-map-sizing.ts` hardcodes the 17/3+6
  CIRCLED_CHARACTER radius — object/map diagrams don't see the
  defaultFontSize tier (no corpus fixture exercises the combination).
- **Impact**: SVG visual QA will flag these on themed/stereo-font fixtures;
  each is a 1-line tier addition at the named site.
- **Confidence**: High (call sites read directly; not exercised by DOT gate).
