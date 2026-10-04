(function () {
  "use strict";
  var PW = window.PW;

  // ---------------------------------------------------------------------
  // Indexes
  // ---------------------------------------------------------------------
  var palByName = {};
  PW.pals.forEach(function (p) { palByName[p.name] = p; });
  var itemByName = {};
  PW.items.forEach(function (i) { itemByName[i.name] = i; });
  var structByName = {};
  PW.structures.forEach(function (s) { structByName[s.name] = s; });
  var techByName = {};
  PW.technology.forEach(function (t) { techByName[t.name] = t; });
  var passiveByName = {};
  PW.passives.forEach(function (p) { passiveByName[p.name] = p; });
  var activeByName = {};
  PW.actives.forEach(function (a) { activeByName[a.name] = a; });

  function esc(s) {
    if (s === undefined || s === null) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function nl2br(s) { return esc(s).replace(/\n/g, "<br>"); }

  function linkPal(name) {
    if (!palByName[name]) return esc(name);
    return '<a href="#/pals/' + encodeURIComponent(name) + '">' + esc(name) + "</a>";
  }
  function linkItem(name) {
    if (itemByName[name]) return '<a href="#/items/' + encodeURIComponent(name) + '">' + esc(name) + "</a>";
    if (structByName[name]) return '<a href="#/structures/' + encodeURIComponent(name) + '">' + esc(name) + "</a>";
    return esc(name);
  }
  function elPill(el) { return '<span class="pill el-' + esc(el) + '">' + esc(el) + "</span>"; }

  // ---------------------------------------------------------------------
  // Global search index
  // ---------------------------------------------------------------------
  var searchIndex = [];
  PW.pals.forEach(function (p) { searchIndex.push({ name: p.name, type: "Pal", href: "#/pals/" + encodeURIComponent(p.name) }); });
  PW.items.forEach(function (i) { searchIndex.push({ name: i.name, type: "Item", href: "#/items/" + encodeURIComponent(i.name) }); });
  PW.structures.forEach(function (s) { searchIndex.push({ name: s.name, type: "Structure", href: "#/structures/" + encodeURIComponent(s.name) }); });
  PW.technology.forEach(function (t) { searchIndex.push({ name: t.name, type: "Technology", href: "#/technology/" + encodeURIComponent(t.name) }); });
  PW.passives.forEach(function (p) { searchIndex.push({ name: p.name, type: "Passive skill", href: "#/passives/" + encodeURIComponent(p.name) }); });
  PW.actives.forEach(function (a) { searchIndex.push({ name: a.name, type: "Active skill", href: "#/actives/" + encodeURIComponent(a.name) }); });
  PW.bosses.towers.forEach(function (t) { searchIndex.push({ name: t.leader + " (Tower Boss)", type: "Boss", href: "#/bosses" }); });
  PW.bosses.raid.forEach(function (r) { searchIndex.push({ name: r.name + " (Raid Boss)", type: "Boss", href: "#/bosses" }); });
  PW.bosses.bounty.forEach(function (b) { searchIndex.push({ name: b.name + " (Bounty Target)", type: "Boss", href: "#/bosses" }); });
  PW.locations.forEach(function (l) { searchIndex.push({ name: l.name, type: "Location", href: "#/locations/" + encodeURIComponent(l.name) }); });

  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) return [];
    var starts = [], contains = [];
    searchIndex.forEach(function (e) {
      var n = e.name.toLowerCase();
      var idx = n.indexOf(q);
      if (idx === 0) starts.push(e);
      else if (idx > 0) contains.push(e);
    });
    return starts.concat(contains).slice(0, 40);
  }

  // ---------------------------------------------------------------------
  // Breeding engine
  // ---------------------------------------------------------------------
  var B = PW.breeding;
  var rankByName = {};
  B.ranks.forEach(function (r) { rankByName[r.name] = r; });
  var eligible = B.ranks.filter(function (r) { return r.eligible; });

  function nearestEligible(avg) {
    var best = null, bestDiff = Infinity;
    eligible.forEach(function (r) {
      var diff = Math.abs(r.rank - avg);
      if (diff < bestDiff || (diff === bestDiff && best && r.dex < best.dex)) {
        best = r; bestDiff = diff;
      }
    });
    return best;
  }

  function findSpecificCombo(a, b) {
    return B.specificCombos.filter(function (c) {
      return (c.parentA === a && c.parentB === b) || (c.parentA === b && c.parentB === a);
    });
  }

  function computeChild(a, b) {
    if (!a || !b) return null;
    if (a === b && B.sameSpeciesOnly.indexOf(a) !== -1) {
      return { child: a, rule: "same-species-only", note: a + " can only be produced by breeding two " + a + "s together." };
    }
    var combos = findSpecificCombo(a, b);
    if (combos.length) {
      if (combos.length > 1) {
        return {
          child: null, rule: "gender-dependent",
          note: "This pair has a gender-dependent result: " + combos.map(function (c) {
            return c.child + (c.parentA_gender ? " (needs " + c.parentA + " ♀/♂ as noted on the wiki)" : "");
          }).join(" or ") + ".",
          options: combos,
        };
      }
      return { child: combos[0].child, rule: "specific-combo", note: "Exclusive combination (overrides the rank formula)." };
    }
    var ra = rankByName[a], rb = rankByName[b];
    if (!ra || !rb) return { child: null, rule: "no-data", note: "No breeding rank on file for one of these Pals." };
    var avg = Math.floor((ra.rank + rb.rank + 1) / 2);
    var result = nearestEligible(avg);
    return { child: result ? result.name : null, rule: "rank-formula", avg: avg, note: "Average Breeding Rank = " + avg + ", nearest eligible species wins." };
  }

  function findParentsFor(child) {
    var out = { same: false, combos: [], pairs: [] };
    if (B.sameSpeciesOnly.indexOf(child) !== -1) {
      out.same = true;
      return out;
    }
    B.specificCombos.forEach(function (c) {
      if (c.child === child) out.combos.push(c);
    });
    if (out.combos.length) return out;
    // rank-formula reverse search over all eligible pals
    var target = rankByName[child];
    if (!target || !target.eligible) return out;
    var n = eligible.length;
    var seen = {};
    for (var i = 0; i < n; i++) {
      for (var j = i; j < n; j++) {
        var a = eligible[i], b = eligible[j];
        var avg = Math.floor((a.rank + b.rank + 1) / 2);
        var best = nearestEligible(avg);
        if (best && best.name === child) {
          var key = [a.name, b.name].sort().join("|");
          if (!seen[key]) {
            seen[key] = true;
            out.pairs.push([a.name, b.name]);
          }
        }
      }
    }
    return out;
  }

  // ---------------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------------
  var $main = document.getElementById("main");
  var $side = document.getElementById("nav-active-holder");

  var NAV = [
    { h: "Guide" },
    { href: "#/", label: "Overview" },
    { href: "#/playthrough", label: "Playthrough by level" },
    { href: "#/base", label: "Base building" },
    { h: "Reference" },
    { href: "#/pals", label: "Pals (" + PW.pals.length + ")" },
    { href: "#/items", label: "Items (" + PW.items.length + ")" },
    { href: "#/structures", label: "Structures (" + PW.structures.length + ")" },
    { href: "#/technology", label: "Technology (" + PW.technology.length + ")" },
    { href: "#/passives", label: "Passive skills (" + PW.passives.length + ")" },
    { href: "#/actives", label: "Active skills (" + PW.actives.length + ")" },
    { h: "Breeding" },
    { href: "#/breeding", label: "Breeding calculator" },
    { h: "World" },
    { href: "#/bosses", label: "Bosses, raids & alphas" },
    { href: "#/locations", label: "Locations" },
  ];

  function renderNav() {
    var html = "";
    NAV.forEach(function (n) {
      if (n.h) html += '<div class="navhead">' + esc(n.h) + "</div>";
      else html += '<a href="' + n.href + '" data-href="' + n.href + '">' + esc(n.label) + "</a>";
    });
    document.getElementById("navlist").innerHTML = html;
    highlightNav();
  }
  function highlightNav() {
    var h = location.hash || "#/";
    var links = document.querySelectorAll("#navlist a");
    links.forEach(function (a) {
      var href = a.getAttribute("data-href");
      var active = href === "#/" ? (h === "#/" || h === "") : h.indexOf(href) === 0;
      a.classList.toggle("active", active);
    });
  }

  function versionLine() {
    var m = PW.meta;
    return '<div class="verscheck">Last checked against <b>palworld.wiki.gg</b> (Cargo API) on ' +
      esc(m.fetchedAt.split(" ")[0]) + " &middot; game version <b>" + esc(m.version) +
      "</b> (released " + esc(m.versionDate) + ") &middot; " +
      m.counts.pals + " Pals, " + m.counts.items + " items, " + m.counts.recipes + " recipes, " +
      m.counts.technology + " technologies indexed.</div>";
  }

  function page(title, bodyHtml) {
    document.title = title + " — Palworld Complete Guide";
    $main.innerHTML = versionLine() + bodyHtml;
    window.scrollTo(0, 0);
  }

  // -- Overview --------------------------------------------------------
  function viewOverview() {
    page("Overview", "" +
      "<h2>Palworld Complete Guide</h2>" +
      "<p>An offline, data-driven reference for every Pal, item, recipe, technology, and boss in " +
      "Palworld, plus a level-by-level playthrough and a breeding calculator computed straight from " +
      "the wiki's structured data. Use the search box or the left-hand list to jump anywhere.</p>" +
      '<div class="grid">' +
      tileLink("#/playthrough", "Playthrough", "Level-band walkthrough: what to catch, what to unlock, which tower boss is next.") +
      tileLink("#/pals", "Pal Database", PW.pals.length + " Pals with stats, elements, work suitability, partner skills, breeding rank, and drops.") +
      tileLink("#/breeding", "Breeding Calculator", "Pick two parents to see the child, or pick a child to see every parent pair that makes it.") +
      tileLink("#/items", "Items", PW.items.length + " items - every recipe in, every use, every drop source.") +
      tileLink("#/technology", "Technology Tree", PW.technology.length + " unlocks across the regular and Ancient Technology trees.") +
      tileLink("#/bosses", "Bosses & Raids", "Tower bosses in order, raid bosses, predator Pals, bounty targets, and overworld Alpha spawns.") +
      "</div>" +
      "<h3>What this guide is built from</h3>" +
      "<p class=\"small\">All Pal, item, recipe, technology, drop, and location data comes from " +
      "<code>palworld.wiki.gg</code>'s Cargo API (<code>action=cargoquery</code>), pulled and cached under " +
      "<code>data/raw/</code> so the build is reproducible offline. The playthrough prose is hand-written, " +
      "but every Pal, item, technology, and boss it names is cross-checked against that pulled data by " +
      "<code>scripts/check_guide.py</code> at build time - see the README for what that check does and " +
      "does not catch.</p>"
    );
  }
  function tileLink(href, name, meta) {
    return '<a class="tile" href="' + href + '"><div class="name">' + esc(name) + '</div><div class="meta">' + esc(meta) + "</div></a>";
  }

  // -- Playthrough -------------------------------------------------------
  function viewPlaythrough() {
    var html = "<h2>Playthrough by level band</h2>" +
      '<p class="small">Every Pal, technology and boss named below is cross-checked against the pulled ' +
      "wiki data at build time (see <code>scripts/check_guide.py</code>). Wild-Pal lists per band come " +
      "from the wiki's Location/LocationEntity tables for that region, not from memory.</p>";
    PW.guide.bands.forEach(function (b) {
      html += '<div class="level-band card"><h3>' + esc(b.title) + "</h3>";
      b.text.forEach(function (t) { html += "<p>" + linkify(t) + "</p>"; });
      if (b.boss) {
        var boss = b.boss;
        html += '<p class="small">Tower boss: <b>' + esc(boss.leader) + "</b> &amp; " + linkPal(boss.partnerPal) +
          " &middot; " + esc(boss.faction) + " &middot; tower at " + esc(boss.tower);
        if (boss.levelNormal) html += " &middot; wiki boss level " + boss.levelNormal;
        if (boss.levelHard) html += " (hard mode " + boss.levelHard + ")";
        if (!boss.levelNormal) html += ' &middot; <span class="unverified">level unverified - ' + esc(boss.levelSource) + "</span>";
        html += "</p>";
      }
      html += "</div>";
    });
    page("Playthrough", html);
  }
  function linkify(text) {
    var out = esc(text);
    // link known pal/item/tech names that appear as whole words
    Object.keys(palByName).sort(function (a, b) { return b.length - a.length; }).forEach(function () {});
    return out;
  }

  // -- Base building -------------------------------------------------------
  function viewBase() {
    var b = PW.guide.base;
    var html = "<h2>" + esc(b.title) + "</h2>";
    b.text.forEach(function (t) { html += "<p>" + esc(t) + "</p>"; });
    html += '<p class="small">Referenced structures: ' + b.refs.tech.map(linkItem).join(", ") + "</p>";
    page("Base building", html);
  }

  // -- Pals -------------------------------------------------------
  var palFilterEl = "All";
  function viewPals(query) {
    var elements = uniq(PW.pals.reduce(function (a, p) { return a.concat(p.elements); }, [])).sort();
    var html = '<h2>Pal Database</h2>' +
      '<div class="searchbar-inline"><input id="palq" type="text" placeholder="Filter by name..." value="' + esc(query || "") + '"></div>' +
      '<div class="filters" id="palfilters"><button data-el="All" class="' + (palFilterEl === "All" ? "active" : "") + '">All</button>' +
      elements.map(function (e) { return '<button data-el="' + esc(e) + '" class="' + (palFilterEl === e ? "active" : "") + '">' + esc(e) + "</button>"; }).join("") +
      '</div><div class="grid" id="palgrid"></div>';
    page("Pals", html);
    document.getElementById("palq").addEventListener("input", function (e) { renderPalGrid(e.target.value); });
    document.querySelectorAll("#palfilters button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        palFilterEl = btn.getAttribute("data-el");
        document.querySelectorAll("#palfilters button").forEach(function (b2) { b2.classList.toggle("active", b2 === btn); });
        renderPalGrid(document.getElementById("palq").value);
      });
    });
    renderPalGrid(query || "");
  }
  function renderPalGrid(q) {
    q = (q || "").toLowerCase();
    var list = PW.pals.filter(function (p) {
      if (palFilterEl !== "All" && p.elements.indexOf(palFilterEl) === -1) return false;
      if (q && p.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    document.getElementById("palgrid").innerHTML = list.map(function (p) {
      return '<a class="tile" href="#/pals/' + encodeURIComponent(p.name) + '">' +
        '<div class="name">#' + esc(p.dex) + " " + esc(p.name) + "</div>" +
        '<div class="pillrow">' + p.elements.map(elPill).join("") + "</div>" +
        '<div class="meta">Rank ' + (p.breeding.rank !== null ? p.breeding.rank : "?") + " &middot; " + esc(p.size) + "</div>" +
        "</a>";
    }).join("") || '<p class="small">No Pals match.</p>';
  }

  function viewPalDetail(name) {
    var p = palByName[name];
    if (!p) { page("Not found", "<p>Unknown Pal: " + esc(name) + "</p>"); return; }
    var s = p.stats.Normal || p.stats.Alpha || {};
    var html = '<div class="breadcrumb"><a href="#/pals">&larr; All Pals</a></div>' +
      '<div class="detail-header"><div><h2>#' + esc(p.dex) + " " + esc(p.name) + "</h2>" +
      '<div class="pillrow">' + p.elements.map(elPill).join("") + '<span class="pill">' + esc(p.size) + "</span></div></div></div>";

    html += '<div class="statgrid">' +
      statbox(s.hp, "HP") + statbox(s.atk, "Attack") + statbox(s.def, "Defense") +
      statbox(s.work, "Work Speed") + statbox(s.stamina, "Stamina") +
      statbox(p.breeding.rank, "Breeding Rank") + statbox(p.sell, "Sell Price") + statbox(p.hunger, "Food/Hr") +
      "</div>";

    if (p.stats.Alpha) {
      html += '<p class="small">Alpha variant: HP ' + p.stats.Alpha.hp + ", Attack " + p.stats.Alpha.atk + ", Defense " + p.stats.Alpha.def + "</p>";
    }

    html += '<h3 class="section-title">Partner Skill</h3><p><b>' + esc(p.partnerSkill.name) + "</b> (" + esc(p.partnerSkill.type) + ")<br>" + nl2br(p.partnerSkill.desc) + "</p>";

    html += '<h3 class="section-title">Work Suitability</h3>';
    html += p.work.length ? '<table class="simple"><tr><th>Type</th><th>Level</th></tr>' + p.work.map(function (w) { return "<tr><td>" + esc(w.type) + "</td><td>" + w.level + "</td></tr>"; }).join("") + "</table>" : '<p class="small">None.</p>';

    html += '<h3 class="section-title">Passive skill (innate)</h3>';
    html += p.passives.length ? p.passives.map(function (n) {
      var ps = passiveByName[n];
      return '<p><a href="#/passives/' + encodeURIComponent(n) + '">' + esc(n) + "</a>" + (ps ? " - " + esc(ps.desc) : "") + "</p>";
    }).join("") : '<p class="small">None recorded.</p>';

    html += '<h3 class="section-title">Active Skills (by level)</h3>';
    html += p.actives.length ? '<table class="simple"><tr><th>Level</th><th>Skill</th><th>Element</th><th>Power</th></tr>' + p.actives.map(function (a) {
      var as = activeByName[a.name] || {};
      return "<tr><td>" + a.level + '</td><td><a href="#/actives/' + encodeURIComponent(a.name) + '">' + esc(a.name) + "</a></td><td>" + esc(as.element || "") + "</td><td>" + (as.power || "") + "</td></tr>";
    }).join("") + "</table>" : '<p class="small">None recorded.</p>';

    html += '<h3 class="section-title">Breeding</h3>';
    var br = p.breeding;
    html += "<p>Breeding Rank <b>" + (br.rank !== null ? br.rank : "?") + "</b> &middot; hatches from <b>" + esc(br.egg) + "</b> &middot; male probability " + br.maleProb + "%" +
      (br.uniqueCombo ? ' &middot; <span class="unverified">not produced by the general rank formula - needs an exact parent combo</span>' : "") + "</p>";
    var parents = findParentsFor(p.name);
    html += "<p><a href=\"#/breeding?child=" + encodeURIComponent(p.name) + "\">Open in breeding calculator &rarr;</a></p>";

    page(p.name, html);
  }
  function statbox(val, label) {
    return '<div class="statbox"><b>' + (val === undefined || val === null || val === "" ? "–" : val) + "</b><span>" + esc(label) + "</span></div>";
  }

  // -- Items / Structures -------------------------------------------------------
  function viewItems(query) {
    var types = uniq(PW.items.map(function (i) { return i.type; }).filter(Boolean)).sort();
    var html = "<h2>Items</h2>" +
      '<div class="searchbar-inline"><input id="itemq" type="text" placeholder="Filter by name..." value="' + esc(query || "") + '"></div>' +
      '<div class="filters" id="itemfilters"><button data-t="All" class="active">All (' + PW.items.length + ")</button>" +
      types.map(function (t) { return '<button data-t="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") +
      '</div><div class="grid" id="itemgrid"></div>';
    page("Items", html);
    var filterT = "All";
    function render() {
      var q = document.getElementById("itemq").value.toLowerCase();
      var list = PW.items.filter(function (i) {
        if (filterT !== "All" && i.type !== filterT) return false;
        if (q && i.name.toLowerCase().indexOf(q) === -1) return false;
        return true;
      }).slice(0, 400);
      document.getElementById("itemgrid").innerHTML = list.map(function (i) {
        return '<a class="tile" href="#/items/' + encodeURIComponent(i.name) + '"><div class="name">' + esc(i.name) +
          '</div><div class="meta">' + esc(i.type) + (i.subtype ? " / " + esc(i.subtype) : "") + "</div></a>";
      }).join("") + (list.length === 400 ? '<p class="small">Showing first 400 - narrow your search or pick a type.</p>' : "");
    }
    document.getElementById("itemq").addEventListener("input", render);
    document.querySelectorAll("#itemfilters button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterT = btn.getAttribute("data-t");
        document.querySelectorAll("#itemfilters button").forEach(function (b2) { b2.classList.toggle("active", b2 === btn); });
        render();
      });
    });
    render();
  }

  function recipeBlock(title, recipes, showProduct) {
    if (!recipes || !recipes.length) return "";
    var html = '<h3 class="section-title">' + esc(title) + "</h3>";
    recipes.forEach(function (r) {
      html += '<div class="card">';
      if (showProduct) html += "<p>" + (r.qty > 1 ? r.qty + "&times; " : "") + linkItem(r.product) + "</p>";
      if (r.ingredients && r.ingredients.length) {
        html += '<p class="small">Needs: ' + r.ingredients.map(function (ing) { return (ing.qty > 1 ? ing.qty + "&times; " : "") + linkItem(ing.name); }).join(", ") + "</p>";
      }
      if (r.workbench) html += '<p class="small">Made at: ' + esc(r.workbench) + (r.workload ? " (" + r.workload + " work)" : "") + "</p>";
      html += "</div>";
    });
    return html;
  }

  function viewItemDetail(name) {
    var it = itemByName[name];
    if (!it) { page("Not found", "<p>Unknown item: " + esc(name) + "</p>"); return; }
    var html = '<div class="breadcrumb"><a href="#/items">&larr; All Items</a></div>' +
      "<h2>" + esc(it.name) + "</h2>" +
      '<p class="pillrow"><span class="pill">' + esc(it.type) + "</span>" + (it.subtype ? '<span class="pill">' + esc(it.subtype) + "</span>" : "") + (it.rarity ? '<span class="pill">' + esc(it.rarity) + "</span>" : "") + "</p>" +
      (it.desc ? "<p>" + nl2br(it.desc) + "</p>" : "") +
      '<p class="small">Sell value: ' + it.sell + " &middot; Weight: " + it.weight + "</p>";

    if (it.unlockedBy) html += '<p class="small">Unlocked by: <a href="#/technology/' + encodeURIComponent(it.techName) + '">' + esc(it.techName) + "</a> (level " + it.unlockedBy.level + (it.unlockedBy.ancient ? ", Ancient Tech" : "") + ")</p>";

    if (it.consumable) {
      var c = it.consumable;
      html += '<h3 class="section-title">Consumable</h3><p class="small">Nutrition ' + c.nutrition + " &middot; Sanity " + c.sanity + " &middot; Corruption " + c.corruption + "</p>" + (c.effect ? "<p>" + nl2br(c.effect) + "</p>" : "");
    }
    if (it.equipment) {
      var e = it.equipment;
      html += '<h3 class="section-title">Equipment</h3><div class="statgrid">' + statbox(e.durability, "Durability") + statbox(e.attack, "Attack") + statbox(e.defense, "Defense") + statbox(e.health, "Health") + statbox(e.shield, "Shield") + statbox(e.capturePower, "Capture Power") + "</div>" + (e.effect ? "<p>" + nl2br(e.effect) + "</p>" : "");
    }

    html += recipeBlock("Recipe (crafted from)", it.recipesOut, false);
    html += recipeBlock("Used to craft", it.usedIn, true);

    if (it.dropsFrom && it.dropsFrom.length) {
      html += '<h3 class="section-title">Dropped by</h3><table class="simple"><tr><th>Source</th><th>Chance</th><th>Qty</th></tr>' +
        it.dropsFrom.map(function (d) { return "<tr><td>" + linkPal(d.target) + (d.variant ? " (" + esc(d.variant) + ")" : "") + "</td><td>" + (d.chance ? (d.chance * 100).toFixed(0) + "%" : "?") + "</td><td>" + d.min + "-" + d.max + "</td></tr>"; }).join("") + "</table>";
    }
    if (it.gatheredFrom && it.gatheredFrom.length) {
      html += '<h3 class="section-title">Gathered from</h3><table class="simple"><tr><th>Source</th><th>Method</th><th>Qty</th></tr>' +
        it.gatheredFrom.map(function (g) { return "<tr><td>" + esc(g.source) + "</td><td>" + esc(g.interact) + "</td><td>" + g.min + "-" + g.max + "</td></tr>"; }).join("") + "</table>";
    }
    if (it.soldBy && it.soldBy.length) {
      html += '<h3 class="section-title">Sold by</h3><table class="simple"><tr><th>Shop</th><th>Cost</th></tr>' +
        it.soldBy.map(function (s) { return "<tr><td>" + esc(s.shop) + "</td><td>" + s.cost + " " + esc(s.currency) + "</td></tr>"; }).join("") + "</table>";
    }
    page(it.name, html);
  }

  function viewStructures(query) {
    var html = "<h2>Structures</h2>" +
      '<div class="searchbar-inline"><input id="stq" type="text" placeholder="Filter by name..." value="' + esc(query || "") + '"></div>' +
      '<div class="grid" id="stgrid"></div>';
    page("Structures", html);
    function render() {
      var q = document.getElementById("stq").value.toLowerCase();
      var list = PW.structures.filter(function (s) { return !q || s.name.toLowerCase().indexOf(q) !== -1; });
      document.getElementById("stgrid").innerHTML = list.map(function (s) {
        return '<a class="tile" href="#/structures/' + encodeURIComponent(s.name) + '"><div class="name">' + esc(s.name) + '</div><div class="meta">' + esc(s.type) + "</div></a>";
      }).join("");
    }
    document.getElementById("stq").addEventListener("input", render);
    render();
  }
  function viewStructureDetail(name) {
    var s = structByName[name];
    if (!s) { page("Not found", "<p>Unknown structure: " + esc(name) + "</p>"); return; }
    var html = '<div class="breadcrumb"><a href="#/structures">&larr; All Structures</a></div>' +
      "<h2>" + esc(s.name) + "</h2>" +
      '<p class="pillrow"><span class="pill">' + esc(s.type) + "</span>" + (s.subtype ? '<span class="pill">' + esc(s.subtype) + "</span>" : "") + "</p>" +
      (s.desc ? "<p>" + nl2br(s.desc) + "</p>" : "") +
      '<p class="small">HP: ' + (s.hp || "-") + (s.capacity ? " &middot; Capacity: " + esc(s.capacity) : "") + "</p>";
    if (s.unlockedBy) html += '<p class="small">Unlocked by: <a href="#/technology/' + encodeURIComponent(s.techName) + '">' + esc(s.techName) + "</a> (level " + s.unlockedBy.level + (s.unlockedBy.ancient ? ", Ancient Tech" : "") + ")</p>";
    var recipes = itemByName[s.name] ? itemByName[s.name].recipesOut : (PW.recipes.filter(function (r) { return r.product === s.name; }));
    html += recipeBlock("Recipe", recipes.map(function (r) { return { ingredients: r.ingredients, workbench: r.workbench, workload: r.workload }; }), false);
    page(s.name, html);
  }

  // -- Technology -------------------------------------------------------
  function viewTechnology(query) {
    var html = "<h2>Technology Tree</h2>" +
      '<p class="small">Regular Technology (earned from leveling &amp; Fast Travel points) and Ancient Technology (earned from Alpha Pals &amp; Tower Bosses) are separate trees.</p>' +
      '<div class="searchbar-inline"><input id="techq" type="text" placeholder="Filter by name..." value="' + esc(query || "") + '"></div>' +
      '<div id="techlist"></div>';
    page("Technology", html);
    function render() {
      var q = document.getElementById("techq").value.toLowerCase();
      var list = PW.technology.filter(function (t) { return !q || t.name.toLowerCase().indexOf(q) !== -1; });
      var byLevel = {};
      list.forEach(function (t) {
        var key = (t.ancient ? "Ancient - " : "Regular - ") + "Level " + t.level;
        (byLevel[key] = byLevel[key] || []).push(t);
      });
      var keys = Object.keys(byLevel).sort(function (a, b) {
        var pa = a.indexOf("Ancient") === 0, pb = b.indexOf("Ancient") === 0;
        if (pa !== pb) return pa ? 1 : -1;
        return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
      });
      document.getElementById("techlist").innerHTML = keys.map(function (k) {
        return '<h4 style="margin:14px 0 4px;color:var(--gold);">' + esc(k) + "</h4><div class=\"grid\">" +
          byLevel[k].map(function (t) {
            return '<a class="tile" href="#/technology/' + encodeURIComponent(t.name) + '"><div class="name">' + esc(t.name) +
              '</div><div class="meta">Cost: ' + t.cost + (t.requirement ? " &middot; " + esc(t.requirement) : "") + "</div></a>";
          }).join("") + "</div>";
      }).join("") || '<p class="small">No matches.</p>';
    }
    document.getElementById("techq").addEventListener("input", render);
    render();
  }
  function viewTechDetail(name) {
    var t = techByName[name];
    if (!t) { page("Not found", "<p>Unknown technology: " + esc(name) + "</p>"); return; }
    var html = '<div class="breadcrumb"><a href="#/technology">&larr; Technology Tree</a></div>' +
      "<h2>" + esc(t.name) + "</h2>" +
      '<p class="pillrow"><span class="pill">' + (t.ancient ? "Ancient Technology" : "Technology") + '</span><span class="pill">Level ' + t.level + '</span><span class="pill">Cost ' + t.cost + "</span></p>" +
      (t.requirement ? "<p>Requirement: " + nl2br(t.requirement) + "</p>" : "");
    var unlocksItem = PW.items.filter(function (i) { return i.techName === t.name; });
    var unlocksStruct = PW.structures.filter(function (s) { return s.techName === t.name; });
    if (unlocksItem.length || unlocksStruct.length) {
      html += '<h3 class="section-title">Unlocks</h3><div class="grid">' +
        unlocksItem.map(function (i) { return '<a class="tile" href="#/items/' + encodeURIComponent(i.name) + '"><div class="name">' + esc(i.name) + "</div></a>"; }).join("") +
        unlocksStruct.map(function (s) { return '<a class="tile" href="#/structures/' + encodeURIComponent(s.name) + '"><div class="name">' + esc(s.name) + "</div></a>"; }).join("") +
        "</div>";
    }
    page(t.name, html);
  }

  // -- Passive / Active skills -------------------------------------------------------
  function viewPassives() {
    var html = "<h2>Passive Skills</h2><table class=\"simple\"><tr><th>Skill</th><th>Rank</th><th>Effect</th><th>Innate on</th></tr>" +
      PW.passives.map(function (p) {
        return "<tr><td id=\"ps-" + encodeURIComponent(p.name) + "\">" + esc(p.name) + "</td><td>" + esc(p.rank) + "</td><td>" + esc(p.desc) + "</td><td>" + p.innateOn.map(linkPal).join(", ") + "</td></tr>";
      }).join("") + "</table>";
    page("Passive Skills", html);
  }
  function viewActives(query) {
    var html = "<h2>Active Skills</h2>" +
      '<div class="searchbar-inline"><input id="actq" type="text" placeholder="Filter by name..." value="' + esc(query || "") + '"></div>' +
      '<div id="actlist"></div>';
    page("Active Skills", html);
    function render() {
      var q = document.getElementById("actq").value.toLowerCase();
      var list = PW.actives.filter(function (a) { return !q || a.name.toLowerCase().indexOf(q) !== -1; });
      document.getElementById("actlist").innerHTML = '<table class="simple"><tr><th>Skill</th><th>Element</th><th>Power</th><th>Cooldown</th><th>Learned by</th></tr>' +
        list.map(function (a) {
          return "<tr><td>" + esc(a.name) + "</td><td>" + (a.element ? elPill(a.element) : "") + "</td><td>" + a.power + "</td><td>" + a.cooldown + "s</td><td>" + a.learnedBy.slice(0, 6).map(function (l) { return linkPal(l.pal); }).join(", ") + (a.learnedBy.length > 6 ? " +" + (a.learnedBy.length - 6) + " more" : "") + "</td></tr>";
        }).join("") + "</table>";
    }
    document.getElementById("actq").addEventListener("input", render);
    render();
  }

  // -- Breeding calculator -------------------------------------------------------
  function palOptions(selected) {
    return B.ranks.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (r) {
      return '<option value="' + esc(r.name) + '"' + (r.name === selected ? " selected" : "") + ">" + esc(r.name) + (r.eligible ? "" : " *") + "</option>";
    }).join("");
  }
  function viewBreeding(params) {
    params = params || {};
    var html = "<h2>Breeding Calculator</h2>" +
      '<p class="small">Computed from the wiki\'s Breeding Rank data + the documented exceptions (same-species-only Pals and exact-combo subspecies). Pals marked * are not produced by the general rank formula.</p>' +
      '<div class="card"><h3>Parents &rarr; Child</h3><div class="calc-row">' +
      '<div class="calc-col"><label class="small">Parent A</label><select id="pa"><option value="">Select...</option>' + palOptions(params.a) + "</select></div>" +
      '<div class="calc-col"><label class="small">Parent B</label><select id="pb"><option value="">Select...</option>' + palOptions(params.b) + "</select></div>" +
      "</div><div id=\"childResult\" class=\"result-box\">Pick two parents.</div></div>" +
      '<div class="card"><h3>Child &rarr; Parent pairs</h3><div class="calc-row"><div class="calc-col">' +
      '<select id="pc"><option value="">Select a Pal...</option>' + palOptions(params.child) + "</select></div></div>" +
      '<div id="parentResult"></div></div>';
    page("Breeding Calculator", html);
    document.getElementById("pa").addEventListener("change", updateChild);
    document.getElementById("pb").addEventListener("change", updateChild);
    document.getElementById("pc").addEventListener("change", updateParents);
    if (params.a) document.getElementById("pa").value = params.a;
    if (params.b) document.getElementById("pb").value = params.b;
    if (params.child) { document.getElementById("pc").value = params.child; updateParents(); }
    if (params.a && params.b) updateChild();

    function updateChild() {
      var a = document.getElementById("pa").value, b = document.getElementById("pb").value;
      var box = document.getElementById("childResult");
      if (!a || !b) { box.innerHTML = "Pick two parents."; return; }
      var r = computeChild(a, b);
      if (!r || !r.child) {
        box.innerHTML = '<p class="badge-no">' + esc(r ? r.note : "No result.") + "</p>";
        return;
      }
      box.innerHTML = '<div class="child-name">' + linkPal(r.child) + '</div><p class="small">' + esc(r.note) + "</p>";
    }
    function updateParents() {
      var c = document.getElementById("pc").value;
      var box = document.getElementById("parentResult");
      if (!c) { box.innerHTML = ""; return; }
      var r = findParentsFor(c);
      var html2 = "";
      if (r.same) {
        html2 = "<p>" + linkPal(c) + " can only be bred from two " + linkPal(c) + "s.</p>";
      } else if (r.combos.length) {
        html2 = "<p>Exact combination(s):</p><ul class=\"tight\">" + r.combos.map(function (cc) {
          return "<li>" + linkPal(cc.parentA) + (cc.parentA_gender ? " (" + cc.parentA_gender + ")" : "") + " + " + linkPal(cc.parentB) + (cc.parentB_gender ? " (" + cc.parentB_gender + ")" : "") + "</li>";
        }).join("") + "</ul>";
      } else if (r.pairs.length) {
        html2 = "<p>" + r.pairs.length + " parent pair(s) produce " + linkPal(c) + " via the rank formula:</p><ul class=\"tight\">" +
          r.pairs.slice(0, 200).map(function (pr) { return "<li>" + linkPal(pr[0]) + " + " + linkPal(pr[1]) + "</li>"; }).join("") + "</ul>" +
          (r.pairs.length > 200 ? '<p class="small">+' + (r.pairs.length - 200) + " more pairs (list truncated).</p>" : "");
      } else {
        html2 = '<p class="small">No parent combination found (this Pal may not be breedable, or has no rank on file).</p>';
      }
      box.innerHTML = html2;
    }
  }

  // -- Bosses -------------------------------------------------------
  function viewBosses() {
    var bo = PW.bosses;
    var html = "<h2>Bosses, Raids &amp; Alphas</h2>";
    html += '<h3 class="section-title">Tower Bosses (Faction Leaders, in order)</h3>' +
      '<table class="simple"><tr><th>#</th><th>Leader</th><th>Partner Pal</th><th>Faction</th><th>Tower</th><th>Level (normal / hard)</th></tr>' +
      bo.towers.map(function (t) {
        var lvl = t.levelNormal ? t.levelNormal + (t.levelHard ? " / " + t.levelHard : "") : '<span class="unverified">unverified</span>';
        return "<tr><td>" + t.order + "</td><td>" + esc(t.leader) + "</td><td>" + linkPal(t.partnerPal) + "</td><td>" + esc(t.faction) + "</td><td>" + esc(t.tower) + "</td><td>" + lvl + "</td></tr>";
      }).join("") + "</table>";

    html += '<h3 class="section-title">Raid Bosses</h3><table class="simple"><tr><th>Boss</th><th>Level</th><th>Summon item</th><th>Fragment source</th></tr>' +
      bo.raid.map(function (r) { return "<tr><td>" + esc(r.name) + "</td><td>" + r.level + "</td><td>" + esc(r.slab) + "</td><td>" + esc(r.obtain) + "</td></tr>"; }).join("") + "</table>";

    html += '<h3 class="section-title">Predator Pals</h3><p class="small">Since v1.0.0 these no longer spawn at fixed points - they appear at a low rate across the whole map.</p><table class="simple"><tr><th>Pal</th><th>Level</th><th>Cores</th></tr>' +
      bo.predator.map(function (p) { return "<tr><td>" + linkPal(p.name) + "</td><td>" + p.level + "</td><td>" + esc(p.cores) + "</td></tr>"; }).join("") + "</table>";

    html += '<h3 class="section-title">Bounty Targets</h3><table class="simple"><tr><th>Name</th><th>Title</th><th>Level</th><th>Partner Pal</th><th>Coords</th></tr>' +
      bo.bounty.map(function (b) { return "<tr><td>" + esc(b.name) + "</td><td>" + esc(b.title) + "</td><td>" + b.level + "</td><td>" + (b.partnerPal ? linkPal(b.partnerPal) : "-") + "</td><td>" + esc(b.coords) + "</td></tr>"; }).join("") + "</table>";

    html += '<h3 class="section-title">Overworld Alpha Pal spawns (' + bo.alphas.length + ")</h3>" +
      '<div class="searchbar-inline"><input id="alphaq" type="text" placeholder="Filter by Pal or location..."></div><div id="alphalist"></div>';
    page("Bosses", html);
    function renderAlphas() {
      var q = document.getElementById("alphaq").value.toLowerCase();
      var list = bo.alphas.filter(function (a) { return !q || a.name.toLowerCase().indexOf(q) !== -1 || a.location.toLowerCase().indexOf(q) !== -1; });
      document.getElementById("alphalist").innerHTML = '<table class="simple"><tr><th>Pal</th><th>Location</th><th>Level</th><th>Coords</th></tr>' +
        list.slice(0, 300).map(function (a) { return "<tr><td>" + linkPal(a.name) + "</td><td>" + esc(a.location) + "</td><td>" + (a.level || "?") + "</td><td>" + esc(a.coords || "-") + "</td></tr>"; }).join("") + "</table>";
    }
    document.getElementById("alphaq").addEventListener("input", renderAlphas);
    renderAlphas();
  }

  // -- Locations -------------------------------------------------------
  function viewLocations() {
    var html = "<h2>Locations</h2><div class=\"grid\">" +
      PW.locations.map(function (l) { return '<a class="tile" href="#/locations/' + encodeURIComponent(l.name) + '"><div class="name">' + esc(l.name) + '</div><div class="meta">' + esc(l.region) + (l.level ? " &middot; POI level " + l.level : "") + "</div></a>"; }).join("") +
      "</div>";
    page("Locations", html);
  }
  function viewLocationDetail(name) {
    var l = PW.locations.filter(function (x) { return x.name === name; })[0];
    if (!l) { page("Not found", "<p>Unknown location.</p>"); return; }
    var html = '<div class="breadcrumb"><a href="#/locations">&larr; All Locations</a></div>' +
      "<h2>" + esc(l.name) + "</h2><p class=\"small\">" + esc(l.region) + (l.level ? " &middot; POI level " + l.level : "") + "</p>";
    if (l.wildPals.length) html += '<h3 class="section-title">Wild Pals</h3><p>' + l.wildPals.map(linkPal).join(", ") + "</p>";
    if (l.alphas.length) html += '<h3 class="section-title">Alpha spawns</h3><table class="simple"><tr><th>Pal</th><th>Level</th><th>Coords</th></tr>' + l.alphas.map(function (a) { return "<tr><td>" + linkPal(a.name) + "</td><td>" + (a.level || "?") + "</td><td>" + esc(a.coords || "-") + "</td></tr>"; }).join("") + "</table>";
    if (l.humans.length) html += '<h3 class="section-title">Human NPCs</h3><p>' + l.humans.map(esc).join(", ") + "</p>";
    page(l.name, html);
  }

  function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }

  // ---------------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------------
  function parseQuery(qs) {
    var out = {};
    (qs || "").split("&").forEach(function (kv) {
      if (!kv) return;
      var parts = kv.split("="); out[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || "");
    });
    return out;
  }

  function route() {
    var hash = location.hash || "#/";
    var qIdx = hash.indexOf("?");
    var query = qIdx !== -1 ? parseQuery(hash.slice(qIdx + 1)) : {};
    var path = qIdx !== -1 ? hash.slice(0, qIdx) : hash;
    var parts = path.replace(/^#\//, "").split("/").filter(Boolean).map(decodeURIComponent);

    if (parts.length === 0) viewOverview();
    else if (parts[0] === "playthrough") viewPlaythrough();
    else if (parts[0] === "base") viewBase();
    else if (parts[0] === "pals" && parts[1]) viewPalDetail(parts[1]);
    else if (parts[0] === "pals") viewPals();
    else if (parts[0] === "items" && parts[1]) viewItemDetail(parts[1]);
    else if (parts[0] === "items") viewItems();
    else if (parts[0] === "structures" && parts[1]) viewStructureDetail(parts[1]);
    else if (parts[0] === "structures") viewStructures();
    else if (parts[0] === "technology" && parts[1]) viewTechDetail(parts[1]);
    else if (parts[0] === "technology") viewTechnology();
    else if (parts[0] === "passives") viewPassives();
    else if (parts[0] === "actives") viewActives();
    else if (parts[0] === "breeding") viewBreeding(query);
    else if (parts[0] === "bosses") viewBosses();
    else if (parts[0] === "locations" && parts[1]) viewLocationDetail(parts[1]);
    else if (parts[0] === "locations") viewLocations();
    else page("Not found", "<p>Unknown page.</p>");

    highlightNav();
  }

  // ---------------------------------------------------------------------
  // Search box wiring
  // ---------------------------------------------------------------------
  function wireSearch() {
    var input = document.getElementById("globalsearch");
    var results = document.getElementById("search-results");
    input.addEventListener("input", function () {
      var hits = runSearch(input.value);
      if (!hits.length) { results.classList.remove("show"); results.innerHTML = ""; return; }
      var byType = {};
      hits.forEach(function (h) { (byType[h.type] = byType[h.type] || []).push(h); });
      var html = "";
      Object.keys(byType).forEach(function (t) {
        html += '<div class="sr-group">' + esc(t) + "</div>";
        byType[t].forEach(function (h) { html += '<a href="' + h.href + '">' + esc(h.name) + "</a>"; });
      });
      results.innerHTML = html;
      results.classList.add("show");
    });
    document.addEventListener("click", function (e) {
      if (!results.contains(e.target) && e.target !== input) results.classList.remove("show");
    });
    results.addEventListener("click", function () { results.classList.remove("show"); input.value = ""; });
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", function () {
    renderNav();
    wireSearch();
    route();
  });
})();
