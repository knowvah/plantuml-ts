# Data flow — whole-file vs per-sprite

## Today: the whole file arrives through the include seam

```mermaid
sequenceDiagram
    participant C as Consumer
    participant R as render()
    participant P as prefetchInner
    participant S as stdlib source
    participant Pa as plugin.parse()

    C->>R: render(source, {stdlibRegistry})
    R->>P: prefetchIncludes(source)
    P->>S: <bootstrap/bootstrap>
    S-->>P: 1,085,342 B (2,078 sprites)
    P-->>R: store
    R->>Pa: parse(preprocessed)
    Note over Pa: matchSpriteCommand registers<br/>ALL 2,078 sprites
    Pa-->>R: AST + SpriteRegistry
    Note over R: getSprite() is a SYNC Map.get —<br/>no await is available here
```

## After: only the referenced sprites are fetched

```mermaid
sequenceDiagram
    participant C as Consumer
    participant R as render()
    participant P as prefetchInner
    participant Sc as scanSpriteNames
    participant M as split manifest
    participant F as fragments
    participant Pa as plugin.parse()

    C->>R: render(source, {stdlibRegistry, sprites?})
    R->>P: prefetchIncludes(source)
    P->>Sc: scan source for <$name>
    Sc-->>P: {bi-globe, bi-alarm, bi-house}
    P->>P: union options.sprites (ADR-5b)
    P->>M: manifest (7,289 B gzip)
    M-->>P: name list
    P->>F: sprites/bi-globe.puml … (3 fetches, concurrent)
    F-->>P: ~1.3 KB total
    P-->>R: payload assembled in SORTED name order
    R->>Pa: parse(preprocessed)
    Note over Pa: registers only the 3 sprites present
    Pa-->>R: AST + SpriteRegistry
```

**The lever is the include PAYLOAD, not the sprite registry.** Parsing is
untouched — it simply sees fewer `sprite` blocks, which is what keeps
`renderSync` synchronous (ADR-4).

## A name the scan cannot see

```mermaid
flowchart TD
    A["&lt;$name&gt; in raw source"] -->|scan finds it| B[fetched]
    C["&lt;$name&gt; produced by a !define expansion"] -->|invisible: prefetch<br/>runs BEFORE macro expansion| D{in options.sprites?}
    D -->|yes, ADR-5b| B
    D -->|no, ADR-5a| E["named error identifying the sprite<br/>— never a silent missing icon"]
```
