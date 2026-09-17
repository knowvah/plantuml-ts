# docs-site / knowvah theme + plantuml.knowvah.com (2026-09-16)

## Observation: the @knowvah scope mapping redirects `npm publish` too
- **Context**: applying the brand-knowvah docs-site path (as dot-atlassian
  did) requires `.npmrc` to map `@knowvah:registry` to npm.pkg.github.com,
  because `@knowvah/theme` is published only there.
- **Finding**: unlike dot-atlassian (a Forge app, never published), this
  repo publishes eight `@knowvah/*` packages to npmjs (root + packages/*).
  A scope-to-registry line applies to publish as well as install, so
  without an override `npm publish` would push to GitHub Packages. Every
  published package.json now carries
  `publishConfig.registry = https://registry.npmjs.org/`, which wins over
  the scope mapping. `@knowvah/dot-engine` is pinned as a tarball URL for
  the same reason (a scope maps to one registry); bumping it means editing
  the URL, not the semver range, and `npm outdated` will not flag it.
- **Impact**: any new workspace package must copy that `publishConfig`, or
  its first publish lands on the wrong registry. CI (`ci.yml`, `docs.yml`)
  needs `packages: read` + `NODE_AUTH_TOKEN` for `npm ci` to resolve the
  theme; a 403 there with the token present means the package's
  "Manage Actions access" on GitHub does not yet grant this repo.
- **Confidence**: High (install verified; publish path reasoned from npm's
  documented precedence — `publishConfig` overrides `.npmrc` scope config).

## Observation: VitePress `base` and the CNAME travel together
- **Context**: moving from sseely.github.io/plantuml-ts/ to
  plantuml.knowvah.com.
- **Finding**: `docs-site/public/CNAME` lands in the Pages artifact and is
  what makes GitHub serve the custom host; `base` must be `/` at the same
  time or every asset URL 404s on the new host. GitHub's Pages API already
  reported `cname: plantuml.knowvah.com` before this change, so the repo
  side was the missing half.
- **Impact**: if the site ever moves back under a path, change both.
- **Confidence**: High.
