# unwind2-S2 — HCL style, top-level assignment, line joining

## Observation: HclParser's tokenizer had three departures, not one
- **Context**: mirroring `isFlatAssignment` away (top-level `a = 1`).
- **Finding**: besides the invented flat-assignment path, `hcl/parser.ts`
  treated TAB/CR/LF as spaces (Java: `Character.isSpaceChar`, Zs/Zl/Zp only,
  `HclParser.java:235`) and flushed a trailing pending string (Java never
  does, `:188-216`). Jar: a tab stays in the key (`\ta`), trailing `foo`
  after the last `}` is silently dropped.
- **Impact**: probe the jar with whitespace variants before trusting any
  hand-written tokenizer "port".
- **Confidence**: High (tests/fixtures/unwind2-S2/hcl-tab-indent, hcl-trailing-token)

## Observation: json-family key column is not tab-aware (open)
- **Context**: hcl-tab-indent after the tokenizer fix.
- **Finding**: key text lands at the jar's x=71 (keyAtoms walk tabs) but
  `TextBlockJson.ts#cellMetrics` measures `keyWidth` with the raw bounder;
  value widths already use `tabAwareWidth`. Column is 56px narrow. Affects
  json/yaml keys containing `\t` too.
- **Impact**: one-line follow-on in TextBlockJson.ts; pinned as an 11-path
  allowance in tests/unit/hcl/unwind2-s2-jar.test.ts.
- **Confidence**: High

## Observation: duplicate object keys collapse in the whole json family (open)
- **Context**: probing HclParser `JsonObject.add` semantics.
- **Finding**: `r { a = "1"  a = "2" }` -> jar draws two rows `a|1`, `a|2`
  (minimal-json `JsonObject.add` appends without dedup). Our AST root is a
  plain JS object (`json-layout-prep.ts#containerEntries` uses
  `Object.entries`), so the second assignment overwrites the first. Same
  representation also reorders integer-like keys first. Not in any
  DIVERGENCES entry. Needs an ordered-entries AST shared by json/yaml/hcl.
- **Impact**: data-model change across the json family; separate task.
- **Confidence**: High for hcl (jar probe); json/yaml duplicates not rendered.

## Observation: hcldiagram.* style mapping is now unreachable
- **Context**: hclStyleInput drops every `applyStyles` input.
- **Finding**: `src/core/style-map-json-diagram.ts:288-293` (the
  `hcldiagram` override) and `style-map-element.ts:395` can no longer
  affect output -- no `<style>` reaches an hcl theme.
- **Impact**: dead-code candidate for a src/core owner (grep first).
- **Confidence**: Medium (not traced through every caller of the override)
