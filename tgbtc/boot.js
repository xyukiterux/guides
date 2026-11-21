/* Boot: the data loader and the language layer. Loaded first.

   Data. The guide's data is split into small scripts under d/ (written by build.py). d/core.js is loaded with the page;
   every other piece is added by TG_LOAD(names) when a page needs it. Each piece calls TGDATA_ADD, which merges it into
   window.TGDATA. Script tags are used (not fetch) so the guide also opens from a local file.

   Language. English is the source of truth; Português (Brasil) and Español are offered.
   - The guide's prose is translated at build time: every g-* piece and the core have a .pt.js and .es.js copy.
   - Fixed interface strings are translated by i18n.table.js (exact-match table plus patterns for built sentences),
     loaded only in PT/ES. A MutationObserver applies them to every text node and to placeholder / aria-label / title /
     alt, so the app keeps rendering English and nothing is injected as HTML.
   - Character names, [version tags], numbers and URLs are never in the table, so they never change. */
'use strict';
(() => {
const LANGS = ['en', 'pt', 'es'], KEY = 'tgbtc-lang';
const NAMES = {en: 'English', pt: 'Português', es: 'Español'};
const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const write = v => { try { localStorage.setItem(KEY, v); return true; } catch (e) { return false; } };
let lang = LANGS.includes(read()) ? read() : 'en';
document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;

/* ---------- data loader ---------- */
const DATA = window.TGDATA = window.TGDATA || {};
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
function merge(into, part) { for (const k in part) { if (plain(part[k]) && plain(into[k])) merge(into[k], part[k]); else into[k] = part[k]; } }
window.TGDATA_ADD = (name, part) => { merge(DATA, part); };
const pending = new Map();
function script(src) {
 if (!pending.has(src)) pending.set(src, new Promise((ok, fail) => {
  const s = document.createElement('script'); s.src = src; s.async = false;
  s.onload = () => ok(); s.onerror = () => { pending.delete(src); fail(Error('Could not load ' + src)); };
  document.head.append(s);
 }));
 return pending.get(src);
}
/* Guide text (g-*, core, d-search) has a copy per language; the English copy is the fallback when one is missing. */
const localized = n => lang !== 'en' && /^(g-|core$|d-search$)/.test(n);
const piece = n => 'd/' + n + (localized(n) ? '.' + lang : '') + '.js';
window.TG_LOAD = names => Promise.all(names.map(n => script(piece(n)).catch(e => { if (!localized(n)) throw e; return script('d/' + n + '.js'); })));
window.TG_SCRIPT = script;

/* ---------- language layer ---------- */
const D = new Map();
let P = [];
function tr(s) {
 if (lang === 'en' || !s) return s;
 const hit = D.get(s); if (hit !== undefined) return hit;
 for (const [re, a, b] of P) {
  const m = re.exec(s); if (!m) continue;
  const f = typeof a === 'function' ? a : (lang === 'pt' ? a : b);
  return typeof f === 'function' ? f(m, tr) : f.replace(/([$%])(\d)/g, (_, k, i) => k === '$' ? (m[i] || '') : tr(m[i] || ''));
 }
 return s;
}
const SKIP = 'script,style,textarea,.lang-switch,.lang-offer,.uname,[data-no-i18n]';
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const done = new WeakMap();
function textNode(n) {
 const v = n.nodeValue; if (done.get(n) === v) return;
 const s = v.trim(); if (!s || !/[A-Za-z]/.test(s)) return;
 const p = n.parentElement; if (p && p.closest(SKIP)) return;
 const out = tr(s);
 if (out !== s) { const nv = v.replace(s, () => out); done.set(n, nv); n.nodeValue = nv; } else done.set(n, v);
}
const SKIP_ATTR = '.lang-switch,.lang-offer,.uname,[data-no-i18n]';
function element(e) {
 if (e.closest(SKIP_ATTR)) return;
 for (const a of ATTRS) { const v = e.getAttribute(a); if (v && /[A-Za-z]/.test(v)) { const out = tr(v); if (out !== v) e.setAttribute(a, out); } }
}
function walk(root) {
 if (root.nodeType === 3) return textNode(root);
 if (root.nodeType !== 1) return;
 element(root);
 const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
 while ((n = w.nextNode())) n.nodeType === 3 ? textNode(n) : element(n);
}
function observe() {
 walk(document.head.querySelector('title') || document.head); walk(document.body);
 new MutationObserver(ms => { for (const m of ms) {
  if (m.type === 'characterData') textNode(m.target);
  else if (m.type === 'attributes') element(m.target);
  else m.addedNodes.forEach(walk);
 } }).observe(document.documentElement, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS});
}

function choose(v) { write(v); if (v !== lang) location.reload(); }
function switcher(cls) {
 const box = document.createElement('div'); box.className = 'lang-switch ' + cls; box.setAttribute('role', 'group');
 box.setAttribute('aria-label', lang === 'en' ? 'Language' : D.get('Language') || 'Language');
 for (const l of LANGS) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = l.toUpperCase(); b.lang = l === 'pt' ? 'pt-BR' : l;
  b.title = NAMES[l]; b.setAttribute('aria-label', NAMES[l]); b.setAttribute('aria-pressed', String(l === lang)); b.dataset.lang = l;
  b.addEventListener('click', () => choose(l)); box.append(b);
 }
 return box;
}
/* Offered once, on a first visit from a Portuguese or Spanish browser. Either answer is remembered. */
function offer() {
 if (read() !== null) return;
 const nav = String((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
 const want = nav.startsWith('pt') ? 'pt' : nav.startsWith('es') ? 'es' : null;
 if (!want) return;
 const bar = document.createElement('div'); bar.className = 'lang-offer'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', NAMES[want]); bar.lang = want === 'pt' ? 'pt-BR' : 'es';
 const q = document.createElement('p'); q.textContent = want === 'pt' ? 'Ver em português?' : '¿Ver en español?';
 const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'primary'; yes.textContent = want === 'pt' ? 'Sim, português' : 'Sí, español';
 const no = document.createElement('button'); no.type = 'button'; no.textContent = 'No, English'; no.lang = 'en';
 yes.addEventListener('click', () => choose(want));
 no.addEventListener('click', () => { write('en'); bar.remove(); });
 bar.append(q, yes, no);
 const header = document.querySelector('header'); if (header) header.after(bar); else document.body.prepend(bar);
}
function mountUI() {
 for (const slot of document.querySelectorAll('[data-lang-slot]')) slot.replaceChildren(switcher(slot.dataset.langSlot));
 offer();
}

/* app.js starts through ready(): in PT/ES it first waits for the interface table and the translated core. */
function ready(start) {
 const go = () => { try { mountUI(); } catch (e) { console.error(e); } if (lang !== 'en') observe(); start(); };
 if (lang === 'en') return go();
 Promise.all([script('i18n.table.js'), script('d/core.' + lang + '.js')]).then(() => {
  const t = window.TGI18N_TABLE(lang, tr), col = lang === 'pt' ? 1 : 2;
  for (const r of t.T) if (r) D.set(r[0], r[col]);
  P = t.P;
  const extra = DATA.strings || {}; for (const k in extra) if (!D.has(k)) D.set(k, extra[k]);
  go();
 }).catch(e => { console.error(e); lang = 'en'; document.documentElement.lang = 'en'; D.clear(); P = []; go(); });
}
window.TGI18N = {get lang() { return lang; }, t: tr, ready, choose, mountUI};
})();
