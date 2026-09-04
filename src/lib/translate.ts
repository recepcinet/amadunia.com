/**
 * English → Amadunia by rule.
 *
 * Amadunia was built to have no exceptions, which is the one condition under
 * which generating a language from rules actually works: no conjugation, no
 * gender, no agreement, no articles, fixed word order. So the hard half of this
 * is reading the English, not writing the Amadunia.
 *
 * Every rule below cites the page that settles it. Nothing here decides
 * anything the language has left open — where upstream has an open question,
 * this does the attested thing and no more.
 */

export type Pos = 'N' | 'V' | 'ADJ' | 'Q' | 'P' | 'LOC' | 'G' | 'NUM' | 'DEM';
export type Lexicon = {
  en: Record<string, string>;
  pos: Record<string, Pos>;
  /** Value to root, e.g. { '1': 'uan', '10': 'des' } — read off the dictionary. */
  num: Record<string, string>;
  /** Names the writing uses that are not roots, read off the corpus. */
  names: string[];
};

const ARTICLES = new Set(['a', 'an', 'the']);
const MOTION = new Set(['go', 'lai', 'kimbia', 'anda']);

// he/she/it is one word; we is two, and English cannot tell them apart.
const PRON: Record<string, string> = {
  i: 'mi', me: 'mi', you: 'yu', he: 'ta', him: 'ta', she: 'ta', it: 'ta',
  we: 'kita', us: 'kita', they: 'ta-ta', them: 'ta-ta',
};
const DET_POSS: Record<string, string> = {
  my: 'mi', your: 'yu', his: 'ta', her: 'ta', its: 'ta', our: 'mi-mi', their: 'ta-ta',
};
const POSS_PRON: Record<string, string> = {
  mine: 'mi', yours: 'yu', hers: 'ta', ours: 'mi-mi', theirs: 'ta-ta',
};
const DEM: Record<string, string> = { this: 'ini', that: 'itu', these: 'ini', those: 'itu' };
// The English side of the numbers. The Amadunia side is never written here:
// it is looked up by value in the lexicon, which reads it off the dictionary.
const NUMVALUE: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, twenty: 20, hundred: 100, thousand: 1000,
};
const QUANT: Record<string, string> = { many: 'cok', much: 'cok', some: 'cok', all: 'cok' };

/**
 * Words the language has not settled, which this does not write. Whether cok
 * carries "very" is an open question in grammar/adverbs.md, and kadang cannot
 * be written at all until the frequency-adverb question is decided, because
 * any sentence using it would answer that question by accident. Writing either
 * would be this page settling something the language has not.
 */
const UNSETTLED = new Set(['very', 'sometimes', 'occasionally']);

// English-side only: which English word the index already answers. No Amadunia
// word is added here — "well" is the adverb of "good", and the language uses
// one form for both (grammar/adverbs.md).
const SYN: Record<string, string> = {
  well: 'good', has: 'have', had: 'have', with: 'together', lots: 'many',
  cannot: 'can', tell: 'say', okay: 'ok', hello: 'hi', sure: 'ok', thanks: 'thank you',
};
// Compounds read off the corpus, not invented: din ini is attested for "today".
const PHRASE: Record<string, string> = {
  today: 'din ini', tonight: 'rat ini', 'thank you': 'mersi', 'how many': 'berapa',
  'how much': 'berapa', 'a lot of': 'cok', 'a lot': 'cok', 'excuse me': 'pardon',
  'you all': 'yu-yu', 'years old': 'tahun', 'of course': 'ok',
};
const COMPAR: Record<string, [string, string]> = {
  bigger: ['lebi', 'big'], better: ['lebi', 'good'], smaller: ['lebi', 'small'],
  longer: ['lebi', 'long'], faster: ['lebi', 'fast'], older: ['lebi', 'old'],
  newer: ['lebi', 'new'], younger: ['lebi', 'young'], biggest: ['paling', 'big'],
  best: ['paling', 'good'], smallest: ['paling', 'small'], longest: ['paling', 'long'],
};
const IRREG: Record<string, string> = {
  ate: 'eat', ran: 'run', saw: 'see', went: 'go', came: 'come', gave: 'give',
  took: 'take', said: 'say', made: 'make', wrote: 'write', drank: 'drink',
  slept: 'sleep', felt: 'feel', found: 'find', knew: 'know', heard: 'hear',
  sat: 'sit', stood: 'stand', bought: 'buy', sold: 'sell', sang: 'sing',
  began: 'begin', died: 'die', brought: 'bring', sent: 'send', thought: 'think',
  understood: 'understand', forgot: 'forget', spoke: 'speak', wanted: 'want',
};
const IRREG_PL: Record<string, string> = {
  children: 'child', people: 'person', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth',
};

