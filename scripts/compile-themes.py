#!/usr/bin/env python3
"""
Compile the RESIDUE of PlantUML's built-in themes into src/core/themes-builtin.ts.

cdd4-T7b: a `!theme` directive EXECUTES the theme source (`TContext
#executeTheme`, `TContext.java:726-755`), and its skinparam / `<style>` lines
reach the styling pipeline at the directive's position like any document
line. unwind2-S5: `root { FontColor }` / `root { LineColor }` now reach
colors.text / colors.arrow / colors.border from the executed lines themselves,
in declaration order (`build-theme.ts#rootCascadeSkinparams`), so this summary
no longer carries them, nor the hand-read MANUAL fontFamily / border.

What is left is ONE field family the json engine reads only from here:

  - root colours, `LineThickness`, top-level `node { MaximumWidth }`
                                   -> colors.graph.json

(the json family reads only `jsonDiagram`-scoped selectors,
`style-map-json-diagram.ts`, not the `root` / bare `node` cascade a theme
writes). MANUAL supplies the json colours for themes whose variables the
parse cannot resolve.
"""

import re
import os
import sys

THEMES_DIR = os.path.expanduser('~/git/plantuml/src/main/resources/themes/')
CORE_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'core')
OUT_FILE = os.path.join(CORE_DIR, 'themes-builtin.ts')
# The theme data is split across two sibling modules so no single generated
# file exceeds the repo's 500-line-per-file cap. themes-builtin.ts is a thin
# barrel that re-assembles BUILTIN_THEMES from them in the original key order.
OUT_FILE_A = os.path.join(CORE_DIR, 'themes-builtin-a-m.ts')
OUT_FILE_B = os.path.join(CORE_DIR, 'themes-builtin-p-v.ts')
FILE_LINE_CAP = 500

# ---------------------------------------------------------------------------
# Manual overrides for themes whose variables can't be easily auto-extracted.
# Values from inspecting the theme files directly.
# ---------------------------------------------------------------------------
MANUAL = {
    'cloudscape-design': {
        'bg': 'transparent', 'fg': '#000716', 'lc': '#0972D3'
    },
    'reddress-darkblue': {
        'bg': '#2e2e2e', 'fg': '#ffffff', 'lc': '#1b1b1b'
    },
    'reddress-darkgreen': {
        'bg': '#2e2e2e', 'fg': '#ffffff', 'lc': '#1b1b1b'
    },
    'reddress-darkorange': {
        'bg': '#2e2e2e', 'fg': '#ffffff', 'lc': '#1b1b1b'
    },
    'reddress-darkred': {
        'bg': '#2e2e2e', 'fg': '#ffffff', 'lc': '#1b1b1b'
    },
    'reddress-lightblue': {
        'bg': '#eeeeee', 'fg': '#222222', 'lc': '#888888'
    },
    'reddress-lightgreen': {
        'bg': '#eeeeee', 'fg': '#222222', 'lc': '#888888'
    },
    'reddress-lightorange': {
        'bg': '#eeeeee', 'fg': '#222222', 'lc': '#888888'
    },
    'reddress-lightred': {
        'bg': '#eeeeee', 'fg': '#222222', 'lc': '#888888'
    },
    'sunlust': {
        'bg': '#fdf6e3', 'fg': '#657b83', 'lc': '#657b83'
    },
    'carbon-gray': {
        'bg': 'transparent', 'fg': '#f4f4f4', 'lc': '#4d4d4d'
    },
    'toy': {
        'bg': '#DDDDDD', 'fg': '#333333', 'lc': '#333333'
    },
    'vibrant': {
        'bg': '#FFFFFF', 'fg': '#333333', 'lc': '#333333'
    },
    'mars': {
        'bg': '#F9F9F9', 'fg': '#191919', 'lc': '#191919'
    },
    'black-knight': {
        'bg': 'transparent', 'fg': '#fff200', 'lc': '#1c1c1c'
    },
}

# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

def strip_front_matter(content: str) -> str:
    """Remove YAML front matter block (--- ... ---)."""
    return re.sub(r'^---.*?---\s*', '', content, flags=re.DOTALL)


def extract_vars(content: str) -> dict[str, str]:
    """
    Extract simple !$VAR = "value" or !$VAR = value declarations.
    Resolves one level of $OTHERVAR references.
    """
    vars: dict[str, str] = {}
    for line in content.split('\n'):
        s = line.strip()
        # Match: !$VARNAME = "value" or !$VARNAME = value
        m = re.match(r'!\$([A-Z_0-9]+)\s*=\s*["\']?(#[0-9A-Fa-f]{3,8}|[a-zA-Z][a-zA-Z0-9_]*|\$[A-Z_0-9]+)["\']?\s*$', s)
        if m:
            k, v = m.group(1), m.group(2)
            if v.startswith('$'):
                v = vars.get(v[1:], v)
            vars[k] = v
    return vars


def _resolve_var(val: str, vars: dict[str, str]) -> str:
    """Resolve up to two levels of $VAR indirection."""
    for _ in range(2):
        if val.startswith('$'):
            val = vars.get(val[1:], val)
    return val


def _match_root_prop(s: str, vars: dict[str, str]) -> tuple[str, str] | None:
    """Match one `root { … }` property line, returning (key, resolved value)."""
    for prop, key in [('BackgroundColor', 'bg'), ('FontColor', 'fg'),
                      ('LineColor', 'lc'), ('FontName', 'fn'),
                      ('LineThickness', 'lt')]:
        if s.lower().startswith(prop.lower()):
            return key, _resolve_var(s[len(prop):].strip().strip('"\''), vars)
    return None


def extract_root_style(content: str, vars: dict[str, str]) -> dict[str, str | None]:
    """Extract colors from <style> root { ... } block."""
    result: dict[str, str | None] = {'bg': None, 'fg': None, 'lc': None,
                                     'fn': None, 'lt': None}
    m = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if not m:
        return result
    in_root = False
    for line in m.group(1).split('\n'):
        s = line.strip()
        if re.match(r'root\s*\{', s):
            in_root = True
        elif in_root and s == '}':
            break
        elif in_root:
            match = _match_root_prop(s, vars)
            if match:
                result[match[0]] = match[1]
    return result


def _style_block_text(content: str) -> str | None:
    """Return the inner text of the theme's <style>...</style> block, or None."""
    m = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    return m.group(1) if m else None


def _iter_style_lines_with_path(style_text: str):
    """
    Walk a <style> block's lines, yielding (path, line) for every declaration
    line -- `path` is the lowercase dotted-selector stack of enclosing blocks
    at that point (e.g. `['root', 'document']`), skipping brace lines, blank
    lines, and PlantUML `'` line comments.

    Shared by every extractor below that reads a selector's direct or nested
    declarations, so the same depth/comment handling (and its edge cases --
    nested blocks reusing a name, commented-out properties) is defined once.
    """
    path: list[str] = []
    for raw in style_text.split('\n'):
        line = raw.strip()
        if not line or line.startswith("'"):
            continue
        if line.endswith('{'):
            path.append(line[:-1].strip().lower())
            continue
        if line == '}':
            if path:
                path.pop()
            continue
        yield list(path), line


def extract_node_maximum_width(content: str) -> str | None:
    """
    A TOP-LEVEL `node { MaximumWidth N }` inside the theme's <style> block.

    `node` there is a bare ELEMENT selector, a sibling of `root`/`document`, so
    it cascades to every style signature containing `node` -- including
    `root.element.jsonDiagram.node`. That is why a json diagram under
    `!theme amiga` wraps its cells in the reference jar
    (yaml/vapoda-87-piku740), and why this value belongs on graph.json.

    Path-tracked rather than regex-scanned, because `MaximumWidth` also
    appears inside NESTED `node` blocks (puml-theme-carbon-gray has two), and
    inside comments (puml-theme-mono's is commented out with a leading quote).
    Only the top-level block (`path == ['node']`), and only its first value,
    is taken.
    """
    style_text = _style_block_text(content)
    if style_text is None:
        return None
    for path, line in _iter_style_lines_with_path(style_text):
        if path != ['node']:
            continue
        prop = re.match(r'MaximumWidth\s+([0-9]+(?:\.[0-9]+)?)\s*$', line, re.IGNORECASE)
        if prop:
            return prop.group(1)
    return None


