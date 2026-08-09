# A2s R2d — container display + enhanced-body blank rows

## Observation: enhanced bodies never run the classic empties filtering
- **Context**: pejone-71/xonamo-50 blank-row diagnosis.
- **Finding**: `BodierLikeClassOrObject#getBody`'s enhanced branch feeds
  `rawBodyWithoutHidden()` (java:191-205) — every raw line, blanks included,
  becomes one `MethodsOrFieldsArea` row (one row height each,
  MethodsOrFieldsArea.java:161-166). The F-A display rules (java:114-172,
  sandwich/leading/trailing filtering) apply ONLY to the classic
  fields/methods path. jar-probed: blank row = exactly one standard 14px row,
  zero width.
- **Impact**: any future enhanced-body sizing work must count rows as
  `lines.length`, not a null-parse filter.
  `class-body-enhanced-geometry.ts#memberLineCount` is now UNUSED in src
  (only its own unit test references it) — outside R2d's write-set, left for
  a cleanup pass.
- **Confidence**: High (Java read + 4 deterministic jar probes).

## Observation: trimSmart(1) dedent reference is the FIRST body line, blank included
- **Context**: probe p4 (leading blank line as first body line of an
  enhanced-looking body) diverged 0.213889in — NOT a ledger fixture.
- **Finding**: upstream `BlocLines#trimSmart(1)` takes the dedent count from
  body line index 1 verbatim; a BLANK first body line → nbStartingSpace 0 →
  no dedent → indented `  .. Fields ..` is NOT a block separator
  (isBlockSeparator does not trim) → body is NOT enhanced upstream (classic
  path, `.. Fields ..` renders as a literal member row). Our
  `parser.ts#dedentRawLines` mirrors the reference choice, but the p4 probe
  still measured a width delta (+18px jar) — pre-existing, un-ledgered
  divergence in that corner; zero known corpus reach.
- **Impact**: leading-blank-then-indented-separator bodies are a latent
  divergence class if a corpus fixture ever hits it.
- **Confidence**: High for the upstream mechanism (Java read + probe);
  Medium for "our p4 delta root cause" (not diagnosed further — out of R2d
  scope).

## Observation: gotoGroup sets a group's display only on creation
- **Context**: rakuci-96 nested quoted-display fix.
- **Finding**: `CucaDiagram#gotoGroup` (net/atmp/CucaDiagram.java:349-355)
  calls `setDisplay` only under `quark.getData() == null`; re-entering an
  existing group keeps its original display. Ported as the `existedBefore`
  gate in `class-container.ts#openNamespaceBlock`.
- **Confidence**: High.
