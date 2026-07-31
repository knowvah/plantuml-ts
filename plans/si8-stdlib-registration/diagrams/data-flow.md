# Data flow — the include seam, sync vs async

## Today (the defect T1 fixes)

`prefetchInner` asks the store for an **exact key**. A `withStdlib` store answers
through `getPumlResource`, which is never consulted — so the async path fails on
input the sync path handles.

```mermaid
sequenceDiagram
    participant C as Caller
    participant R as render() (async)
    participant P as prefetchInner
    participant S as withStdlib store
    participant E as errorSvg

    C->>R: render(src, {includeStore: withStdlib(...)})
    R->>P: prefetchIncludes(src, fetcher, store)
    P->>P: stdlibPathOf("<bootstrap/bootstrap>") → "bootstrap/bootstrap"
    P->>S: has("<bootstrap/bootstrap>")
    S-->>P: false  ← delegates to base.get, ignores getPumlResource
    P--xR: throw StdlibNotBundledError
    R->>E: catch
    E-->>C: error card: "pass options.includeStore"
    Note over C,E: The caller DID pass options.includeStore.
```

`renderSync` never runs the prefetch pass, which is the only reason stdlib works
there — and why ten `withStdlib` call sites never caught this.

## After T1 + T3

Exact key still wins first; `getPumlResource` is consulted on the miss; the
registry is consulted after that; resolved bundle text **re-enters the walk**
because bundle files include each other.

```mermaid
sequenceDiagram
    participant R as render() (async)
    participant P as prefetchInner
    participant S as IncludeStore
    participant G as getPumlResource
    participant Reg as StdlibRegistry
    participant I as IncludeExecutor (sync)

    R->>P: prefetchIncludes(src, fetcher, store, registry)
    P->>S: has("<c4/C4_Context>")
    S-->>P: false
    P->>G: getPumlResource("c4/C4_Context")
    G-->>P: undefined
    P->>Reg: resolve("c4")
    Reg-->>P: BundleData (thunk awaited once, memoized)
    P->>S: fold bundle in
    P->>P: recurse into resolved text
    Note over P: text contains !include <C4/C4> — ADR-4's whole point
    P-->>R: store ready
    R->>I: buildBlockUmls(src, {includeStore})
    I->>S: get / getPumlResource  (synchronous read-back)
```

## `renderSync` — ADR-5's warm-up

The sync interpreter cannot await, so the caller performs the async half
explicitly. This is the same two steps `render()` already does internally.

```mermaid
sequenceDiagram
    participant C as Caller
    participant W as warm-up (async)
    participant Reg as StdlibRegistry
    participant RS as renderSync

    C->>W: await warmUp(src, {registry})
    W->>Reg: resolve(...) per bundle named in src
    Reg-->>W: BundleData
    W-->>C: IncludeStore (ready, synchronous)
    C->>RS: renderSync(src, {includeStore})
    RS-->>C: SVG
    Note over C,RS: renderSync stays synchronous — hard constraint.
```