def extract_skinparam(content: str, vars: dict[str, str]) -> dict[str, str | None]:
    """Extract top-level skinparam BackgroundColor / DefaultFontName / FontColor."""
    result: dict[str, str | None] = {'bg': None, 'fg': None, 'fn': None}
    for line in content.split('\n'):
        s = line.strip()
        for pat, key in [
            (r'skinparam\s+BackgroundColor\s+(.+)', 'bg'),
            (r'skinparam\s+(?:Default)?FontColor\s+(.+)', 'fg'),
            (r'skinparam\s+(?:Default)?FontName\s+(.+)', 'fn'),
        ]:
            mm = re.match(pat, s, re.IGNORECASE)
            if mm and result[key] is None:
                val = mm.group(1).strip().strip('"\'')
                if val.startswith('$'):
                    val = vars.get(val[1:], val)
                result[key] = val
    return result


def normalize_color(val: str | None) -> str | None:
    """Normalize a color value: add # prefix if missing, handle 'transparent'."""
    if val is None:
        return None
    v = val.strip().strip('"\'')
    if not v or v == '?':
        return None
    if v.lower() == 'transparent':
        return 'transparent'
    if v.lower() in ('white', 'black', 'red', 'blue', 'green', 'yellow', 'orange'):
        return v.lower()
    # Add # if it's a bare hex
    if re.match(r'^[0-9A-Fa-f]{3,8}$', v):
        return '#' + v
    if v.startswith('#'):
        return v.upper() if len(v) == 7 else v
    return None  # Unresolved variable or complex expression


def parse_theme(fname: str) -> dict[str, str | None]:
    """Parse a .puml theme file and return {bg, fg, lc, lt, root_bg, mw}."""
    with open(fname) as f:
        content = f.read()
    content = strip_front_matter(content)
    vars = extract_vars(content)
    root = extract_root_style(content, vars)
    skp = extract_skinparam(content, vars)

    # Merge: root style takes priority, skinparam fills gaps
    return {
        'bg': root['bg'] or skp['bg'],
        'fg': root['fg'] or skp['fg'],
        'lc': root['lc'],
        'lt': root['lt'],
        # The `<style> root { … }` background specifically, NOT the merged one.
        # A theme's `skinparam BackgroundColor` converts to SName.document
        # (`FromSkinparamToStyle.java:180`), whose signature does not match a
        # node, so it cannot overwrite the highlight the way a root block does.
        'root_bg': root['bg'],
        'mw': extract_node_maximum_width(content),
    }


# ---------------------------------------------------------------------------
# TypeScript emission
# ---------------------------------------------------------------------------

