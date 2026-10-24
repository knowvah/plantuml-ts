# T6a — public API: `ImageProvider`, `imageProvider`, `filename`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T6a`. Commit:
`feat(api): add RenderOptions.imageProvider and RenderOptions.filename`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
Two upstream inputs have no port-side channel. Remote images: `AtomImg.create`
fetches `http:`/`https:` srcs (`AtomImg.java:165-169`; bytes via `SURL#getBytes`
`SURL.java:325`, raster via `readRasterImageFromURL` `:183-198`). `%filename()`:
`Defines.overrideFilename` puts env `filename` and `filenameNoExtension`
(`Defines.java:89-94`, `nameNoExtension` `:149-155`); `builtin/Filename.ts:19`
already reads `env.getEnvironmentValue('filename')`. This task adds the types
and threads `filename`; behaviours land in T6b (images) and T6f (env).

## Targets
None directly. Unblocks T6b-T6d, T6f.

## Write-set
`src/core/image-provider.ts` (new), `src/core/render-options.ts`,
`src/index.ts` (type export + pass `filename` at the three
`buildBlockUmls(source, { includeStore… })` calls, `:347,376,393`; the file is
near the 500-line hook cap, journal any split), `src/core/preprocessor.ts`
(ONLY the optional `filename?: string | undefined` field on `PreprocessOptions`
`:145-152`, JSDoc), `tests/unit/core/image-provider.test.ts`,
`tests/unit/render-options-filename.test.ts`; update `docs/api-extractor`
report if the repo gates it (`npm run build` tells).

## Read-set
`render-options.ts:26-84`; `index.ts:340-400`; `preprocessor.ts:140-155`;
`BlockUmlBuilder.ts:133,231` (does it forward `PreprocessOptions` whole?);
`Defines.java:60-100`.

## Interface contracts (T6b/T6c/T6d/T6e/T6g code to these)
```ts
// src/core/image-provider.ts — type-only, no runtime code, no DOM/Node types
export type ImageFetchResult =
  | { readonly bytes: Uint8Array; readonly mimeType: string }
  | { readonly blocked: string }   // policy refused; string = reason
  | { readonly failed: string };   // transport/size/timeout; string = reason
export interface ImageProvider {
  fetch(url: string): Promise<ImageFetchResult>; // never rejects
}
```
`RenderOptions.imageProvider?: ImageProvider | undefined` ("used by `render()`
family only; `renderSync` ignores it"); `RenderOptions.filename?: string |
undefined` ("the source file name `%filename()` reports; `Defines.java:89`").
`index.ts` re-exports `ImageProvider` and `ImageFetchResult` as types. No other
public export (stop 10).

## Acceptance
- Given `RenderOptions` with both fields, when type-checked, then it compiles;
  without them, every existing call site compiles unchanged.
- Given `renderSync(src, { filename: 'a.puml' })`, then the option reaches
  `PreprocessOptions.filename` (spy on `buildBlockUmls` in the unit test).
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine (no behaviour change).

## Observability
N/A.

## Rollback
Reversible.
