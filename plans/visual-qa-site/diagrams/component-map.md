# Component Map

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[~/git/pdiff/\n(corpus fixtures)] as pdiff
[scripts/classify-corpus.ts\n(T1)] as classify
[tests/visual/data/*.json\n(FixtureEntry[])] as manifests
[scripts/capture-corpus.ts\n(T2)] as capture
[tests/visual/reference/type/slug.png] as pngs
[plantuml.com\n(reference PNG API)] as plantumlcom
[scripts/build-pages.ts\n(T3)] as buildpages
[tests/visual/*.html\n(static pages)] as html
[dist/plantuml-js.js\n(ESM browser build)] as dist
[Browser viewer\n(live SVG rendering)] as browser

pdiff --> classify
classify --> manifests
manifests --> capture
plantumlcom --> capture
capture --> pngs
manifests --> buildpages
buildpages --> html
pngs --> browser
html --> browser
dist --> browser
@enduml
```
