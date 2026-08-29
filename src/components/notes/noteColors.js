// Keep-style pastels, all from Tailwind's built-in palette — no dark
// tones in the set, per the "no dark colors anywhere" requirement.
// hex duplicates each color's actual Tailwind value, needed for the
// fade-out gradient (a CSS gradient can't reference a Tailwind class,
// it needs a real color to fade into).
const PALETTE = [
  { bg: 'bg-amber-100', hex: '#fef3c7' },
  { bg: 'bg-emerald-100', hex: '#d1fae5' },
  { bg: 'bg-sky-100', hex: '#e0f2fe' },
  { bg: 'bg-rose-100', hex: '#ffe4e6' },
  { bg: 'bg-violet-100', hex: '#ede9fe' },
];

function pick(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function colorForNote(id) {
  return pick(id).bg;
}

export function hexForNote(id) {
  return pick(id).hex;
}
