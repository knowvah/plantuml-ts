# ufp-T3c — HColorAutomagic

## Observation: `automatic` in skinparam/colour-string paths never reaches HColorSet.parseColor
- **Context**: auditing callers after `parseColor('automatic')` stopped throwing.
- **Finding**: the 5 corpus rows containing the word (nisune-86, satabo-94, jivati-56, gucare-93, xeroce-52) render byte-identical before/after; the port's skinparam path is string-based (`resolveColorToSvgHex`, cdd2-T8 sentinel) and no typed port site calls `getAppropriateColor` (the Java sites: FontConfiguration:354, CircledCharacter:62, OpenIconic:199 are collapsed to resolved strings/identity in the port).
- **Impact**: only `PSystemColors` (java:99/:122) observes the new result. Typed `HColor` consumers fed by getColor*/getColorOrWhite now receive an HColorAutomagic instead of an Error.
- **Confidence**: High (before/after SVG compare)

## Observation: port has no HColor base class
- **Finding**: `HColorSet` returns `HColorSimple | HColorGradient` union; widened to exported `ParsedColor` (adds HColorAutomagic). `HColors.asSimple` / `PSystemColors.asSimple` params widened (type only).
- **Confidence**: High
