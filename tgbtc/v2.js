/* Coach v2 pages (2026-11-04): Gem planner, Stronghold, Battle replay, game stats on character pages,
   and the 3D look. Data: window.TGDATA.v2 (scripts/build_v2_data.py). Loaded BEFORE app.js; app.js calls
   TGV2.init(helpers) inside its closure and routes #plan/#stronghold/#sim here. */
window.TGV2 = { init: function (A) {
  'use strict';
  const V = (window.TGDATA || {}).v2;
  if (!V) return null;
  const { el, text, panel, image, more, title, main, byKey, fixName, headerContext, link, select, field } = A;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const pct = n => Math.round(n * 1000) / 10 + '%';
  const src = s => text('Source: ' + s, 'subtle');
  const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem('tgbtc-v2-' + k)); localStorage.setItem('tgbtc-v2-' + k, JSON.stringify(v)); } catch (e) { return null; } };
  const unitName = id => { const h = byKey.get(id); return h ? fixName(h.name) : 'Unit ' + id; };
  const unitImg = (id, cls) => image('assets/units/' + id + '.png', unitName(id), cls || '');

  /* ---------- Gem planner ---------- */
  function plan() {
    const P = V.plan;
    title('GEM PLANNER', 'How many Diamonds will I have?', 'Pick how you play. The table shows what you save in 1, 2, 3 and 4 weeks.');
    const st = Object.assign({ tier: 'f2p', cards: null, sh: 0, freepass: false }, store('plan') || {});
    const box = el('div');
    main.append(box);
    const draw = () => {
      store('plan', st);
      const tier = P.tiers.find(t => t.id === st.tier);
      const cards = st.cards || tier.cards;
      let perDay = 0, perWeek = 0, tickets = 0, once = 0;
      const lines = [];
      for (const i of P.income) {
        if (!i.tiers.includes(st.tier)) continue;
        if (i.optional && !st[i.id]) continue;
        if (i.per === 'day') perDay += i.amount; else perWeek += i.amount;
        tickets += i.tickets || 0;
        lines.push([i.name, i.per === 'day' ? fmt(i.amount) + ' a day' : (i.tickets ? i.tickets + ' tickets a week' : fmt(i.amount) + ' a week'), i.note || '', i.source]);
      }
      for (const c of P.cards) if (cards.includes(c.id)) {
        perDay += c.per_day; once += c.once;
        lines.push([c.name, fmt(c.per_day) + ' a day + ' + fmt(c.once) + ' when bought', c.note || 'Price: check the shop.', c.source]);
      }
      const shWeek = +st.sh || 0;
      if (shWeek) lines.push(['Stronghold (Saturday war)', fmt(shWeek) + ' a week', 'Your pick below.', 'Stronghold page']);
      const week = perDay * 7 + perWeek + shWeek;
      const rows = [1, 2, 3, 4].map(w => {
        const d = week * w + (w === 1 ? once : once * Math.ceil(w * 7 / 30));
        return [w + (w === 1 ? ' week' : ' weeks'), d, Math.floor(d / P.pull_cost + tickets * w), tickets * w];
      });
      box.replaceChildren(
        el('div', { class: 'v2-choice', role: 'group', 'aria-label': 'How do you play?' },
          P.tiers.map(t => el('button', { 'aria-pressed': String(st.tier === t.id), class: 'v2-big', on: { click: () => { st.tier = t.id; st.cards = null; draw(); } } },
            el('strong', {}, t.name), el('small', {}, t.blurb)))),
        el('div', { class: 'panel v2-opts' },
          el('h3', {}, 'Cards you keep running'),
          P.cards.map(c => el('label', { class: 'inline-check' }, el('input', { type: 'checkbox', checked: cards.includes(c.id), on: { change: e => { const s = new Set(cards); e.target.checked ? s.add(c.id) : s.delete(c.id); st.cards = [...s]; draw(); } } }), c.name + ' (+' + fmt(c.per_day) + ' a day)')),
          el('label', { class: 'inline-check' }, el('input', { type: 'checkbox', checked: st.freepass, on: { change: e => { st.freepass = e.target.checked; draw(); } } }), 'My server is new (Free Monthly Pass, +100 a day for 30 days)'),
          el('h3', {}, 'Stronghold (Saturday war)'),
          select([['0', 'Not counted'], ['3000', 'We place 3rd–4th (about 3,000 a week)'], ['26000', 'We place 1st (about 26,000 a week)']], String(shWeek), v => { st.sh = +v; draw(); })),
        el('div', { class: 'v2-weeks' }, rows.map(([label, d, pulls, t]) => el('div', { class: 'metric v2-tilt' },
          el('small', {}, label), el('strong', {}, fmt(d)), el('small', {}, 'Diamonds · about ' + fmt(pulls) + ' pulls' + (t ? ' (incl. ' + t + ' tickets)' : ''))))),
        text('One pull = ' + P.pull_cost + ' Diamonds. ' + P.note, 'subtle'),
        more([el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, ['Where it comes from', 'Amount', 'Note', 'Source'].map(x => el('th', {}, x)))),
          el('tbody', {}, lines.map(r => el('tr', {}, r.map(c => el('td', {}, c)))))))], 'Where these Diamonds come from'));
    };
    draw();
    main.append(el('div', { class: 'section-head' }, el('h2', {}, 'Should I buy it?')));
    for (const v of P.verdicts) main.append(el('section', { class: 'panel v2-verdict' },
      el('div', { class: 'v2-verdict-head' }, el('span', { class: 'v2-stamp ' + (/SKIP/.test(v.a) ? 'v2-no' : 'v2-yes') }, v.a), el('h3', {}, v.q)),
      el('ul', { class: 'list' }, v.why.map(w => el('li', {}, w))), src(v.source)));
    main.append(el('div', { class: 'section-head' }, el('h2', {}, 'Every week: buy or skip')));
    main.append(el('div', { class: 'v2-buyskip' }, P.buy_skip.map(([a, item, why, s]) => el('div', { class: 'v2-bs' },
      el('span', { class: 'v2-stamp ' + (a === 'SKIP' ? 'v2-no' : 'v2-yes') }, a), el('div', {}, el('strong', {}, item), why ? text(why, 'muted') : null, src(s))))));
    main.append(el('div', { class: 'section-head' }, el('h2', {}, 'VIP daily mail')));
    main.append(panel(text('Sent every day. It never includes Diamonds.', 'muted'), el('div', { class: 'table-wrap' }, el('table', {}, el('tbody', {}, P.vip_daily.map(r => el('tr', {}, r.map(c => el('td', {}, c))))))), src('Game data (VipDaily_1..30)')));
    main.append(el('div', { class: 'notice' }, el('strong', {}, 'Not known yet: '), el('ul', { class: 'list' }, P.pending.map(p => el('li', {}, p)))));
  }

  /* ---------- Stronghold ---------- */
  const COL = { 2: '#e4c18b', 5: '#f5687d', 4: '#80d5d8', 7: '#7fd38a', 8: '#b98bff', 9: '#ff8a4c', 3: '#2a2f3d' };
  function hexMap(m) {
    const cv = el('canvas', { class: 'v2-map', role: 'img', 'aria-label': m.label + ' map: ' + Object.entries(m.counts).map(([k, n]) => n + ' ' + k).join(', ') });
    const paint = () => {
      const xs = m.tiles.map(t => t[0]), ys = m.tiles.map(t => t[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const W = cv.clientWidth || 800, s = W / ((x1 - x0 + 2) * 1.5), H = (y1 - y0 + 2) * s * Math.sqrt(3) / 2;
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sp = new Map(m.sp.map(([x, y, t, q]) => [x + ',' + y, [t, q]]));
      const P = (x, y) => [(x - x0 + 1) * 1.5 * s, (y - y0 + 1) * s * Math.sqrt(3) / 2];
      const hex = (cx, cy, r) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; c[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a)); } c.closePath(); };
      for (const [x, y] of m.tiles) {
        const [cx, cy] = P(x, y);
        hex(cx, cy, s * 0.98); c.fillStyle = '#1b2030'; c.fill();
      }
      /* buildings sit on their own cells (not in the ground list); bigger = more important */
      const R = { 5: 2.6, 2: 1.6, 4: 1.3, 9: 1.5, 7: 1.2, 8: 1.2, 3: 0.98 };
      for (const [x, y, t, q] of [...m.sp].sort((a, b) => (a[2] === 3 ? -1 : 0) - (b[2] === 3 ? -1 : 0))) {
        const [cx, cy] = P(x, y);
        hex(cx, cy, s * (t === 2 && q === 2 ? 2.1 : (R[t] || 1)));
        c.fillStyle = COL[t] || '#555'; c.fill();
        if (t !== 3) { c.lineWidth = t === 5 ? 3 : 1.5; c.strokeStyle = t === 5 ? '#fff' : '#0b0d14'; c.stroke(); }
      }
      void sp;
    };
    requestAnimationFrame(paint);
    window.addEventListener('resize', paint);
    window.addEventListener('hashchange', () => window.removeEventListener('resize', paint), { once: true });
    return cv;
  }
  function stronghold() {
    const S = V.stronghold;
    title('STRONGHOLD', 'Stronghold: maps and rewards.', 'What each building pays, what a top org earns each week, and the three maps.');
    const held = Object.assign({ t1: 3, t2: 1, core: 0 }, store('sh') || {});
    const out = el('div', { class: 'v2-weeks' });
    const calc = () => {
      store('sh', held);
      const g = held.t1 * 1000 + held.t2 * 2000 + held.core * 3000;
      out.replaceChildren(...[1, 2, 3, 4].map(w => el('div', { class: 'metric v2-tilt' }, el('small', {}, w + (w > 1 ? ' weeks' : ' week')), el('strong', {}, fmt(g * w)), el('small', {}, 'Diamonds each member'))));
    };
    const num = (k, max, lbl) => field(lbl, el('input', { type: 'number', min: 0, max, value: held[k], inputmode: 'numeric', on: { input: e => { held[k] = Math.max(0, Math.min(max, +e.target.value || 0)); calc(); } } }));
    main.append(panel(el('h2', {}, 'How much will we earn?'), text('Type how many buildings your org holds until their reward bar fills.', 'muted'),
      el('div', { class: 'flex' }, num('t1', 15, 'Small strongholds (max 15)'), num('t2', 5, 'Large strongholds (max 5)'), num('core', 1, 'The Core (max 1)')), out,
      text(S.reward_note, 'subtle')));
    calc();
    main.append(el('div', { class: 'grid' },
      S.rewards.map(r => el('section', { class: 'panel v2-tilt' }, el('h3', {}, r.kind), el('p', { class: 'v2-gem' }, fmt(r.gems), el('small', {}, ' Diamonds')), text(r.extra, 'muted'), src('Game data, ' + r.row)))));
    main.append(panel(el('h3', {}, 'What orgs earn by place (per member, per week)'),
      el('div', { class: 'table-wrap' }, el('table', {}, el('tbody', {}, S.placements.map(p => el('tr', {}, el('td', {}, p.place), el('td', {}, el('strong', {}, p.gems)), el('td', { class: 'subtle' }, p.source)))))),
      text(S.max_note, 'muted'), text(S.check, 'subtle')));
    main.append(el('div', { class: 'section-head' }, el('h2', {}, 'The maps')));
    const tabs = el('div', { class: 'tabs' }), holder = el('div', { class: 'panel' });
    const legend = el('div', { class: 'v2-legend' }, [[5, 'Core'], [2, 'Stronghold'], [4, 'Spawn base'], [7, 'Hospital'], [9, 'Fortress'], [8, 'Depot'], [3, 'Blocked']].map(([t, n]) => el('span', {}, el('i', { style: 'background:' + COL[t] }), n)));
    const show = i => {
      [...tabs.children].forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      const m = S.maps[i];
      holder.replaceChildren(el('h3', {}, m.label), hexMap(m), legend, text(Object.entries(m.counts).map(([k, n]) => n + ' ' + k).join(' · '), 'subtle'));
    };
    S.maps.forEach((m, i) => tabs.append(el('button', { on: { click: () => show(i) } }, m.label)));
    main.append(tabs, holder); show(0);
    main.append(text(S.map_credit, 'subtle'), el('p', {}, el('a', { class: 'text-link', href: S.map_link, target: '_blank', rel: 'noopener noreferrer' }, 'Open the full Stronghold planner →')));
    main.append(panel(el('h3', {}, 'Tips from creators'), el('ul', { class: 'list' }, S.tips.map(([t, s]) => el('li', {}, t, ' ', el('span', { class: 'subtle' }, '(' + s + ')'))))));
    main.append(el('section', { class: 'panel' }, el('h3', {}, 'Can one "immortal" team win the whole Stronghold?'), text(S.immortal)));
    main.append(panel(el('h3', {}, 'Progress rewards'), el('ul', { class: 'list' }, S.progress.map(p => el('li', {}, 'Tier ' + p.tier + ': ' + p.items))), src(S.progress_source)));
  }

  /* ---------- Battle replay ---------- */
  function sim() {
    const R = V.sim, team = R.team.filter(u => !u.backup), back = R.team.find(u => u.backup);
    title('BATTLE REPLAY', 'Watch the simulator play a boss fight.', 'Every turn you draw cards, play 4 of them, and two matching cards side by side merge into a stronger one. This replay shows how the simulator plays them.');
    main.append(el('div', { class: 'notice' }, el('strong', {}, 'Example only. '), 'This is our World Boss simulator (Bin Brothers), with example stats, not a real account. It is not calibrated against real fights yet, so damage numbers are only for comparing teams. Card rules come from the game data.'));
    const stage = el('section', { class: 'v2-stage' });
    const pitch = el('div', { class: 'v2-field' }, team.map(u => el('div', { class: 'v2-unit', 'data-id': u.id }, unitImg(u.id), el('small', {}, unitName(u.id).split(' [')[0]))),
      back ? el('div', { class: 'v2-unit back' }, unitImg(back.id), el('small', {}, 'Back-up')) : null);
    const boss = el('div', { class: 'v2-boss' }, el('div', { class: 'v2-boss-name' }, 'WORLD BOSS · BIN BROTHERS'), el('div', { class: 'v2-bar' }, el('i')), el('div', { class: 'v2-dmg' }, '0'));
    const hand = el('div', { class: 'v2-hand', 'aria-live': 'polite' }), say = el('p', { class: 'v2-say' });
    const chart = el('div', { class: 'v2-chart', 'aria-hidden': 'true' });
    const ctrl = el('div', { class: 'actions' });
    stage.append(boss, pitch, hand, say, chart, ctrl);
    main.append(stage);
    const max = Math.max(...R.turns.map(t => t.dmg));
    let timer = null, total = 0, ti = 0, step = 0;
    const card = c => c[0] === 'E' ? el('div', { class: 'v2-card energy' }, el('b', {}, '⚡'), el('small', {}, 'Energy')) :
      el('div', { class: 'v2-card lv' + c[1] }, unitImg(c[0]), el('small', {}, 'Lv' + c[1]));
    const reset = () => { clearInterval(timer); timer = null; total = 0; ti = 0; step = 0; chart.replaceChildren(); boss.querySelector('.v2-dmg').textContent = '0'; boss.querySelector('i').style.width = '0'; hand.replaceChildren(); say.textContent = 'Press Play.'; };
    const tick = () => {
      const T = R.turns[ti];
      if (!T) { clearInterval(timer); timer = null; say.textContent = 'Fight over: ' + fmt(total) + ' damage in ' + R.turns.length + ' turns. Over 200 simulated fights the middle result was ' + fmt(R.p50) + ' (most fall between ' + fmt(R.p10) + ' and ' + fmt(R.p90) + ').'; return; }
      if (step === 0) { hand.replaceChildren(...T.hand.map(card)); say.textContent = 'Turn ' + (ti + 1) + ': your hand.'; step = 1; return; }
      const act = T.plan[step - 1];
      if (act) {
        say.textContent = 'Turn ' + (ti + 1) + ': ' + act.replace(/(\d{4})/, m => unitName(m)).replace('play', 'Play').replace('move', 'Move');
        const id = (act.match(/\d{4}/) || [])[0];
        const cs = [...hand.children].find(n => !n.classList.contains('used') && (id ? n.querySelector('img')?.alt === unitName(id) : n.classList.contains('energy')));
        if (cs && act.startsWith('play')) cs.classList.add('used');
        if (id) pitch.querySelectorAll('.v2-unit').forEach(u => u.classList.toggle('hit', u.dataset.id === id));
        step++; return;
      }
      total += T.dmg;
      boss.querySelector('.v2-dmg').textContent = fmt(total);
      boss.querySelector('i').style.width = Math.min(100, total / R.p90 * 100) + '%';
      boss.classList.remove('shake'); void boss.offsetWidth; boss.classList.add('shake');
      chart.append(el('span', { style: 'height:' + Math.max(6, T.dmg / max * 100) + '%', title: 'Turn ' + (ti + 1) + ': ' + fmt(T.dmg) }));
      say.textContent = 'Turn ' + (ti + 1) + ' dealt ' + fmt(T.dmg) + '.';
      pitch.querySelectorAll('.v2-unit').forEach(u => u.classList.remove('hit'));
      ti++; step = 0;
    };
    ctrl.append(el('button', { class: 'primary v2-big', on: { click: () => { if (timer) return; if (ti >= R.turns.length) reset(); timer = setInterval(tick, 900); tick(); } } }, '▶ Play'),
      el('button', { on: { click: () => { clearInterval(timer); timer = null; } } }, '❚❚ Pause'),
      el('button', { on: { click: () => { clearInterval(timer); timer = null; tick(); } } }, 'Next step'),
      el('button', { on: { click: reset } }, '↺ Restart'));
    reset();
    main.append(more([el('ul', { class: 'list' },
      el('li', {}, 'Hand size grows with living field units: 4 units = 6 cards, 4 plays a turn. (game data)'),
      el('li', {}, 'Two identical cards next to each other merge into the next level, up to Lv3. (game data)'),
      el('li', {}, 'Cards give energy: 20 / 50 / 100 for Lv1 / Lv2 / Lv3, +5 per merge, +10 per move. (game data)'),
      el('li', {}, 'The simulator tries every play order and picks the one with the most damage, counting what stays in your hand.'),
      el('li', {}, 'Only the boss\'s damage taken is modeled. Its attacks on you are not in any public table yet.')),
      text('Team: ' + R.team.map(u => unitName(u.id) + (u.backup ? ' (back-up)' : '')).join(', ') + '.', 'subtle')], 'How a turn works'));
    main.append(text('Recordings from the Fight Recorder will calibrate this. Then it can compare your real teams.', 'subtle'));
  }

  /* ---------- Game stats on character pages ---------- */
  function statsPanel(id) {
    const s = V.stats[id];
    if (!s || document.querySelector('.v2-stats')) return;
    const m = (lbl, v, sub) => el('div', { class: 'metric' }, el('small', {}, lbl), el('strong', {}, v), sub ? el('small', {}, sub) : null);
    const kids = [el('h2', {}, 'Game stats'),
      el('div', { class: 'mini-grid' },
        m('ATK at max', fmt(s.max_atk || 0), 'with RC cells ' + fmt(s.max_atk_rc || 0)),
        m('HP at max', fmt(s.max_hp || 0), 'with RC cells ' + fmt(s.max_hp_rc || 0)),
        m('DEF at max', fmt(s.max_def || 0), 'with RC cells ' + fmt(s.max_def_rc || 0)),
        m('Max CP', fmt(s.combat_rc_cell || s.combat || 0), s.cp_rank_rc ? 'rank ' + s.cp_rank_rc + ' of ' + (s.ranked_total || '?') : ''),
        m('Crit', pct(s.crit || 0), 'Crit DMG ' + pct(s.crit_dmg || 0)),
        m('Block', pct(s.block || 0), 'Lifesteal ' + pct(s.lifesteal || 0)),
        m('Regeneration', pct(s.regeneration || 0)),
        s.releaseSEA ? m('Released (SEA)', s.releaseSEA) : null)];
    if (s.rankPassive) kids.push(el('div', { class: 'skill' }, el('h3', {}, 'Rank passive: ' + s.rankPassive.name), text(s.rankPassive.desc)));
    if (s.maxRankSkill && (s.maxRankSkill.name || s.maxRankSkill.desc)) kids.push(el('div', { class: 'skill' }, el('h3', {}, 'Max-rank skill' + (s.maxRankSkill.name ? ': ' + s.maxRankSkill.name : '')), text(s.maxRankSkill.desc || '')));
    if (s.lrCells) kids.push(text('LR cells: ' + Object.entries(s.lrCells).map(([k, v]) => k.toUpperCase() + ' ' + (typeof v === 'object' ? (v.name || JSON.stringify(v)) : v)).join(' · '), 'muted'));
    kids.push(src(V.stats_source));
    const sec = el('section', { class: 'panel v2-stats' }, ...kids);
    const hero = main.querySelector('.detail-hero');
    if (hero) hero.after(sec); else main.append(sec);
  }

  /* ---------- Game rules (11-04): numbers straight from the game's tables ---------- */
  const TECH = [ // tier: [icon, value, what, mode, pick]  pick: B best, M max, 1 = Lv 1 only. Game text tid#S{tier}Tech*
    [['sword', '+30%', 'DMG', 'Chain', '1'], ['sword', '+30%', 'DMG', 'Conquest', '1'], ['shield', '-10%', 'DMG taken', 'Attr. Arena', '1']],
    [['people', '+15', 'Members', 'Org', 'M'], ['heart', '+50', 'Friend pts', 'Friends', '1']],
    [['bolt', '+20%', 'CRIT', 'World Boss', '1'], ['sword', '+20%', 'DMG', 'Weekly', 'M'], ['shield', '-30%', 'DMG taken', 'Endless Trial', 'M']],
    [['battery', '+50', 'Stamina cap', 'Free', 'M']],
    [['sword', '+15%', 'ATK', 'Force Chal.', '1'], ['pierce', '+15%', 'PEN', 'Weekly', '1'], ['sword', '+15%', 'DMG', 'Stronghold', 'M']],
    [['cube', '+3/day', 'Shard runs', 'Free', 'M'], ['ticket', '+3/day', 'Sweeps', 'Free', 'M']],
    [['sword', '+10%', 'DMG', 'RTA', '1'], ['star', '+15%', 'Stats', 'Endless Trial', 'M'], ['sword', '+15%', 'DMG', 'Force Chal.', '1']],
    [['bag', 'More', 'Org shop', 'Free', 'M']],
    [['sword', '+20%', 'DMG', 'Strong Enemy', '1'], ['bolt', '+30%', 'CRIT DMG', 'All PvE', 'M'], ['sword', '+10%', 'Top ATK', 'Weekly', '1']],
    [['wheel', '+2', 'Free spins', 'Potential', 'M']],
    [['sword', '+15%', 'DMG', 'Region Brk.', '1'], ['heart', '+20%', 'HP', 'Stronghold', 'M'], ['star', '+10%', 'Stats', 'Carnival', '1']],
    [['ticket', '+2', 'Attempts', 'Stronghold', 'B']],
    [['shield', '-15%', 'DMG taken', 'RTA', '1'], ['shield', '+15%', 'DEF', 'Stronghold', 'M']],
    [['star', '+10%', 'Stats', 'All PvE', 'M'], ['sword', '+15%', 'ATK', 'Stronghold', 'M']],
    [['people', '+9', 'Members', 'Org', 'M']],
    [['shield', '+5%', 'Block', 'RTA', '1'], ['shield', '-6.5%', 'DMG taken', 'Stronghold', 'M']],
    [['heart', '+20%', 'HP', 'Blockade', 'M'], ['sword', '+6%', 'DMG', 'Carnival', '1']],
    [['ticket', '+2', 'Attempts', 'Stronghold', 'B']],
    [['pierce', '+5%', 'PEN', 'RTA', '1'], ['shield', '+10%', 'Shields', 'All PvE', 'M']],
    [['shield', '-6%', 'DMG taken', 'Carnival', '1'], ['bolt', '+15%', 'CRIT DMG', 'Blockade', 'M']]];
  const ICP = { sword: '<path d="M14 3h7v7L9 22l-3-3L18 7"/><path d="M5 14l5 5M3 21l3-3"/>', shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>', heart: '<path d="M12 21s-8-5.5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 5.5-8 11-8 11z"/>', star: '<path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', pierce: '<path d="M2 12h16M14 7l5 5-5 5"/><path d="M21 4v16"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="9" r="2.5"/>', ticket: '<path d="M3 7h18v3a2 2 0 000 4v3H3v-3a2 2 0 000-4z"/><path d="M12 9v6"/>', battery: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 10v4M6 10v4M10 10v4"/>', bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 016 0v2"/>', wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>', cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12L3 7M12 12v10"/>' };
  const icon = n => { const i = el('i'); i.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">' + ICP[n] + '</svg>'; return i; };
  const TECH_GATE = { 7: 9, 9: 13, 11: 16, 14: 11, 17: 11 };
  const modeCls = m => /Stronghold/.test(m) ? 'sh' : /RTA|Arena|Carnival/.test(m) ? 'pvp' : /Free|Org|Friends|Potential/.test(m) ? 'ut' : 'pve';
  function rules() {
    title('GAME RULES', 'How the game actually works.', 'Every number on this page comes from the game\'s own data tables, not from guesses.');
    // 1. cards
    const hand = [[1, 3, 1], [2, 4, 2], [3, 5, 3], [4, 6, 4], [5, 7, 4]];
    main.append(panel(el('h2', {}, 'More characters alive = more cards'),
      el('div', { class: 'v2-hands' }, hand.map(([u, c, p]) => el('div', { class: 'v2-hcol v2-tilt' },
        el('div', { class: 'v2-hbar', style: '--h:' + c * 13 + '%' }, el('b', {}, c)), el('small', {}, u + ' alive'), el('small', { class: 'subtle' }, p + (p > 1 ? ' plays' : ' play'))))),
      text('Cards in your hand and plays per turn depend on how many of your characters are still alive. 4 plays is the max.', 'muted'),
      el('div', { class: 'notice' }, el('strong', {}, 'Does running fewer characters help? '), 'Not proven. You lose cards and plays, but your best units get all the cards, so you merge to Lv3 more often. It can pay off if your 4th and 5th units are weak. We are testing it with recorded matches.'),
      src('game data, Const.json BattlePlayerCardNum / BattlePlayerCardUseNum')));
    // 2. RTA
    main.append(panel(el('h2', {}, 'Real-Time Arena'),
      el('div', { class: 'mini-grid' },
        ...[['Open', '11:00–13:00 + 18:00–20:00', 'server time'], ['Turn timer', '40 s', 'then 30, 30, 30, 20, 15'], ['Sudden death', '+10% → +50%', 'damage from round 5 to round 10 (PvP)'], ['Win streak', '+1 / +2 / +3', 'at 2–3 / 4 / 5+ wins (arena table)']]
          .map(([a, b, c]) => el('div', { class: 'metric v2-tilt' }, el('small', {}, a), el('strong', {}, b), el('small', {}, c)))),
      el('ul', { class: 'list' }, el('li', {}, 'Beating someone ranked above you pays up to 1.3× points. Losing to them costs only 0.8×. Losing to someone below you costs up to 1.2×. So challenge up, not down.'),
        el('li', {}, 'Unlocks at Chain Campaign depth 75. One challenge comes back every hour; you can buy 10 more a day with Diamonds.'),
        el('li', {}, 'Points and rank reset on Monday from Sunday\'s finish.')),
      src('game data, Const.json ArenaRealBattleTime, ArenaRoundTimeList, PVPOverRoundDamageFactor, ArenaWinStreak, ArenaWinFactor; rule text Arena_RuleDesc_3_*')));
    // 3. Weekly Challenge calculator
    const w = Object.assign({ total: 50000000, best: 8000000, counter: 20000000, borrow: 0 }, store('weekly') || {});
    const wout = el('div', { class: 'v2-weeks' });
    const wcalc = () => {
      store('weekly', w);
      const base = 500 + w.total * 0.004 + w.best * 0.005 + w.counter * 0.0065;
      const pen = Math.max(0, 1 - 0.2 * w.borrow);
      wout.replaceChildren(el('div', { class: 'metric v2-tilt' }, el('small', {}, 'Base points'), el('strong', {}, fmt(base)), el('small', {}, 'before the difficulty bonus')),
        el('div', { class: 'metric v2-tilt' }, el('small', {}, 'After borrowing'), el('strong', {}, fmt(base * pen)), el('small', {}, w.borrow ? '-' + 20 * w.borrow + '% for ' + w.borrow + ' borrowed' : 'no borrowed units')),
        el('div', { class: 'metric v2-tilt' }, el('small', {}, 'Worth most'), el('strong', {}, 'Counter dmg'), el('small', {}, '0.0065 per damage vs 0.004')));
    };
    const wnum = (k, lbl, max) => field(lbl, el('input', { type: 'number', min: 0, max, value: w[k], inputmode: 'numeric', on: { input: e => { w[k] = Math.max(0, Math.min(max, +e.target.value || 0)); wcalc(); } } }));
    main.append(panel(el('h2', {}, 'Weekly Challenge: how points work'),
      text('Points = 500 + total damage × 0.004 + best single hit × 0.005 + damage from attacking the attribute you counter × 0.0065. Higher difficulty adds a percent on top. Each borrowed character takes 20% off. Beat it in 5 turns or it fails.', 'muted'),
      el('div', { class: 'flex' }, wnum('total', 'Total damage', 1e12), wnum('best', 'Best single hit', 1e12), wnum('counter', 'Counter-attribute damage', 1e12), wnum('borrow', 'Borrowed characters', 5)), wout,
      el('ul', { class: 'list' }, el('li', {}, 'Bring the attribute that counters the boss: that damage counts 1.6× more than plain damage.'), el('li', {}, 'One huge hit adds extra points, so save your biggest card for the boss\'s weakest moment.'), el('li', {}, 'Only your best run counts, and switching difficulty doesn\'t add runs together.')),
      src('game rule text UnionBattle_RuleDesc_* (Weekly Challenge)')));
    wcalc();
    // 4. Org Tech map
    const tiers = TECH.map((t, i) => el('div', { class: 'v2-tier' + (TECH_GATE[i + 1] ? ' gate' : '') },
      el('div', { class: 'v2-tn' }, 'T' + (i + 1)),
      el('div', { class: 'v2-tnodes' }, t.map(([ic, v, wh, m, p]) => el('div', { class: 'v2-tnode v2-tilt ' + modeCls(m) + ' p' + p },
        el('span', { class: 'v2-tag' }, p === 'B' ? 'BEST' : p === 'M' ? 'MAX' : 'Lv 1'), icon(ic), el('b', {}, v), el('small', {}, wh), el('em', {}, m)))),
      TECH_GATE[i + 1] ? el('div', { class: 'v2-tgate' }, '▲ next tier needs ' + TECH_GATE[i + 1] + ' total levels here') : null));
    main.append(panel(el('h2', {}, 'Org Tech: what to upgrade'),
      text('Gold = level it up. Faded = Lv 1 only, just to open the next tier. Red = best tech in the tree (+2 Stronghold attempts). Leaders: tap a tech and press Mark so members know what to research.', 'muted'),
      el('div', { class: 'v2-legend' }, [['sh', 'Stronghold'], ['pve', 'PvE'], ['pvp', 'PvP'], ['ut', 'Free stuff']].map(([c, n]) => el('span', {}, el('i', { class: 'v2-dot ' + c }), n))),
      el('div', { class: 'v2-tree' }, tiers),
      text('Each tier opens when every tech in the tier above is activated and the server is old enough (T5 = day 10 … T20 = day 230). You must be in the org 24 h before you can research.', 'subtle'),
      src('game text S01Tech–S20Tech, Unlock_UnionTechStage02–20, UnionTech_UI4 "Mark"')));
  }

  /* ---------- routing ---------- */
  const PAGES = { plan, stronghold, sim, rules };
  const NAMES = { plan: 'Gem planner', stronghold: 'Stronghold', sim: 'Battle replay', rules: 'Game rules' };
  const nav = document.getElementById('nav');
  const before = nav.querySelector('a[href="#spend"]');
  for (const [r, n] of Object.entries(NAMES)) nav.insertBefore(link(n, '#' + r, ''), before);
  /* Owner 11-04: 19 links in 3 rows was too busy. Keep 8 main links; the rest go under "More". */
  const MAIN = ['#home', '#start', '#best-teams', '#tiers', '#characters', '#bosses', '#stronghold', '#rules'];
  const drop = el('div', { class: 'nav-drop' });
  const moreBox = el('details', { class: 'nav-more' }, el('summary', {}, 'More'), drop);
  [...nav.querySelectorAll('a')].forEach(a => { if (!MAIN.includes(a.getAttribute('href'))) drop.append(a); });
  const srcLink = drop.querySelector('a[href="#sources"]'); if (srcLink) srcLink.textContent = 'Sources';
  nav.append(moreBox);
  drop.addEventListener('click', () => moreBox.removeAttribute('open'));
  document.addEventListener('click', e => { if (!moreBox.contains(e.target)) moreBox.removeAttribute('open'); });
  const mob = document.querySelector('.mobile-nav');
  if (mob) mob.insertBefore(el('a', { href: '#plan' }, 'Gems'), mob.children[3] || null);
  /* app.js render() calls after(r,id) once its own page is drawn (also for PAGES routes). */
  function after(r, id) {
    if (PAGES[r]) document.title = 'Tokyo Ghoul · ' + NAMES[r];
    if (r === 'hero' && id) statsPanel(id);
    if (r === 'home') homeTiles();
    const sm = document.querySelector('.nav-more summary');
    if (sm) sm.classList.toggle('on', !!document.querySelector('.nav-drop a.on'));
    tilt();
  }
  function homeTiles() {
    const head = [...main.querySelectorAll('.section-head')][1];
    if (!head || main.querySelector('.v2-new')) return;
    const tiles = el('div', { class: 'v2-new' }, [['plan', 'Gem planner', 'Free, VIP 5 or VIP 10: Diamonds in 1–4 weeks, and what to buy', '1155'], ['stronghold', 'Stronghold', 'Maps, what each building pays, what top orgs earn', '1012'], ['sim', 'Battle replay', 'Watch the simulator play a boss fight, card by card', '1174'], ['rules', 'Game rules', 'RTA numbers, Weekly Challenge points calculator, Org Tech map', '1180']]
      .map(([r, n, s, u]) => el('a', { href: '#' + r, class: 'portal v2-tilt v2-feature' }, image('assets/units/' + u + '.png', ''), el('span', { class: 'tag red' }, 'NEW'), el('strong', {}, n), el('small', {}, s))));
    head.before(el('div', { class: 'section-head' }, el('h2', {}, 'New in this update')), tiles);
  }

  /* ---------- the 3D look ---------- */
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tilt() {
    if (calm || document.body.classList.contains('data-first')) return;
    main.querySelectorAll('.character,.portal,.v2-tilt').forEach(n => {
      if (n.dataset.tilt) return; n.dataset.tilt = '1';
      n.addEventListener('pointermove', e => { const b = n.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; n.style.transform = 'perspective(700px) rotateY(' + x * 10 + 'deg) rotateX(' + (-y * 10) + 'deg) translateZ(6px)'; });
      n.addEventListener('pointerleave', () => { n.style.transform = ''; });
    });
  }
  if (!calm) {
    const bg = el('div', { class: 'v2-bg', 'aria-hidden': 'true' }, ['1168', '1155', '1174', '1180', '1103'].map((u, i) => el('img', { src: 'assets/units/' + u + '.png', alt: '', style: '--i:' + i, loading: 'lazy' })));
    document.body.prepend(bg);
    let raf = 0;
    addEventListener('pointermove', e => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; bg.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3)); bg.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3)); }); });
  }
  return { pages: PAGES, after };
} };
