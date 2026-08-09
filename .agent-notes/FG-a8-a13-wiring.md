# A2s F-G (A8 package-stereotype leaf + A13 classAttributeIconSize)

## Observation: optional params + point-free `.map(fn)` is a silent widener
- **Context**: Added an optional 2nd param `keepVisibilityChar` to
  `class-layout-helpers.ts#formatMemberText` (A13). Full class ratchet then
  showed 3 WIDENED fixtures (fijali-69-pina030, kevoda-64-mije856,
  xogixe-78-zuro619 — all enhanced bodies).
- **Finding**: `class-body-enhanced-layout.ts` called
  `members.map(formatMemberText)` point-free; `.map` passes the array INDEX
  as the 2nd argument, so every member at index >= 1 with explicit
  visibility got the char prepended. Fixed with an explicit arrow at the
  call site (comment left there).
- **Impact**: Any signature extension of an exported helper must grep for
  point-free `.map(fn)` / `.filter(fn)` uses first. The unit suite alone did
  not catch it — only the full ratchet did (diagnosis rule "widen
  measurement to the full ratchet set" earned another notch).
- **Confidence**: High (3 slugs went 0.10-0.11in widened -> 0 with only the
  arrow fix).

## Observation: bare `#lizard forgives` is eaten by spread-ternary object literals
- **Context**: check-complexity hook kept flagging
  `class-member-rows.ts#buildSectionRows` (pre-existing 6 PARAM) despite a
  `// #lizard forgives` comment placed near the function end (the memory
  note's usual recipe).
- **Finding**: lizard resets its `forgive` flag on EVERY `end_of_function`
  pop (lizard.py:514-519), and `...(cond ? { a } : {})` spreads inside an
  object literal stack anonymous contexts that pop at the OUTER function's
  end, consuming the flag first. The metric-specific form
  `// #lizard forgives(parameter_count)` attaches to `current_function`
  immediately at comment time and is immune; placed at function TOP it
  works.
- **Impact**: For functions containing spread-ternary object literals, use
  `#lizard forgives(<metric>)` at the top of the function, not the bare
  form near the end.
- **Confidence**: High (minimal repro + lizard.py source inspection).
