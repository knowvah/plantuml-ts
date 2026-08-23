## Observation: the repo has no Prettier config, and no lint rule guards quote style

- **Context**: While fitting `src/diagrams/sequence/sequence-arrowhead.ts`
  under the 500-line hook cap during SI33 T1, I reached for
  `npx prettier --write` to normalise formatting.
- **Finding**: There is no `.prettierrc`/`prettier` key anywhere in the repo
  and Prettier is not a devDependency, so `npx prettier` downloads a fresh
  copy and applies **its own defaults** — which rewrote every single-quoted
  string in both files to double quotes. `eslint.config.ts` contains no
  `quotes`/`@stylistic` rule and no `eslint-plugin-prettier`, so
  `npm run lint` passes on the mangled file: nothing in the four quality
  gates catches the style regression. The repo's actual convention (single
  quotes, 80-col, trailing commas) is upheld only by convention.
- **Impact**: Never run `prettier` in this repo. Formatting must be written
  by hand to match neighbouring files, and a stray `prettier --write` on a
  pre-existing file would produce a large, invisible-to-CI diff.
- **Confidence**: High — reproduced directly; `grep -n "quotes|stylistic|
  prettier" eslint.config.ts` returns nothing and no prettier config file
  exists at the repo root.
