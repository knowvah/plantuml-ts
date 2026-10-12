# Batch 3: factories

After batch 2 closes. Three parallel tasks in worktrees, disjoint write-sets. Close via
[../close-procedure.md](../close-procedure.md) (no salt row moves until T4a registers the
plugin). Prompt = [../batch-1/task-preamble.md](../batch-1/task-preamble.md) + the task file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-simple-factories.md) | Button, Droplist, Image, Line, Text, TextField, RetrieveFromDictonnary | typescript-pro (sonnet) | `src/diagrams/salt/factory/ElementFactory{Button,Droplist,Image,Line,Text,TextField,RetrieveFromDictonnary}.ts` | T2a, T2e | [ ] |
| [T3b](T3b-check-radio-factories.md) | CheckboxOn/Off, RadioOn/Off | typescript-pro (sonnet) | `src/diagrams/salt/factory/ElementFactory{CheckboxOn,CheckboxOff,RadioOn,RadioOff}.ts` | T2a, T2e | [ ] |
| [T3c](T3c-complex-factories.md) | Border, Menu, Pyramid, Scroll, Tab, Tree | typescript-pro (opus) | `src/diagrams/salt/factory/ElementFactory{Border,Menu,Pyramid,Scroll,Tab,Tree}.ts` | T2b, T2c, T2d, T2e | [ ] |