def _json_graph_lines(bg: str | None, fg: str | None, lc: str | None,
                      mw: str | None, lt: str | None = None,
                      root_bg: str | None = None) -> list[str]:
    """
    For themes with a solid (non-transparent) background, propagate the theme
    colors into graph.json so JSON nodes inherit the theme instead of falling
    back to defaultTheme's plantuml.skin json defaults.

    `maximumWidth` is INDEPENDENT of that: it is carried whenever the theme
    declares one, background or not, because it is a layout property rather
    than a color and a transparent-background theme wraps its cells just the
    same.
    """
    out: list[str] = []
    if bg and bg != 'transparent':
        out.append(f"          background: '{bg}',")
        if lc:
            out.append(f"          border: '{lc}',")
            out.append(f"          arrowColor: '{lc}',")
        if fg:
            # Disable per-type value coloring for themed nodes — uniform text color.
            for field in ('keyText', 'stringValue', 'numberValue',
                          'booleanValue', 'nullValue'):
                out.append(f"          {field}: '{fg}',")
    if mw:
        out.append(f"          maximumWidth: {mw},")
    # `root { LineThickness N }` and `root { BackgroundColor C }` OVERWRITE the
    # skin's deeply-nested `jsonDiagram { node { LineThickness 1.5 } }` and
    # `node { highlight { BackGroundColor #ccff02 } }`. That is not a
    # specificity accident: `StyleStorage#computeMergedStyle`
    # (`style/StyleStorage.java:102-114`) walks a LinkedHashMap in INSERTION
    # order and merges with `MergeStrategy.OVERWRITE_EXISTING_VALUE`, with no
    # specificity ranking at all -- so a theme, parsed after plantuml.skin,
    # wins on every property it names however shallow its selector.
    # Jar-verified: `!theme plain` renders json nodes at stroke-width 1 and its
    # highlight rows at #FFF (its own root BackgroundColor), not #ccff02.
    if lt:
        out.append(f"          nodeLineThickness: {lt},")
        out.append(f"          separatorThickness: {lt},")
    if root_bg and root_bg != 'transparent':
        out.append(f"          highlightBackground: '{root_bg}',")
    return out


def _emit_colors_block_lines(json_lines: list[str]) -> list[str]:
    """
    Emit the `colors: { graph: { json: { … } } }` block, or [] when there is
    nothing to say -- a theme may declare `node { MaximumWidth }` and no
    colors at all.
    """
    if not json_lines:
        return []
    lines = ["    colors: {"]
    if json_lines:
        lines.append("      graph: {")
        lines.append("        json: {")
        lines.extend(json_lines)
        lines.append("        },")
        lines.append("      },")
    lines.append("    },")
    return lines


def emit_theme_entry(name: str, props: dict) -> list[str]:
    """
    Emit a TypeScript object entry for one theme: its json residue only.
    """
    fg = normalize_color(props.get('fg'))
    lc = normalize_color(props.get('lc'))

    lines = [f"  '{name}': {{"]
    json_lines = _json_graph_lines(normalize_color(props.get('bg')), fg, lc, props.get('mw'),
                                   props.get('lt'), normalize_color(props.get('root_bg')))
    lines.extend(_emit_colors_block_lines(json_lines))
    lines.append("  },")
    return lines


def collect_entries() -> dict[str, list[str]]:
    """Parse every theme .puml into its emitted TS entry lines, keyed by name."""
    entries: dict[str, list[str]] = {}
    for fname in sorted(os.listdir(THEMES_DIR)):
        if not fname.endswith('.puml') or fname == 'puml-theme-_none_.puml':
            continue
        theme_name = fname.replace('puml-theme-', '').replace('.puml', '')
        # MANUAL OVERLAYS the parse, it does not replace it: the manual keys
        # are all explicit, so they still win where they are set, and every
        # auto-extracted property (a root LineThickness, a node MaximumWidth)
        # survives for those themes.
        props = {
            **parse_theme(os.path.join(THEMES_DIR, fname)),
            **MANUAL.get(theme_name, {}),
        }
        entries[theme_name] = emit_theme_entry(theme_name, props)
    return entries


