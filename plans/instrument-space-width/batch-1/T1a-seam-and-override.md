# T1a — seam #4 in the oracle and the matching port override

**Agent:** typescript-pro (sonnet, high). Prompt = `common-rules.md` + this file.
**Worktree:** `measurements/mkwt.sh T1a`. **Authorized:** one commit on the fork
`~/git/plantuml` branch `dot-output` (this task's seam #4 only — stop 8 otherwise).

## Why
D1–D4, D9. Upstream `UnicodeFontWidthSansSerif` block 0 index 0x20 = 0, so
under `-DPLANTUML_DETERMINISTIC_TEXT` every space is zero-wide; our
`DeterministicMeasurer` mirrors it. A lone-space `UText` crashes the jar
(`klimt/compress/Slot.java:44-45` via `SlotFinder.drawText`,
`SlotFinder.java:127-133`) — `.agent-notes/oracle-svg-seam.md`.

## Write-set
Fork: `src/main/java/net/sourceforge/plantuml/FileFormat.java` (the seam's
anonymous subclass only). Repo: `oracle/patches/0004-oracle-space-width.patch`;
`src/core/measurer-deterministic.ts`; the D9 comment sites
(`src/core/klimt/creole/legacy/AtomText.ts`, `src/diagrams/json/tab-stops.ts`,
`src/core/cluster-title-table.ts`, `src/core/svek/image/creole-text-lines.ts`,
`src/diagrams/state/state-sizing-creole.ts` — comments only);
`tests/unit/core/isw-*.test.ts`; `tests/fixtures/isw-T1a/`;
`.agent-notes/isw-T1a.md`. NOT `oracle/dist`, `oracle/pin.json`,
`src/core/measurer-width-table.data.ts`, `WidthTableMeasurer`.

## Do
1. Read `FileFormat.java#getDefaultStringBounder` (seam #3's subclass),
   `StringBounderFromWidthTable.java` (`calculateDimension`, `getCharWidth`),
   `UnicodeBlock.getWidth`; quote them. Confirm block 0: 0x20 = 0, 0x21 = 44,
   0xA0 = 44 (D1), and the other zeros (D2).
2. Seam #4: override `calculateDimension` in seam #3's subclass —
   `width = super.width + count(U+0020) × 44/10 × size/16` (cite D1's sources in
   the comment). Build the jar (`./gradlew jar -x test`) to
   `/private/tmp/claude-501/isw-T1a/plantuml-oracle.jar`; export the patch with
   `git format-patch -1`.
3. Port: `DeterministicMeasurer` becomes `class DeterministicMeasurer extends
   WidthTableMeasurer` overriding the per-char width for U+0020 only (44 tenths),
   `@see` the seam and D1. Keep `measurer-deterministic.ts`'s doc accurate.
4. Tests: (a) `"a b"` at 12 pt = 16.65 and `" "` = 3.3; (b) every other block-0
   zero enumerated with its D2 reason, still 0; (c) jar fixtures under
   `tests/fixtures/isw-T1a/` rendered with the STAGED jar (copy
   `oracle-render.sh` with REPO and JAR overridden): labels with single/multiple
   spaces, a lone-space line, a tab-bearing creole label (D9), at 12 and 14 pt —
   ours `textLength` = jar `textLength` exactly; (d) the jar without the property
   renders a fixture byte-identical to stock (build both, compare).
5. Render the four lgm crash fixtures (kovaxi-11, zidebi-71, runima-82,
   pixisi-38, from `test-results/dot-cache/`) with the staged jar: none is a
   crash page; record it.
6. Rewrite the D9 comments (no code change in those files).

## Acceptance
- Given `"a b"` at 12 pt, when measured by `DeterministicMeasurer`, then 16.65,
  and the staged jar's `textLength` for it is 16.65.
- Given any space-bearing authored fixture, when rendered by both, then every
  `textLength` matches exactly (stop 4 otherwise).
- Given no `PLANTUML_DETERMINISTIC_TEXT`, when the staged jar renders, then its
  output equals the seam-#3 jar's.
- Given the four crash fixtures, when rendered by the staged jar, then no
  output contains "has crashed".

**Interface output (T1b):** fork SHA; staged jar path; patch path.
**Observability:** N/A. **Rollback:** reversible (revert; fork commit inert
without the property).