/**
 * Numbers are built, never irregular: a digit before a base multiplies it, a
 * digit after it adds, so du-des is twenty and des-du is twelve
 * (grammar/numbers.md). Every root comes from the lexicon; none is typed here.
 */
export function numeral(lex: Lexicon, n: number): string {
  const r = (v: number) => lex.num[String(v)];
  if (n >= 1 && n <= 10) return r(n) ?? String(n);
  if (n === 100 || n === 1000) return r(n) ?? String(n);
  if (n > 10 && n < 20) return `${r(10)}-${numeral(lex, n - 10)}`;
  if (n < 100 && n % 10 === 0) return `${numeral(lex, n / 10)}-${r(10)}`;
  if (n < 100) return `${numeral(lex, Math.floor(n / 10))}-${r(10)}-${numeral(lex, n % 10)}`;
  if (n < 10000 && n % 1000 === 0) return `${numeral(lex, n / 1000)}-${r(1000)}`;
  return String(n);
}

type Tok = { t: string; p: string; r: string | null; past?: boolean; cmp?: [string, string] };

const GEN = '␟GEN';

function lookup(lex: Lexicon, w: string): [string, Pos, string] | null {
  const hit = (f: string) => (f in lex.en ? f : null);
  for (const f of [w, `to ${w}`]) {
    if (f in lex.en) { const r = lex.en[f]; return [r, lex.pos[r] ?? 'N', w]; }
  }
  const stems: string[] = [];
  if (w.endsWith('ies') && w.length > 4) stems.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es') && w.length > 3) stems.push(w.slice(0, -2));
  if (w.endsWith('s') && w.length > 2) stems.push(w.slice(0, -1));
  if (w.endsWith('ing') && w.length > 4) stems.push(w.slice(0, -3), w.slice(0, -3) + 'e');
  if (w.endsWith('ed') && w.length > 3) stems.push(w.slice(0, -2), w.slice(0, -1));
  for (const s of stems) for (const f of [s, `to ${s}`]) {
    if (f in lex.en) { const r = lex.en[f]; return [r, lex.pos[r] ?? 'N', s]; }
  }
  void hit;
  return null;
}

