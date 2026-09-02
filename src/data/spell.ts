// Counts appear in prose as words, but must never drift from the data.
const words = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty',
];

export function spell(n: number): string {
  return words[n] ?? String(n);
}

export function Spell(n: number): string {
  const w = spell(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}
