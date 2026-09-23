import tseslint from 'typescript-eslint';
import type { ConfigWithExtends } from 'typescript-eslint';
import { fileURLToPath } from 'url';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

/** D5 (decisions.md): a template chunk ending in `name="` is, by
 *  construction, immediately followed by an interpolation -- the last
 *  quasi of a template literal has `tail: true`, and a trailing `="`
 *  there would be a syntax error in the emitted markup anyway. Catches
 *  every attribute-value sink that bypasses `attrs()`/`attrsFromRecord()`. */
const ATTRIBUTE_SINK_SELECTOR = {
  // Any chunk that OPENS an attribute value (`="`) and has not closed it by
  // the time an interpolation starts -- covers `href="${x}"` and the
  // mid-value `style="a;b:${x}"` shape alike (PR #59 review).
  selector: 'TemplateElement[value.raw=/="[^"]*$/]',
  message:
    'Attribute values must go through attrs()/attrsFromRecord() so they are escaped once (plans/svg-attribute-escaping-audit/decisions.md D5).',
};

/** D8 (decisions.md): a template chunk containing an unclosed `<!--`
 *  before an interpolation is an XML-comment sink that must defang `--`
 *  via `escapeComment()`, not interpolate raw. */
const COMMENT_SINK_SELECTOR = {
  selector: 'TemplateElement[value.raw=/<!--(?:(?!-->).)*$/]',
  message: 'XML comments must go through escapeComment() (plans/svg-attribute-escaping-audit/decisions.md D8).',
};

/**
 * Shared with `tests/architecture/attribute-sink-rule.test.ts` so the
 * fitness fixtures exercise the exact block this file ships, not a
 * re-derived copy that could drift from it.
 *
 * `svek-dot-emit*.ts`/`graph-layout-build*.ts` emit graphviz DOT syntax
 * and HTML-like `<TABLE>` labels, not SVG -- a language boundary the D5/D8
 * seam does not apply to. This is a FILE-pattern exclusion, not a
 * per-sink allowlist: every other file under `src/` is covered with no
 * exemptions (journal B3).
 */
export const ATTRIBUTE_SINK_RULE_CONFIG: ConfigWithExtends = {
  ignores: ['src/core/svek-dot-emit*.ts', 'src/core/graph-layout-build*.ts'],
  rules: {
    'no-restricted-syntax': ['error', ATTRIBUTE_SINK_SELECTOR, COMMENT_SINK_SELECTOR],
  },
};

export default tseslint.config([
  {
    ignores: ['dist/**', 'dist-demo/**', 'coverage/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    // `scripts/` carries a few hand-written `.mjs`/`.js` helpers that no
    // tsconfig includes, so the type-checked rules cannot resolve services
    // for them. Lint them untyped rather than excluding them outright.
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // `docs-site/` is in no tsconfig either: VitePress transpiles its config
    // and theme itself. `npm run lint` never names it, but lint-staged does
    // on commit, and a typed rule with no project throws instead of failing
    // a rule. Same treatment as the `.mjs` helpers above.
    files: ['docs-site/**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // `scripts/` and the root `*.config.ts` files are NOT in the root tsconfig (which includes src/tests/demo
    // only), so `project: true` -- nearest-tsconfig resolution -- cannot see
    // it. Most script files happened to be reachable transitively as imports
    // from `tests`; the ones nothing imports (e.g. visual-qa-dot.ts) were
    // not, and failed to parse. Name their real project instead.
    files: ['scripts/**/*.ts', '*.config.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json'],
        tsconfigRootDir,
      },
    },
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'demo/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    ...ATTRIBUTE_SINK_RULE_CONFIG,
  },
  {
    // Same strict rules as the src/tests/demo block above, extended to
    // scripts/**/*.ts (code-review-tasks.md item 4). A SEPARATE block, not
    // added to that one's `files` list: this one carries no `languageOptions`
    // so it does not override the scripts/**/*.ts-specific `tsconfig.node.json`
    // parserOptions set two blocks up — that block still wins for
    // languageOptions since this one is silent on it, while this block's
    // `rules` merge in on top.
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // src/ is a browser-safe library: diagnostics go to the caller through
    // RenderOptions.onWarning (or an error SVG), never the host's console.
    files: ['src/**/*.ts'],
    rules: { 'no-console': 'error' },
  },
  {
    // The only sanctioned console writers, all pre-existing:
    // - EmbeddedDiagram, svek/Cluster: faithful ports of upstream Logme.error.
    // - tim/EaterLog, TMemoryGlobal/Local: the user's own !log / !dump_memory.
    // - svg-nanoparser-transform: no warning carrier in scope yet
    //   (.agent-notes/cr-core.md).
    // - activity tile-layout (unreachable exhaustiveness default) and
    //   description renderer-draw-sequence (edge-draw failure guard):
    //   port-own; candidates for onWarning.
    // Adding a file here needs a reason of the same kind.
    files: [
      'src/core/EmbeddedDiagram.ts',
      'src/core/klimt/sprite/svg-nanoparser-transform.ts',
      'src/core/svek/Cluster.ts',
      'src/core/tim/EaterLog.ts',
      'src/core/tim/TMemoryGlobal.ts',
      'src/core/tim/TMemoryLocal.ts',
      'src/diagrams/activity/layout/tile-layout.ts',
      'src/diagrams/description/renderer-draw-sequence.ts',
      // CDD T27FU: the class engine's own EmbeddedDiagram.java:148-150
      // Logme.error mirror (renderEmbed's catch), same faithful-port reason
      // as EmbeddedDiagram.ts above.
      'src/diagrams/class/class-body-enhanced-embeds.ts',
      // CDD B7FU-R2: the class engine's note-embed analog of the same
      // EmbeddedDiagram.java:148-150 Logme.error mirror
      // (buildEmbeddedNoteImageAtom's catch).
      'src/diagrams/class/note-layout-measure-rows.ts',
    ],
    rules: { 'no-console': 'off' },
  },
]);
