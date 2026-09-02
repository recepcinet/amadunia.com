Sync the site with the language repository (amadunia-lang, vendored as the git submodule `lang/`).

1. `git -C lang fetch -q origin main && git -C lang log --oneline HEAD..origin/main`
   - No output → nothing changed. Stop; report "no change" in one line.
2. Note the old pointer (`git -C lang rev-parse --short HEAD`), then `git submodule update --remote lang`
   and read what changed: `git -C lang diff <old>..HEAD --stat` and the full diff.
3. Adapt the site only where the change requires it:
   - `lang/grammar/phonology.md` letter table changed → update `src/data/alphabet.ts` (the build fails otherwise).
   - a grammar topic settled, changed, or added → update the summary in `src/data/rules.ts`; new topic files become pages automatically.
   - README status prose (what is settled / still open) changed → update the Status band in `src/pages/about.astro`.
   - new lessons, dictionary rows, README counts → nothing to do; they are derived.
   - a new kind of file or folder in `lang/` → decide whether the site needs a page for it, and build one in the existing style if so.
4. `npm run build`; fix anything that fails. Check the built HTML for the change (counts, new pages, links without `.md`).
5. Commit everything with the message `Update language to <short sha>: <upstream commit subject>` (list any site adaptations in the body), then push:
   `git push git@github.com:recepcinet/amadunia.com.git HEAD:main` (HTTPS has no credentials here; SSH does).
6. Confirm the deploy: poll `https://api.github.com/repos/recepcinet/amadunia.com/actions/runs?per_page=1` until the run for that sha completes, then spot-check the live page that changed on https://amadunia.com.
7. Report in Turkish, briefly: what changed upstream, what the site needed, deploy result.
