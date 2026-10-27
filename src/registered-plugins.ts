/**
 * The composition root's registrations, in upstream's factory order: the
 * `factories.add(...)` run of `PSystemBuilder`'s constructor. `src/index.ts`
 * calls {@link registerPlugins} on the dispatcher's singleton registry.
 *
 * Split out of `src/index.ts` (ufp T2a), which sits at the repo's 500-line
 * hook cap, when the utility factories joined the run -- the same move as
 * `RenderOptions`/`assembleSvg` before it; the order comment moved with it.
 * `scripts/parity-dashboard.ts` reads the `registry.register(<type>Plugin)`
 * lines below as text, so each registration stays one call naming its plugin.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:132-202
 */
import type { DiagramRegistry } from './core/dispatcher.js';
import { listArchimateSpritesPlugin } from './core/klimt/sprite/PSystemListArchimateSpritesFactory.js';
import { activityPlugin } from './diagrams/activity/index.js';
import { boardPlugin } from './diagrams/board/index.js';
import { chartPlugin } from './diagrams/chart/index.js';
import { chronologyPlugin } from './diagrams/chronology/index.js';
import { classPlugin } from './diagrams/class/index.js';
import { dedicationPlugin } from './diagrams/dedication/PSystemDedicationFactory.js';
import { descriptionPlugin } from './diagrams/description/index.js';
import { dotPlugin } from './diagrams/dot/index.js';
import { donorsPlugin } from './diagrams/donors/PSystemDonorsFactory.js';
import { skinparameterListPlugin } from './diagrams/donors/PSystemSkinparameterListFactory.js';
import { appleTwoPlugin } from './diagrams/eggs/PSystemAppleTwoFactory.js';
import { charliePlugin } from './diagrams/eggs/PSystemCharlieFactory.js';
import { colorsPlugin } from './diagrams/eggs/PSystemColorsFactory.js';
import { eggPlugin } from './diagrams/eggs/PSystemEggFactory.js';
import { ripPlugin } from './diagrams/eggs/PSystemRIPFactory.js';
import { listEmojiPlugin } from './diagrams/emoji/PSystemListEmojiFactory.js';
import { filesPlugin } from './diagrams/files/index.js';
import { ganttPlugin } from './diagrams/gantt/index.js';
import { hclPlugin } from './diagrams/hcl/index.js';
import { jsonPlugin } from './diagrams/json/index.js';
import { mindmapPlugin } from './diagrams/mindmap/index.js';
import { listOpenIconicPlugin } from './diagrams/openiconic/PSystemListOpenIconicFactory.js';
import { openIconicPlugin } from './diagrams/openiconic/PSystemOpenIconicFactory.js';
import { packetdiagPlugin } from './diagrams/packetdiag/index.js';
import { saltPlugin } from './diagrams/salt/index.js';
import { sequencePlugin } from './diagrams/sequence/index.js';
import { statePlugin } from './diagrams/state/index.js';
import { licensePlugin } from './diagrams/version/PSystemLicenseFactory.js';
import { versionPlugin } from './diagrams/version/PSystemVersionFactory.js';
import { wbsPlugin } from './diagrams/wbs/index.js';
import { yamlPlugin } from './diagrams/yaml/index.js';

/** The one registry method the registrations need (a test passes a recorder). */
export type PluginRegistrar = Pick<DiagramRegistry, 'register'>;

/**
 * `PSystemBuilder.java:133-152`: Colors, the UML run, then the utility pages
 * and listings up to (not including) Salt. Welcome (java:133) and ListFonts
 * (java:148) are not registered -- see {@link registerPlugins}.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:133-152
 */
function registerUmlRun(registry: PluginRegistrar): void {
  registry.register(colorsPlugin); // java:134
  registry.register(sequencePlugin); // java:135
  registry.register(classPlugin); // java:136
  registry.register(descriptionPlugin); // java:138
  registry.register(statePlugin); // java:139
  registry.register(activityPlugin); // java:140 (ActivityDiagramFactory3)
  registry.register(licensePlugin); // java:144
  registry.register(versionPlugin); // java:145
  registry.register(donorsPlugin); // java:146
  registry.register(skinparameterListPlugin); // java:147
  registry.register(listEmojiPlugin); // java:149
  registry.register(openIconicPlugin); // java:150
  registry.register(listOpenIconicPlugin); // java:151
  registry.register(listArchimateSpritesPlugin); // java:152
}

