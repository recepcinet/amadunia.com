/**
 * Counting readers, without tracking them.
 *
 * GoatCounter sets no cookie, stores no IP address and follows no one between
 * sites, which is why this needs no consent banner and why it is the only
 * third-party script on the site. It is also the only thing here that talks to
 * a server at all — everything else is files.
 *
 * What it can and cannot see is worth stating, because the difference is the
 * whole answer to "was that a person or a robot":
 *
 *   - It counts a visit by running JavaScript in a browser. Search-engine and
 *     AI crawlers do not run it, so they are absent rather than miscounted:
 *     roughly, whatever this reports is a person.
 *   - It therefore cannot show GPTBot, ClaudeBot or Googlebot at all. Those
 *     live in Search Console's crawl stats, or in a server that sees every
 *     request — which GitHub Pages is not.
 *   - It undercounts people who block scripts. The number is a floor.
 *
 * Set to '' to serve no script at all; the site works exactly the same without
 * it, and one empty string is the whole opt-out.
 */
export const GOATCOUNTER = 'amadunia';

export const countEndpoint = GOATCOUNTER
  ? `https://${GOATCOUNTER}.goatcounter.com/count`
  : null;
