# Tech Health

Generated 2026-10-29 from the lockfiles of each repo plus `npm audit` /
`pnpm audit` run the same day, cross-checked against the advisory sources
listed at the end. Versions are the **installed** (lockfile) versions, not
the `package.json` ranges. "CVEs (High+)" lists only High/Critical
advisories that affect the installed version; Moderate/Low findings are
summarised in the notes below the table.

Action values: `OK`, `Update available`, `EOL — upgrade required`,
`CVE — patch required`.

## Summary table

| Repo | Component | Version | EOL Date | CVEs (High+) | Action |
|------|-----------|---------|----------|--------------|--------|
| plantuml-ts | Node.js (engines `>=26`; dev box 26.9.0; CI resolves latest 26.x via `node-version-file`) | 26.x | 2029-04-30 (Node 26 entered Active LTS 2026-10-28) | CVE-2026-111497 Brotli decoder OOB write / RCE (High; vendor write-ups score 9.2), CVE-2026-105483 TLS hostname bypass (High) — fixed in 26.12.1 | CVE — patch required (any 26.x < 26.12.1) |
| plantuml-ts | TypeScript | 6.0.3 | — (6.0 is the last JS-based compiler; 7.0 Go-native is GA) | none | Update available |
| plantuml-ts | Vite (lib build) | 8.3.5 | — | none (Oct-2026 batch fixed in 8.3.3; `npm audit` clean) | OK |
| plantuml-ts | Vitest / @vitest/coverage-v8 | 5.0.5 | — | none (CVE-2026-53633 fixed in 5.0.0-beta.4; `@vitest/ui` not installed) | OK |
| plantuml-ts | ESLint | 10.13.0 | — | none | OK |
| plantuml-ts | VitePress (docs-site) | 1.6.4, with `overrides.vitepress.vite = ^7.3.6` | — | none (the override keeps VitePress on a patched Vite 7 line; see dot-engine row for the un-overridden case) | OK |
| plantuml-ts | katex | 0.19.0 | — | none (CVE-2026-103923, Low 2.1, affects < 0.18.2) | OK |
| plantuml-ts | elkjs | 0.12.0 | — | none found | OK |
| plantuml-ts | @xmldom/xmldom | 0.9.12 | — | none at 0.9.12 (CVE-2026-83609/-83612/-83614/-83616 fixed **in** 0.9.12; 0.9.11 and below carry CVE-2026-83607 XSS) | OK — at the fix version exactly; do not downgrade |
| plantuml-ts | pako | 3.0.2 | — | none (the "pako-js" malicious-package report is a different package name) | OK |
| plantuml-ts | @knowvah/dot-engine | 2.4.0 (pinned tarball) | — | none | Update available (upstream tagged v2.7.1 on 2026-10-27; a 2.6.10 bump is parked on `chore/dot-engine-2-6-10`) |
| plantuml-ts | OpenJDK (oracle jar + `scripts/oracle-render.sh` only; not shipped) | 21.0.1 | Temurin 21: 2029-12-31 | none relevant (dev tooling) | OK |
| plantuml-ts | Graphviz `dot` (oracle + test shell-out only) | 16.1.0 | — | none relevant (dev tooling) | OK |
| dot-engine | Node.js (engines `>=22`; volta 26.3.1; CI 26) | 22.x–26.x | Node 22: 2027-04-30; Node 26: 2029-04-30 | same Node CVEs — fixed in 22.23.4 / 24.22.1 / 26.12.1 | CVE — patch required |
| dot-engine | TypeScript (+ `@typescript/native-preview` 7.0-dev) | ^6.0 | — | none | OK |
| dot-engine | Vitest | 4.1.11 | — | none High; `vitest` / `@vitest/mocker` Moderate (fixed 4.1.12) | Update available |
| dot-engine | Vite (transitive via VitePress 1.6.4 docs, un-overridden) | ≤ 6.4.3 | — | `npm audit`: vite High (≤ 6.4.3), undici High (≤ 6.29.0 via semantic-release/npm), brace-expansion High | CVE — patch required (docs/release tooling only; runtime has zero deps) |
| dot-engine | esbuild / peggy | 0.28.x / 5.x | — | none | OK |
| plantuml-plugins | Node.js (engines `>=22`) | 22.x+ | Node 22: 2027-04-30 | same Node CVEs | CVE — patch required |
| plantuml-plugins | TypeScript | 5.9.3 | — | none | Update available (rest of org is on 6.0) |
| plantuml-plugins | Vite (transitive) | 8.3.0–8.3.2 | — | launch-editor `fs.existsSync()` bypass on Windows (High) — fixed 8.3.3 | CVE — patch required |
| plantuml-plugins | markdown-it | 15.0.x < 15.0.3 | — | quadratic-time link-reference DoS (High) — fixed 15.0.3 | CVE — patch required |
| plantuml-plugins | undici (transitive) | 8.x < 8.12.2 | — | 5 High (TLS validation bypass, cache poisoning, 3 DoS) — fixed 8.12.2 | CVE — patch required |
| plantuml-plugins | source-map-js (transitive) | < 1.2.2 | — | event-loop DoS (High) — fixed 1.2.2 | CVE — patch required |
| plantuml-plugins | Vitest | 4.1.11 | — | none High; `@vitest/mocker` Moderate (fixed 4.1.12) | Update available |
| plantuml-plugins | VS Code engine / Kotlin / IntelliJ Platform Gradle | ^1.125.0 / 2.4.10 / 2.18.1 | — | none found | OK |
| common | Node.js (CI 22; no `engines`) | 22.x | 2027-04-30 | same Node CVEs — fixed 22.23.4 | CVE — patch required |
| common | TypeScript / tsup | 6.0.3 / 8.5.1 | — | none | OK |
| common | Vite (transitive) | 8.3.0–8.3.2 | — | launch-editor bypass (High) — fixed 8.3.3 | CVE — patch required |
| common | undici / source-map-js (transitive) | 8.x < 8.12.2 / < 1.2.2 | — | High (as above) | CVE — patch required |
| common | Vitest | 5.0.x < 5.0.3 | — | none High; `@vitest/mocker` Moderate (fixed 5.0.3) | Update available |
| plantuml-grammar | Python (`>=3.11`; CI 3.13) | 3.11–3.13 | 3.11: 2027-10; 3.13: 2029-10 | none found (Python deps not audited — no `pip-audit` run) | OK |
| plantuml-grammar | Node.js (volta 26.9.0; engines `>=26`) | 26.9.0 | 2029-04-30 | same Node CVEs — fixed 26.12.1 | CVE — patch required |
| plantuml-grammar | undici (transitive, root tooling) | 4.0.0–6.29.0 | — | High (`npm audit`) | CVE — patch required (tooling only; `packages/engine` audit clean) |
| plantuml-grammar | TypeScript / Vitest (packages/engine) | 6.0.3 / 5.0.5 | — | none | OK |
| plantuml-grammar | Java (javac for `tools/extract`) | 21 | Temurin 21: 2029-12-31 | none relevant | OK |
| elk-engine | TypeScript (native) | 7.0.2 | — | none | OK |
| elk-engine | Node.js (engines `>=22`; volta 26.3.1; CI 26) | 22.x–26.x | as above | same Node CVEs | CVE — patch required |
| elk-engine | Vitest / esbuild | 5.0.3 / 0.28.2 | — | none (`npm audit` clean) | OK |
| elk (reference) | Java | 17 (JavaSE-17) | Oracle Premier ended 2026-09-30; Temurin 17 to 2027-10-31 | none relevant (reference source, never built as a product here) | OK — note Temurin 17 EOL in 12 months |
| elk (reference) | Maven Tycho / ELK | 4.0.12 / 0.13.0-SNAPSHOT | — | — | OK |
| plantuml (upstream reference, outside org) | Java / Gradle | 1.2026.8beta1 | — | — (consulted, not built or shipped) | OK |

