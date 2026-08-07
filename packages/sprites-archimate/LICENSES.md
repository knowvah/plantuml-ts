# Vendored jar-internal sprite bundle — licences and attribution

Everything under `assets/sprites/` is a **byte-verbatim** copy of the
`/sprites/**` resource root of upstream PlantUML, taken at commit
`de1f986f09253edb9bf6351808e1cdba99ec9e74` (`snapshot-61-gde1f986f092`) from
`https://github.com/plantuml/plantuml`, path
`src/main/resources/sprites/`.

No file here has been re-drawn, re-encoded, re-traced, recoloured, optimised,
minified or re-exported. Byte identity is the provenance chain: see
`assets/sprites.manifest.json` for a per-file SHA-256 and
`scripts/vendor-sprites.ts` for the reproducible copy step.

Provenance was reviewed per ADR-9(a) of `plans/s1l-tail-fix/decisions.md`; the
full evidence trail is `plans/s1l-tail-fix/findings/sprite-licence-review.md`.

## The set is not one artifact

| Files | Lineage | Licence |
| --- | --- | --- |
| 116 `.svg` under `archimate/` | Original Inkscape drawings contributed to `plantuml/plantuml` by Jean-Marc van Leerdam (PRs #2316, #2327, 2025-09), drawn to the ArchiMate 3.2 notation. Distributed by upstream under its own MIT offer (`LICENSES.md`, `plantuml-mit`, which ships `src/main/resources`). | MIT (PlantUML) |
| 23 `.png` under `archimate/` | Derived from the **Archi** modelling tool (<http://www.archimatetool.com>), plugin `com.archimatetool.editor`, path `img/archimate`; imported into PlantUML on 2016-01-09 (`703a77ee1c3`). MIT at the moment of import and MIT today. | MIT (Archi) |

## Attribution — the Archi lineage (23 PNG)

Reproducing upstream PlantUML's own attribution line, which appears in all six
of its licence-header templates (`plantuml-{mit,asl,bsd,epl,lgpl,gplv2}`) and is
printed at runtime by `net/sourceforge/plantuml/version/License.java:227`:

> Archimate sprites are from Archi:
> <http://www.archimatetool.com>

Archi's MIT notice, carried in full as MIT requires:

```
MIT License

Copyright (c) 2013-2015 Phillip Beauvoir
Copyright (c) Phillip Beauvoir, Jean-Baptiste Sarrodie, The Open Group

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Attribution — the PlantUML lineage (116 SVG)

Taken under upstream PlantUML's MIT option (`LICENSES.md` in
`plantuml/plantuml`, delivered through the `plantuml-mit` subproject, whose
`build.gradle.kts` adds `src/main/resources` to its resource source set and
which publishes to Maven Central with POM `<license>MIT`).

```
MIT License

Copyright (c) Arnaud Roques and the PlantUML contributors
(SVG sprites in this directory: Jean-Marc van Leerdam)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Trademark

ArchiMate® is a registered trademark of The Open Group.

The mark is used here referentially and adjectivally, to identify sprites that
depict the ArchiMate® notation. Neither plantuml-ts nor this bundle is
endorsed by, certified by, accredited by, or affiliated with The Open Group.
No trademark licence is granted by the MIT licences above, which cover
copyright only.

## Not legal advice

This file records a technical provenance review against primary sources. It is
not legal advice.
