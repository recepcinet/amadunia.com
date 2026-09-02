# amadunia.com

The website for Amadunia — a world auxiliary language built from the easiest features of all
languages. Twenty letters, one sound each, zero exceptions. Mi ama dunia! 🌍

The language itself lives in [amadunia-lang](https://github.com/recepcinet/amadunia-lang)
(CC BY-SA 4.0). This repository is only the site (MIT); it reads the grammar, lessons and
dictionary straight from that repository, vendored here as the git submodule `lang/`.

## Running the site

```bash
git clone --recurse-submodules https://github.com/recepcinet/amadunia.com.git
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve the built output
```

If you cloned without `--recurse-submodules`, run `git submodule update --init` first.

To pull the latest language changes:

```bash
git submodule update --remote lang
npm run build    # fails if src/data/alphabet.ts no longer matches lang/grammar/phonology.md
git add lang && git commit -m "Update language to <commit>"
```

Built with [Astro](https://astro.build). No client framework; the only JavaScript on the site
is the dictionary filter.

## Structure

```
lang/              the language (git submodule → amadunia-lang)
src/
  content.config   collections over lang/grammar and lang/lessons
  lib/lang.ts      build-time parsers: dictionary table, alphabet, README status
  lib/rehype-lang  Markdown plugin: strips H1/status, rewrites links, tags Amadunia table columns
  data/            alphabet.ts (sound values; checked against phonology.md), rules.ts (summary)
  pages/           routes; grammar/[slug] and learn/[slug] come from the collections
  layouts/Base     document shell, fonts, metadata, JSON-LD
  components/      Masthead, Colophon, Band (a section with its left rail)
  styles/          global.css — all design tokens live at the top
scripts/og.py      renders public/og.png
public/            favicon, og.png, robots.txt, CNAME
```

See [CONTENT.md](CONTENT.md) for what is derived from `lang/` and what is maintained by hand.

## For search engines and models

Besides the pages: `/llms.txt` (summary), `/llms-full.txt` (the whole language as text),
`/dictionary.json`, and `/corpus.tsv` — Amadunia⇄English sentence pairs from every lesson and
grammar table, the parallel corpus a translation system would train on. Every page carries
schema.org JSON-LD (the dictionary as `DefinedTermSet`, lessons as a `Course`). `scripts/indexnow.sh`
pings IndexNow after a deploy.

## Design

One rule governs colour: grey is English, fuchsia `#b3155f` is Amadunia. Text in the language
is marked `lang="art-x-amadunia"` (BCP 47 for a constructed language with no code) and the
colour follows from that. Archivo for display, Newsreader for reading, on paper `#faf7f0`.
Colour pairs are checked against WCAG AA; tokens are at the top of `src/styles/global.css`.

## Deploying

`.github/workflows/deploy.yml` builds on every push to `main` and publishes to GitHub Pages.
Before the first deploy:

1. In the repository, **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Point DNS at GitHub Pages (see below).
3. In **Settings → Pages → Custom domain**, enter `amadunia.com` and enable **Enforce HTTPS**
   once the certificate is issued.

`public/CNAME` keeps the custom domain attached across deploys.

### DNS

At the registrar (Porkbun), for the apex `amadunia.com`, four A records:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

and optionally the AAAA records `2606:50c0:8000::153` through `2606:50c0:8003::153`.
For `www`, a CNAME to `recepcinet.github.io`.

## Licence

Site code: MIT, see [LICENSE](LICENSE). Language content under `lang/`:
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), © Recep Cinet.
