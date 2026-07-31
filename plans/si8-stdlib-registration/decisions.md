# Architecture Decisions — si8-stdlib-registration

All six approved by the maintainer 2026-07-31. **Treat every decision here as
locked.** If you discover a conflicting constraint, STOP and log it to
`decision-journal.md` — do not silently override.

## ADR-1 — `prefetchInner` consults `getPumlResource` before throwing

**Context.** `src/core/include-resolver.ts#prefetchInner` gates a
`<bundle/thing>` target on `store.has(url)`, an exact-key lookup. A store built
by `withStdlib` resolves through `getPumlResource` and carries no such key, so
prefetch throws `StdlibNotBundledError` and `render()` catches it into an error
card. Verified by probe 2026-07-31: `render()` + `withStdlib` produces
*"plantuml-ts bundles no PlantUML stdlib… pass options.includeStore"* for a
caller who did exactly that. `renderSync` is unaffected only because it never
prefetches.

**Decision.** Accept the target when `store.getPumlResource?.(stdlibPath)`
resolves; keep throwing when nothing resolves it.

**Consequences.** Fixes a shipped defect and gets its own commit ahead of the
registry work. It is a **behavior change to public API**: inputs that error
today start succeeding. Strictly widening — no input that succeeds today changes
result — but it needs a regression test on `render()`, whose absence is why the
bug survived (all 10 `withStdlib` call sites feed `renderSync`).

## ADR-2 — Per-bundle laziness now; per-resource deferred, with the measurement

**Context.** Published payloads: `@plantuml-ts/stdlib` 1.8 MB across 5 bundles
(largest `bootstrap.js` **1.06 MB**); `-aws` `awslib14.js` **7.93 MB**;
`-tupadr3` `tupadr3.js` **19.54 MB**. The last two are *single bundles* —
per-bundle laziness makes them opt-in but does not shrink them.

**Decision.** Ship per-bundle lazy registration. Per-resource splitting becomes
its own tracked mission, recorded with these numbers.

**Consequences.** A tupadr3 consumer still pays 19.54 MB on first use, instead
of always. The deferral is justified by measurement, not adjectives: splitting
requires changing the **generated package shape** (6,849 tupadr3 `.puml` files;
29,101 across the full assets tree), which is a packaging mission, not a seam
mission. Options to record and NOT decide here: per-resource static modules
(bundler explosion) versus runtime HTTP fetch reusing the existing
`IncludeFetcher`.

## ADR-3 — Registration is an explicit map of dynamic-`import()` thunks

**Context.** A browser consumer needs to declare which packages back
`<bundle/thing>` without `node:fs` and without eager loading.

**Decision.**
`stdlibRegistry({ bootstrap: () => import('@plantuml-ts/stdlib/bootstrap') })`.

**Rejected.** (B) A generated self-registering meta-package — defeats
tree-shaking and re-introduces eager 19.54 MB. (C) A computed specifier
`` import(`…/${name}`) `` — unanalyzable by Vite/webpack, so it silently
degrades to no code-splitting, which is the entire feature.

**Consequences.** Static specifiers keep bundlers able to split and shake.
`stdlibStore`, `withStdlib` and `BundleData` must keep working unchanged — the
registry is additive, never a replacement.

## ADR-4 — Extend `prefetchIncludes`; do not add a sibling pass

**Context.** Resolved bundle text itself contains stdlib includes:
`assets/stdlib/c4/C4_Context.puml` has `!include <C4/C4>`. Lazy resolution must
therefore re-enter the transitive walk.

**Decision.** Teach the existing async pass to resolve stdlib targets through
the registry and recurse into the result.

**Rejected.** A sibling pass — it would have to duplicate the transitive walk,
the cycle guard and the over-fetch policy, then hand results back to the pass it
duplicated.

**Consequences.** One walk, one `CircularIncludeError`, one documented
over-fetch divergence. The existing over-fetch caveat (a text scan cannot know
which `!ifdef` branch runs) now extends to bundle loads: a bundle named in a
dead branch may be fetched.

## ADR-5 — Lazy registration is `render()`-only; `renderSync` gets a warm-up

**Context.** The sync seam cannot await, and `renderSync` staying synchronous is
a hard CLAUDE.md constraint and public API.

**Decision.** Expose an async resolver returning a ready `IncludeStore` that
sync callers await first and pass in. Rewrite the unregistered-bundle error to
name the bundle and state whether a registry was supplied.

**Consequences.** Sync callers keep working unchanged. The current message
("pass `options.includeStore`") becomes actively misleading once a registry
exists and must go. A chunk-load failure must be distinguishable from
bundle-not-registered — they have different fixes.

## ADR-6 — Reverting a fixture's `in.puml` requires re-capturing its `golden.svg`

**Context.** The three sprite fixtures were ratcheted in by SI9 and are pinned
at zero-diff, so this mission can fail `npm test`. All three declare *bundle*
sprites and are revertible in principle — "multiline" refers to multi-line
display text (`\n` in the usecase label), not multi-line sprite declarations.

**Decision.** When an `in.puml` changes, re-capture its `golden.svg` from the
pinned oracle jar in the **same commit**. This is explicitly distinct from the
forbidden "edit a golden to make a test pass".

**Consequences.** The predecessor's 2026-07-30 claim that `!include` and inlined
forms give byte-identical jar output must be **re-verified per fixture** — it
now sits behind a gate that fails the suite. Any fixture that will not return to
zero-diff **stays inlined**, with the measurement recorded; that is a documented
outcome, not a failure to engineer around.

Checked while planning, so the seed risk is bounded: the three goldens contain
no gradients, no filters and no `url(#…)` references, and their ids are
sequential `ent0001…`. The raw-source seed change from editing `in.puml` is not
observable in these three.

## Rollback classification

**Reversible** — revert the commits. One ordering hazard, and it dictates T6's
shape: if goldens are re-captured while `ratchet.json` still pins them, a
**partial** revert (code without goldens, or goldens without code) fails
`npm test`. T6's `in.puml` and `golden.svg` changes are therefore one commit,
revertible as a unit.

## Public API impact

Additive exports to `src/index.ts` (7 export statements today; no surface-pin
test exists). `stdlibStore` / `withStdlib` / `BundleData` unchanged. The one
contract change is ADR-1's, and it is strictly widening. Package is `0.1.0` and
publishable, so pre-1.0 latitude applies — but the generated package shape stays
untouched this mission (ADR-2), so no consumer regenerates anything.
