# Batch 1 — Decode-ordering (the clean fix)

Land the one high-confidence fix: codepoint escapes (`<U+…>`/`&#…;`) decode
per-line at measure/render time, not before the line-split — so `<U+000A>` is
inline (Rule 1, ADR-1). Output-neutral for every existing golden; fixes the
HEIGHT over-splitting that inflates all three target fixtures.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Decode codepoints per-line, not in `finalizeDisplay` | typescript-pro | `parse-helpers-strings.ts`, `leaf-sizing.ts`, `EntityImageDescriptionSupport.ts`, new unit test | — | ☑ |

**Exit bar:** `measure-description-size-deltas.ts` exit 0 (zero widened);
`dot-sync-report component usecase` stays 262/262 + 90/90; the 3 targets'
HEIGHT components shrink (their pins drop); full suite + typecheck + lint +
build green. No class-diagram or non-target golden moves (STOP if one does).
