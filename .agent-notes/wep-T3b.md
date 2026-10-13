## Observation: wbs multiline one-line block is a syntax error in the jar
- **Context**: wep T3b, porting CommandWBSItemMultilineNew/Old.
- **Finding**: CommandMultilines2.isValid (java:79-111) returns OK_PARTIAL for a 1-line block before probing END (java:101-102); END is only probed on a later last line. Jar probe `* root\n+[#red](c):text;\n** x` => "Syntax Error?" (line 3). The mindmap precedent collectOrgmodeMultilineBlock checks the first line's DATA for END (not Java-faithful).
- **Impact**: T3b brief's "END on first line" test/acceptance contradicts Java. Also Colors(String,HColorSet,ColorType) ctor and ColorParser are unported (Colors.ts:25-31), blocking CommandWBSLink.
- **Confidence**: High