/**
 * `PSystemBuilder.java:153-200`: Salt onwards.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:153-200
 */
function registerFromSalt(registry: PluginRegistrar): void {
  registry.register(saltPlugin); // java:153
  registry.register(dotPlugin); // java:154
  registry.register(mindmapPlugin); // java:156
  registry.register(wbsPlugin); // java:157
  registry.register(chartPlugin); // java:158
  registry.register(packetdiagPlugin); // java:159
  registry.register(eggPlugin); // java:175
  registry.register(appleTwoPlugin); // java:176
  registry.register(ripPlugin); // java:177
  registry.register(charliePlugin); // java:181
  registry.register(ganttPlugin); // java:183
  registry.register(chronologyPlugin); // java:184 (commented out upstream)
  registry.register(dedicationPlugin); // java:186
  registry.register(jsonPlugin); // java:190
  registry.register(filesPlugin); // java:192
  registry.register(boardPlugin); // java:193
  registry.register(yamlPlugin); // java:194
  registry.register(hclPlugin); // java:195
}

// Registration order IS upstream's factory order (`PSystemBuilder.java:133-200`),
// re-mirrored here now that dispatch attempts the parse. Under the old
// `accepts()` heuristics this order was frozen the other way round --
// mirroring upstream moved the routing gate 79 -> 469, 25 fixed and 415 newly
// misrouted (`.agent-notes/T2-registration-order-halt.md`) -- because the
// order was compensating for `sequencePlugin.accepts()` claiming 1343 of 3158
// fixtures, 244 of them not sequence diagrams. With refusal live that
// compensation is unnecessary and the upstream order is simply correct, which
// is why D3' makes the order change and the dispatch switch one unit.
//
// Upstream's legacy-UML run is: SequenceDiagramFactory, ClassDiagramFactory,
// ActivityDiagramFactory, DescriptionDiagramFactory, StateDiagramFactory,
// ActivityDiagramFactory3, BpmDiagramFactory.
//
// THIS PORT'S ACTIVITY ENGINE SITS AT ActivityDiagramFactory3's SLOT, after
// state -- not at the legacy factory's slot, which is where T12's own brief
// put it. The engine mirrors `ActivityDiagramFactory3`: `trySwimlane`,
// `tryAction`, `tryIf`, `tryRepeat`, `tryFork`, `trySplit` map 1:1 onto
// `CommandSwimlane`, `CommandActivity3`, `CommandIf4`, `CommandRepeat3`,
// `CommandFork3`, `CommandSplit3` (`ActivityDiagramFactory3.java:105-165`),
// while the legacy factory's arrow-based `UBrexCommandIf` /
// `CommandLinkActivity` / `CommandLinkLongActivity`
// (`ActivityDiagramFactory.java:76-97`) have no counterpart anywhere here.
// Putting it at slot 5 would let it claim `@startuml` sources upstream gives
// to description or state.
//
// The utility factories (ufp, decisions.md D2) are single-line `@startuml`
// pages typed SEQUENCE (`PSystemSingleLineFactory.java:61`), so their place
// among the UML engines decides ties: Colors precedes Sequence (java:134);
// the rest follow the UML run. A tie also names the error page: when every
// candidate refuses a single-line source, the first of the equal top scores
// owns it (`PSystemErrorUtils.java:140-147`), and Colors is first.
// Not registered by ufp: PSystemWelcomeFactory (java:133),
// PSystemListFontsFactory (java:148) and HelpFactory (java:188), outside its
// scope, and PSystemSudokuFactory (java:163), which the MIT edition removes
// (`PSystemBuilder.java:161-164`, decisions.md D13).
//
// The engines outside `@startuml`'s candidate set (`DiagramType.java:198-201`)
// each own a distinct `@start` tag, so their relative order can never decide a
// tie; they still sit at their upstream lines. Chronology's line is upstream's
// commented-out `// factories.add(new ChronologyDiagramFactory())` (java:184).

/**
 * Registers every plugin into `registry`, in upstream's factory order.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:132-202
 */
export function registerPlugins(registry: PluginRegistrar): void {
  registerUmlRun(registry);
  registerFromSalt(registry);
}
