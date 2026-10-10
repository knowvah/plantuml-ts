# aepp-T2b report
- Commits: 0d9f4bc79 docs(aepp-T2b): write the error-page conformance rule (+ this note)
- Java -> ours: none (docs only).
- Edits: CLAUDE.md "Mirror the jar" bullet (138 -> 139 lines; error-page carve-out + pointer); docs/svg-conformance.md new "Error pages" section (rule, stock-jar companion, verdict table, scripts/stock-jar-verify.sh + oracle/goldens/stock-error-pages.json re-run on pin change, errorPage field, oracle-widths exception, production version line unchanged); DIVERGENCES.md error-page entry note (not measured any more).
- Rows before -> after: n/a. Survey/census: n/a (no src edits).
- Checks: prettier clean; npm run lint green; docs:build fails only at docs-site/divergences.md (884:498), the pre-existing {{ }} occurrence (was 883:498; +1 line shift from my added paragraph above it). No {{ }} added.
- Not done: nothing.