## Notes per finding

### Node.js October 2026 security release (all repos)

The 2026-10-21 Node.js security release fixed 10 CVEs across the 22.x,
24.x and 26.x lines (fixed versions 22.23.4, 24.22.1, 26.12.1). The
headline item, CVE-2026-111497, is an out-of-bounds write in the Brotli
decoder reachable from `zlib`; the official advisory rates it High, several
vendor write-ups score it 9.2. plantuml-ts does **not** call `zlib` at
runtime in `src/` (deflate is via `pako`, a pure-JS port), so the exposure
is the toolchain and any host application, not the library — but every
repo's dev box and CI runner should move to a patched line. The dev box
reported `node v26.9.0` on 2026-10-29. plantuml-ts CI uses
`node-version-file: package.json`, which resolves the newest 26.x the
runner image offers; whether that is already ≥ 26.12.1 is not knowable
from the repo.

### Vite

- plantuml-ts: 8.3.5 (≥ 8.3.3) — the three 2026-10-06/10-21 advisories
  (CVE-2026-112945/-112946/-112947) are fixed; the April file-read
  advisories (CVE-2026-39363/-39364, fixed 8.0.5) do not apply.
  `overrides` pins VitePress's own Vite to `^7.3.6`, which is why
  plantuml-ts's audit is clean while dot-engine's VitePress 1.6.4 still
  resolves a Vite ≤ 6.4.3 and audits High.
