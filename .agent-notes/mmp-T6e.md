## Observation: the preprocessor right-trims every line; upstream mindmap keeps trailing spaces
- **Context**: kijaru-67-buco967 (`  ** **$index** `) — jar draws `1` bold then a separate `<text> </text>`.
- **Finding**: `CommandMindMapOrgmode.java:55` calls `super(false, ...)` → `SingleLineCommand2.doTrim=false`
  (SingleLineCommand2.java:60-78), so the label keeps `**1** ` (LayoutProbe `label=[**1** ]`). The port's
  `src/core/preprocessor.ts:166` (`flatten`, `segment.trimEnd()`) strips it for every engine before any
  command runs. The whitespace atom measures 0 wide (box width unchanged), but is drawn.
- **Impact**: any command upstream builds with `doTrim=false` loses trailing whitespace here. A global fix
  touches all engines — needs its own task + all-engine survey.
- **Confidence**: High (jar oracle of `* **1** ` + trace of the orgmode regex input)

## Observation: blocks-creole chromeAtomOps is the mindmap's AtomOps
- **Context**: rinamu `<&flag>` missing.
- **Finding**: `creole-atoms-image-resolver.ts:376` returns `undefined` for openiconic (0x0, no draw).
  Mindmap reaches it through `chromeAtomOps` (mindmap-skin-param.ts:107). Fixed by dispatching the token
  to `klimt/creole/atom/AtomOpenIconic.ts` inside `chromeAtomOps`; the description engine's resolver is
  untouched (its openiconic atoms still draw nothing — unknown/cakutu, nixeka, pacope, usecase/ridola).
- **Impact**: description-family `<&glyph>` labels are a separate open gap.
- **Confidence**: High

## Observation: Fission dropped the `[[url]]` on every wrapped text atom
- **Finding**: `Fission.ts pushTextNeutron` rebuilt `{kind,text,font}`; upstream `AtomText#withText`
  (AtomText.java:169-171) keeps `url`. Any engine with `MaximumWidth` + a creole link lost its `<a>`.
- **Confidence**: High
