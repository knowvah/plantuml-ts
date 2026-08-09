# F2-c — url-label sprite scale (G10)

## Observation: the description leaf sizer never reaches `scanLineForAtoms`

- **Context**: Deciding where to attach url provenance so a `<$sprite>` inside
  a `[[url label]]` could skip `CommandCreoleSprite`'s `fontSize/13` factor.
  `creole-atoms-measure.ts` has TWO entry points — `measureInlineAtom` (token
  in) and `measureLineWithAtoms`/`lineAtomHeightExcess` (raw line in, via
  `scanLineForAtoms`) — and it was not obvious which one produces a leaf's box.
- **Finding**: Instrumenting `spriteScale` with a stack trace over
  `rectangle "You can click\n[[http://www.google.com <$maxime>]]"` shows the
  ONLY call sites reached are `leaf-sizing-entity.ts:80`
  (`sizingAtomImageResolverFor`) and `render-atoms.ts:274/279`
  (`resolveSpriteAtom`), both driven from `Sea.add` / `Sea.doAlign` /
  `SheetBlock1.initMap` — i.e. entirely from `buildLineAtoms`'s `CreoleAtom`
  stream. `scanLineForAtoms` is NOT on the leaf path.
  `leaf-sizing-text.ts#maxLineWidth`/`atomHeightBonus` (which DO use the raw
  scan) are not what sizes a routed leaf any more; the `BodyEnhanced2`/`Sea`
  route superseded them.
- **Impact**: Any future per-atom provenance/context flag for a DESCRIPTION
  leaf belongs on the token that `StripeSimple` pushes, not on the raw-line
  scanner. `scanLineForAtoms`'s remaining consumer is `link-edge-attrs.ts`
  (edge labels), which is a genuinely separate path.
- **Confidence**: High — direct stack-trace evidence, not inference.

## Observation: `CommandCreoleUrl#resolveLabel` eats a sprite's `{scale=N}`

- **Context**: Writing a provenance test for `<$maxime{scale=0.31}>` inside a
  `[[url …]]`.
- **Finding**: `resolveLabel` and `resolveUrlAndTooltip`
  (`src/core/klimt/creole/command/CommandCreoleUrl.ts`) both run
  `inner.replace(/\{[^}]*\}/g, '')` over the WHOLE `[[…]]` inner text to drop
  an optional `{tooltip}`. That also deletes a sprite's own `{scale=N}` block
  when the sprite is in the LABEL, so the scale silently falls back to 1:
  `[[http://p.com <$maxime{scale=0.31}>]]` → `scale: 1`, while
  `<$maxime{scale=0.31}>` outside a link → `scale: 0.31`. Upstream's tooltip is
  POSITIONAL, not a global strip —
  `UrlBuilder.java:76-79` (`S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL`)
  matches the link, then `\{([^{}]*)\}` immediately after it, then a label
  `[^%s\{\}\[\]][^\[\]]*` whose FIRST char may not be a brace but whose
  remainder may — so upstream's label keeps its braces.
- **Impact**: Real, currently un-owned. The `*N` scale form (`<$s*0.31>`) is
  unaffected, which is why `vivido-49-nisu863` node 0 measures exact anyway. No
  fixture in the 354 exercises the `{scale=N}`-in-a-link shape.
  `tests/unit/creole-url-sprite-scale.test.ts` records it as an `it.todo`
  rather than pinning the wrong value.
- **Confidence**: High — reproduced both ways; upstream regex read directly.

## Observation: upstream also drops a sprite's forced colour inside a url

- **Context**: Reading `AtomTextUtils#createAtomTextForUrl` (`java:119-127`)
  for the scale mechanism.
- **Finding**: That branch passes `final HColor forcedColor = null;` and uses
  `fontConfiguration.getColor()` — so upstream ignores `<#RRGGBB$name>`'s
  forced colour inside a `[[url …]]`, where the ordinary path
  (`CommandCreoleSprite`, `java:84-89`) honours it. Our port honours it in both
  contexts.
- **Impact**: A colour-only (size-neutral) divergence, so no size ratchet can
  see it; its only observable is SVG, against goldens this mission may not
  regenerate. NOT fixed in F2-c — out of the diagnosed mechanism and with no
  fixture to verify against.
- **Confidence**: High for the upstream reading; unverified against the jar's
  actual SVG output.

## Observation: `oracle/goldens/` scan paths are all exact joins

- **Context**: Needing somewhere to land an ADR-7 authored fixture whose fix
  lands in a later batch.
- **Finding**: Every ratchet and measurement script joins to its own exact
  engine directory (`oracle/goldens/{description,class,state,object,svg-*}`);
  none enumerates `oracle/goldens/*`. Only `scripts/oracle-gap.ts` (a report,
  not a gate) walks the tree recursively.
- **Impact**: `oracle/goldens/pending/<slug>/` is a safe staging area for an
  authored fixture + jar oracle that would otherwise classify as `widened` for
  want of a `size-backlog.json` pin (which ADR-1 forbids a task from writing).
  See `oracle/goldens/pending/README.md`.
- **Confidence**: High — grep-verified across `scripts/` and `tests/`.