- plantuml-plugins and common: transitive Vite 8.3.0–8.3.2 (via tsup /
  vitest toolchains); `pnpm update vite` to 8.3.3+ clears the High.
  All Vite advisories concern the **dev server**; none of these repos ship
  a Vite dev server to users.

### Vitest

CVE-2026-53633 (Browser Mode CDP exposure, 9.8) and CVE-2026-47429 (UI
server file read, 9.8) were fixed in 3.2.5 / 4.1.0 / 5.0.0-beta.4; none of
the installed versions are affected. The remaining `@vitest/mocker`
findings (code injection via manual mock registration; fixed 4.1.12 and
5.0.3) are Moderate and dev-only. The Vulert entry CVE-2026-112948
against `@vitest/ui` 5.0.5 could not be verified against a primary source
and `@vitest/ui` is not installed in plantuml-ts.

### @xmldom/xmldom 0.9.12

plantuml-ts sits exactly on the version that closed the 2026 series
(CVE-2026-83605/-83606/-83607 fixed in 0.9.11; -83609/-83612/-83614/-83616
fixed in 0.9.12). The library is used to parse SVG sprites and `<img>`
data URIs, i.e. attacker-influenced XML in a browser context, so this
dependency warrants a Dependabot watch rather than a one-off check.

### katex 0.19.0

CVE-2026-103923 (prototype-pollution-assisted `trust` escalation, CVSS 4
= 2.1) affects < 0.18.2 only. plantuml-ts renders `<latex>`/`<math>` via
KaTeX as a documented divergence from JLaTeXMath (`DIVERGENCES.md`).

### TypeScript

6.0.3 is the final JavaScript-based compiler; 7.0 (Go-native) is GA and
elk-engine already pins 7.0.2. plantuml-plugins is the outlier on 5.9.3.
There is no security EOL for a compiler version; the action is
"Update available", driven by the org converging on one toolchain.

### Java 17 (elk reference fork)

Oracle JDK 17 Premier Support ended 2026-09-30; Eclipse Temurin 17 is
supported to 2027-10-31. The knowvah `elk` checkout is read as a
specification (option metadata in `.melk` files, layered-algorithm source)
and is never built into a shipped artifact, so this is informational.

## Sources consulted

Confidence per `~/.claude/rules/research-sources.md`: **HIGH** for the
`npm audit`/`pnpm audit` rows (Tier 1, run this session) and for the
GitHub advisory GHSA-238p-pmpm-9mq7 (fetched); **MEDIUM** for EOL dates
and the Node/Vite/xmldom CVE ranges (consistent across several Tier 3
trackers, primary advisory text not all fetched).

- Node.js October 2026 security releases — https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
- Node.js release schedule — https://nodejs.org/en/about/releases/ and https://endoflife.date/nodejs
- KaTeX GHSA-238p-pmpm-9mq7 / CVE-2026-103923 — https://github.com/advisories/GHSA-238p-pmpm-9mq7
- Vite advisories index — https://github.com/vitejs/vite/security/advisories ; CVE-2026-112946 ranges — https://www.mend.io/vulnerability-database/CVE-2026-112946/
- Vitest CVE-2026-53633 / -47428 / -47429 — https://advisories.gitlab.com/npm/vitest/CVE-2026-47429/ , https://vulert.com/vuln-db/CVE-2026-53633
- @xmldom/xmldom 2026 series — https://releasealert.dev/npmjs/@xmldom/xmldom/cves , https://www.mend.io/vulnerability-database/CVE-2026-83607/
- Eclipse ELK 0.12.0 release — https://projects.eclipse.org/projects/modeling.elk/releases/0.12.0/review
- TypeScript 6.0 / 7.0 — https://visualstudiomagazine.com/articles/2026/03/23/typescript-6-0-ships-as-final-javascript-based-release-clears-path-for-go-native-7-0.aspx
- Java support timelines — https://www.oracle.com/java/technologies/java-se-support-roadmap.html , https://adoptium.net/support
- Python version status — https://devguide.python.org/versions/
