# ADR-002: Stay MIT while depending on an EPL-2.0 layout engine

## Status

Accepted (2026-08-12) — maintainer ruling. Closes the licensing item raised by
the SI20 code review (`code-review-tasks.md`).

## Context

`@knowvah/dot-engine`, this project's layout engine and one of its three
runtime dependencies, is **EPL-2.0**. This package declares **MIT**. A code
review flagged the combination, and at the time the flag was raised it was
sharper than it is now: the engine's code was being **inlined into
`dist/plantuml-ts.js` and `.cjs`**, so the published artifact physically
contained EPL-2.0 code while advertising MIT.

Two things changed before this decision was taken:

1. **`dist/` no longer inlines it** (`e2feb98a`). `@knowvah/dot-engine` and
   `jsonc-parser` were added to `build.rollupOptions.external`, joining
   `katex`. The bundle now emits `import … from '@knowvah/dot-engine'` and npm
   installs the package alongside us. Verified by inspecting the built output,
   not the manifest.
2. **A `NOTICE` was added** and ships in the tarball (`package.json` `files`),
   recording each dependency, its license, its source URL, and the fact that
   the EPL component is imported rather than contained.

A related misstatement was corrected separately: `DIVERGENCES.md` had rejected
`elkjs` partly because it would be "the first non-permissive dependency in a
tree that is otherwise MIT" — a premise already false, since the layout engine
was EPL-2.0. That entry now rests on the one-engine ruling instead
(`dbdc295d`).

## Decision

**Stay MIT.** Depending on an EPL-2.0 library is not redistributing it. EPL-2.0
is a file-level copyleft: its obligations attach to the EPL-covered files and
their modifications, and reach a larger work only when that work actually
carries those files. Since `dist/` imports the engine rather than containing
it, the EPL-covered code reaches the consumer from its own publisher, under its
own license, with its own source availability.

Upstream PlantUML is the precedent, and its position is *harder* than ours:

- PlantUML is multi-licensed, with **MIT among the options**
  (`plantuml-mit`, alongside GPL-3.0-or-later, GPL-2.0, LGPL-3.0+, Apache-2.0,
  BSD-3-Clause and EPL-1.0 — `LICENSES.md`).
- Its npm packages `@plantuml/core` and `@plantuml/mcp-js` are distributed
  **under MIT** (`LICENSES.md`, "npm packages").
- That same codebase **bundles** Smetana, a Java transpile of Graphviz 2.38,
  whose lineage is EPL. Upstream therefore ships EPL-derived code inside an
  MIT-available artifact.

We do strictly less: we do not transpile, vendor, or bundle the engine. We
declare it as a dependency and import it.

## Consequences

**Easier.** No license change, no dual-licensing scaffolding, no
attribution-in-source obligations to thread through the build. Consumers get
MIT terms on our code and EPL-2.0 terms on the engine, each from its publisher.

**Harder.** The decision is contingent on `dist/` continuing to *not* inline
the engine. Re-inlining it — by dropping the `external` entry, vendoring the
source, or bundling for a CDN build — would reinstate the original question and
invalidate this ADR. That is the one change that must not be made casually.

**Guarded by.** `NOTICE`, which describes the three dependencies as imported
rather than contained, and would become factually wrong the moment that stops
being true.

**Not covered.** This records an engineering rationale, not a legal opinion. It
reflects the maintainer's determination for this project's distribution model.

@see NOTICE
@see ~/git/plantuml/LICENSES.md
@see DIVERGENCES.md ("`!pragma layout elk` — not supported")
