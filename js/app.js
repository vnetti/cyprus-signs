import { shuffle, answer, options } from './quiz.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'cyprus-signs', app = $('#app'), sheet = $('#sheet');
let signs, cats, byId, st; // st = { cats, tab, s }

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

async function boot() {
  try {
    [signs, cats] = await Promise.all(['data/signs.json', 'data/categories.json'].map(u => fetch(u).then(r => r.json())));
  } catch { app.innerHTML = '<p class="center mut">Could not load signs. Check your connection and reload.</p>'; return; }
  byId = new Map(signs.map(s => [s.id, s]));
  const o = load();
  st = { cats: (o.cats || cats.map(c => c.key)).filter(k => cats.some(c => c.key === k)), tab: cats.some(c => c.key === o.tab) ? o.tab : cats[0].key, s: o.s || null };
  if (st.s) { st.s.q = (st.s.q || []).filter(id => byId.has(id)); if (!st.s.q.length) st.s = null; }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  addEventListener('hashchange', render);
  render();
}

function render() {
  const h = location.hash.slice(1);
  if (h === 'quiz' && st.s) return quiz();
  if (h === 'done') return done();
  if (h === 'browse') return browse();
  home();
}

function home() {
  const n = k => signs.filter(s => s.category === k).length;
  const cont = st.s ? `<button id="cont">Continue — ${st.s.q.length} of ${st.s.total} left</button>` : '';
  app.innerHTML = `<h1>Cyprus Road Signs</h1>${cont}
    <div class="block"><div class="chips">
      <label class="chip"><input type="checkbox" id="all"> All</label>
      ${cats.map(c => `<label class="chip"><input type="checkbox" value="${esc(c.key)}" ${st.cats.includes(c.key) ? 'checked' : ''}> ${esc(c.title)} (${n(c.key)})</label>`).join('')}
    </div>
    <div class="row"><button data-m="s2n">Sign → Name</button></div>
    <div class="row"><button data-m="n2s">Name → Sign</button></div></div>
    <div class="row center" style="justify-content:center"><button class="link" id="br">Browse all signs</button></div>`;
  const boxes = [...app.querySelectorAll('.chips input[value]')], all = $('#all');
  const sync = () => { st.cats = boxes.filter(b => b.checked).map(b => b.value); all.checked = st.cats.length === boxes.length; save(); };
  boxes.forEach(b => b.onchange = sync); sync();
  all.onchange = () => { boxes.forEach(b => b.checked = all.checked); sync(); };
  if (st.s) $('#cont').onclick = () => location.hash = 'quiz';
  $('#br').onclick = () => location.hash = 'browse';
  app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    if (!st.cats.length) return alert('Pick at least one category.');
    if (st.s && !confirm('Start over? Your saved session will be replaced.')) return;
    start(b.dataset.m, st.cats);
  });
}

function start(mode, ck) {
  const q = shuffle(signs.filter(s => ck.includes(s.category)).map(s => s.id));
  st.s = { mode, q, total: q.length, wrong: 0, cats: ck }; save();
  location.hash === '#quiz' ? render() : location.hash = 'quiz';
}

function browse() {
  const tab = () => {
    app.innerHTML = `<div class="row" style="margin:0"><button class="icon" id="x" aria-label="Home">×</button><h2>Browse signs</h2></div>
      <div class="tabs">${cats.map(c => `<button class="chip ${c.key === st.tab ? 'on' : ''}" data-k="${esc(c.key)}">${esc(c.title)}</button>`).join('')}</div>
      <div class="grid">${signs.filter(s => s.category === st.tab).map(s => `<button class="sec" data-id="${esc(s.id)}"><img loading="lazy" src="${esc(s.img)}" alt="${esc(s.name)}"></button>`).join('')}</div>`;
    $('#x').onclick = () => location.hash = '';
    $('.tabs .on').scrollIntoView({ inline: 'center', block: 'nearest' }); // re-render resets the strip's scroll
    app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { st.tab = b.dataset.k; save(); tab(); scrollTo(0, 0); });
    app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
      const s = byId.get(b.dataset.id);
      sheet.innerHTML = `<img src="${esc(s.img)}" alt="${esc(s.name)}"><h2>${esc(s.name)}</h2><p>${esc(s.desc)}</p><button class="sec">Close</button>`;
      $('button', sheet).onclick = () => sheet.close(); sheet.showModal();
    });
  };
  tab();
}
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

function quiz() {
  const s = st.s, sign = byId.get(s.q[0]), a = s.mode === 's2n', done = s.total - s.q.length;
  const opts = options(sign, signs);
  app.innerHTML = `<div class="row" style="margin:0"><button class="icon" id="x" aria-label="Home">×</button><div class="bar"><i style="width:${done / s.total * 100}%"></i></div><span class="small mut">${done} / ${s.total}</span></div>
    <div class="prompt">${a ? `<img src="${esc(sign.img)}" alt="">` : `<h2>${esc(sign.name)}</h2>`}</div>
    <div class="opts ${a ? '' : 'img'}">${opts.map(o => `<button data-id="${esc(o.id)}">${a ? esc(o.name) : `<img src="${esc(o.img)}" alt="${esc(o.name)}">`}</button>`).join('')}</div>
    <div id="fb"></div>`;
  scrollTo(0, 0);
  $('#x').onclick = () => location.hash = '';
  const btns = [...app.querySelectorAll('.opts button')];
  btns.forEach(b => b.onclick = () => {
    btns.forEach(x => x.disabled = true);
    btns.forEach(x => x.style.opacity = 1);
    const ok = b.dataset.id === sign.id;
    btns.find(x => x.dataset.id === sign.id).classList.add('ok');
    if (!ok) { b.classList.add('bad'); s.wrong++; }
    answer(s.q, ok); save();
    // hashchange renders #done; skip if the user left (×) during the 600ms pause.
    const next = () => { if (st.s === s && location.hash === '#quiz') s.q.length ? quiz() : location.hash = 'done'; };
    if (ok) return setTimeout(next, 600);
    const picked = a ? '' : `<p class="mut">You picked: ${esc(byId.get(b.dataset.id).name)}</p>`;
    $('#fb').innerHTML = `${picked}<p class="desc">${esc(sign.desc)}</p><button id="nx">Next</button>`;
    $('#nx').onclick = next; $('#nx').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function done() {
  const s = st.s;
  if (!s) return home();
  const cats0 = s.cats || st.cats, mode = s.mode, n = s.total, m = s.wrong;
  st.s = null; save();
  app.innerHTML = `<h1>Done!</h1><p>All ${n} signs answered correctly. Mistakes: ${m}.</p>
    <div class="row"><button id="again">Again</button></div><div class="row"><button class="sec" id="hm">Home</button></div>`;
  $('#again').onclick = () => start(mode, cats0);
  $('#hm').onclick = () => location.hash = '';
}

boot();
