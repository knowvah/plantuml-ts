## Observation: the preprocessor's blanket trimEnd() was also hiding CRLF
- **Context**: T6i removed `flatten`'s per-line `trimEnd()` (preprocessor.ts) so doTrim=false commands see trailing spaces.
- **Finding**: `readLines` (src/core/tim/ReadLineReader.ts) split on '\n' only; upstream's `BufferedReader#readLine`
  (ReadLineReader.java:90) ends a line at CRLF, CR or LF. The trimEnd had been stripping every CRLF line's '\r';
  without it `@startmindmap\r` (empty-mindmap-0..7, empty-root-mindmap-*, WBS-easter-egg-*) broke. Fixed at the
  reader (`/\r\n|\r|\n/`).
- **Impact**: engine parsers now receive untrimmed trailing whitespace (upstream semantics); any port command that
  upstream builds with doTrim=true but matches with an end-anchored regex and no trailing `\s*` may now miss a line
  with trailing spaces — check the survey movers before assuming a regression elsewhere.
- **Confidence**: High (ratchet failure traced to od -c of in.puml; fixed by the reader test)

## Observation: the jar draws a trailing creole space as U+00A0 with no textLength
- **Context**: authored `tests/unit/mindmap/fixtures/trailing-space.puml` (`* **1** `).
- **Finding**: jar emits `<text …> </text>` (width 0, no textLength); a test literal with ASCII space fails.
- **Confidence**: High

## Observation: doTrim=true CommandMindMapRoot needed its own trim once the preprocessor stopped trimming
- **Context**: T6i; the mindmap dispatcher (MindMapDiagramFactory.ts, T6h-owned) matches every command on the RAW line.
- **Finding**: `0 **r** ` drew an extra ` ` atom; jar trims (CommandMindMapRoot.java:52 doTrim=true). Fixed with
  `trin(label)` in CommandMindMapRoot.ts. The faithful seam is a per-command `myTrim2` in the dispatcher
  (SingleLineCommand2.java:74-79) — not ported; the factory is owned by other tasks.
- **Impact**: any other doTrim=true command matched on raw lines with a `(.*)$` tail would do the same.
- **Confidence**: High (authored jar oracle trailing-space-root)

## Observation: jar multiline orgmode block keeps trailing spaces on body lines and NPEs on `;<<st>> `
- **Context**: probe `**:**a** \n**b** \n**c** ; ` — jar draws `b` + ` ` atom and `**c** ; ` NOT as an end (draws `;`);
  `w;<<rose>> ` (trailing space) crashes the jar (NPE lineLast). Port trims (CommandMindMapOrgmodeMultiline.ts:48,57),
  unaffected by T6i. No corpus fixture known. Not investigated further.
- **Confidence**: Medium (single probe, jar source for Trim.BOTH not read)
