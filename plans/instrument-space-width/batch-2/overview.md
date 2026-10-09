# Batch 2a — fix every reveal family (on isw/T1b, before the T1b merge)

Created from the b1 census (journal rows 16–20; `diagnosis/diag-*.md`). Runs on
task worktrees off `isw/T1b` (journal row 17: fix before merge, residue owed).
Rule 12 per-agent all-engine surveys are replaced by: each agent surveys ONLY
its own engine(s), foreground, `--maxWorkers=2`; the orchestrator runs the
all-engine survey, elements, seq-scores and the production manifest at merge.
Production changes are expected and must be attributed (D10-AMEND RULED):
each agent lists which families change production output.

| ID | Families | Agent | Writes (exclusive) | Done |
|---|---|---|---|---|
| T2-act | F1 (inject measurer, 9 sites), F2-act (parser trims), F3-act (trailing special swimlane), F5 (wrapWidth), F6/F7 diagnose+fix, activity S/P tests; the 19 ACTIVITY-typed `unknown/` rows | typescript-pro (opus) | `src/diagrams/activity/**`, `tests/diagrams/activity/**`, `tests/unit/activity/**`, `tests/oracle/svg-conformance/activity-*.test.ts` (non-baseline logic only) | [ ] |
| T2-seq | F1 site (renderer-participant-symbol.ts:201), F2-seq (trim-then-measure: drawWidth + leading shift), F3-seq (divider greedy label), F4-seq (ref per-line trim), F5-seq (autonumber block in span), X (ComponentRoseNote int note width), seq S/P tests | typescript-pro (sonnet) | `src/diagrams/sequence/**`, `tests/unit/sequence/**` | [ ] |
| T2-cls | F2a–F2f (class atoms/rows/notes/table cells/edge labels/namespace titles), F3 (note/legend bodies: removeEmptyColumns not trim), F3d + F4 (description notes, `[ .. ]` label), F7 (multiline element trimSmart), lisepi object `<style>`, class/description/object/core-svek S/P tests | typescript-pro (sonnet) | `src/diagrams/class/**`, `src/diagrams/description/**`, `src/diagrams/object/**`, `tests/unit/class/**`, `tests/unit/description/**`, `tests/unit/core/svek/**` | [ ] |
| T2-smj | F2-state (per-run drawDx + trimmed textLength), F3-state (tabSize always 8), F4-mm (multiline orgmode keeps spaces), F5-json (empty stripe " "), Smetana allow-list tests, state/mindmap/json S/P tests | typescript-pro (sonnet) | `src/diagrams/{state,mindmap,json}/**`, `tests/unit/{state,mindmap,json}/**`, `tests/unit/json/**`, `tests/oracle/svg-conformance/json-family-structural*.ts` | [ ] |
| T2-core | F2-core (svg-text-font.ts leading-space shift helper + doc; error pages graphic-strings.ts / error-page-exact.ts / error-text.ts / PSystemError.ts), F2-table-cell (creole-table.ts keeps cell spaces), core/misc S/P tests | typescript-pro (sonnet) | `src/core/**` (except measurer files), `tests/unit/core/**` (except svek), `tests/unit/*.test.ts`, `tests/oracle/svg-conformance/unwind*.test.ts` | [ ] |

Orchestrator-only: every baseline/pin JSON (ratchets, census, routing/refusal,
size/direction backlogs), `owed.json`, `tests/fixtures/**` jar renders (the
re-capture tool missed multi-page `_00N.svg` — orchestrator fixes and re-runs).

# Batch 2b — residue after 2a (journal rows 23–25; user rulings row 24)

| ID | Scope | Agent | Writes (exclusive) | Done |
|---|---|---|---|---|
| T2b-ca | `swimlaneWrapTitleWidth` theme field + activity use (sesodi-22, tirizu-79); `activityDiagram { MaximumWidth }` selector (cezeje-11, febuci-08, kakitu-70); wrap-switch `getYdelta1a` (FtileSwitchWithManyLinks.java:413-423, the it.fails test); assemble-svg.ts float formatting | typescript-pro (opus) | `src/core/**` except dispatcher.ts, measurer*, stereotype-decoration.ts; `src/diagrams/activity/**`; `tests/unit/core/**`, `tests/unit/*.test.ts`, `tests/diagrams/activity/**`, `tests/unit/activity/**` | [ ] |
| T2b-seq | mezaxa: per-style note padding/position (NoteTile.java:289-296, ComponentRoseNote.java:70-72, NoteBox/Hexagonal :58, total-width note term); draw-side measurer injection through the plugin render seam | typescript-pro (sonnet) | `src/diagrams/sequence/**`, `src/core/dispatcher.ts`, `tests/unit/sequence/**` | [ ] |
| T2b-obj | lisepi: object `<style> object/map/json`; Stereotype inner space (Stereotype.java:122-133) | typescript-pro (sonnet) | `src/diagrams/class/**`, `src/diagrams/object/**`, `src/core/stereotype-decoration.ts`, `tests/unit/class/**`, `tests/unit/object/**` | [ ] |