function tag(lex: Lexicon, tokens: string[]): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    let w = t.toLowerCase();
    let consumed = 1;
    for (const k of [3, 2, 1]) {
      if (i + k > tokens.length) continue;
      const ph = tokens.slice(i, i + k).map((x) => x.toLowerCase()).join(' ');
      if (ph in PHRASE) { out.push({ t, p: 'PHRASE', r: PHRASE[ph] }); consumed = k; w = ''; break; }
      if (ph in SYN && k > 1) { w = SYN[ph]; consumed = k; break; }
    }
    i += consumed;
    if (!w) continue;

    if (w === GEN.toLowerCase()) { out.push({ t, p: 'OF', r: null }); continue; }
    if (ARTICLES.has(w)) { out.push({ t, p: 'DROP', r: null }); continue; }
    if (w in COMPAR) {
      const [deg, base] = COMPAR[w];
      const f = lookup(lex, base);
      out.push({ t, p: 'CMP', r: null, cmp: [deg, f ? f[0] : base] });
      continue;
    }
    if (w in QUANT) { out.push({ t, p: 'QUANT', r: QUANT[w] }); continue; }
    if (w in DET_POSS) {
      const nxt = (tokens[i] ?? '').toLowerCase();
      const f = nxt ? lookup(lex, IRREG[nxt] ?? nxt) : null;
      // "her book" marks the owner; "I see her" is the object.
      const solo = ['her', 'his', 'its'].includes(w) && (!nxt || !f || f[1] === 'V');
      out.push({ t, p: solo ? 'PRON' : 'POSS', r: DET_POSS[w] });
      continue;
    }
    if (w in POSS_PRON) { out.push({ t, p: 'PRON', r: POSS_PRON[w] }); continue; }
    if (w in PRON) { out.push({ t, p: 'PRON', r: PRON[w] }); continue; }
    if (w in DEM) { out.push({ t, p: 'DEM', r: DEM[w] }); continue; }
    if (w in NUMVALUE) { out.push({ t, p: 'NUM', r: numeral(lex, NUMVALUE[w]) }); continue; }
    if (/^\d+$/.test(w)) { out.push({ t, p: 'NUM', r: numeral(lex, Number(w)) }); continue; }
    if (w === 'not' || w === 'no') { out.push({ t, p: 'NEG', r: 'no' }); continue; }
    if (w === 'do' || w === 'does') { out.push({ t, p: 'DROP', r: null }); continue; }
    if (w === 'did') { out.push({ t, p: 'AUX', r: 'suda' }); continue; }
    if (w === 'will' || w === 'shall') { out.push({ t, p: 'AUX', r: 'saufa' }); continue; }
    if (['is', 'am', 'are', 'be'].includes(w)) { out.push({ t, p: 'BE', r: null }); continue; }
    if (w === 'was' || w === 'were') { out.push({ t, p: 'BE', r: null, past: true }); continue; }
    if (w === 'to') { out.push({ t, p: 'TO', r: null }); continue; }
    if (w === 'of') { out.push({ t, p: 'OF', r: null }); continue; }
    if (w === 'and') { out.push({ t, p: 'CONJ', r: 'aur' }); continue; }
    if (w === 'or') { out.push({ t, p: 'CONJ', r: 'o' }); continue; }
    if (w === 'more') { out.push({ t, p: 'DEG', r: 'lebi' }); continue; }
    if (w === 'less') { out.push({ t, p: 'DEG', r: 'kurang' }); continue; }
    if (w === 'most') { out.push({ t, p: 'DEG', r: 'paling' }); continue; }
    if (w === 'than') { out.push({ t, p: 'W', r: 'dari' }); continue; }
    // "There is a hotel" is not the place word: the existential is es at the
    // front with no subject at all (grammar/copula.md). Only a clause-initial
    // there followed by the verb to be is it; "the hotel is there" is situ.
    if (
      w === 'there' &&
      !out.some((x) => x.p !== 'DROP') &&
      ['is', 'are', 'was', 'were', "'s", "'re"].includes((tokens[i] ?? '').toLowerCase())
    ) {
      out.push({ t, p: 'EXIST', r: null });
      continue;
    }
    if (UNSETTLED.has(w)) { out.push({ t, p: 'OPEN', r: null }); continue; }
    if (w in SYN) w = SYN[w];
    if (w in IRREG_PL) {
      const f = lookup(lex, IRREG_PL[w]);
      if (f) { out.push({ t, p: 'N', r: `${f[0]}-${f[0]}` }); continue; }
    }
    const base = IRREG[w] ?? w;
    const f = lookup(lex, base);
    if (!f) {
      // A capital at the start of a sentence says nothing — every sentence has
      // one — so it is not evidence of a name. Treating it as one dressed an
      // English word up in the language's own colour, which is a claim this
      // page must not make. A name is a word the writing already uses as one,
      // or a capital somewhere a capital had to be chosen.
      const lower = t.toLowerCase();
      // A word the English index cannot answer may still be Amadunia: Sol is a
      // name in the writing and sol is the root for sun, and someone typing
      // either means the same word.
      if (lower in lex.pos) { out.push({ t, p: lex.pos[lower], r: lower }); continue; }
      const known = lex.names.some((n) => n.toLowerCase() === lower);
      const isName = known || (/^[A-Z]/.test(t) && out.some((x) => x.p !== 'DROP'));
      out.push({ t, p: isName ? 'NAME' : 'UNK', r: isName ? t : null });
      continue;
    }
    const [root, pos, stem] = f;
    const past = (w in IRREG && IRREG[w] !== w) || (pos === 'V' && w.endsWith('ed') && stem !== w);
    // A plural noun doubles; nothing inside the word changes.
    const plural = pos === 'N' && stem !== base && base.endsWith('s') && !stem.endsWith('s');
    out.push({ t, p: pos, r: plural ? `${root}-${root}` : root, past });
  }
  return out;
}

const NP = ['POSS', 'NUM', 'DEM', 'ADJ', 'N', 'PRON', 'NAME', 'QUANT', 'DEG', 'CMP'];

