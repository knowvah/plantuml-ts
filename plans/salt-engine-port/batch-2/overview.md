# Batch 2: elements + factory base

After batch 1 closes. **T2f first** (klimt gaps, maintainer-approved 2026-10-12, journal row 14),
then five parallel tasks in worktrees, disjoint write-sets. Close via
[../close-procedure.md](../close-procedure.md) (still no salt row can move). Prompt =
[../batch-1/task-preamble.md](../batch-1/task-preamble.md) + the task file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-widgets.md) | Button, Droplist, TextField, RadioCheckbox, Line, Image | typescript-pro (opus) | `src/diagrams/salt/element/{ElementButton,ElementDroplist,ElementTextField,ElementRadioCheckbox,ElementLine,ElementImage}.ts` | T1c | [ ] |
| [T2b](T2b-menus-tabs.md) | MenuBar, MenuEntry, MenuPopup, TabBar | typescript-pro (opus) | `src/diagrams/salt/element/{ElementMenuBar,ElementMenuEntry,ElementMenuPopup,ElementTabBar}.ts` | T1c | [ ] |
| [T2c](T2c-containers.md) | Grid, LeftFirst, TopFirst, Positionner2, Pyramid, PyramidScrolled, Border | typescript-pro (opus) | `src/diagrams/salt/element/{Grid,LeftFirst,TopFirst,ElementPyramid,ElementPyramidScrolled,ElementBorder}.ts`, `Positionner2.ts` | T1a, T1b, T1c | [ ] |
| [T2d](T2d-tree.md) | Tree, TreeEntry | typescript-pro (opus) | `src/diagrams/salt/element/{ElementTree,ElementTreeEntry}.ts` | T1b, T1c | [ ] |
| [T2e](T2e-factory-base.md) | ElementFactory, AbstractElementFactoryComplex | typescript-pro (sonnet) | `src/diagrams/salt/factory/{ElementFactory,AbstractElementFactoryComplex}.ts` | T1a, T1c | [ ] |
| [T2f](T2f-klimt-gaps.md) | klimt gaps: `Splitter.purgeAllTag`/`htmlTag`, `FontStyle` regex patterns, `UFontFactory.byDefault`, `FontConfiguration.blackBlueTrue`; unstub `AbstractElementText` | typescript-pro (opus) | `src/core/klimt/creole/command/Splitter.ts`, `src/core/klimt/shape/UText.ts`, `src/core/klimt/font/UFontFactory.ts`, `src/core/abel/FontConfiguration.ts`, `src/diagrams/salt/element/{AbstractElement,AbstractElementText,ElementText}.ts` | T1c | [ ] |
