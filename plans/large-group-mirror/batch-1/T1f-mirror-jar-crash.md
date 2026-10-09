# T1f — mirror the jar's deterministic-mode crash (user ruling 2026-10-08)

**DROPPED 2026-10-08 (journal row 19):** user reversed the ruling — "if we render as full diagrams, then maybe we're OK". Kept for the facts section only.

**Agent:** typescript-pro (sonnet, high). Runs after T1e merges (both may touch
`src/index.ts`). Worktree `measurements/mkwt.sh T1f`.

## Ruling (user, 2026-10-08)
"If the 4 all crash the JAR, conformance means that we also put up an error
page. We need not exactly match the Jar for an error page."

## Facts (orchestrator, .agent-notes/oracle-svg-seam.md)
Under PLANTUML_DETERMINISTIC_TEXT the jar crashes on usecase kovaxi-11-reti348,
zidebi-71-nocu387 (nested `{{ }}` only) and activity runima-82-jigi009,
pixisi-38-kixa563 (whole diagram): `IllegalArgumentException: start=X end=X`
at `klimt/compress/Slot.java:44-45` from `SlotFinder.drawText`
(`SlotFinder.java:127-133`) on a UText `" "` at 12pt, mode ON_X — upstream's
width table gives U+0020 width 0, so `TextLimitFinder.drawText`
(`TextLimitFinder.java:82-90`) yields minX == maxX. The crash page carries a
random `IconLoader` icon (unseeded shuffle, `fun/IconLoader.java:55-74`).
Stock metrics: no crash. Our port, WidthTableMeasurer (same table, `measure(" ")`
= 0): renders all four as full diagrams, no throw. Our `Slot`
(`src/diagrams/activity/layout/compress/slot.ts`) already throws on start >= end.

## Do
1. Find why our render never reaches the throw: where upstream emits the
   lone-space UText that SlotFinder walks (which diagram element, which
   compression pass — activity `CompressionXorYBuilder`/`SlotFinder`, and what
   the usecase nested diagram compresses), and where ours diverges. Quote it.
2. Mirror it: the same input reaches the same throw, which becomes upstream's
   crash page path (`PSystemBuilder.java:275-281` / `CrashImage`) — whole page
   for activity, the nested embed's image for the usecase pair. The page need
   not byte-match (random icon); it must be an error page where the jar's is.
3. Conformance: teach `scripts/svg-parity-survey.ts` + `compare.ts` that a jar
   oracle which is a crash page is conformant iff ours is an error page at the
   same level (top-level vs nested image), no byte comparison. Unit-test the rule.
4. Rule 11 survey, element counts, all ratchets.

## Exit
The four fixtures conformant under the new rule; 0 conformant losses; no
crash where the jar has none (production `jarMeasurer` path unaffected — prove it).
