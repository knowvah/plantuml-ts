# Observation: code spans wrapped across line breaks can break the docs-site build

- **Context**: CI docs deploy failed ("Element is missing end tag",
  vite:vue) on docs-site/divergences.md, generated from DIVERGENCES.md.
- **Finding**: an inline code span split across a line break, with a
  `<tag>`-shaped token at the continuation-line start
  (`` `No if related to this\n  <directive>` ``, DIVERGENCES.md:363-364,
  SI6-era), reaches the Vue compiler as raw HTML through the VitePress
  markdown pipeline. Vue then fails the whole site build. Bisect-verified;
  fixed by keeping the span on one line (main bdbd131).
- **Impact**: when editing DIVERGENCES.md / docs/parity-report.md (both
  mirrored into the VitePress site by docs-site/copy-reports.mjs), never
  wrap an inline code span containing `<...>` across lines — re-wrap the
  sentence instead. `npm run docs:build` is the local check.
- **Confidence**: High (empirical bisect + green build after fix).
