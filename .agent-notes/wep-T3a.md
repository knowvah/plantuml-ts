# wep-T3a: CommandWBSItemNew/Old

## Observation: task text inverts the PSEUDO / missing-label cases
- **Context**: porting CommandWBSItemNew/Old.executeArg (New:60-65, Old:58-65)
- **Finding**: `IdeaShape.fromDesc(null)` is BOX, `fromDesc("_")` is NONE. So a marker-only line (`+++`, no `_`) hits `label==null && shape!=NONE` -> error "Missing label for WBS node."; `+_` (NONE) becomes PSEUDO. The task's examples ("`+++` PSEUDO, `+_` missing label") are the reverse of the Java; the port follows the Java.
- **Impact**: T3c/the factory tests and any fixture expectations should use `+_` for a pseudo node.
- **Confidence**: High (Java read; port tests pin it)

## Observation: Java RegexOr in the item commands has three arms
- **Context**: the shape/direction RegexOr (New:53-59, Old:56-62)
- **Finding**: the second RegexConcat closes after DIRECTION_2; SHAPE_2 is the RegexOr's own third argument, so the alternatives are `(_)?([<>])?` | `([<>])?` | `(_)?`. Mirrored literally.
- **Impact**: do not "tidy" into two arms.
- **Confidence**: High