function clause(tg: Tok[], question: boolean): string {
  let tail: string | null = null;

  // "A question is the answer with one word swapped": the question word goes
  // back to the slot the answer would fill (grammar/questions.md). kim before
  // a verb is already in that slot, as the subject.
  const kimSubject = tg[0]?.p === 'Q' && tg[0].r === 'kim' && !tg.slice(0, 3).some((x) => x.p === 'BE');
  if (question && tg[0]?.p === 'Q' && !kimSubject) { tail = tg[0].r; tg = tg.slice(1); }

  // A fronted "is" belongs to its predicate, not to the front of the sentence.
  if (question && tg[0]?.p === 'BE') {
    const be = tg[0], rest = tg.slice(1);
    let j = 0;
    while (rest[j]?.p === 'DROP') j++;
    while (rest[j] && ['POSS', 'NUM', 'DEM', 'ADJ', 'QUANT', 'DEG'].includes(rest[j].p)) j++;
    if (rest[j] && ['N', 'PRON', 'NAME'].includes(rest[j].p)) j++;
    while (rest[j] && ['DEM', 'OF', 'POSS', 'N', 'PRON', 'NAME'].includes(rest[j].p)) j++;
    tg = [...rest.slice(0, j), be, ...rest.slice(j)];
  }

  // An adverb is the adjective unchanged, and it stands before the object
  // rather than after it: Mi kara hao libro is "I read a book well", while
  // Mi kara libro hao is "I read a good book" (grammar/adverbs.md). Position
  // is the whole distinction, so this only fires when the trailing adjective
  // really belongs to this verb — not across a copula or a subordinator, where
  // it is the predicate of a clause standing in the object slot instead.
  const v = tg.findIndex((x) => x.p === 'V');
  const trail = tg[tg.length - 1];
  if (v >= 0 && tg.length > v + 2 && trail.p === 'ADJ' && trail.r !== 'una') {
    const mid = tg.slice(v + 1, -1);
    const clean = !mid.some((x) => ['BE', 'CONJ', 'Q', 'W', 'V'].includes(x.p));
    if (clean && mid.some((x) => ['N', 'PRON', 'NAME'].includes(x.p))) {
      const adv = [{ ...trail, p: 'ADV' }];
      let cut = tg.length - 1;
      // "very well" moves as a piece: cok scales the adjective it stands before.
      if (tg[cut - 1]?.p === 'DEG') { adv.unshift({ ...tg[cut - 1], p: 'ADV' }); cut -= 1; }
      tg = [...tg.slice(0, v + 1), ...adv, ...tg.slice(v + 1, cut)];
    }
  }

  const out: string[] = [];
  let i = 0, neg = false, tense: string | null = null;
  // "There is..." has no subject, and es stands whatever the predicate is —
  // Es cok badal, there are many clouds (grammar/copula.md).
  let existential = false;
  const n = tg.length;

  while (i < n) {
    const { t, p, r, past, cmp } = tg[i];
    if (p === 'DROP') { i++; continue; }
    if (p === 'EXIST') { existential = true; i++; continue; }
    if (p === 'UNK' || p === 'OPEN') { out.push(`⟨${t}⟩`); i++; continue; }
    if (p === 'NEG') { neg = true; i++; continue; }
    if (p === 'AUX') { tense = r; i++; continue; }
    if (p === 'PHRASE') { out.push(r!); i++; continue; }

    if (NP.includes(p)) {
      if (neg) { out.push('no'); neg = false; }
      if (tense) { out.push(tense); tense = null; }
      // English says friend's house; Amadunia says house friend — the owner
      // comes right after the thing owned (grammar/possession.md), so the
      // groups either side of 's are handed back in reverse.
      const groups: Tok[][] = []; let cur: Tok[] = [];
      while (i < n) {
        const x = tg[i];
        if (x.p === 'DROP') { i++; continue; }
        if (x.p === 'OF') { groups.push(cur); cur = []; i++; continue; }
        if (NP.includes(x.p)) { cur.push(x); i++; continue; }
        break;
      }
      groups.push(cur);
      for (const g of groups.filter((x) => x.length).reverse()) {
        const owner: string[] = [], adjs: string[] = [], pre: string[] = [];
        let dem: string | null = null, num: string | null = null, head: string | null = null;
        for (const x of g) {
          if (x.p === 'POSS') owner.push(x.r!);
          else if (x.p === 'NUM') num = x.r;
          else if (x.p === 'DEM') dem = x.r;
          else if (x.p === 'DEG' || x.p === 'QUANT') pre.push(x.r!);
          else if (x.p === 'CMP') { pre.push(x.cmp![0]); adjs.push(x.cmp![1]); }
          else if (x.p === 'ADJ' && head === null) adjs.push(x.r!);
          else if (['N', 'PRON', 'NAME'].includes(x.p) && head === null) head = x.r;
          else if (['N', 'PRON', 'NAME'].includes(x.p)) owner.push(x.r!);
          else if (x.p === 'ADJ') adjs.push(x.r!);
        }
        // ini and itu stand alone as subjects — Ini es ke, what is this
        // (grammar/demonstratives.md, taught in Lesson 15). With nothing to
        // follow, the demonstrative is the phrase.
        if (head === null && dem) { head = dem; dem = null; }
        if (head === null) { out.push(...pre, ...adjs); continue; }
        // After a number the noun stays single: the number has done the work.
        let rest = pre;
        if (num) { out.push(num); head = head.split('-')[0]; }
        if (pre.length) head = head.split('-')[0];
        if (pre.length && !adjs.length) { out.push(pre[0]); rest = pre.slice(1); }
        out.push(head);
        out.push(...owner, ...rest, ...adjs);
        if (dem) out.push(dem);
      }
      continue;
    }

    if (p === 'BE') {
      if (past) tense = 'suda';
      let j = i + 1;
      while (j < n && tg[j].p === 'DROP') j++;
      const nxt = tg[j]?.p;
      // A denial of the existential comes first: No es ca, there is no tea.
      if (existential && nxt === 'NEG') { out.push('no'); tg[j].p = 'DROP'; }
      if (neg) { out.push('no'); neg = false; }
      if (tense) { out.push(tense); tense = null; }
      // es stands before a noun predicate only; an adjective or a place word
      // is the sentence and takes the particle directly (grammar/copula.md).
      // The answer to what and who is a noun, so the copula stands before it —
      // Ini es ke, Yu es kim — but only where the sentence has no verb of its
      // own. "What are you doing" is Yu suru ke, and es never joins a verb.
      const answerIsNoun =
        (tail === 'kim' || tail === 'ke') && !tg.some((x) => x.p === 'V');
      if (existential || (nxt && ['N', 'PRON', 'NUM', 'POSS', 'NAME'].includes(nxt)) || answerIsNoun)
        out.push('es');
      i++; continue;
    }

    if (p === 'V') {
      if (neg) { out.push('no'); neg = false; }
      if (past && !tense) tense = 'suda';
      if (tense) { out.push(tense); tense = null; }
      out.push(r!);
      if (tail === 'ke') { out.push(tail); tail = null; }
      // A verb of motion takes its destination bare (grammar/place.md).
      if (MOTION.has(r!) && tg[i + 1]?.p === 'TO') i++;
      i++; continue;
    }

    if (p === 'TO') {
      let j = i + 1;
      while (j < n && tg[j].p === 'DROP') j++;
      if (tg[j]?.p === 'V') { i++; continue; }   // verb chain: nothing between
      out.push('por'); i++; continue;
    }

    if (p === 'OF') { i++; continue; }
    if (p === 'P') {
      let j = i + 1;
      while (j < n && tg[j].p === 'DROP') j++;
      if (tg[j]?.p === 'LOC') { i = j; continue; }
    }
    if (p === 'ADV') { out.push(r!); i++; continue; }
    if (['Q', 'P', 'LOC', 'G', 'W', 'CONJ'].includes(p)) {
      if (neg && (p === 'LOC' || p === 'P')) { out.push('no'); neg = false; }
      if (tense && (p === 'LOC' || p === 'P')) { out.push(tense); tense = null; }
      out.push(r!); i++; continue;
    }
    i++;
  }
  if (neg) out.unshift('no');
  if (tail) out.push(tail);
  return out.join(' ');
}

