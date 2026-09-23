# T23 — RESOLVED (resumed in main checkout, write-set extended)

## Update 2026-09-22 (resume): fixed, committed

The coordinator extended T23's write-set (journal row 63) to include
`renderer-classifier-box.ts`'s enhanced-body branch of `buildBodyPrimitives`
(ONLY that branch) and `renderer-body-enhanced.ts`, exactly the two files
the halt below identified as required. Fix:

- `renderer-body-enhanced.ts`: `renderEnhancedBody` (single joined string,
  tagged by the caller with ONE url) renamed to `buildEnhancedBodyPrimitives`
  and changed to return `UrlTaggedPrimitive[]` — one primitive per divider/
  tree part (still tagged `geo.url`, no per-cell url source exists for
  those), and one primitive PER ROW inside a 'rows' part (`row.url ??
  geo.url`, mirroring the classic path's `pushMemberRowPrimitives` exactly).
  An icon-bearing row reuses `renderer-classifier-box.ts#pushIconRowPrimitives`
  verbatim (now exported) via a throwaway `{y, item}` scratch array, to get
  the SAME url-background-rect + `<g data-visibility-modifier>`-wrapped-icon
  + text 2-or-3-primitive split the classic path already has (needed for
  `xogixe-78-zuro619`'s explicit-visibility rows).
- `renderer-classifier-box.ts`: `buildBodyPrimitives`'s enhanced-body branch
  (ONLY this branch touched) now returns `buildEnhancedBodyPrimitives(...)`
  directly instead of wrapping ONE collapsed string under `geo.url`.
  `wrapClassifierBody` (unchanged, `renderer-url.ts`) needed NO change — its
  existing merge/break-on-url-change algorithm, once fed real per-row
  primitives, produces the jar's exact 9/50 `<a>` structure on its own
  (header+leading-divider merge because both are tagged `geo.url` and are
  adjacent; each member row breaks its own run because its url differs from
  its neighbours; the closing divider gets its own run for the same reason).

Result: cutasu-32-zete658 fully conformant (structural 6->0). xogixe-78-
zuro619 structural 6->2 — the `<a>` COUNT/boundary acceptance criterion is
met (50 `<a>`, jar-exact triple structure, all 9 new unit tests pass); the
residual 2 diffs are a DIFFERENT, pre-existing, newly-EXPOSED (not
introduced) bug: `class-body-enhanced-layout.ts:198-200`'s
`buildRowsBlockRows` computes `visibilityIsField: m.params === undefined`
directly, instead of calling the shared, upstream-faithful `isMethodMember`
(`class-member-rows.ts:121-127`, `m.rawDisplay.includes('(') ||
m.rawDisplay.includes(')')` — "jar buckets ANY `(`/`)`-containing raw line
as a method, however malformed"). Two Observation members ("subject",
"performer") have a `Resource(A|B|C)` TYPE containing parens; jar (verified
directly in `xogixe-78-zuro619/in.svg`: `data-visibility-modifier=
"PUBLIC_METHOD"`) classifies them as METHODS (filled icon `#84BE84`); this
port's enhanced-body path classifies them as FIELDS (unfilled `none`) since
it never runs the parens-anywhere check. The CLASSIC path already gets this
right (`isMethodMember` is classic-path-only, not called from
`class-body-enhanced-layout.ts`). Out of T23's write-set (would touch
`class-body-enhanced-layout.ts`, not authorized) — filed as a follow-on, not
fixed here. This is NOT a T23 regression: xogixe was `diverged` before (6
structural diffs, all `<a>`-count/nesting) and is still `diverged` after (2
structural diffs, now ONLY icon-fill) — a strict improvement, and this
specific defect was invisible before because the old single-`<a>`-blob
comparison never walked deep enough into the tree to reach this `ellipse`.

Commit: `fix(cdd-T23): split member-url anchors from the classifier
fallback` (see git log). Files: `src/diagrams/class/renderer-body-
enhanced.ts`, `src/diagrams/class/renderer-classifier-box.ts`,
`tests/unit/class/renderer-body-enhanced-url.test.ts`, `docs/catalog.md`
(regenerated, export surface changed), `plans/class-divergence-drive/
measurements/t23.json`, this file.

---

# T23 (original halt, superseded above) — write-set contradiction, not a code fix

## Mechanism (diagnosis artifact)

**Origin:** `src/diagrams/class/renderer-classifier-box.ts:250-258`
(`buildBodyPrimitives`'s `geo.enhancedBody !== undefined` branch):

```ts
if (geo.enhancedBody !== undefined) {
  return [
    {
      url: geo.url,
      body: renderEnhancedBody(geo, geo.enhancedBody, theme, classifierFill(geo, theme), classBorderLine(geo, theme)),
    },
  ];
}
```

and the caller, `renderer-classifier-box.ts:377-378`:

```ts
const primitives: UrlTaggedPrimitive[] = [buildHeaderPrimitive(geo, theme), ...buildBodyPrimitives(geo, theme)];
return wrapClassifierBody(geo, primitives);
```

**Causal chain:** `cutasu-32-zete658` and `xogixe-78-zuro619` both have a
bare `--` line terminating the member list before the closing `}`
(`isEnhancedBody`, `src/diagrams/class/class-body-enhanced.ts:72-78`,
upstream-faithful — `BodierLikeClassOrObject#isBodyEnhanced`). That routes
BOTH fixtures through `computeEnhancedBodyGeo`/`buildBodyPrimitives`'s
enhanced-body branch, which collapses the ENTIRE member-row content into
ONE opaque `body` string via `renderEnhancedBody`
(`renderer-body-enhanced.ts`), tagged with a SINGLE `url: geo.url`. The
per-member `Url` that `class-body-enhanced-layout.ts:201` already attaches
to each `geo.enhancedBody.parts[...]` row (`...(m.ownUrl !== undefined ? {
url: m.ownUrl } : {})`) is discarded at this collapse point — it never
reaches a `UrlTaggedPrimitive`. `primitives` therefore has exactly 2
entries for these fixtures (header, one enhanced-body blob), both tagged
`url: geo.url`; `wrapClassifierBody`
(`renderer-url.ts:79-97`) merges them into ONE `<a>` — reproduced exactly:
`render-diff` shows `svg/g[1]/g[2]/a[1][childCount] exp=1 act=13`.

**Ruled out:**
- `class-member-parser.ts#stripUrlSuffix`/`class-url.ts#parseUrlBracket`:
  verified directly (`parseMemberLine('identifier : Identifier 0..1
  [[[careplan-definitions.htm#CarePlan.identifier]]]')` returns
  `ownUrl: {url: "careplan-definitions.htm#CarePlan.identifier", ...}` —
  per-member url parsing is correct and NOT the defect.
- `class-member-rows.ts:209` (`...(member.ownUrl !== undefined ? { url:
  member.ownUrl } : {})`): correctly copies `ownUrl` onto `row.url` for the
  CLASSIC (non-enhanced) path.
- `renderer-classifier-box.ts:290-296` (classic per-row loop, `const
  effectiveUrl = row.url ?? geo.url`): correct and reachable for the 5
  OTHER `[[[url]]]`-bearing corpus fixtures that do NOT trigger
  `isEnhancedBody` (`class-missing-label-URL-SVG-0`, `dasagu-52-vani172`,
  `fugexa-12-zoti674`, `fijali-69-pina030`, `gukuda-51-fuju086` — none has a
  bare `--`/`==`/`..`/`__`/`|_` line). `renderer-url.ts`'s merge/break
  condition IS the correct edit site for those 5.
- `renderer-url.ts#wrapClassifierBody`/`urlsEqual`: confirmed via direct
  read — operates correctly on whatever `primitives` array it's given; the
  defect is entirely upstream of it (only 2 primitives ever reach it for
  cutasu/xogixe, both already collapsed to the same url before
  `wrapClassifierBody` runs).
- Debug instrumentation (temporary `console.error` in
  `buildBodyPrimitives`'s classic per-row loop, added and reverted, net
  diff `git status --short` clean before/after): confirmed the classic
  loop's per-row branch NEVER executes for cutasu — `buildBodyPrimitives`
  returns from the enhanced-body branch before reaching it.

## Why this is a STOP, not a fix

Upstream's own enhanced-body path (`BodyEnhanced1.buildTextBlock`,
`~/git/plantuml/.../cucadiagram/BodyEnhanced1.java:186-190`) does NOT
bypass the per-member `Url` wrap either:

```java
private TextBlock buildTextBlock(Display display, char separator, TextBlock title, StringBounder stringBounder) {
    TextBlock result = new MethodsOrFieldsArea(display, skinParam, align, entity, style);
    result = decorate(result, separator, title, stringBounder);
    return result;
}
```

Each enhanced-body block is built as a `new MethodsOrFieldsArea(...)` — the
SAME class the classic (non-enhanced) path uses, whose
`TextBlockTracer.drawU` (`cucadiagram/MethodsOrFieldsArea.java:317-323`)
opens/closes each member atom's OWN `Url` (`m.getUrl()`,
`MethodsOrFieldsArea.java:314`) independently of the classifier's
`EntityImageClass.drawU`-level `startUrl`/`closeUrl`
(`svek/image/EntityImageClass.java:141-158`). `BodyEnhanced1.getUrls()`
(java:236) is a SEPARATE flat url-collection accessor, not the draw path.

So the jar's 9-`<a>`/50-`<a>` structure for cutasu/xogixe genuinely comes
from per-member url wrapping inside the enhanced-body render path — this
port's enhanced-body path (`class-body-enhanced-layout.ts` +
`renderer-body-enhanced.ts` + `renderer-classifier-box.ts`'s enhanced-body
branch) has NO per-row `<a>`-splitting mechanism at all (it emits one
joined string). Reaching the T23 acceptance criteria on cutasu/xogixe
therefore requires:

1. `renderer-body-enhanced.ts`: change `renderEnhancedBody` (or a sibling)
   to emit an array of per-part fragments (each part already carries `.url`
   per `class-body-enhanced-layout.ts:201`) instead of one joined string.
2. `renderer-classifier-box.ts:250-258`: change the enhanced-body branch of
   `buildBodyPrimitives` to spread those fragments into the
   `UrlTaggedPrimitive[]` array (mirroring the classic loop at lines
   290-296) instead of returning a single collapsed primitive.

Both are explicitly out of this task's write-set. `renderer-classifier-box
.ts` is explicitly named "Never: touch ... (out of write-set — read-only
for the bundle shape)" in the brief's Boundaries section, and
`renderer-body-enhanced.ts` is in neither the read-set nor the write-set.
Correction #5 in the brief anticipates exactly this shape of finding
("If the run-break needs a change in renderer-classifier-box.ts's bundle
shape, STOP and report the exact edit — do not make it") — this is that
condition, discovered one file earlier (`buildBodyPrimitives`) and one
file over (`renderer-body-enhanced.ts`, also required, also out of scope).

`renderer-url.ts`'s own merge algorithm (`wrapClassifierBody`/`urlsEqual`)
is correct as written and requires NO change for cutasu/xogixe specifically
— it never receives more than 2 primitives for either fixture. It IS the
correct (and sufficient) edit site for the task's step-4 render-all sweep
of the 5 non-enhanced-body `[[[url]]]` fixtures
(`class-missing-label-URL-SVG-0`, `dasagu-52-vani172`, `fugexa-12-zoti674`,
`fijali-69-pina030`, `gukuda-51-fuju086`), which do NOT trigger
`isEnhancedBody` and DO reach the classic per-row loop where `row.url` is
already correctly populated and merge-broken by url identity.

## No code changes made

`git status --short` is clean (worktree untouched apart from this note and
`measurements/t23.json`, written below). No commit created.

## Corpus sweep (task step 4)

`[[[url]]]`-bearing fixtures: 7 total (`grep -lE '\[\[\['`) —
`class-missing-label-URL-SVG-0`, `cutasu-32-zete658`, `dasagu-52-vani172`,
`fugexa-12-zoti674`, `fijali-69-pina030`, `gukuda-51-fuju086`,
`xogixe-78-zuro619`. Of these, 2 (`cutasu-32-zete658`, `xogixe-78-zuro619`)
trigger `isEnhancedBody`; 5 do not and are reachable by a
`renderer-url.ts`-only fix. Classifier-level `[[url]]`-only fixtures (no
`[[[`): 22 total (`grep -lE '\[\[[^\['`), all on the classic path and
already url-fallback-merged as one run (unaffected by any `renderer-url.ts`
change scoped to member-owned urls, since they have none).
