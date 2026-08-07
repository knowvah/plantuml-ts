# F3-lic — sprite icon-set licence review

**Task:** F3-lic (Batch 3). **Gate for:** F4-a (ADR-9(a) — blocking, not advisory).
**Reviewed:** 2026-08-07. **Reviewed tree:** `~/git/plantuml`, HEAD
`de1f986f09253edb9bf6351808e1cdba99ec9e74` (`snapshot-61-gde1f986f092`).
**Scope:** the jar-internal `/sprites/**` resource root ONLY
(`SpriteImage.java:125`). NOT the `plantuml-stdlib` PUML bundles (SI5b), NOT
Twemoji (ADR-9(b), F4-b).

## Verdict

| Icon set | Files | Provenance | Licence | Verdict |
|---|---|---|---|---|
| `archimate/` | 139 (116 `.svg`, 23 `.png`) | 23 PNG: derived from the **Archi** modelling tool (`archimatetool.com`, `com.archimatetool.editor/img/archimate`), imported into PlantUML 2016-01-09. 116 SVG: **original Inkscape drawings** contributed to `plantuml/plantuml` by Jean-Marc van Leerdam (PRs #2316, #2327, 2025-09), drawn to the ArchiMate 3.2 notation. | **MIT** on both paths. PNG: Archi is MIT (`archimatetool/archi` `License.txt`; the owning plugin `com.archimatetool.editor` carried MIT at the time of import). SVG: upstream's own multi-licence offer (`LICENSES.md`), whose `plantuml-mit` subproject **does** ship `src/main/resources` and therefore these files. | **MIT-compatible** — conditional on the attribution + trademark notices in §5 |

**Stop condition 10 (scope collapse) is NOT triggered.** The single set found
passes. No fixture becomes a documented gap on licence grounds.

---

## 1. Enumeration — independently re-verified

Re-run, not copied from the task file:

```sh
find ~/git/plantuml/src/main/resources/sprites -mindepth 1 -maxdepth 1   # -> archimate
find ~/git/plantuml/src/main/resources/sprites -type f | wc -l           # -> 139
```

- Exactly **one** top-level set: `archimate/`. **Matches** the task file's claim.
- **139 files**, matching the claimed count, but the task file's "a mix of
  `.svg` and `.png`" understates a material split: **116 `.svg` + 23 `.png`**,
  and the two halves have *completely different provenance* (§2, §3). A review
  that treated the set as one artifact would have audited only half of it.
- No `LICENSE`, `NOTICE`, `README`, `COPYRIGHT`, `AUTHORS` or `CREDITS` file
  anywhere under the tree — **confirmed** (case-insensitive `find`, zero hits).
- No `copyright`/`licen*`/`creator`/`author` string inside any of the 139 files.
  The only metadata present is an Inkscape generator comment.
- `~/git/plantuml/LICENSES.md` re-grepped for `archimate|sprite|icon|open group`,
  case-insensitive: **zero hits** — no drift from the task file's finding. But
  see §4: LICENSES.md is *not* where upstream records this attribution.

**Other resource roots exist** (`openiconic/`, `stdlib/`, `svg/`, `themes/`,
`skin/`, `teavm/`) but none is reachable through the `/sprites/` root that
`SpriteImage.java:125` consumes, so none is in F4-a's vendoring scope. Not
reviewed here; if F4-a's scope ever widens to `openiconic/`, that needs its own
review (its attribution line points at `useiconic.com/open`).

## 2. Provenance — the 23 PNGs

**Evidence trail:**

- `git log --follow src/main/resources/sprites/archimate/access.png` walks back
  through two pure renames (2025-08-30 `25ddbddee5a`, `src/main/java/sprites` →
  `src/main/resources/sprites`; 2025-03-09 `c3c6022e90f`, Gradle restructure) to
  the true origin: **`703a77ee1c3`, 2016-01-09, Arnaud Roques, "version 8034"** —
  a 1753-file bulk release-snapshot commit that added 90 archimate PNGs at
  `src/sprites/archimate/` in one go. **No attribution in the commit message**,
  no accompanying licence file. On the commit alone, provenance is unknown.
- Upstream *does* state the attribution, just not in `LICENSES.md`. It lives in
  **all six** of upstream's licence-header templates —
  `plantuml-{mit,asl,bsd,epl,lgpl,gplv2}/*-license.txt` — and is emitted at
  runtime by `src/main/java/net/sourceforge/plantuml/version/License.java:227`
  (the `license` PSystem). The line credits the Archimate sprites to **Archi**,
  `http://www.archimatetool.com`. This is upstream's own authoritative,
  currently-shipping statement of origin, present in the MIT variant.
- **Independent corroboration of that claim** (I did not take it on faith):
  Archi's element/relationship icon directory
  `com.archimatetool.editor/img/archimate` (74 non-`@2x` PNGs, enumerated via
  the GitHub API) matches PlantUML's naming convention near 1:1 —
  `access`, `aggregation`, `assignment`, `association`, `composition`, `flow`,
  `influence`, `serving`, `triggering`, junction and realization/specialization
  are all present in both. PlantUML's set carries British respellings
  (`realisation`, `specialisation`), reordered junction names (`junction-and`)
  and extra `-filled` variants, i.e. an Archi-derived set with local edits.

**Licence at the point of taking** — the thread that mattered most, because
Archi's *root* `License.txt` was only added 2016-06-29, five months **after**
PlantUML's import, so citing today's root file alone would have been an
anachronism. Checked the last Archi commit before 2016-01-09
(`48ac092196bf9ad6098d7c4baa6acb966f38e9d2`): the plugin that owns
`img/archimate`, `com.archimatetool.editor`, carried its own `LICENSE.txt` —
**MIT, "Copyright (c) 2013-2015 Phillip Beauvoir"**. Archi's icons were
MIT-licensed at the moment PlantUML took them.

**Licence today:** `archimatetool/archi` `License.txt` — MIT, copyright
Phillip Beauvoir, Jean-Baptiste Sarrodie, **The Open Group**. GitHub's licence
detection reports SPDX `MIT` for the repository. Note the third copyright
holder: The Open Group is itself a grantor of this MIT licence (§4).

**Confidence: HIGH** that the set is Archi-derived and MIT-licensed at both the
time of import and today. **Residual (MEDIUM→HIGH, stated for honesty):** I
established correspondence by filename and by upstream's own attribution, not
by byte-comparing images — deliberately, since downloading sprite bytes is
outside this task's boundaries. Should upstream's attribution be wrong, the
files would fall back to §3's reasoning, which independently reaches MIT.

## 3. Provenance — the 116 SVGs

**Evidence trail:**

- `git log --follow` on `actor.svg` and the directory history: the SVGs enter in
  `7250c60b335` (2025-09-05, PR **#2316**) and `19b93cab93d` (2025-09-09,
  PR **#2327**), both by Jean-Marc van Leerdam (GitHub `jeanmarc`), preceded by
  a single placeholder `aaa.svg` in `23aed4376a2`. Not present before 2025-09.
- PR #2316's body presents the set as the contributor's own work offered to the
  project, not as an import from a third party; #2327 replaces the PNGs with
  SVG counterparts and adds backward-compatible aliases. No third-party source
  is named anywhere in the PRs or the linked discussion #2309.
- Every file carries an Inkscape generator comment and hand-authored path data
  at a uniform `19.995mm × 19.928mm` canvas — consistent with original drawing
  rather than extraction from a specification PDF or an existing icon pack.
- **Inbound licensing:** upstream `CONTRIBUTING.md` contains **no CLA and no
  DCO**. Contributions therefore land under the GitHub inbound=outbound
  convention: the contribution is licensed on the repository's own terms.
- **The repository's own terms include MIT** — `LICENSES.md` offers the codebase
  under seven licences at the user's option, MIT via the `plantuml-mit`
  subproject.
- **The decisive check, because LICENSES.md says "source code" and delivers the
  alternatives through "dedicated subprojects"** — that wording would be
  satisfied by a source-only MIT offer that never covered artwork. It does not
  hold up: `plantuml-mit/build.gradle.kts` declares
  `sourceSets.main.resources.srcDir(rootProject.../"src/main/resources")`, so
  the MIT jar contains `sprites/archimate/**`. That jar is published to Maven
  Central with POM `<license>MIT`, and the same subproject's `npmPackage` task
  publishes `@plantuml/core` declared MIT (`LICENSES.md` lists it as MIT).
  **Upstream itself distributes these exact files under MIT.**

**Confidence: HIGH.**

## 4. Trademark — does it bind independently of copyright?

Short answer: **yes, trademark binds independently — and it does not block
vendoring.** It imposes a notice obligation, not a redistribution bar.

- **ArchiMate® is a registered trademark of The Open Group** — confirmed
  directly against The Open Group's own trademark page. Registered marks may
  not be used as a generic term, nor in connection with products or services
  absent a licence; referential/editorial use is permitted, with the mark used
  adjectivally and a first-occurrence attribution notice.
  **Confidence: HIGH** (primary source, read directly).
- **Trademark attaches to the mark, not to the artwork bytes.** Nothing in the
  policy conditions redistribution of image files. The relevant exposure is
  naming — a sprite directory called `archimate/` and a stereotype
  `<<$archimate/interface>>` are referential uses identifying compatibility
  with the notation. That is the same use upstream PlantUML, Archi, and every
  ArchiMate tool makes. The cited infringement examples are commercial
  appropriations (e.g. offering ArchiMate training without a licence), not
  interoperability naming. **Confidence: HIGH** on the policy text;
  **MEDIUM** on the application, which is a legal judgment, not a fact.
- **The ArchiMate Specification *document* may not be redistributed** under The
  Open Group's evaluation/member licences — read directly. plantuml-ts would
  redistribute neither the document nor any text from it, so this restriction
  is not engaged. **Confidence: HIGH.**
- **The Open Group's own copyright pages state fair use for implementers** of
  the names and labels in the specification, and that publication is intended
  to encourage implementations. This sentence appears consistently across the
  1.0, 2.1, 3.0.1, 3.1 and 3.2 copyright pages. **Confidence: MEDIUM — I could
  not read this primary source directly:** `pubs.opengroup.org` now redirects to
  an SSO gate (`identity.opengroup.org/oauth2/authorize`), and I did not
  authenticate. Verified only through search-engine indexing of those primary
  pages, consistent across five spec versions. Treated as corroborating, never
  as load-bearing — the verdict does not depend on it.
- **The strongest trademark-side signal, and it is a primary source:**
  **The Open Group is itself a named copyright holder on Archi's MIT licence.**
  The trademark owner is a grantor of an MIT licence over a codebase whose
  purpose is ArchiMate icons and models. A trademark reading that forbade
  redistributing those icons would be inconsistent with the mark owner's own
  published licensing. **Confidence: HIGH.**

**Not legal advice.** This is a technical provenance review against primary
sources. The trademark *application* judgment (bullet 2) is the one place where
a maintainer may reasonably want counsel before shipping; the copyright chain
does not depend on it.

## 5. Obligations F4-a must satisfy (the verdict is conditional on these)

MIT is permissive but **not attribution-free**. `MIT-compatible` here means
"may be vendored *with these notices*", not "may be vendored bare":

1. **Carry the upstream copyright + permission notices.** MIT requires the
   copyright notice and permission notice in all copies. Ship, alongside the
   vendored bundle: Archi's MIT notice (Phillip Beauvoir, Jean-Baptiste
   Sarrodie, The Open Group) for the PNG lineage, and PlantUML's MIT notice
   (Arnaud Roques) for the SVG lineage. Following the SI5b D4 precedent, a
   per-bundle `LICENSE`/`LICENSES.md` beside the assets is the right shape.
2. **Reproduce upstream's own attribution line**, crediting the Archimate
   sprites to Archi (`archimatetool.com`) — it is what upstream ships in every
   licence header and prints at runtime.
3. **Carry the trademark notice**: ArchiMate is a registered trademark of The
   Open Group. Use the mark adjectivally; do not imply endorsement,
   certification, or Open Group accreditation of plantuml-ts.
4. **Vendor verbatim.** Do not re-encode, re-trace, recolour or optimise the
   SVG/PNG bytes. This is SI5b D3's rule and it applies here for a second
   reason: byte-verbatim copies keep provenance auditable, and re-drawing would
   forfeit the MIT chain established above in favour of a fresh derivative whose
   own provenance nobody has reviewed.
5. **Record the pinned upstream commit SHA** (`de1f986f092`) in the manifest, so
   a future audit can re-derive exactly what was taken.

## 6. What I could not establish

Stated so the maintainer can judge whether to pursue any of it beyond this
task's timebox. None of these changes the verdict.

- **The Open Group's spec copyright/trademark chapters, read first-hand.**
  `pubs.opengroup.org` is SSO-gated; I declined to authenticate. Corroborated
  indirectly only (§4). Pursuable with an Open Group account.
- **Byte-level identity between PlantUML's 23 PNGs and Archi's icons.** Not
  attempted — downloading sprite bytes is outside this task's boundaries.
  Filename correspondence plus upstream's own attribution was the evidence used.
- **Why the 2016 import carried no attribution commit.** `703a77ee1c3` is an
  SVN-era bulk release dump; there is no per-file record to recover. The
  attribution surfaces only in the licence headers, which is sufficient.
- **Whether Archi's own icons were themselves derived from an Open Group
  source.** Archi's MIT licence names The Open Group as a copyright holder,
  which is the strongest available answer; I did not trace further upstream.

## 7. Consequence for F4-a

**F4-a is cleared to proceed with the full `archimate/` set**, subject to §5.

- **No fixture becomes a documented gap on licence grounds.** All five sprite
  fixtures named in the mission remain in scope: `lesori-32-zeve057`,
  `ravodu-50-siso430`, `tuliba-37-liza126`, `kofuca-08-pafi749`,
  `turasu-73-zoni468`.
- **Stop condition 10 is NOT triggered** — the only set found passes, so this
  is neither a scope collapse nor push-forward rule 5's partial-failure case.
- The README's **"−4 (→ 343)" risk row does not fire.** The mission's 347 target
  stands as far as this gate is concerned; the remaining conditionality is
  F3-diag's `fariba-82` residual, which is not this task's.
- **Residual work transferred to F4-a, not waived:** the §5 notice obligations
  are part of F4-a's write-set. Vendoring the bytes without them would convert a
  clean MIT verdict into an actual licence violation — the precise failure mode
  ADR-9 exists to prevent.

## 8. Conflation guard — this is NOT the SI5b corpus

`plans/si5b-stdlib/decisions.md` D2 lists an `archimate` bundle inside
`@plantuml-ts/stdlib` as "all MIT/audited". **That conclusion was not imported
here and is not the basis of any verdict above.** The two corpora are disjoint:

| | SI5b corpus | This review |
|---|---|---|
| Location | `~/git/plantuml-stdlib/stdlib/archimate/` | `~/git/plantuml/src/main/resources/sprites/archimate/` |
| Contents | 3 `.puml` macro files + themes + examples; sprites inlined as encoded text in `ArchimateSprites.puml` | 139 standalone binary/vector image files |
| Source | `github.com/plantuml-stdlib/Archimate-PlantUML` (bundle README declares `license: MIT`) | Archi (PNG) + a PlantUML contributor (SVG) |
| Reached by | `!include <archimate/Archimate>` | `SpriteImage.java:125`, `/sprites/` resource root |

SI5b's **method** was reused (verbatim-copy discipline, per-bundle licence
capture, pinned SHA — D1/D3/D4, reflected in §5). Its conclusions were not.
The two happening to land on MIT is a coincidence of two independent audits,
not evidence for either.
