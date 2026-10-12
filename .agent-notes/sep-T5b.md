# sep-T5b: CommandCreoleSpace

## Observation: a new CreoleAtom kind falls into 'inline' in every consumer
- **Context**: adding the `'space'` variant (`AtomSpace.java`).
- **Finding**: consumers narrow with `if` chains ending in `atom.atom` (inline); tsc flags only three files (EntityImageDescriptionDelegates/TextBlock, leaf-sizing-folder-title). Others (creole-text-lines, leaf-sizing-text, class-member-creole, blocks-creole-atoms) compile silently and mis-measure as 0x0, so each needs an explicit branch.
- **Impact**: the next new kind needs the same audit; class member rows have no render variant for a space (it contributes nothing).
- **Confidence**: High

## Observation: AtomSpace height is the constant 1
- **Context**: `AtomSpace.java` calculateDimensionSlow.
- **Finding**: `(width, 1)`, not font height; bare `<space>` does not match (`^(\<space:(\d+)/?\>)`).
- **Confidence**: High
