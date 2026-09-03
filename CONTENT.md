# Where the content comes from

The language lives in [amadunia-lang](https://github.com/recepcinet/amadunia-lang), vendored
here as the git submodule `lang/`. The site does not carry its own copy of the grammar, the
lessons or the dictionary; it renders them at build time.

| On the site | Comes from | How |
|---|---|---|
| `/grammar/<topic>/` | `lang/grammar/*.md` | content collection, rendered as-is |
| `/learn/<lesson>/` | `lang/lessons/lesson-*.md` | content collection, rendered as-is |
| `/texts/<story>/` | `lang/texts/story-*.md` | content collection; roots-used and gap counts parsed |
| `/writing/`, `/writing/<page>/` | `lang/writing/*.md` | content collection; the whole section disappears when the folder is absent |
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
- `src/pages/texts/index.astro` — the framing prose, which names the gaps the first story found.
- `scripts/og.py` — the share image; regenerate if the motto or the colours change.

## Inside rendered Markdown

Tables from `lang/` get the language colour on columns whose header names Amadunia
(`Word`, `Amadunia`, `Singular`, `Plural`, `Example`, `Particle`, tense columns, digit headers).
Everywhere else — dialogue, practice lines, italics in prose, untagged table cells — a run of
text is coloured when the dictionary says so: at least three quarters of its words are settled
Amadunia words (`lang/dictionary/dictionary.md` is the lexicon). Source-language words
(*sudah*, *sawfa*) and rejected candidates (*kami*, *kya*) fail that test and stay grey.
See `src/lib/rehype-lang.mjs`.

A text's fenced block is a story, not code, so `syntaxHighlight` is off in `astro.config.mjs`.

`writing/` is a proposal upstream (an optional keyboard layout and a spelling alphabet, drafted
from the site's own frequency analysis). `hasWriting` in `src/lib/lang.ts` is a filesystem check;
the collection, the route and the nav link are all guarded by it, so the section costs nothing
and emits no warnings until the folder lands on `main`. Nothing needs changing when it does.

**Cache:** Astro keeps rendered Markdown in `node_modules/.astro/data-store.json` and does not
notice plugin changes. After editing `rehype-lang.mjs`, run `rm -rf node_modules/.astro` before
building (the deploy workflow always starts clean).

## Updating

```bash
git submodule update --remote lang
npm run build
```

Then commit the new submodule pointer. If the build fails on the phonology check, the alphabet
has changed upstream: update `src/data/alphabet.ts` to match.
