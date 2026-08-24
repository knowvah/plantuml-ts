# Dispatch flow — upstream, ours today, ours after

## Upstream — `PSystemBuilder.createPSystem`

Sequence, because *who* is asked and *in what order* is the whole mechanism.

```plantuml
@startuml
title Upstream dispatch (PSystemBuilder.java:230-296)
participant Builder
participant DiagramType
participant "Factory N" as Factory
Builder -> DiagramType : findStartTypes(first line)
DiagramType --> Builder : candidate type set
note right of Builder
  the uml start tag gives 10 candidates
  every other start tag gives exactly 1
end note
loop each factory, in fixed order
  Builder -> Builder : skip if type not a candidate
  Builder -> Factory : createSystem(source)
  alt every line matched a Command
    Factory --> Builder : Diagram
    Builder -> Builder : isOk -> return it
  else a line matched nothing
    Factory --> Builder : PSystemError (score)
    Builder -> Builder : collect, try next factory
  end
end
Builder -> Builder : all refused -> mergeV2 keeps max score
@enduml
```

## Ours today

```plantuml
@startuml
title Current dispatch (src/core/dispatcher.ts:236-275)
start
:read block type;
if (type is unambiguous?) then (yes)
  :return plugin with that type;
  stop
endif
while (more plugins in registration order?)
  if (plugin.accepts(lines) matches a regex?) then (yes)
    :return that plugin;
    stop
  endif
endwhile
:fall back to the block's own type;
stop
@enduml
```

The parser is never consulted, so a plugin can claim a source it cannot parse.
That is the divergence: `sequencePlugin.accepts()` is true for 1343 of 3158
fixtures, 244 of which are not sequence diagrams.

## Ours after

```plantuml
@startuml
title Dispatch after this mission
start
:findStartTypes(first line);
while (more plugins in registration order?)
  if (plugin type is a candidate?) then (no)
    :skip;
  else (yes)
    :plugin.parse(source);
    if (returned a refusal?) then (no)
      :return plugin and its AST;
      stop
    else (yes)
      :collect the refusal;
    endif
  endif
endwhile
:mergeRefusals -> highest score;
:render that error diagram;
stop
@enduml
```

The AST returns with the plugin so `renderSync` reuses resolution's parse
rather than repeating it ([D0](../decisions.md#d0), T12 criterion 4).
