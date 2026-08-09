## Observation: descriptive-keywords.ts exceeds the 500-line cap (pre-existing)
- **Context**: A2s flatten follow-up added the blank-line scan filter (+3 lines net).
- **Finding**: file was 524 lines before this mission (cap 500); complexity hook blocks any edit while over.
- **Impact**: needs a dedicated split (cleanup PR), out of A2s scope.
- **Confidence**: High
