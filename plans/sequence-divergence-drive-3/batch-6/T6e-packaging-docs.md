# T6e — packaging and docs for `image-providers`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T6e`. Commit:
`build(image-providers): export subpath and document providers`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
`package.json:34-39` has one `exports` entry (`.`); `vite.config.ts:14-37`
builds one library entry (`src/index.ts`, formats es + cjs, `fileName:
'plantuml-ts'`). D3 puts providers in a separate entry so core consumers never
load network code. Add `./image-providers` -> `dist/image-providers.{js,cjs}` +
types; vite lib `entry` becomes an object with a `fileName` function; external
list unchanged. `vite-plugin-dts` with `bundleTypes: true` must emit a second
bundled `.d.ts`; verify the built output.

## Targets
None (packaging). Verified by `npm run build` and a consumer-import test.

## Write-set
`package.json` (`exports["./image-providers"]`, `files` if needed),
`vite.config.ts`, `src/image-providers/index.ts` (re-exports
`createNetworkImageProvider`, `createBrowserImageProvider`, option types),
`README.md` (a "Remote images" section near "Security", `:138`),
`docs-site/guide/image-providers.md` (new page: usage for Node and browser,
CSP note, security profile interplay), `docs-site/.vitepress/config.ts`
(sidebar entry), `docs-site/guide/api.md` (`imageProvider`, `filename`
options), a build test `tests/unit/image-providers/entry.test.ts`.

## Read-set
`package.json:30-45`; `vite.config.ts` (whole); `README.md:138-165`;
`docs-site/guide/api.md`; `docs-site/.vitepress/config.ts` (sidebar);
`src/image-providers/{network,browser}.ts` public types.

## Interface contracts
Import path `@knowvah/plantuml-ts/image-providers` (name per `package.json:2`
`name`). The main entry must not import it; `dist/plantuml-ts.js` contains no
`image-providers` code (grep the build).

## Acceptance
- Given `npm run build`, then `dist/image-providers.js`, `.cjs` and `.d.ts`
  exist and the root bundle has no `createNetworkImageProvider`.
- Given a Node ESM `import { createNetworkImageProvider } from
  '@knowvah/plantuml-ts/image-providers'` against the build, then it resolves.
- Given `npm run docs:build` (or the repo's docs check), then the page builds
  and the sidebar links it.
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine; `npm run catalog` drift gate green.

## Observability
N/A.

## Rollback
Reversible.
