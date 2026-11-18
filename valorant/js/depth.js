/* depth.js -- the shared "depth kit" for every page the Hub opens.
 *
 * ONE SOURCE: (local file) Pages that must work offline
 * (the game guides, the coach reports) carry a COPY written by
 * `py kit\sync.py`; `py kit\sync.py --check` fails if any copy is stale.
 * Edit this file, never a copy.
 *
 * What it adds, and nothing else:
 *   1. a fixed canvas BEHIND the page: a floor grid receding to a horizon
 *      plus a few drifting motes, tinted with the page's own accent;
 *   2. pointer parallax (--px/--py on <html>, -1..1) for any page that wants it;
 *   3. cards that lean toward the cursor with a soft glare in the accent;
 *   4. cards that rise in the first time they scroll into view.
 *
 * Configure on the script tag (all optional):
 *   data-accent="#7c9be0"          colour; default = first of --accent, --ai,
 *                                  --cc-accent, --teal found on :root
 *   data-tilt=".card,.tile"        which elements lean (small ones only)
 *   data-reveal=".card"            which elements rise in (default = data-tilt;
 *                                  "none" = the page animates its own)
 *   data-intensity="0.6"           0..1, how visible the backdrop is
 *   data-grid="off"                motes only, no floor grid
 *   data-surface=".app-shell"      full-page wrappers whose opaque background
 *                                  would hide the backdrop; moved onto <html>
 *
 * Rules it keeps: never blocks input (pointer-events:none), static for
 * prefers-reduced-motion, no tilt on touch, paused while the tab is hidden,
 * ~30 fps, and it never fails loud -- any error leaves the page as it was.
 */
