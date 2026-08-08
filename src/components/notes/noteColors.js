// Keep-style pastels, all from Tailwind's built-in palette — no dark
// tones in the set, per the "no dark colors anywhere" requirement.
export const NOTE_COLORS = [
  'bg-amber-100',
  'bg-emerald-100',
  'bg-sky-100',
  'bg-rose-100',
  'bg-violet-100',
];

export function colorForNote(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return NOTE_COLORS[hash % NOTE_COLORS.length];
}
