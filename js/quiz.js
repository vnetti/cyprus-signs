export const GAP = 3;
export function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Take the head of the queue; a miss comes back after GAP other cards (or last if fewer remain).
export function answer(q, ok, gap = GAP) {
  const id = q.shift();
  if (!ok) q.splice(Math.min(gap, q.length), 0, id);
}
const norm = s => s.trim().toLowerCase();
// sign + 4 distractors with distinct names, same category first.
export function options(sign, all, n = 5) {
  const seen = new Set([norm(sign.name)]), out = [sign];
  const same = shuffle(all.filter(s => s.category === sign.category)), rest = shuffle(all.filter(s => s.category !== sign.category));
  for (const s of [...same, ...rest]) { if (out.length === n) break; if (!seen.has(norm(s.name))) { seen.add(norm(s.name)); out.push(s); } }
  return shuffle(out);
}
