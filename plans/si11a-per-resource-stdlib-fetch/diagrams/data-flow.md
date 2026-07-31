# Data flow — eager vs remote stdlib resolution

## Today (post-SI8): one bundle, one chunk

```mermaid
sequenceDiagram
    participant C as consumer
    participant R as render()
    participant P as prefetchInner
    participant G as StdlibRegistry
    participant M as bundle chunk

    C->>R: render(src, { stdlibRegistry })
    R->>P: prefetchIncludes
    P->>P: exact key? getPumlResource? both miss
    P->>G: resolve('tupadr3')
    G->>M: import('@plantuml-ts/stdlib-tupadr3/tupadr3')
    M-->>G: BundleData with 6,849 files — 19.54 MB
    G-->>P: BundleData
    P->>P: stdlibStore(...).getPumlResource(key)
    P-->>R: store filled
    R->>R: sync pipeline (unchanged)
```

**19.54 MB to serve one 2.9 KB icon.**

## After SI11a: manifest chunk + per-resource fetch

```mermaid
sequenceDiagram
    participant C as consumer
    participant R as render()
    participant P as prefetchInner
    participant G as StdlibRegistry
    participant M as manifest chunk
    participant H as host (baseUrl)

    C->>R: render(src, { stdlibRegistry })
    R->>P: prefetchIncludes
    P->>P: exact key? getPumlResource? both miss
    P->>G: resolveResource('tupadr3', 'font-awesome-5/ban')
    G->>M: import('.../tupadr3/remote')
    M-->>G: manifest — 49.6 KB gzip, key→path
    G->>H: GET baseUrl/font-awesome-5/ban.puml
    H-->>G: 2,889 bytes
    G-->>P: content
    P->>P: recurse — text names <tupadr3/common>
    P->>G: resolveResource('tupadr3', 'common')
    G->>H: GET baseUrl/common.puml (cached manifest, no re-import)
    H-->>G: content
    P-->>R: store filled
    R->>R: sync pipeline (STILL unchanged)
```

The sync pipeline never changes. Everything SI11a does happens in the async
prefetch pass, which is the only place an `await` is available —
`renderSync` stays synchronous.

## The three resolution channels, in order

`prefetchInner`'s stdlib branch. SI8 established the order; SI11a changes only
what the third one does.

```mermaid
flowchart TD
    A["!include &lt;tupadr3/font-awesome-5/ban&gt;"] --> B{exact key in store?}
    B -->|hit| Z[use it]
    B -->|miss| C{"base.getPumlResource?"}
    C -->|hit| Z
    C -->|miss| D{registry present?}
    D -->|no| E[StdlibNotBundledError]
    D -->|yes| F["resolveResource(bundle, key)"]
    F -->|eager BundleData| G["files[key] — no network"]
    F -->|remote manifest| H{key in manifest?}
    H -->|no| E
    H -->|yes| I["GET baseUrl + relPath"]
    I -->|ok| Z
    I -->|reject| J[StdlibResourceFetchError]
    G --> Z
    Z --> K[recurse into the resolved text]
```

Three failure modes, three different consumer actions — they must stay
distinguishable end to end:

| error | meaning | consumer does |
|---|---|---|
| `StdlibNotBundledError` | not registered, or not in this bundle | add a registration / fix the target |
| `StdlibChunkLoadError` | registered; the manifest chunk failed | fix bundler config |
| `StdlibResourceFetchError` | manifest fine; the resource fetch failed | fix `baseUrl` / host / CORS / CSP |
