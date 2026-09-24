## Observation: Code Quality findings have their own REST path
- **Context**: Triaging github.com/knowvah/plantuml-ts/security/quality
- **Finding**: `code-scanning/alerts` and analysis SARIF hold only security-tagged results. Quality findings come from `gh api repos/knowvah/plantuml-ts/code-quality/findings` (read-only; `PATCH .../findings/N` returns 404, so dismissal is UI-only).
- **Impact**: Never conclude "no quality findings" from the code-scanning API.
- **Confidence**: High

## Observation: security alerts 17-22 triage evidence (2026-09-23)
- **Context**: Alerts opened by the 0df81700f scan.
- **Finding**: 17 real (applySeededDefIds 40000x `url(#(` = 6.2 s, quadratic; fixed in the same commit). 20-22 (document-shell): renderSync probe with attribute/element-breakout payloads in titles, stereotypes, notes, labels, URLs, skinparam + inline + gradient colors across class/seq/activity/state/usecase/component/mindmap/json/error produced zero on* attrs, zero <script>, zero parse errors; payloads present escaped. Gradient defs ids are base-36 only; diagramType is always a DIAGRAM_TYPE_* constant. 18: sha1 fingerprints rendered SVG in a dev report script; "uid" is a diagram element uid, not a credential.
- **Impact**: 21/22 and 18 are dismissable with this evidence; 20 escaped anyway.
- **Confidence**: High
