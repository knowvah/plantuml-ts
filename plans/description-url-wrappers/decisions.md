# Architecture decisions (pre-made, approved 2026-10-15)

Do not re-argue these. A Java reading that contradicts one is stop 3.

## D1 — Exit bar
The mission is done when, at the T6 re-measure:
1. every target row (`fixtures.md`) has 0 `<a>`/`@id` diffs, or a `fixtures.md` ledger line with a
   mechanism (Java + port `file:line`);
2. 0 conformant losses in all 28 engines at every close;
3. 0 unexplained census rises (component, usecase; a rise with a stated mechanism is allowed);
4. class, object and state golden ratchets green throughout.
Rows with unrelated residuals (e.g. tuliba `rx`, jobuje fills) do not have to become conformant.
If the bar is missed, T7 still runs and files the gap with mechanisms.

## D2 — Family B wraps per text run, in the two description drawers
Wrap each text run and each inline (sprite) atom that carries a url in `startUrl`/`closeUrl`, in
`core/svek/image/EntityImageDescriptionDelegates.ts` (`drawTextAtom` and the inline branch) and
`core/svek/image/EntityImageDescriptionTextBlock.ts` (`drawAtoms`). Mirrors `AtomText.java:197-198,235-236`.
Reuse the duck-typed `urlCapable` from `core/annotations/blocks-creole-atoms.ts:172-182` (export it).
Not: rerouting description text through the legend drawer; not `TextBlockWithUrl` (block granularity).
No geometry or sizer change is expected; if one appears, it is a finding.

## D3 — Mirror the jar in every engine the shared code reaches
The core edit also reaches class (members already wrap at block level, `TextBlockTracer.ts:96-100`) and
state (SvekEdge labels). Mirror the jar exactly — nested `<a>` included only if the jar nests. T0b
measures the class/state jar SVGs first. Our nested `<a>` where the jar has none is a defect to remove,
not a reason to gate the wrap to description. A red class/object/state ratchet is stop 5.

## D4 — The parser keeps the raw token; the layout seam builds the Url
The description parser has no theme, so it stores the raw `[[…]]` token (`DescriptiveNode.url?: string`).
The layout/render seam builds the link with `UrlBuilder(theme.topurl, UrlMode.STRICT)` and passes a plain
`{ url, tooltip }` (as `EntityImageDescription.ts:138-141` expects; `Url.ts` keeps private fields).
Flagged deviation: Java resolves at parse time (`CommandUrl.java:98`, `CommandCreateElementFull.java:333-337`);
same precedent as codd's packagestyle resolution at layout entry.

## D5 — Edge leaf names travel on the edge geo
Add `DescriptionEdgeGeo.fromName?/toName?`, set in `layout-geo-post.ts#assembleEdgeGeo` through
`leafDisplayName(bareEntityName(link.from), namespaceSeparator)`; `renderer-edge.ts` prefers them. Do not
change `SvekEdge.ts` or `bareEntityName` (class/state use them). Do not add a 7th `drawEdge` parameter.

## D6 — Cluster URL is in scope through authored fixtures
No corpus fixture has a group URL. Author `.puml` fixtures (package, rectangle, frame with `[[url]]`) and
render oracles only with `scripts/oracle-render.sh <out-dir> <puml>`. Mirror `Cluster.java:339-341`.

## D7 — Core edits are pre-authorized where the mechanism lives in core
Allowed core files: `core/klimt/creole/atom/Atom.ts`, `core/klimt/creole/legacy/StripeSimple.ts`,
`core/svek/image/EntityImageDescriptionDelegates.ts`, `core/svek/image/EntityImageDescriptionTextBlock.ts`,
`core/annotations/blocks-creole-atoms.ts` (export only), and any other core file a diagnosis puts the
origin in (journal it). **Guards** (all green; red = stop 5):
- `tests/oracle/svg-conformance/{class,object,state}.golden.ratchet.test.ts`
- `tests/oracle/{class,object,state}-dot-parity.test.ts`, `tests/oracle/wrapper-parity*.test.ts`
- `tests/oracle/svg-conformance/layout-parity.ratchet.test.ts` (489), `description.golden.ratchet.test.ts` (352)
**Forbidden:** dot-engine, the plantuml fork, the oracle jar, cached oracle bytes (`test-results/dot-cache/**`,
`oracle/dist/**`).

## D8 — `makeNode` takes a decorations object
`makeNode(…, decorations?: { url?: string })` rather than another positional parameter (7+ call sites;
≤5-param hook limit).

## D9 — Measurement and branch
Codd's harness, copied into `measurements/` with paths changed: survey of all engines (`chain.sh`, load
gate 12), `diff-eng.mjs`, census through renderSync (`npx tsx scripts/svg-conformance-census.ts <type>
--json <path>`), render-diff (`npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree>/<slug>`),
re-pin at T6 (`pin-description.mts`, layout-parity, diff-baseline, census pins). Branch
`feat/description-url-wrappers` from `bb5b660d9`; merge commit to main; no push.
