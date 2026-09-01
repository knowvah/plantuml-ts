# B3 — participant hyperlinks

## Context

The jar wraps a participant head in an `<a>` when the participant carries a
url. `boparo-11-pema294` declares `actor User as u [[/wiki/index.php/User]]`
and its golden wraps the label accordingly. The Java is explicit —
`LivingSpace#drawHeadOrTail:205-212`:

```java
final Url url = getParticipant().getUrl();
if (url != null) ug.startUrl(url);
comp.drawU(ug, area, context);
if (url != null) ug.closeUrl();
```

This port carries `url` on the model (`ast.ts:74`) and emits nothing. All 89
`<a>` elements in the corpus are missing.

**Two neighbouring things are NON-GOALS.** Message-level `A -> B [[url]] :
label` emits no `<a>` in the jar — verified on `fajixi-56-dete708` and recorded
at `renderer-message.ts:118-138`; do not "fix" it. Creole `[[url]]` inside a
label text (`devamo-31-coji129`) is a creole feature, not a sequence one.

## Task

Wrap a participant head in the jar's `<a>` when it has a url.

## Write-set

- `src/diagrams/sequence/renderer-participant-shapes.ts`
- `src/core/svg-shapes.ts` (an `<a>` wrapper emitter)
- `tests/unit/sequence/renderer.test.ts`, `tests/unit/svg-primitives.test.ts`

## Read-set

- `test-results/dot-cache/sequence/boparo-11-pema294/in.svg` — the jar's exact
  `<a>` attribute set: `target`, `href`, `xlink:href`, `xlink:type`,
  `xlink:actuate`, `xlink:show`, `title`, `xlink:title`. Match it; do not
  invent a subset.
- `src/diagrams/sequence/ast.ts:70-78` — where `url` already lives.
- `src/diagrams/sequence/renderer-message.ts:118-138` — the note explaining why
  MESSAGE urls are correctly not drawn. Read it so you do not undo it.

## Acceptance criteria

- Given `boparo-11-pema294`, when rendered, then the participant head is
  wrapped in an `<a>` whose attribute set matches the jar's element-for-element.
- Given a participant with no url, when rendered, then no `<a>` is emitted.
- Given `fajixi-56-dete708` (a message-level url), when rendered, then still no
  `<a>` appears anywhere — the non-goal holds.
- Given the corpus, when rendered, then the `<a>` count rises toward 89 and the
  fixtures it affects move closer on child count.

## Observability

N/A beyond the element census.

## Rollback

**Reversible.**

## Quality bar

All four gates. Write-set exact.

## Commit

`feat(B3): wrap a participant head in the jar's hyperlink`
