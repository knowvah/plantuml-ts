# Data flow — how a consumer registers a bundle, before and after

## Before: two encodings shipped, one used

```mermaid
graph LR
  npm["npm install<br/>-tupadr3 (40.8 MB)"] --> eager["generated/tupadr3.js<br/>20.49 MB eager BundleData"]
  npm --> man["generated/tupadr3.remote.js<br/>0.43 MB manifest"]
  npm --> assets["assets/tupadr3/**<br/>19.9 MB raw .puml"]
  eager -. "used by the eager consumer" .-> reg["stdlibRegistry"]
  man -. "used by the remote consumer" .-> reg
  assets -. "served over CDN" .-> cdn["jsDelivr"]
  cdn --> reg
```

Every consumer downloads all three; each uses at most two.

## After: one encoding per package

```mermaid
sequenceDiagram
  participant C as Consumer
  participant P as "@knowvah/plantuml-stdlib-tupadr3 (20.3 MB)"
  participant CDN as jsDelivr / self-host
  participant R as render()

  C->>P: import { tupadr3Remote }
  Note over C,P: 0.43 MB manifest — no bundle content
  C->>R: stdlibRegistry({ tupadr3: remoteStdlib({ manifest, baseUrl }) })
  R->>CDN: fetch only the resources the diagram names
  CDN-->>R: font-awesome-5/ban.puml (~2.9 KB)
  R-->>C: SVG
```

## Offline, without an eager module

```mermaid
sequenceDiagram
  participant C as Consumer (Node, offline)
  participant FS as "node_modules/.../assets/tupadr3"
  participant R as renderSync

  C->>C: fetcher = (url) => readFile(mapToAssetPath(url))
  C->>C: await prepareIncludeStore(source, { stdlibRegistry, fetcher })
  C->>R: renderSync(source, { includeStore })
  R-->>C: SVG
```

The eager module was never the only offline path — this recipe already works
today and is what replaces it (T6 documents it end to end).
