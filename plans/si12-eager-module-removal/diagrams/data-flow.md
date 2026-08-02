# Data flow — how a consumer registers a bundle, before and after

## Before: two encodings shipped, one used

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[npm install\n-tupadr3 (40.8 MB)] as npm
[generated/tupadr3.js\n20.49 MB eager BundleData] as eager
[generated/tupadr3.remote.js\n0.43 MB manifest] as man
[assets/tupadr3/**\n19.9 MB raw .puml] as assets
[stdlibRegistry] as reg
[jsDelivr] as cdn

npm --> eager
npm --> man
npm --> assets
eager ..> reg : used by the eager consumer
man ..> reg : used by the remote consumer
assets ..> cdn : served over CDN
cdn --> reg
@enduml
```

Every consumer downloads all three; each uses at most two.

## After: one encoding per package

```plantuml
@startuml
participant "Consumer" as C
participant "@knowvah/plantuml-stdlib-tupadr3 (20.3 MB)" as P
participant "jsDelivr / self-host" as CDN
participant "render()" as R
C -> P : import { tupadr3Remote }
note over C,P : 0.43 MB manifest — no bundle content
C -> R : stdlibRegistry({ tupadr3: remoteStdlib({ manifest, baseUrl }) })
R -> CDN : fetch only the resources the diagram names
CDN --> R : font-awesome-5/ban.puml (~2.9 KB)
R --> C : SVG
@enduml
```

## Offline, without an eager module

```plantuml
@startuml
participant "Consumer (Node, offline)" as C
participant "node_modules/.../assets/tupadr3" as FS
participant "renderSync" as R
C -> C : fetcher = (url) => readFile(mapToAssetPath(url))
C -> C : await prepareIncludeStore(source, { stdlibRegistry, fetcher })
C -> R : renderSync(source, { includeStore })
R --> C : SVG
@enduml
```

The eager module was never the only offline path — this recipe already works
today and is what replaces it (T6 documents it end to end).
