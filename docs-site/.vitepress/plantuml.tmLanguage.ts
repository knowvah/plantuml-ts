// SPDX-License-Identifier: MIT
//
// TextMate grammar for PlantUML, registered with VitePress/Shiki via
// markdown.languages so ```plantuml fences are syntax-highlighted, and with
// the playground's client-side highlighter so the editor uses the same rules.
// Shiki bundles no PlantUML grammar, so without this it warns and falls back
// to plain text.
//
// The rules are a verbatim copy of the VS Code extension's grammar,
// plantuml-plugins/packages/vscode/syntaxes/plantuml.tmLanguage.json
// (scope source.plantuml). That file is the source of truth: fix a rule
// there and re-copy, do not fork it here. Once plantuml-plugins publishes the
// grammar, this module becomes an import.

import type { LanguageRegistration } from 'shiki';

export const plantumlLang: LanguageRegistration = {
  name: 'plantuml',
  scopeName: 'source.plantuml',
  aliases: ['puml'],
  patterns: [
    {
      include: '#comments',
    },
    {
      include: '#directives',
    },
    {
      include: '#preprocessor',
    },
    {
      include: '#keywords',
    },
    {
      include: '#arrows',
    },
    {
      include: '#strings',
    },
    {
      include: '#colors',
    },
    {
      include: '#stereotypes',
    },
  ],
  repository: {
    comments: {
      patterns: [
        {
          name: 'comment.block.plantuml',
          begin: "/'",
          end: "'/",
        },
        {
          name: 'comment.line.apostrophe.plantuml',
          match: "^\\s*'.*$",
        },
      ],
    },
    directives: {
      patterns: [
        {
          name: 'keyword.control.directive.plantuml',
          match: '^\\s*@(start|end)\\w+',
        },
      ],
    },
    preprocessor: {
      patterns: [
        {
          name: 'meta.preprocessor.include.plantuml',
          match: '^\\s*(!include(?:sub|url|_many)?)\\s+(.*)$',
          captures: {
            '1': {
              name: 'keyword.control.import.plantuml',
            },
            '2': {
              name: 'string.unquoted.include.plantuml',
            },
          },
        },
        {
          name: 'keyword.control.preprocessor.plantuml',
          match:
            '^\\s*!(define|undef|if|ifdef|ifndef|else|elseif|endif|while|endwhile|function|endfunction|procedure|endprocedure|theme|log|assume|pragma|unquoted|import)\\b',
        },
        {
          name: 'variable.other.plantuml',
          match: '\\$[A-Za-z_]\\w*',
        },
      ],
    },
    keywords: {
      patterns: [
        {
          name: 'keyword.other.declaration.plantuml',
          match:
            '\\b(abstract|actor|agent|artifact|boundary|card|class|cloud|collections|component|control|database|entity|enum|file|folder|frame|interface|json|label|node|object|package|participant|queue|rectangle|stack|state|storage|usecase)\\b',
        },
        {
          name: 'keyword.control.flow.plantuml',
          match:
            '\\b(alt|else|end|group|loop|opt|par|break|critical|activate|deactivate|destroy|return|note|hnote|rnote|legend|endlegend|ref over|box|end box|newpage|split|again|fork|repeat|backward|detach|kill|start|stop)\\b',
        },
        {
          name: 'keyword.other.style.plantuml',
          match:
            '\\b(skinparam|title|header|footer|caption|hide|show|scale|left to right direction|top to bottom direction|autonumber|allowmixing|mainframe|sprite|style|endstyle|together)\\b',
        },
      ],
    },
    arrows: {
      patterns: [
        {
          name: 'keyword.operator.arrow.plantuml',
          match: '([-.=]{1,2}(\\[[^\\]]*\\])?[-.=]*(\\|>|>>|>|\\*|o|\\+)?)|((<\\||<<|<|\\*|o|\\+)?[-.=]{1,2}[-.=]*)',
        },
      ],
    },
    strings: {
      patterns: [
        {
          name: 'string.quoted.double.plantuml',
          begin: '"',
          end: '"',
          patterns: [
            {
              name: 'constant.character.escape.plantuml',
              match: '\\\\.',
            },
          ],
        },
      ],
    },
    colors: {
      patterns: [
        {
          name: 'constant.other.color.plantuml',
          match: '#[0-9A-Fa-f]{3,8}\\b|#\\w+',
        },
      ],
    },
    stereotypes: {
      patterns: [
        {
          name: 'entity.name.type.stereotype.plantuml',
          match: '<<[^>]*>>',
        },
      ],
    },
  },
};
