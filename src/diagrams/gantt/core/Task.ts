import type { Display } from '../../../core/klimt/creole/Display.js';
import type { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { Url } from '../../../core/url/Url.js';
import type { CenterBorderColor } from '../lang/CenterBorderColor.js';
import type { Load } from '../ngm/Load.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { Moment } from './Moment.js';
import type { Resource } from './Resource.js';
import type { TaskCode } from './TaskCode.js';

/**
 * Task -- a gantt row item (task, task group or separator).
 *
 * `addPause(LocalDate)` / `addPause(DayOfWeek)` (java:77, :79) are one method
 * taking the union; `setColors(CenterBorderColor...)` keeps its varargs.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Task.java:49-95
 */
export interface Task extends Moment {
  getCode(): TaskCode;

  getLoad(): Load;

  setLoad(load: Load): void;

  setStart(start: TimePoint): void;

  setEnd(end: TimePoint): void;

  setColors(...colors: CenterBorderColor[]): void;

  addResource(resource: Resource, percentage: number): void;

  setDiamond(diamond: boolean): void;

  isDiamond(): boolean;

  setCompletion(completion: number): void;

  setUrl(url: Url): void;

  putInSameRowAs(row: Task): void;

  getRow(): Task | undefined;

  addPause(pause: LocalDate | DayOfWeek): void;

  setNote(note: Display, stereotype: Stereotype | undefined): void;

  getStyleBuilder(): StyleBuilder;

  isAssignedTo(res: Resource): boolean;

  setDisplay(displayString: string | undefined): void;

  getDisplayString(): string | undefined;

  getStereotype(): Stereotype | undefined;

  setStereotype(stereotype: Stereotype | undefined): void;
}
