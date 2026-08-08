# Licences — vendored Twemoji artwork

This directory contains **1,174 SVG artwork files**, copied byte-for-byte from
upstream PlantUML's jar-internal emoji resources
(`src/main/resources/net/sourceforge/plantuml/emoji/data/*.svg`) at commit
`de1f986f09253edb9bf6351808e1cdba99ec9e74`.

Per-file SHA-256 digests are in [`../emoji.manifest.json`](../emoji.manifest.json).
Re-check them at any time with:

```sh
npx tsx scripts/vendor-emoji.ts --verify
```

## Licence: CC BY 4.0

> **Twemoji**
> Copyright (c) Twitter, Inc and other contributors
> Graphics licensed under **CC-BY 4.0**:
> <https://creativecommons.org/licenses/by/4.0/>

This artwork is **not** MIT-licensed. `@knowvah/plantuml-ts` itself is MIT; this
asset tree is not, which is why it ships as a **separate, opt-in package**
(`@knowvah/plantuml-emoji`) rather than inside the core package.

- **Original project:** <https://github.com/twitter/twemoji> (archived)
- **Maintained fork:** <https://github.com/jdecked/twemoji>
- **Upstream's own attribution line**, shipped in PlantUML's `license` command
  (`version/License.java:235`), reproduced verbatim:

  > Twemoji (c) by Twitter at https://twemoji.twitter.com/

The Twemoji project states that attribution "through mentions in project
documentation, website footers, or app settings sections" satisfies CC-BY 4.0.
This file, the package `README.md`, and the manifest all carry it.

## Modifications

**None.** Every file is a byte-for-byte copy of the upstream bytes at the
pinned SHA — never re-encoded, optimised, minified, reformatted or
re-exported. CC-BY 4.0 requires that modifications be indicated; there are
none to indicate, and `--verify` proves it mechanically rather than by
assertion.

Note that these files are **bare `<path>`/`<circle>` fragments with no `<svg>`
root element**. That is how upstream stores and consumes them
(`Emoji.java:167-172` feeds them to `SvgSpriteParserFactory.create(data, null,
null)`). They are *not* malformed, and they must not be "repaired" into
well-formed SVG documents: doing so would both modify a CC-BY work and change
the geometry the conformance oracle measures.

## What is NOT here

`emoji.txt` — upstream PlantUML's own name→codepoint registry — is
deliberately **not** vendored into this tree. It is PlantUML's MIT-licensed
data, already ported inline as `src/core/klimt/creole/Emoji.ts#EMOJI_DATA`.
Keeping it out means everything in this directory is CC-BY-4.0 material and
nothing else, so the notice above applies cleanly to the whole tree.

## Provenance review

The full licence review, including the evidence trail and why this verdict
differs from the MIT verdict reached for the ArchiMate sprites, is in
[`../../plans/s1l-tail-fix/findings/emoji-artwork-licence-review.md`](../../plans/s1l-tail-fix/findings/emoji-artwork-licence-review.md).
