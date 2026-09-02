# What still needs real content

The site structure is finished; the language content in it is placeholder and marked as such
in the source. Replace these before the site goes public.

## src/data/alphabet.ts
- The nineteen letters are a plausible guess (5 vowels, 14 consonants), not a decision.
- Every IPA value, "as in" example, and example word is invented.
- Decide whether `r`, `c`, `v`, `y`, `z` are genuinely excluded, and say why on `/alphabet/`.

## src/data/rules.ts
- Rules 1 and 2 are written as real claims; confirm them.
- Rules 3–8 are placeholders. Each needs a claim, a short body, and an example with a gloss.
- The homepage shows the first four rules, so order matters.

## src/pages/dictionary.astro
- Three placeholder entries. Decide where the real word list lives — a data file now, a
  content collection once it outgrows one file.
- The search filters the rendered list in the browser. Past a few hundred words it will need
  a real index instead.

## src/pages/learn.astro
- Five lesson titles, no lesson bodies. Decide whether lessons become their own routes.

## src/pages/about.astro
- Two placeholder paragraphs: who the language is for, and which languages it draws on.

## Elsewhere
- `public/favicon.svg` is a plain `a` on blue. Replace if the project gets a real mark.
- No Open Graph image yet; `/og.png` referenced by nothing so far.
