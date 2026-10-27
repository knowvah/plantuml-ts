/**
 * Test-only `GanttStyle` over the jar's dumped `plantuml.skin` storage
 * (tests/unit/core/style/fixtures/plantuml-skin-storage.json), shaped like
 * ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagram.java:205-215:
 * `StyleSignatureBasic.of(root, element, ganttDiagram, param[, param2]).getMergedStyle(builder)`.
 */
import type { GanttStyle } from '../../../../src/diagrams/gantt/GanttStyle.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import type { Style } from '../../../../src/core/style/Style.js';
import type { SName } from '../../../../src/core/style/SName.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { skinStorageDump, styleFromDump } from '../../core/style/helpers/style-fixture.js';

export function skinGanttStyle(): GanttStyle {
  const builder = new StyleBuilder().muteStyle(skinStorageDump().map(styleFromDump));
  return {
    getStyle(param: SName, param2?: SName): Style {
      const names: SName[] = ['root', 'element', 'ganttDiagram', param];
      if (param2 !== undefined) names.push(param2);
      const merged = StyleSignatureBasic.of(...names).getMergedStyle(builder);
      if (merged === undefined) throw new Error('no style for ' + names.join(','));
      return merged;
    },
  };
}
