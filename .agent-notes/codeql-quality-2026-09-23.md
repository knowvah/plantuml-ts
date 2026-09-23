## Observation: Code Quality findings have their own REST path
- **Context**: Triaging github.com/knowvah/plantuml-ts/security/quality
- **Finding**: `code-scanning/alerts` and analysis SARIF hold only security-tagged results. Quality findings come from `gh api repos/knowvah/plantuml-ts/code-quality/findings` (read-only; `PATCH .../findings/N` returns 404, so dismissal is UI-only).
- **Impact**: Never conclude "no quality findings" from the code-scanning API.
- **Confidence**: High