export function translate(lex: Lexicon, sentence: string): string {
  // A typed apostrophe and the one a word processor substitutes are the same
  // apostrophe, and friend\u2019s must not become friend + s.
  const text = sentence.replace(/[\u2018\u2019\u02BC]/g, "'").trim();
  const parts = text.split(/([.?!,;])/);
  const pieces: [string, string][] = [];
  let buf = '';
  for (const x of parts) {
    if ('.?!,;'.includes(x) && x.length === 1) { if (buf.trim()) pieces.push([buf, x]); buf = ''; }
    else buf += x;
  }
  if (buf.trim()) pieces.push([buf, '']);

  const outs: string[] = [];
  for (const [raw, punct] of pieces) {
    let chunk = raw
      .replace(/\b(\w+)'ll\b/gi, '$1 will')
      .replace(/\b(\w+)'re\b/gi, '$1 are')
      .replace(/\b(\w+)n't\b/gi, '$1 not')
      .replace(/\bI'm\b/gi, 'I am')
      .replace(/\b(\w+)'ve\b/gi, '$1 have')
      .replace(/\bcan not\b/gi, 'can');
    const raw2 = chunk.match(/[A-Za-z]+'s|[A-Za-z']+|\d+/g) ?? [];
    const toks: string[] = [];
    for (const t of raw2) {
      if (t.endsWith("'s") && t.length > 2) toks.push(t.slice(0, -2), GEN);
      else toks.push(t);
    }
    if (!toks.length) continue;
    const q = punct === '?' || text.endsWith('?');
    let am = clause(tag(lex, toks), q);
    if (!am) continue;
    if (/^[A-Z]/.test(raw.trim())) am = am[0].toUpperCase() + am.slice(1);
    outs.push(am + ('.?!,;'.includes(punct) ? punct : ''));
  }
  return outs.join(' ').trim();
}
