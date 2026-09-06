// Counts appear in prose as words, but must never drift from the data.
const words = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty',
];

const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

// The table used to stop at twenty and fall back to a digit, which is the same
// silent failure as raising past the end of it: a count that crosses the
// ceiling stops reading as prose and nothing says so. The alphabet sits at
// exactly twenty, one letter from crossing it.
export function spell(n: number): string {
  if (n in words) return words[n];
  if (n > 20 && n < 100) {
    const t = tens[Math.floor(n / 10)];
    return n % 10 === 0 ? t : `${t}-${words[n % 10]}`;
  }
  if (n >= 100 && n < 1000) {
    const h = `${words[Math.floor(n / 100)]} hundred`;
    return n % 100 === 0 ? h : `${h} and ${spell(n % 100)}`;
  }
  return String(n);
}

export function Spell(n: number): string {
  const w = spell(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}
