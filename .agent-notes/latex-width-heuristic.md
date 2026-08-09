## Observation: KaTeX HTML metrics for accurate LaTeX width measurement

- **Context**: Implementing `measureLatex` heuristic for LaTeX node sizing in activity/usecase diagrams
- **Finding**: KaTeX's `renderToString` with `output: 'html'` embeds em-based widths in the generated HTML spans. These could be parsed to get a real layout width without needing a DOM or canvas — purely string processing on KaTeX's output.
- **Impact**: Current atom-counting heuristic overcounts fractions: `\frac{A}{B}` counts atoms in both A and B, but the real rendered width is `max(width(A), width(B))`. Parsing KaTeX HTML output would give exact widths and eliminate the main source of error.
- **Confidence**: High — KaTeX HTML output is well-documented and stable across versions.
