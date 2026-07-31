# Architecture Decisions — si11a-per-resource-stdlib-fetch

All seven approved by the maintainer 2026-07-31. **Treat every decision here as
locked.** If you discover a conflicting constraint, STOP and log it to
`decision-journal.md` — do not silently override.

Two of these were maintainer rulings taken BEFORE planning began and are not
open for re-litigation: the mechanism is runtime HTTP fetch (not static
per-resource modules), and bootstrap per-sprite splitting is a separate mission
(SI11b).

## ADR-1 — The generated module becomes a manifest; registration is unchanged

**Context.** SI8's `stdlibRegistry({ tupadr3: () => import('@plantuml-ts/stdlib-tupadr3/tupadr3') })`
loads a 19.54 MB chunk, because the generated module inlines every resource's
text.

**Decision.** Emit a parallel **remote** module per bundle carrying
`{ name, aliasOf?, files: { key → relPath } }` and no content — measured at
49.6 KB gzip for tupadr3, 8.3 KB for awslib14. Publish it on a NEW subpath; the
existing eager module stays, unchanged, for offline consumers.

**Consequences.** SI8's registration mechanism survives intact: still an
explicit map of static `import()` thunks, still bundler-analyzable, still
promise-memoized. No separate manifest fetch is needed — the manifest IS the
chunk. Existing consumers are unaffected because their module is untouched.

**Rejected.** Per-resource static modules — 6,849 for tupadr3 alone, 29,101
across the assets tree. Bundler-explosion risk, and it would substantially
change the generated package shape.

## ADR-2 — `resolve()` keeps its signature; the registry gains `resolveResource()`

**Context.** `StdlibRegistry.resolve(bundle): Promise<BundleData | undefined>`
cannot be honored by a remote bundle — producing a `BundleData` means having
fetched all 6,849 files, which is the thing being removed.

**Decision.** A remote bundle's `resolve()` returns a `BundleData` with correct
`name`/`aliasOf` and **empty `files`**. Content comes from a new
`resolveResource(bundle, key)`.

**Consequences.** Alias chains reuse SI8's `bundlesFor` and
`StdlibStore#resolveBundle` **completely unchanged**, cycle guard included —
that logic never needs to know a bundle is remote. Purely additive: no existing
signature changes.

## ADR-3 — Ship a key→path map, not path-by-convention

**Context.** Measured 2026-07-31: **890 of 891 `awslib14` paths contain
uppercase** (`Storage/SimpleStorageService.puml`), while `derivePumlKey`
lowercases every key. Path-by-convention (`key + '.puml'`) would therefore
require renaming vendored assets.

**Decision.** The manifest maps each resolved key to its real relative path.

**Consequences.** Costs ~19 KB gzip over a bare key list for tupadr3 (49.6 vs
31.0) and buys **zero renames of vendored files** — so SI11a stays a pure
checksummed file copy and SI5b's verbatim guarantee plus its sha256 manifest
gate are untouched. That matters specifically because `awslib14` is the
CC BY-**ND** bundle, where any regenerate/re-encode step voids the grant. It
also gives offline miss-detection: a key absent from the manifest is known
missing with no 404 round-trip.

## ADR-4 — No default base URL

**Context.** The packages ship to npm. There is no plantuml-ts-operated CDN, and
this mission does not create infrastructure.

**Decision.** `baseUrl` is **required**. The `.puml` assets ship inside the
package; the docs give recipes (serve from your own origin; or point at
jsDelivr/unpkg yourself).

**Consequences.** The library never makes a network call the consumer did not
explicitly configure — "offline unless you opt in" stays literally true, which
is what makes this mission safe to land in a library whose whole render path is
currently offline. Opting in is also the gradual-rollout mechanism; no feature
flag is needed.

**Rejected.** Defaulting to a third-party CDN — it bakes a third-party
dependency into a library, creates version-skew between the installed package
and the fetched assets, and silently turns an offline library into an online
one.

## ADR-5 — Promise-memoized in-memory cache; the fetcher is injectable

**Decision.** Mirror SI8's `StdlibRegistry` exactly: memoize the PROMISE so
concurrent resolves of one key share a single request, and drop the memo on
rejection so a transient failure can be retried. Accept an `IncludeFetcher`
(defaulting to `fetchInclude`) so a consumer can wrap their own retry, caching,
auth or metrics.

**Consequences.** Reuses `fetchInclude`'s CORS-vs-CSP differentiation for free —
a CSP-blocked asset fetch already reports the exact `connect-src` directive
needed. The injected fetcher is also this mission's **observability seam**: a
browser library has no metrics pipeline, so the consumer instruments there.

## ADR-6 — State what this does NOT solve, with measurements

Per SI8 ADR-2's precedent: measure and state, never assert success.

- **Request count.** A diagram using 50 icons makes ~51 requests. Latency × N is
  a real cost against one chunk; HTTP/2 multiplexing mitigates it, it does not
  erase it. This is why T4 makes the walk concurrent.
- **`awslib14` aggregators.** Eleven `*/all.puml` files run 116–445 KB
  (`Compute/all.puml` is 445 KB). `!include <awslib14/Compute/all>` still fetches
  445 KB — far better than 7.93 MB, but not small.
- **Nothing for bootstrap.** 1.06 MB in ONE file (2,078 sprites); per-resource
  splitting is a no-op there. That is SI11b.
- **The manifest is a floor.** tupadr3 costs 49.6 KB gzip before a single
  resource loads.

## ADR-7 — The remote manifest is public, hand-constructible API

**Context.** Third-party extensibility was **verified working today** before
this ADR was written: a non-`@plantuml-ts` bundle registers under its own name
and resolves eagerly, lazily, and through nested cross-includes. Nothing in
`src/` hardcodes a package list or closes the bundle namespace. If only the
generator could produce a manifest, SI11a would create a two-tier API where
third parties get bundle-level laziness but never per-resource.

**Decision.** `StdlibRemoteManifest` is exported and documented as
hand-constructible. `remoteStdlib({ manifest, baseUrl, fetcher? })` accepts any
manifest from any source — generator-emitted, hand-written, or fetched at
runtime by the consumer. The generator is **one producer, not the gatekeeper.**

**Consequences.** A third party hosting their own icon set gets exactly what
`tupadr3` gets. Costs nothing: the generator emits the same public type. Adds an
acceptance criterion — a hand-built manifest with no `@plantuml-ts` package
involved must resolve per-resource (T1).

**Known characteristic, document don't fix.** The *sprite name* namespace is
flat and global per diagram (`addSprite` is `byName.set`, last-write-wins), so
two collections both defining `$star` collide. Bundle PATHS are namespaced;
sprite NAMES are not. That is upstream's `SkinParam.sprites` behavior.

## Rollback classification

**Reversible** — revert the commits. Exports are additive; generated packages
gain NEW subpaths while existing eager modules stay byte-identical; no data
migration.

One constraint this implies: **npm publication is a separate maintainer-gated
step** (SI5b) and is NOT part of this mission. An in-repo revert is clean; an
unpublish is not.

## Public API impact

Additive only. `BundleData`, `stdlibStore`, `withStdlib`, `stdlibRegistry` and
`resolve()`'s signature are all unchanged. New package subpaths are non-breaking
per `~/.claude/rules/architecture.md`'s taxonomy. A consumer opts in by editing
one registry entry.
