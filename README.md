# amadunia.com

Amadunia — a world auxiliary language built from the easiest features of all languages.
18 letters, zero exceptions. Mi ama dunia! 🌍

This repository holds the language and the website that documents it.

## Running the site

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve the built output
```

Built with [Astro](https://astro.build). No client framework; the only JavaScript on the site
is the dictionary filter.

## Structure

```
src/
  data/            the language itself — alphabet.ts, rules.ts
  pages/           one file per route
  layouts/Base     document shell, fonts, metadata
  components/      Masthead, Colophon, Band (a section with its left rail)
  styles/          global.css — all design tokens live at the top
public/            favicon, robots.txt, CNAME
```

Content lives in `src/data`. Editing `alphabet.ts` or `rules.ts` updates every page that
counts or lists them, including the counts in the section rails.

## Design

Two inks on paper, after the risograph pamphlets of the auxiliary-language movement: a small
ink set for a small letter set. Federal blue `#2a4b8d`, fluorescent pink `#ff48b0`, paper
`#faf7f0`. Archivo for display, Newsreader for reading. Colour pairs are checked against
WCAG AA; see the tokens at the top of `src/styles/global.css`.

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

MIT. See [LICENSE](LICENSE).
