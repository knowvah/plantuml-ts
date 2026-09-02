# Filed: `CommandCreoleUrl`'s link class admits `[`, and upstream's does not

**Status.** Diagnosed, reproduced, fix known and NOT applied. Stop condition 8
forbids this mission from touching `core/klimt/creole/`, and the change is
shared by class, description, state and object — it needs its own mission with
its own corpus measurement across those families.

Found by C5 while routing frame text; C5 applied the fix as an experiment,
confirmed it, and reverted it. Independently re-verified against upstream by
the orchestrator before filing.

## Mechanism

Upstream's link alternative excludes BOTH brackets from the captured link:

```java
private static final String S_LINK_WITH_OPTIONAL_TOOLTIP_WITH_OPTIONAL_LABEL = START_PART +
        "([^%s%g\\[\\]]+?)" +   // Link
        ...
```
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:76-80`,
and the same `\[\]` exclusion appears in all five alternatives `getRegexp()`
composes (`:82-88`). `CommandCreoleUrl` uses that regexp verbatim
(`klimt/creole/command/CommandCreoleUrl.java:56`).

This port's class excludes only `]`:

```
'\\[\\[([^\\]]*(?:\\][^\\]]+)*)\\]\\]'
```
`src/core/klimt/creole/command/CommandCreoleUrl.ts:39`

## Causal chain

`ComponentRoseGroupingHeader.java:89` wraps a group's comment in its own square
brackets, so the drawn string is `[[[https://www.plantuml.com]]]` — an outer
`[`, then the creole `[[…]]`, then an outer `]`. Upstream's pattern cannot
start at position 0 (the `[` is excluded from the link), so it matches at
position 1 and the jar emits three runs: `[`, the linked url, `]`.

This port's pattern accepts the outer `[` into the link and matches at position
0, so it emits two runs: a linked `[https://www.plantuml.com` and a trailing
`]`. The `<a href>` is `[https://www.plantuml.com` — a broken url.

## Reach

`cedeti-10-bufu072`, on both the `alt` comment and the `else` condition. The
same shape occurs wherever a bracketed component text contains a creole url.
Not sequence-specific: any diagram family whose component wraps a display in
literal brackets hits it.

## The fix, verified

```
- '\\[\\[([^\\]]*(?:\\][^\\]]+)*)\\]\\]'
+ '\\[\\[([^\\[\\]]*(?:\\][^\\[\\]]+)*)\\]\\]'
```
With it, `cedeti-10-bufu072`'s comment becomes the jar's three runs exactly —
`[` at 86.731, the url at 89.756 with `textLength="125.194"`, `]` at 214.95.

## Why it is not applied here

`core/klimt/creole/` is shared. A character-class change to the url command
moves every family that renders a creole url, and this mission has neither the
mandate nor a measurement budget for class, description, state and object
goldens. Stop condition 8's instruction in this exact situation is to say so
rather than fork it.

**Follow-on.** Apply the one-character fix and measure all five families'
corpora. Expect movement wherever a bracketed display carries a creole url.