def emit_data_module(var_name: str, sibling: str, names: list[str],
                     entries: dict[str, list[str]]) -> list[str]:
    """Emit one data sibling exporting `var_name` for the themes in `names`."""
    first, last = names[0], names[-1]
    out = [
        "/**",
        f" * Built-in PlantUML theme residue ({first} .. {last}): only the fields an",
        " * executed `!theme` does not yet reach (json only) -- see scripts/compile-themes.py.",
        " * Auto-generated by scripts/compile-themes.py — do not edit by hand.",
        " * Re-run the script when upstream themes change.",
        " *",
        f" * Split from themes-builtin.ts to stay under the {FILE_LINE_CAP}-line-per-file cap;",
        " * themes-builtin.ts re-assembles BUILTIN_THEMES from this and its sibling",
        f" * `{sibling}` in the original key order.",
        " */",
        "",
        "import type { ThemeOverride } from './theme.js';",
        "",
        f"/** Partial Theme overrides for built-in PlantUML themes '{first}' through '{last}'. */",
        f"export const {var_name}: Record<string, ThemeOverride> = {{",
    ]
    for name in names:
        out.extend(entries[name])
    out.append("};")
    out.append("")
    return out


def emit_barrel(first_range: str, second_range: str) -> list[str]:
    """Emit the themes-builtin.ts barrel that re-assembles BUILTIN_THEMES."""
    return [
        "/**",
        " * Built-in PlantUML theme residue: only the fields an executed `!theme`",
        " * does not yet reach -- see scripts/compile-themes.py.",
        " * Auto-generated by scripts/compile-themes.py — do not edit by hand.",
        " * Re-run the script when upstream themes change.",
        " *",
        f" * The theme data itself is split across `themes-builtin-a-m.ts` ({first_range})",
        f" * and `themes-builtin-p-v.ts` ({second_range}) to stay under the",
        f" * {FILE_LINE_CAP}-line-per-file cap. This module re-assembles BUILTIN_THEMES from those",
        " * two siblings in the original key order and remains the sole import site",
        " * used elsewhere in the codebase.",
        " */",
        "",
        "import type { ThemeOverride } from './theme.js';",
        "import { BUILTIN_THEMES_A_M } from './themes-builtin-a-m.js';",
        "import { BUILTIN_THEMES_P_V } from './themes-builtin-p-v.js';",
        "",
        "/** Partial Theme overrides for each built-in PlantUML theme name. */",
        "export const BUILTIN_THEMES: Record<string, ThemeOverride> = {",
        "  ...BUILTIN_THEMES_A_M,",
        "  ...BUILTIN_THEMES_P_V,",
        "};",
        "",
    ]


def write_ts(path: str, lines: list[str]) -> None:
    """Write a generated TS file, warning if it breaches the line cap."""
    if len(lines) > FILE_LINE_CAP:
        print(f"WARNING: {os.path.basename(path)} is {len(lines)} lines "
              f"(> {FILE_LINE_CAP} cap) — split the theme data across more files.",
              file=sys.stderr)
    with open(path, 'w') as f:
        f.write('\n'.join(lines))


def main() -> None:
    if not os.path.isdir(THEMES_DIR):
        print(f"ERROR: themes directory not found: {THEMES_DIR}", file=sys.stderr)
        sys.exit(1)

    entries = collect_entries()
    names = list(entries.keys())
    # Split the sorted theme list into two near-even halves so neither data
    # module exceeds the line cap. `write_ts` warns if a half still does.
    split = (len(names) + 1) // 2
    first_half, second_half = names[:split], names[split:]

    write_ts(OUT_FILE_A, emit_data_module(
        'BUILTIN_THEMES_A_M', 'themes-builtin-p-v.ts', first_half, entries))
    write_ts(OUT_FILE_B, emit_data_module(
        'BUILTIN_THEMES_P_V', 'themes-builtin-a-m.ts', second_half, entries))
    write_ts(OUT_FILE, emit_barrel(
        f"{first_half[0]}..{first_half[-1]}", f"{second_half[0]}..{second_half[-1]}"))

    print(f"Written {len(entries)} themes across 3 files:")
    print(f"  {OUT_FILE_A} ({first_half[0]}..{first_half[-1]}, {len(first_half)} themes)")
    print(f"  {OUT_FILE_B} ({second_half[0]}..{second_half[-1]}, {len(second_half)} themes)")
    print(f"  {OUT_FILE} (barrel)")


if __name__ == '__main__':
    main()
