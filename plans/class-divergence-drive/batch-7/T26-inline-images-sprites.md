# T26 — inline images, sprites, openiconic, emoji atoms

**Agent:** typescript-pro (sonnet) · **Depends on:** — · Worktree.

## Context

`diagnosis/A2b-entity-groups.md` §E12 (MEDIUM confidence — divergence shape
proven from both SVGs, but the jar's `AtomImg`/`AtomSprite` bodies were NOT
read): the jar turns `<img:…>`, `<$sprite>`, `<&openiconic>` and emoji
markup into `<image>` elements (or, for emoji, coloured `<path>`s; for a
recoloured sprite, an `<image>` plus `<filter><feFlood>`). This port
already resolves OpenIconic (`class-member-atom-resolve.ts
#resolveOpenIconicAtom`, `renderer-openiconic.ts#renderOpenIconicAtom`) and
emoji (`resolveEmojiAtom`, delegating to `core/klimt/creole/atom/
AtomEmoji.ts` — emoji render as native-font `<text>`, a DELIBERATE
divergence shared with the description engine, NOT the E12 gap) for MEMBER
ROW text. The gap is in TITLE text (`rotisi-30-loge424`'s `title I am
<$bug16> and <$printer8>…`, `malara-55-moce209`), namespace/cluster titles
(`jabama-09-kago823`'s `<img:HelloWorld.png{scale=1.5}>`), and sprite
RECOLOURING (`manube-50-xora983`, `ziripa-77-zizo842`'s `<filter>` defs) —
read `net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java` and
`klimt/sprite/` FIRST (the report explicitly did not) before assuming the
existing member-row resolvers generalize. The report is a lead, not a
proof: `ziripa-77-zizo842`'s actual source
(`test-results/dot-cache/class/ziripa-77-zizo842/in.puml`) contains
`<u:#FF0000>toto</u>`/`<w:green>green</w>`/`<s:#00FFFF>strike</s>` — creole
DECORATION tags, not a `<$sprite>` reference — which more closely matches
`diagnosis/A3-style.md` §M7's wave-underline `<filter>` mechanism than
sprite recolouring. Verify against the jar SVG before implementing; if
ziripa is not sprite-related, journal it as M7's territory (or unresolved)
rather than forcing a sprite fix that does not apply.

## Task

1. Read `AtomImg.java` (full) and `klimt/sprite/` (the recolour/`feFlood`
   emission) before writing any code.
2. TDD: write failing tests for `rotisi-30-loge424`, `malara-55-moce209`,
   `jabama-09-kago823`, `manube-50-xora983`, `gekope-01-ricu859` against
   `test-results/dot-cache/class/<slug>/in.svg`.
3. Instrument `ziripa-77-zizo842` per the Context note; journal whether it
   belongs to this task's scope, M7, or neither, BEFORE attempting a fix.
4. Wire title/legend/namespace-title text through the same `<img:>`/
   `<$sprite>` atom resolution member rows already have, in `src/core/
   klimt/creole/` (the shared atom layer — NOT the stripe/tree files T24
   owns) plus whichever class title/cluster-title render path currently
   drops to literal text.
5. Add sprite-recolour support (`<filter><feFlood flood-color="…">`) for a
   coloured sprite reference, per the jar's emission you just read.
6. Instrument `gekope-01-ricu859`: `<size:12><&key></size><b>` combines an
   existing, working OpenIconic glyph with a `<size:>` wrapper and tabs —
   name why this diverges (spacing, size interaction, or something else)
   before patching.
7. `npx tsx tools/render-diff.mts` on all six named fixtures; record
   before/after in `.agent-notes/cdd-T26.md`.

## Read-set

`net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java` (whole file);
`net/sourceforge/plantuml/klimt/sprite/` (recolour/`feFlood` emission);
`src/diagrams/class/class-member-atom-resolve.ts` (whole file, 176 lines —
the existing pattern to extend, not to blindly copy); `src/diagrams/class/
renderer-openiconic.ts`, `renderer-bullet-atom.ts`; `src/core/klimt/
creole/atom/AtomEmoji.ts` (the existing, deliberate emoji-as-text
approach); `diagnosis/A2b-entity-groups.md` §E12; `diagnosis/A3-style.md`
§M7 (the manube/ziripa distinction).

## Write-set

`src/core/klimt/creole/` atom files for img/sprite/openiconic/emoji
resolution ONLY (name the exact files after reading them — never the
stripe/tree files T24 relies on), `src/diagrams/class/
renderer-openiconic.ts`, `renderer-bullet-atom.ts`,
`class-member-atom-resolve.ts`, their test files, `.agent-notes/
cdd-T26.md`, `plans/class-divergence-drive/decision-journal.md`
(append-only).

## Acceptance criteria

- Given `rotisi-30-loge424`, when rendered, then `<image>` elements replace
  every `<$bug16>`/`<$printer8>`/`<$printer4>` occurrence in the title
- Given `manube-50-xora983`, when rendered, then its sprite-recolour
  `<filter>` defs are present (count matches the jar for the sprite
  portion only — the legend-table creole-parsing half is T28's)
- Given `malara-55-moce209`, `jabama-09-kago823`, `gekope-01-ricu859`, when
  rendered, then each is conformant or its residual is named with a
  mechanism
- Given `ziripa-77-zizo842`, when diagnosed, then the journal states
  whether it belongs to this task, M7, or neither — no forced fix
- Given every `href` this task emits, then it follows the byte-shape of
  the existing `DIVERGENCES.md` sprite/img pass-through entry

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; `npx tsx
tools/render-diff.mts` on all six named fixtures before/after; hooks:
≤500-line files, ≤30 NLOC functions, CCN ≤10, ≤5 params.

## Boundaries

Always: read `AtomImg.java`/`klimt/sprite/` before coding; verify ziripa's
actual mechanism against its real source rather than trusting the report's
label. Ask first: any README stop condition; touching a file T24 owns.
Never: rebuild the oracle cache (D12); change emoji-as-text (a deliberate,
pre-existing divergence, not this task's gap); fit a constant without a
citation.

## Commit

`fix(cdd-T26): route title/namespace/sprite images through the atom seam`

Body: cites `AtomImg.java`/`klimt/sprite/` line ranges used; states
ziripa's resolved disposition.
