import test from 'node:test';
import assert from 'node:assert/strict';
import { answer, options, shuffle } from '../js/quiz.js';

test('answer', () => {
  let q = [...'abcde']; answer(q, false); assert.deepEqual(q, [...'bcdae']);
  q = ['a', 'b']; answer(q, false); assert.deepEqual(q, ['b', 'a']);
  q = ['a']; answer(q, false); assert.deepEqual(q, ['a']);
  q = ['a', 'b']; answer(q, true); assert.deepEqual(q, ['b']);
});

test('simulation: all removed, miss never next while >=2 left', () => {
  const ids = Array.from({ length: 50 }, (_, i) => 'id' + i), q = shuffle([...ids]);
  assert.equal(new Set(q).size, 50);
  let steps = 0;
  while (q.length) {
    const cur = q[0], ok = Math.random() > .3;
    answer(q, ok);
    if (!ok && q.length >= 2) assert.notEqual(q[0], cur);
    assert.equal(new Set(q).size, q.length);
    assert.ok(++steps < 10000);
  }
});

const mk = (id, category, name) => ({ id, category, name, desc: '', img: id + '.png' });
const fx = [
  ...Array.from({ length: 6 }, (_, i) => mk('w' + i, 'warning', 'Warn ' + i)),
  mk('r0', 'regulatory', 'Stop'), mk('r1', 'regulatory', ' stop '), mk('r2', 'regulatory', 'Yield'),
  ...Array.from({ length: 4 }, (_, i) => mk('i' + i, 'info', 'Info ' + i)),
];

test('options', () => {
  for (const s of fx) {
    const o = options(s, fx), names = o.map(x => x.name.trim().toLowerCase());
    assert.equal(o.length, 5);
    assert.ok(o.includes(s));
    assert.equal(new Set(names).size, 5);
  }
  assert.ok(options(fx[0], fx).every(x => x.category === 'warning'));
  const o = options(fx[6], fx); // regulatory has only 2 distinct names
  assert.equal(o.length, 5);
});

test('data: unique ids, images exist, English-only, no "(variant N)" names a quiz cannot tell apart', async () => {
  const { readFileSync, existsSync } = await import('node:fs');
  const signs = JSON.parse(readFileSync(new URL('../data/signs.json', import.meta.url)));
  const cats = JSON.parse(readFileSync(new URL('../data/categories.json', import.meta.url))).map(c => c.key);
  assert.equal(new Set(signs.map(s => s.id)).size, signs.length);
  for (const s of signs) {
    assert.ok(cats.includes(s.category), s.id);
    assert.ok(existsSync(new URL('../' + s.img, import.meta.url)), s.img);
    assert.doesNotMatch(s.name + s.desc, /[Ͱ-Ͽἀ-῿]/, s.id);
    assert.doesNotMatch(s.name, /\((variant|case) \d+\)/i, s.id);
  }
});