(function () {
  'use strict';
  if (window.__depthKit) return;
  window.__depthKit = true;

  var me = document.currentScript || {};
  var ds = me.dataset || {};

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function parseColor(s) {
    s = (s || '').trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
      var n = parseInt(h, 16);
      return [n >> 16, (n >> 8) & 255, n & 255];
    }
    m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }

  function luminance(rgb) {
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  }

  ready(function () {
    try { init(); } catch (e) { /* the page works without us */ }
  });

  function init() {
    var root = document.documentElement, body = document.body;
    var rs = getComputedStyle(root);
    var accent = parseColor(ds.accent) ||
      ['--accent', '--ai', '--cc-accent', '--teal'].map(function (v) { return parseColor(rs.getPropertyValue(v)); })
        .filter(Boolean)[0] || [95, 199, 216];
    var A = accent.join(',');
    root.style.setProperty('--dk-accent', 'rgb(' + A + ')');
    root.style.setProperty('--dk-accent-rgb', A);

    var light, gridA, moteRGB, moved = [];

    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
    var intensity = Math.max(0, Math.min(1, parseFloat(ds.intensity || '0.6')));
    var gridOn = ds.grid !== 'off';

    /* Move the body's paint onto <html> so a z-index:-1 canvas can sit
       between the page background and the page content. Without this a body
       background (painted after negative layers) would hide the canvas.
       2026-10-02: this used to run ONCE, so a page that switched theme later
       kept the load-time ground (a light theme showed navy and its dark
       headings vanished; hit in the Study Hub and the Security+ app). It now
       re-runs whenever the page's theme attribute or class changes. */
    function movePaint() {
      moved.forEach(function (p) { root.style[p] = ''; });
      moved = [];
      body.style.background = '';
      var bs = getComputedStyle(body), rs = getComputedStyle(root);
      var bgc = parseColor(bs.backgroundColor);
      if (!bgc || /rgba\([^)]*,\s*0\)$/.test(bs.backgroundColor)) bgc = parseColor(rs.backgroundColor) || [16, 18, 22];
      light = luminance(bgc) > 0.55;
      gridA = (light ? 0.16 : 0.24) * intensity / 0.6;
      moteRGB = light ? A : '211,215,220';
      if (bs.backgroundImage !== 'none' || (bs.backgroundColor && !/rgba\([^)]*,\s*0\)$/.test(bs.backgroundColor) && bs.backgroundColor !== 'transparent')) {
        var props = ['backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundAttachment'];
        var htmlHas = rs.backgroundImage !== 'none' || !/rgba\([^)]*,\s*0\)$/.test(rs.backgroundColor);
        if (!htmlHas) props.forEach(function (p) { root.style[p] = bs[p]; moved.push(p); });
        else { root.style.backgroundColor = bs.backgroundColor; moved.push('backgroundColor'); }
        body.style.background = 'transparent';
      }
    }
    movePaint();
    var tPending = 0;
    new MutationObserver(function () {
      if (tPending) return;
      tPending = requestAnimationFrame(function () {
        tPending = 0; movePaint();
        try { if (W) draw(); } catch (e) { /* a still (reduced-motion) canvas repaints once here */ }
      });
    }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    root.style.minHeight = '100%';

    /* A full-page wrapper that paints its own opaque background (an app
       shell) would hide the canvas just like the body did. data-surface
       names those wrappers; their colour moves onto <html> the same way.
       Re-applied on DOM changes, because an app can remount its shell. */
    var surfSel = ds.surface || '';
    function adoptSurfaces() {
      if (!surfSel) return;
      document.querySelectorAll(surfSel).forEach(function (el) {
        if (el.__dkSurf) return;
        el.__dkSurf = 1;
        var c = getComputedStyle(el).backgroundColor;
        if (c && !/rgba\([^)]*,\s*0\)$/.test(c) && c !== 'transparent') root.style.backgroundColor = c;
        el.style.backgroundColor = 'transparent';
      });
    }
    adoptSurfaces();
    if (surfSel) {
      var sPending = 0;
      new MutationObserver(function () {
        if (sPending) return;
        sPending = requestAnimationFrame(function () { sPending = 0; adoptSurfaces(); });
      }).observe(body, { childList: true, subtree: true });
    }

    /* ---------- styles ---------- */
    var css =
      '#dk-depth{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}' +
      '.dk-tilt{transform:perspective(760px) rotateX(var(--dk-rx,0deg)) rotateY(var(--dk-ry,0deg));' +
      'transition:transform .18s ease-out,box-shadow .25s,border-color .2s;will-change:transform}' +
      /* :where() = zero specificity, so a page's own hover shadow wins. */
      ':where(.dk-tilt:hover){box-shadow:0 14px 34px -16px rgba(' + A + ',.55),0 0 0 1px rgba(' + A + ',.16) inset}' +
      '.dk-glare{position:relative}' +
      '.dk-glare::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .25s;' +
      'background:radial-gradient(240px 150px at var(--dk-mx,50%) var(--dk-my,50%),rgba(' + A + ',' + (light ? '.14' : '.2') + '),transparent 70%)}' +
      '.dk-glare:hover::after{opacity:1}' +
      '@keyframes dk-rise{from{opacity:0;transform:perspective(760px) translateY(12px) rotateX(7deg)}to{opacity:1}}' +
      '.dk-hide{opacity:0}' +
      '.dk-in{animation:dk-rise .55s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--dk-d,0ms)}' +
      '@media (prefers-reduced-motion:reduce){.dk-tilt{transform:none!important}.dk-in{animation:none}.dk-hide{opacity:1}}';
    var st = document.createElement('style');
    st.id = 'dk-style';
    st.textContent = css;
    document.head.appendChild(st);

    /* ---------- backdrop ---------- */
    var cv = document.createElement('canvas');
    cv.id = 'dk-depth';
    cv.setAttribute('aria-hidden', 'true');
    body.insertBefore(cv, body.firstChild);
    var cx = cv.getContext('2d');
    var W = 0, H = 0, px = 0, py = 0, tpx = 0, tpy = 0, scroll = 0, raf = 0, last = 0;
    var motes = [];
    for (var i = 0; i < 40; i++) motes.push({ x: Math.random(), y: Math.random(), z: [.35, .6, 1][i % 3], s: Math.random() });
    /* gridA and moteRGB are set by movePaint() above, and refreshed on a theme change. */

    function size() {
      var d = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      cx.setTransform(d, 0, 0, d, 0, 0);
    }

    function draw() {
      cx.clearRect(0, 0, W, H);
      var hz = H * .66 + py * 10, vx = W / 2 + px * 40;
      if (gridOn) {
        var fog = cx.createLinearGradient(0, hz, 0, H);
        fog.addColorStop(0, 'rgba(' + A + ',0)');
        fog.addColorStop(1, 'rgba(' + A + ',' + gridA.toFixed(3) + ')');
        cx.strokeStyle = fog; cx.lineWidth = 1; cx.beginPath();
        for (var r = -14; r <= 14; r++) {
          var bx = vx + r * W / 9;
          cx.moveTo(vx + (bx - vx) * .02, hz); cx.lineTo(bx, H);
        }
        for (var k = 0; k < 14; k++) {
          var z = ((k + scroll) % 14) / 14, y = hz + (H - hz) * z * z * z;
          cx.moveTo(0, y); cx.lineTo(W, y);
        }
        cx.stroke();
        var hg = cx.createRadialGradient(vx, hz, 0, vx, hz, W * .45);
        hg.addColorStop(0, 'rgba(' + A + ',' + (0.07 * intensity / 0.6).toFixed(3) + ')');
        hg.addColorStop(1, 'rgba(' + A + ',0)');
        cx.fillStyle = hg; cx.fillRect(0, hz - H * .3, W, H * .6);
      }
      motes.forEach(function (p) {
        var x = p.x * W + px * 30 * p.z, y = p.y * H + py * 18 * p.z;
        var a = (.06 + .2 * p.z) * (.6 + .4 * Math.sin(p.s * 6.28 + scroll)) * intensity / 0.6;
        cx.fillStyle = 'rgba(' + moteRGB + ',' + a.toFixed(3) + ')';
        cx.fillRect(x, y, 1.4 * p.z + .4, 1.4 * p.z + .4);
      });
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (ts - last < 33) return;
      var dt = last ? Math.min(.1, (ts - last) / 1000) : 0;
      last = ts;
      px += (tpx - px) * .06; py += (tpy - py) * .06;
      scroll = (scroll + dt * .35) % 14;
      motes.forEach(function (p) { p.y -= dt * .006 * p.z; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); } });
      draw();
    }

    function start() {
      cancelAnimationFrame(raf); last = 0;
      if (still || document.hidden) { draw(); return; }
      raf = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', start);
    window.addEventListener('resize', function () { size(); draw(); });
    size(); start();

    /* ---------- tilt + glare ---------- */
    var tiltSel = ds.tilt || '';
    var revealSel = ds.reveal === 'none' ? '' : (ds.reveal || tiltSel);

    function small(el) {
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.width <= 560 && r.height <= 340;
    }

    function prep(el) {
      if (el.__dk) return;
      el.__dk = 1;
      if (!small(el)) return;
      el.classList.add('dk-tilt');
      var after = getComputedStyle(el, '::after').content;
      if (!after || after === 'none' || after === 'normal') el.classList.add('dk-glare');
    }

    if (!still && fine) {
      window.addEventListener('pointermove', function (e) {
        tpx = e.clientX / innerWidth * 2 - 1; tpy = e.clientY / innerHeight * 2 - 1;
        root.style.setProperty('--px', tpx.toFixed(3));
        root.style.setProperty('--py', tpy.toFixed(3));
      }, { passive: true });
    }

    if (tiltSel && !still && fine) {
      var cur = null;
      document.addEventListener('pointermove', function (e) {
        var t = e.target && e.target.closest ? e.target.closest(tiltSel) : null;
        if (t) prep(t);
        if (t && !t.classList.contains('dk-tilt')) t = null;
        if (cur && cur !== t) { cur.style.setProperty('--dk-rx', '0deg'); cur.style.setProperty('--dk-ry', '0deg'); }
        cur = t;
        if (!t) return;
        var r = t.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        t.style.setProperty('--dk-ry', ((x - .5) * 7).toFixed(2) + 'deg');
        t.style.setProperty('--dk-rx', ((.5 - y) * 9).toFixed(2) + 'deg');
        t.style.setProperty('--dk-mx', (x * 100).toFixed(1) + '%');
        t.style.setProperty('--dk-my', (y * 100).toFixed(1) + '%');
      }, { passive: true });
      document.addEventListener('pointerleave', function () {
        if (cur) { cur.style.setProperty('--dk-rx', '0deg'); cur.style.setProperty('--dk-ry', '0deg'); cur = null; }
      });
    }

    /* ---------- rise-in, once per element ---------- */
    if (revealSel && !still && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        var n = 0;
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          io.unobserve(el);
          el.style.setProperty('--dk-d', Math.min(n++, 12) * 30 + 'ms');
          el.classList.remove('dk-hide');
          el.classList.add('dk-in');
          el.addEventListener('animationend', function () { el.classList.remove('dk-in'); }, { once: true });
        });
      }, { rootMargin: '0px 0px -40px 0px' });
      var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
      function scan() {
        document.querySelectorAll(revealSel).forEach(function (el) {
          if (seen && seen.has(el)) return;
          if (seen) seen.add(el);
          var r = el.getBoundingClientRect();
          if (r.top > innerHeight) el.classList.add('dk-hide');   // only below the fold; what you see first is never hidden
          io.observe(el);
        });
      }
      scan();
      /* Guides render their lists in JS; pick up new cards as they appear. */
      var pending = 0;
      new MutationObserver(function () {
        if (pending) return;
        pending = requestAnimationFrame(function () { pending = 0; scan(); });
      }).observe(body, { childList: true, subtree: true });
    }
  }
})();
