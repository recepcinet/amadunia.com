# Where the content comes from

The language lives in [amadunia-lang](https://github.com/recepcinet/amadunia-lang), vendored
here as the git submodule `lang/`. The site does not carry its own copy of the grammar, the
lessons or the dictionary; it renders them at build time.

| On the site | Comes from | How |
|---|---|---|
| `/grammar/<topic>/` | `lang/grammar/*.md` | content collection, rendered as-is |
| `/learn/<lesson>/` | `lang/lessons/lesson-*.md` | content collection, rendered as-is |
| `/dictionary/` | `lang/dictionary/dictionary.md` | table parsed in `src/lib/lang.ts` |
| letter list | `lang/grammar/phonology.md` | checked against `src/data/alphabet.ts` at build; mismatch fails the build |
| roots count, A1 target, milestones, birth date | dictionary rows, `lang/README.md` | parsed |
| `/llms.txt` | all of the above | generated |

## Hand-maintained, must follow the language

- `src/data/alphabet.ts` — IPA values, "as in" hints and example words per letter. The letter
  list must match phonology.md (enforced); the rest is the site's reading.
- `src/data/rules.ts` — the eight-line summary of `lang/grammar/`. When a topic is settled,
  changed or added there, this list has to be updated by hand.
- `src/pages/about.astro` — the "why" prose and the five design rules, paraphrased from the
  language README.
- `scripts/og.py` — the share image; regenerate if the motto or the colours change.

## Inside rendered Markdown

Tables from `lang/` get the language colour on columns whose header names Amadunia
(`Word`, `Amadunia`, `Singular`, `Plural`, `Example`, `Particle`, tense columns, digit headers).
Running prose and dialogue blockquotes stay grey: italics there are used for Amadunia, for
English emphasis, and for source-language words alike, and the site does not guess.
See `src/lib/rehype-lang.mjs`.

## Updating

```bash
git submodule update --remote lang
npm run build
```

Then commit the new submodule pointer. If the build fails on the phonology check, the alphabet
has changed upstream: update `src/data/alphabet.ts` to match.
