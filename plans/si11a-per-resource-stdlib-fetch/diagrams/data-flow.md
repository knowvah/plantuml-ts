# Data flow — eager vs remote stdlib resolution

## Today (post-SI8): one bundle, one chunk

```plantuml
@startuml
participant "consumer" as C
participant "render()" as R
participant "prefetchInner" as P
participant "StdlibRegistry" as G
participant "bundle chunk" as M
C -> R : render(src, { stdlibRegistry })
R -> P : prefetchIncludes
P -> P : exact key? getPumlResource? both miss
P -> G : resolve('tupadr3')
G -> M : import('@plantuml-ts/stdlib-tupadr3/tupadr3')
M --> G : BundleData with 6,849 files — 19.54 MB
G --> P : BundleData
P -> P : stdlibStore(...).getPumlResource(key)
P --> R : store filled
R -> R : sync pipeline (unchanged)
@enduml
```

**19.54 MB to serve one 2.9 KB icon.**

## After SI11a: manifest chunk + per-resource fetch

```plantuml
@startuml
participant "consumer" as C
participant "render()" as R
participant "prefetchInner" as P
participant "StdlibRegistry" as G
participant "manifest chunk" as M
participant "host (baseUrl)" as H
C -> R : render(src, { stdlibRegistry })
R -> P : prefetchIncludes
P -> P : exact key? getPumlResource? both miss
P -> G : resolveResource('tupadr3', 'font-awesome-5/ban')
G -> M : import('.../tupadr3/remote')
M --> G : manifest — 49.6 KB gzip, key→path
G -> H : GET baseUrl/font-awesome-5/ban.puml
H --> G : 2,889 bytes
G --> P : content
P -> P : recurse — text names tupadr3/common
P -> G : resolveResource('tupadr3', 'common')
G -> H : GET baseUrl/common.puml (cached manifest, no re-import)
H --> G : content
P --> R : store filled
R -> R : sync pipeline (STILL unchanged)
@enduml
```

The sync pipeline never changes. Everything SI11a does happens in the async
prefetch pass, which is the only place an `await` is available —
`renderSync` stays synchronous.

## The three resolution channels, in order

`prefetchInner`'s stdlib branch. SI8 established the order; SI11a changes only
what the third one does.

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[!include] as A
[exact key in store?] as B
[use it] as Z
[base.getPumlResource?] as C
[registry present?] as D
[StdlibNotBundledError] as E
[resolveResource(bundle, key)] as F
[files[key] — no network] as G
[key in manifest?] as H
[GET baseUrl + relPath] as I
[StdlibResourceFetchError] as J
[recurse into the resolved text] as K

A --> B
B --> Z : hit
B --> C : miss
C --> Z : hit
C --> D : miss
D --> E : no
D --> F : yes
F --> G : eager BundleData
F --> H : remote manifest
H --> E : no
H --> I : yes
I --> Z : ok
I --> J : reject
G --> Z
Z --> K
@enduml
```

Three failure modes, three different consumer actions — they must stay
distinguishable end to end:

| error | meaning | consumer does |
|---|---|---|
| `StdlibNotBundledError` | not registered, or not in this bundle | add a registration / fix the target |
| `StdlibChunkLoadError` | registered; the manifest chunk failed | fix bundler config |
| `StdlibResourceFetchError` | manifest fine; the resource fetch failed | fix `baseUrl` / host / CORS / CSP |
