# Upstream PlantUML: bundled skins `sonyxperiadev` and `reddress` crash the renderer

**Status:** open (upstream defect). Filed from plantuml-ts skin-file-loading mission, Batch 4.
**Not a graphviz-ts / this-port issue** — reproduced with unmodified upstream PlantUML.

## Summary

Two of PlantUML's own bundled skin stylesheets crash the renderer with an
unhandled exception on every diagram type, producing an empty/degraded SVG:

- `skin sonyxperiadev` → `NullPointerException` in the style engine.
- `skin reddress` → `StyleParsingException: bad definition` in `StyleLoader`.

## Affected versions (reproduced in both)

- `plantuml-1.2026.7beta3` (this repo's pinned oracle jar).
- `PlantUML 1.2026.6 / 6287b33` (stable, Homebrew).

## Minimal repro

```
@startuml
skin sonyxperiadev
object o1
object o2
o1 --> o2
@enduml
```
```
@startuml
skin reddress
object o1
@enduml
```
`java -jar plantuml.jar -tsvg <file>` → non-zero stack trace, empty SVG.
Diagram type is irrelevant (class / state / object / sequence all crash).
`skin rose` on the same diagrams renders fine (rules out a general skin path
issue); both `.skin` files are bundled in the jar byte-identical to source.

## Stack (sonyxperiadev)

```
java.lang.NullPointerException: Cannot invoke "net.sourceforge.plantuml.style.Style.value(net.sourceforge.plantuml.style.PName)" because the return value of "net.sourceforge.plantuml.svek.image.EntityImageObject.getStyle()" is null
	at net.sourceforge.plantuml.svek.image.EntityImageObject.<init>(EntityImageObject.java:94)
	at net.sourceforge.plantuml.svek.GeneralImageBuilder.createEntityImageBlockInternal(GeneralImageBuilder.java:181)
	at net.sourceforge.plantuml.svek.GeneralImageBuilder.createEntityImageBlock(GeneralImageBuilder.java:98)
```

## Stack (reddress)

```
net.sourceforge.plantuml.style.parser.StyleParsingException: bad definition
	at net.sourceforge.plantuml.style.parser.StyleParser.readValue(StyleParser.java:215)
	at net.sourceforge.plantuml.style.parser.StyleParser.parseNow(StyleParser.java:130)
	at net.sourceforge.plantuml.style.parser.StyleParser.parse(StyleParser.java:85)
```

## Note

No test in the upstream PlantUML tree exercises either skin, which is likely
why the regression went unnoticed. plantuml-ts renders these skins (resolving
their skinparams) rather than crashing — see `DIVERGENCES.md`.
