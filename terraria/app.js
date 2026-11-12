// Terraria Complete Guide -- client app. No build step, no fetch(); every
// data/*.js file assigns into window.GUIDE and is loaded via <script src>
// before this file, so this works from file:// as well as http(s)://.
(function () {
  "use strict";
  var G = window.GUIDE || {};
  var $content = document.getElementById("content");
  var $sidebar = document.getElementById("sidebar");

  // ---------------------------------------------------------------- indices --
  var itemsByName = new Map();
  (G.items || []).forEach(function (it) { itemsByName.set(it.name.toLowerCase(), it); });

  var npcsByName = new Map();
  (G.npcs || []).forEach(function (n) { npcsByName.set(n.name.toLowerCase(), n); });

  var happinessByName = new Map();
  (G.happiness || []).forEach(function (h) { happinessByName.set(h.name.toLowerCase(), h); });

  var recipesByResult = new Map();
  var recipesByIngredient = new Map();
  (G.recipes || []).forEach(function (r) {
    var rk = r.result.toLowerCase();
    if (!recipesByResult.has(rk)) recipesByResult.set(rk, []);
    recipesByResult.get(rk).push(r);
    r.ings.forEach(function (ing) {
      var ik = ing.name.toLowerCase();
      if (!recipesByIngredient.has(ik)) recipesByIngredient.set(ik, []);
      recipesByIngredient.get(ik).push(r);
    });
  });

  var dropsBySource = new Map();
  var dropsByItem = new Map();
  (G.drops || []).forEach(function (d) {
    var sk = d.src.toLowerCase();
    if (!dropsBySource.has(sk)) dropsBySource.set(sk, []);
    dropsBySource.get(sk).push(d);
    var ik = d.item.toLowerCase();
    if (!dropsByItem.has(ik)) dropsByItem.set(ik, []);
    dropsByItem.get(ik).push(d);
  });

  // Composite boss/event names that map to more than one NPC row.
  var BOSS_NPC_ALIASES = {
    "the twins": ["Retinazer", "Spazmatism"],
    "celestial pillars (solar, vortex, nebula, stardust)": ["Solar Pillar", "Vortex Pillar", "Nebula Pillar", "Stardust Pillar"],
    "moon lord": ["Moon Lord", "Moon Lord's Core", "Moon Lord's Hand"],
  };

  function npcNamesFor(bossName) {
    var key = bossName.toLowerCase();
    if (BOSS_NPC_ALIASES[key]) return BOSS_NPC_ALIASES[key];
    if (npcsByName.has(key)) return [bossName];
    return [];
  }

  // -------------------------------------------------------------- search idx --
  var searchIndex = [];
  (G.items || []).forEach(function (it) { searchIndex.push({ kind: "Item", name: it.name, route: "#/item/" + encodeURIComponent(it.name) }); });
  (G.npcs || []).forEach(function (n) { searchIndex.push({ kind: "NPC", name: n.name, route: "#/npc/" + encodeURIComponent(n.name) }); });
  (G.bosses || []).forEach(function (b) { searchIndex.push({ kind: "Boss", name: b.name, route: "#/boss/" + b.id }); });
  (G.biomes || []).forEach(function (b) { searchIndex.push({ kind: "Biome", name: b.name, route: "#/biomes" }); });
  [
    ["Overview", "#/overview"], ["Full Playthrough", "#/playthrough"],
    ["Ores & Pickaxes", "#/progression"], ["Class Setups", "#/classes"],
    ["Bosses & Events", "#/bosses"], ["Biomes", "#/biomes"],
    ["NPCs & Happiness", "#/npcs"], ["Pylons", "#/pylons"],
    ["Items", "#/items"], ["Recipes", "#/recipes"], ["Reforge Modifiers", "#/modifiers"],
  ].forEach(function (s) { searchIndex.push({ kind: "Section", name: s[0], route: s[1] }); });

  // ------------------------------------------------------------------- utils --
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function itemLink(name) {
    var it = itemsByName.get(name.toLowerCase());
    if (it) return '<a class="itemLink" href="#/item/' + encodeURIComponent(it.name) + '">' + esc(it.name) + "</a>";
    var n = npcsByName.get(name.toLowerCase());
    if (n) return '<a class="itemLink" href="#/npc/' + encodeURIComponent(n.name) + '">' + esc(n.name) + "</a>";
    return '<span class="itemLink missing" title="Not a single data row (event/world feature/collective name)">' + esc(name) + "</span>";
  }

  // Turn {{Name}} markers in authored prose into item/NPC links.
  function linkify(text) {
    return esc(text).replace(/\{\{([^{}]+)\}\}/g, function (_, name) { return itemLink(name); });
  }

  function chipEra(era) {
    var cls = "chip";
    if (/pre-hardmode/i.test(era)) cls += " era-pre";
    else if (/endgame/i.test(era)) cls += " era-end";
    else if (/hardmode/i.test(era)) cls += " era-hard";
    return '<span class="' + cls + '">' + esc(era) + "</span>";
  }

  function list(names) {
    if (!names || !names.length) return '<span class="muted">&mdash;</span>';
    return names.map(itemLink).join(", ");
  }

  function coin(text) { return text ? esc(text) : "&mdash;"; }

  // ------------------------------------------------------------ recipe block --
  function recipeBlockHtml(r) {
    var ings = r.ings.map(function (i) { return itemLink(i.name) + (i.qty > 1 ? " &times;" + i.qty : ""); }).join(" + ");
    var amt = r.amount > 1 ? " &times;" + r.amount : "";
    return (
      '<div class="recipeBlock"><div class="station">' + esc(r.station) + (r.legacy ? '<span class="legacyTag">legacy version</span>' : "") + "</div>" +
      "<div>" + ings + '<span class="recipeArrow">&rarr;</span>' + itemLink(r.result) + amt + "</div></div>"
    );
  }

  // ------------------------------------------------------------------ routes --
  var routes = {};

  function versionCheckLine(v) {
    if (!v) return "";
    var links = (v.sources || []).map(function (s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + "</a>";
    }).join(" &middot; ");
    return '<div class="sourceLine" id="versionCheck"><b>Patch re-checked ' + esc(v.checkedOn) + ": the latest version is " +
      esc(v.latest) + " (" + esc(v.latestDate) + ").</b> " + esc(v.note || "") + (links ? " Sources: " + links + "." : "") + "</div>";
  }

  routes.overview = function () {
    var m = G.manifest || {};
    return (
      "<h1>Terraria &mdash; Complete Guide</h1>" +
      '<p class="lede">A full offline reference for vanilla Desktop Terraria: a start-to-Moon-Lord playthrough, ore/pickaxe progression, ' +
      "class setups for every stage, every boss and event, and a searchable database of every item and recipe in the game.</p>" +
      '<div class="sourceLine">Data pulled from ' + esc(m.source || "terraria.wiki.gg") + " on " + esc(m.builtOn || "?") + ", game version " + esc(m.gameVersion || "?") + ".</div>" +
      versionCheckLine(m.versionCheck) +
      "<div class=\"grid\">" +
      statCard("Items", (G.items || []).length, "#/items") +
      statCard("Recipes", (G.recipes || []).length, "#/recipes") +
      statCard("Bosses & events", (G.bosses || []).length, "#/bosses") +
      statCard("NPCs (town + enemies)", (G.npcs || []).length, "#/npcs") +
      statCard("Drop entries", (G.drops || []).length, "#/npcs") +
      statCard("Biomes covered", (G.biomes || []).length, "#/biomes") +
      "</div>" +
      "<h2>How to use this guide</h2>" +
      "<ul>" +
      '<li><b>Full Playthrough</b> walks you start-to-finish, in order, with every item/boss name clickable.</li>' +
      '<li><b>Ores &amp; Pickaxes</b> and <b>Class Setups</b> are quick-reference tables for \"what do I mine/wear/wield right now.\"</li>' +
      '<li><b>Bosses &amp; Events</b> has prep checklists (arena, buffs, gear, summon item, strategy) and live drop tables for every boss.</li>' +
      '<li><b>Items</b> and <b>Recipes</b> are the full searchable database, every item card shows its recipe in, what it is used to craft, and where it drops.</li>' +
      '<li>The search box at the top works across all of it.</li>' +
      "</ul>"
    );
  };

  function statCard(label, n, href) {
    return '<a class="card" href="' + href + '" style="display:block;text-decoration:none;"><div style="font-size:26px;font-family:var(--font-serif);color:var(--gold);">' + n + "</div><div style=\"color:var(--muted);font-size:13px;\">" + esc(label) + "</div></a>";
  }

  routes.playthrough = function () {
    var html = "<h1>Full Playthrough: Spawn to Moon Lord</h1>";
    html += '<p class="lede">In order. Every item, boss and NPC name is a link to its full card. Optional detours are marked.</p>';
    (G.playthrough || []).forEach(function (stage) {
      html += '<div class="card"><h2 style="margin-top:0">' + esc(stage.title) + " " + chipEra(stage.era) + "</h2>";
      stage.body.forEach(function (p) { html += "<p>" + linkify(p) + "</p>"; });
      html += "</div>";
    });
    return html;
  };

  routes.progression = function () {
    var html = "<h1>Ore &amp; Pickaxe Progression</h1>";
    html += '<p class="lede">Every ore, its bar, the pickaxe tier that mines it, and where to find it, in mining order.</p>';
    html += '<div class="sourceLine">Pickaxe-power requirements: ' + esc((G.progression || {}).pickaxePowerSource || "") + "</div>";
    (G.progression.tiers || []).forEach(function (t) {
      html += '<div class="card">';
      var powerChip = (t.minPower === null || t.minPower === undefined)
        ? '<span class="chip optional">not mined with a pickaxe</span>'
        : '<span class="chip">min pickaxe power: ' + t.minPower + "%</span>";
      html += "<h3 style=\"margin-top:0\">" + esc(t.tier) + " " + chipEra(t.era) + powerChip + "</h3>";
      html += '<div class="statRow">';
      if (t.ore.length) html += "<span><b>Ore:</b> " + list(t.ore) + "</span>";
      if (t.bar.length) html += "<span><b>Bar:</b> " + list(t.bar) + "</span>";
      if (t.pickaxe.length) html += "<span><b>Pickaxe:</b> " + list(t.pickaxe) + "</span>";
      if (t.axe.length) html += "<span><b>Axe:</b> " + list(t.axe) + "</span>";
      html += "</div><p>" + linkify(t.where) + "</p></div>";
    });
    return html;
  };

  routes.classes = function () {
    var html = "<h1>Class Setups By Stage</h1>";
    html += '<p class="lede">A recommended weapon/armor/accessory per class at each major point in progression. Use the Items search for full stats.</p>';
    (G.classes || []).forEach(function (c) {
      html += '<div class="card"><h3 style="margin-top:0">' + esc(c.stage) + "</h3>";
      html += '<table class="dataTable classTable"><tr><th>Melee</th><th>Ranged</th><th>Mage</th><th>Summoner</th></tr><tr>';
      ["melee", "ranged", "mage", "summoner"].forEach(function (k) {
        var cl = c[k];
        html += "<td>" +
          (cl.weapon.length ? "<div>" + list(cl.weapon) + "</div>" : "") +
          (cl.armor.length ? '<div style="margin-top:4px;color:var(--muted)">Armor: ' + list(cl.armor) + "</div>" : "") +
          (cl.accessory.length ? '<div style="margin-top:4px;color:var(--muted)">Accessory: ' + list(cl.accessory) + "</div>" : "") +
          "</td>";
      });
      html += "</tr></table>";
      if (c.note) html += "<p style=\"margin-bottom:0;color:var(--muted)\">" + linkify(c.note) + "</p>";
      html += "</div>";
    });
    return html;
  };

  routes.bosses = function () {
    var html = "<h1>Bosses &amp; Events</h1>";
    html += '<p class="lede">In recommended fight order. Click a boss name to jump straight to it, or scroll through.</p><div style="margin-bottom:16px">';
    (G.bosses || []).forEach(function (b) { html += '<a class="pill-btn" href="#/boss/' + b.id + '">' + esc(b.name) + "</a>"; });
    html += "</div>";
    (G.bosses || []).forEach(function (b) { html += bossCardHtml(b); });
    return html;
  };

  routes.boss = function (id) {
    var b = (G.bosses || []).find(function (x) { return x.id === id; });
    if (!b) return "<h1>Boss not found</h1>";
    return '<a class="back-link" href="#/bosses">&larr; All bosses &amp; events</a>' + bossCardHtml(b, true);
  };

  function bossCardHtml(b, expanded) {
    var id = "boss-" + b.id;
    var html = '<div class="card bossCard" id="' + id + '"><h3>' + esc(b.name) + " " + chipEra(b.era) + (b.optional ? '<span class="chip optional">optional</span>' : "") + "</h3>";
    html += '<div class="field-label">Summon</div><div>' + (b.summon ? itemLink(b.summon) : "(automatic)") + (b.summonHow ? " &mdash; " + linkify(b.summonHow) : "") + "</div>";
    if (b.naturalSpawn) html += '<div class="field-label">Natural spawn condition</div><div>' + linkify(b.naturalSpawn) + "</div>";
    html += '<div class="field-label">Arena</div><ul>' + (b.arena || []).map(function (a) { return "<li>" + linkify(a) + "</li>"; }).join("") + "</ul>";
    html += '<div class="field-label">Buffs to bring</div><div>' + list(b.buffs) + "</div>";
    html += '<div class="field-label">Recommended gear</div>';
    html += '<table class="dataTable classTable"><tr><th>Melee</th><th>Ranged</th><th>Mage</th><th>Summoner</th></tr><tr>' +
      ["melee", "ranged", "mage", "summoner"].map(function (k) { return "<td>" + list(b.gear[k]) + "</td>"; }).join("") + "</tr></table>";
    html += '<div class="field-label">Strategy</div><p>' + linkify(b.strategy) + "</p>";
    if (b.unlocks) html += '<div class="field-label">Unlocks / drops of note</div><p>' + linkify(b.unlocks) + "</p>";

    var npcNames = npcNamesFor(b.name);
    var dropRows = [];
    npcNames.forEach(function (nn) {
      (dropsBySource.get(nn.toLowerCase()) || []).forEach(function (d) { dropRows.push(d); });
    });
    if (dropRows.length) {
      html += '<div class="field-label">Drop table (' + dropRows.length + " entries)</div>";
      html += '<table class="dataTable"><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Note</th></tr>';
      dropRows.slice(0, 60).forEach(function (d) {
        html += "<tr><td>" + itemLink(d.item) + "</td><td>" + esc(d.qty) + "</td><td>" + esc(d.rate) + "</td><td>" + esc(d.note) + "</td></tr>";
      });
      html += "</table>";
      if (dropRows.length > 60) html += '<div class="resultCount">+' + (dropRows.length - 60) + " more, see the NPC page.</div>";
    }
    html += "</div>";
    return html;
  }

  routes.biomes = function () {
    var html = "<h1>Biomes</h1><p class=\"lede\">Where each major biome is, when it appears, and what to expect.</p><div class=\"grid\">";
    (G.biomes || []).forEach(function (b) {
      html += '<div class="card"><h3 style="margin-top:0">' + esc(b.name) + '</h3><div class="chip">' + esc(b.when) + "</div><p>" + linkify(b.body) + "</p></div>";
    });
    return html + "</div>";
  };

  routes.pylons = function () {
    var html = "<h1>Pylons</h1>";
    html += '<p class="lede">Fast-travel network furniture, one per biome plus a Universal Pylon.</p>';
    html += '<div class="sourceLine">Mechanic summary (general game knowledge, not a single pulled data table): each biome Pylon needs at least two qualifying town NPCs housed in a matching biome nearby to be purchasable/usable, and no boss/invasion event active nearby. The Universal Pylon works in Town regardless of biome. Verify specifics in-game if in doubt.</div>';
    html += '<div class="card"><h3 style="margin-top:0">Pylon items</h3><p>' + list(G.pylons || []) + "</p></div>";
    return html;
  };

  routes.npcs = function () {
    var townNpcs = (G.npcs || []).filter(function (n) { return n.types.indexOf("nPC") !== -1 || n.types.indexOf("NPC") !== -1; });
    var html = "<h1>NPCs &amp; Happiness</h1>";
    html += '<p class="lede">Town NPCs, their preferred biomes, and who they love/hate as neighbors (source: the wiki\'s NPC relationship table). Search the full NPC/enemy database below.</p>';
    html += '<div class="grid">';
    townNpcs.forEach(function (n) {
      var h = happinessByName.get(n.name.toLowerCase());
      html += '<div class="card"><h3 style="margin-top:0"><a href="#/npc/' + encodeURIComponent(n.name) + '">' + esc(n.name) + "</a></h3>";
      if (h) {
        html += '<div class="statRow"><span><b>Likes biomes:</b> ' + (h.biomes.length ? esc(h.biomes.join(", ")) : "&mdash;") + "</span></div>";
        html += '<div class="statRow"><span><b>Loves:</b> ' + (h.loves.length ? h.loves.map(function (x) { return itemLink(x); }).join(", ") : "&mdash;") + "</span></div>";
        html += '<div class="statRow"><span><b>Hates:</b> ' + (h.hates.length ? h.hates.map(function (x) { return itemLink(x); }).join(", ") : "&mdash;") + "</span></div>";
      } else {
        html += '<div class="statRow muted">No biome-preference data in the wiki\'s relationship table for this NPC.</div>';
      }
      html += "</div>";
    });
    html += "</div>";
    html += '<h2>Full NPC / enemy database</h2>';
    html += '<div class="toolbar"><input type="search" id="npcSearch" placeholder="Search NPCs &amp; enemies..."> <select id="npcTypeFilter"><option value="">All types</option>' +
      npcTypeOptions().map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + "</option>"; }).join("") + "</select></div>";
    html += '<div class="resultCount" id="npcResultCount"></div><div id="npcResults"></div>';
    return html;
  };

  function npcTypeOptions() {
    var set = new Set();
    (G.npcs || []).forEach(function (n) { (n.types || []).forEach(function (t) { set.add(t); }); });
    return Array.from(set).sort();
  }

  function mountNpcBrowser() {
    var $search = document.getElementById("npcSearch");
    var $type = document.getElementById("npcTypeFilter");
    var $out = document.getElementById("npcResults");
    var $count = document.getElementById("npcResultCount");
    var PAGE = 150;

    function render() {
      var q = ($search.value || "").trim().toLowerCase();
      var type = $type.value;
      var filtered = (G.npcs || []).filter(function (n) {
        if (type && n.types.indexOf(type) === -1) return false;
        if (q && n.name.toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      $count.textContent = filtered.length + " NPC" + (filtered.length === 1 ? "" : "s") + (filtered.length > PAGE ? " (showing first " + PAGE + ", refine your search)" : "");
      var html = '<table class="dataTable"><tr><th>Name</th><th>Type</th><th>Life</th><th>Damage</th><th>Defense</th></tr>';
      filtered.slice(0, PAGE).forEach(function (n) {
        html += "<tr><td><a href=\"#/npc/" + encodeURIComponent(n.name) + '">' + esc(n.name) + "</a></td><td>" + esc((n.types || []).join(", ")) + "</td><td>" + esc(n.life) + "</td><td>" + esc(n.dmg) + "</td><td>" + esc(n.def) + "</td></tr>";
      });
      html += "</table>";
      $out.innerHTML = html;
    }
    $search.addEventListener("input", render);
    $type.addEventListener("change", render);
    render();
  }

  routes.modifiers = function () {
    var html = "<h1>Reforge Modifiers</h1><p class=\"lede\">Every modifier a Goblin Tinkerer reforge can roll, and its stat deltas.</p>";
    html += '<table class="dataTable"><tr><th>Name</th><th>Damage</th><th>Crit</th><th>Speed</th><th>Size</th><th>Velocity</th><th>Knockback</th><th>Mana</th></tr>';
    (G.modifiers || []).forEach(function (m) {
      html += "<tr><td><b>" + esc(m.name) + "</b></td><td>" + esc(m.dmg) + "</td><td>" + esc(m.crit) + "</td><td>" + esc(m.speed) + "</td><td>" + esc(m.size) + "</td><td>" + esc(m.vel) + "</td><td>" + esc(m.kb) + "</td><td>" + esc(m.mana) + "</td></tr>";
    });
    return html + "</table>";
  };

  // ---------------------------------------------------------- items browser --
  function itemTypeOptions() {
    var set = new Set();
    (G.items || []).forEach(function (it) { (it.types || []).forEach(function (t) { set.add(t); }); });
    return Array.from(set).sort();
  }

  routes.items = function () {
    var html = "<h1>Items</h1><p class=\"lede\">Every item pulled from the wiki. Search by name or filter by type.</p>";
    html += '<div class="toolbar"><input type="search" id="itemSearch" placeholder="Search items..."> <select id="itemTypeFilter"><option value="">All types</option>' +
      itemTypeOptions().map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + "</option>"; }).join("") + "</select></div>";
    html += '<div class="resultCount" id="itemResultCount"></div><div id="itemResults"></div>';
    return html;
  };

  function mountItemsBrowser() {
    var $search = document.getElementById("itemSearch");
    var $type = document.getElementById("itemTypeFilter");
    var $out = document.getElementById("itemResults");
    var $count = document.getElementById("itemResultCount");
    var PAGE = 150;

    function render() {
      var q = ($search.value || "").trim().toLowerCase();
      var type = $type.value;
      var filtered = (G.items || []).filter(function (it) {
        if (type && it.types.indexOf(type) === -1) return false;
        if (q && it.name.toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      $count.textContent = filtered.length + " item" + (filtered.length === 1 ? "" : "s") + (filtered.length > PAGE ? " (showing first " + PAGE + ", refine your search)" : "");
      var shown = filtered.slice(0, PAGE);
      var html = '<table class="dataTable"><tr><th>Name</th><th>Type</th><th>Rarity</th><th>Sell</th></tr>';
      shown.forEach(function (it) {
        html += "<tr><td>" + itemLink(it.name) + "</td><td>" + esc((it.types || []).join(", ")) + "</td><td>" + esc(it.rare) + "</td><td>" + coin(it.sellT) + "</td></tr>";
      });
      html += "</table>";
      $out.innerHTML = html;
    }
    $search.addEventListener("input", render);
    $type.addEventListener("change", render);
    render();
  }

  // -------------------------------------------------------- recipes browser --
  routes.recipes = function () {
    var stations = Array.from(new Set((G.recipes || []).map(function (r) { return r.station; }))).sort();
    var html = "<h1>Recipes</h1><p class=\"lede\">Every current-version recipe. Filter by crafting station or search a result/ingredient name.</p>";
    html += '<div class="toolbar"><input type="search" id="recipeSearch" placeholder="Search result or ingredient..."> <select id="recipeStationFilter"><option value="">All stations</option>' +
      stations.map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + "</option>"; }).join("") + "</select></div>";
    html += '<div class="resultCount" id="recipeResultCount"></div><div id="recipeResults"></div>';
    return html;
  };

  function mountRecipesBrowser() {
    var $search = document.getElementById("recipeSearch");
    var $station = document.getElementById("recipeStationFilter");
    var $out = document.getElementById("recipeResults");
    var $count = document.getElementById("recipeResultCount");
    var PAGE = 150;

    function render() {
      var q = ($search.value || "").trim().toLowerCase();
      var station = $station.value;
      var filtered = (G.recipes || []).filter(function (r) {
        if (station && r.station !== station) return false;
        if (q) {
          var hit = r.result.toLowerCase().indexOf(q) !== -1 || r.ings.some(function (i) { return i.name.toLowerCase().indexOf(q) !== -1; });
          if (!hit) return false;
        }
        return true;
      });
      $count.textContent = filtered.length + " recipe" + (filtered.length === 1 ? "" : "s") + (filtered.length > PAGE ? " (showing first " + PAGE + ", refine your search)" : "");
      var html = "";
      filtered.slice(0, PAGE).forEach(function (r) { html += recipeBlockHtml(r); });
      $out.innerHTML = html;
    }
    $search.addEventListener("input", render);
    $station.addEventListener("change", render);
    render();
  }

  // ------------------------------------------------------------------ cards --
  routes.item = function (name) {
    var it = itemsByName.get(decodeURIComponent(name).toLowerCase());
    if (!it) return "<h1>Item not found</h1><p>No item named &ldquo;" + esc(name) + "&rdquo; in the pulled data.</p>";
    var html = '<a class="back-link" href="#/items">&larr; All items</a>';
    html += '<div class="itemCard"><div class="itemHead"><h1>' + esc(it.name) + "</h1>";
    (it.types || []).forEach(function (t) { html += '<span class="chip">' + esc(t) + "</span>"; });
    if (it.hardmode) html += '<span class="chip era-hard">Hardmode</span>';
    html += "</div>";
    if (it.tip) html += '<div class="tooltip-flavor">&ldquo;' + esc(it.tip) + "&rdquo;</div>";

    html += '<div class="statRow">';
    if (it.dmg) html += "<span><b>Damage:</b> " + esc(it.dmg) + (it.dmgType ? " (" + esc(it.dmgType) + ")" : "") + "</span>";
    if (it.def) html += "<span><b>Defense:</b> " + esc(it.def) + "</span>";
    if (it.crit) html += "<span><b>Crit chance:</b> " + esc(it.crit) + "%</span>";
    if (it.useTime) html += "<span><b>Use time:</b> " + esc(it.useTime) + "</span>";
    if (it.vel) html += "<span><b>Velocity:</b> " + esc(it.vel) + "</span>";
    if (it.kb) html += "<span><b>Knockback:</b> " + esc(it.kb) + "</span>";
    if (it.pick) html += "<span><b>Pickaxe power:</b> " + esc(it.pick) + "</span>";
    if (it.axe) html += "<span><b>Axe power:</b> " + esc(it.axe) + "</span>";
    if (it.hammer) html += "<span><b>Hammer power:</b> " + esc(it.hammer) + "</span>";
    if (it.mana) html += "<span><b>Mana cost:</b> " + esc(it.mana) + "</span>";
    if (it.healLife) html += "<span><b>Restores:</b> " + esc(it.healLife) + " life</span>";
    if (it.healMana) html += "<span><b>Restores:</b> " + esc(it.healMana) + " mana</span>";
    html += "<span><b>Max stack:</b> " + esc(it.stack) + "</span>";
    if (it.rare) html += "<span><b>Rarity:</b> " + esc(it.rare) + "</span>";
    if (it.buyT) html += "<span><b>Buy:</b> " + coin(it.buyT) + "</span>";
    if (it.sellT) html += "<span><b>Sell:</b> " + coin(it.sellT) + "</span>";
    html += "</div>";

    var madeAt = recipesByResult.get(it.name.toLowerCase()) || [];
    html += "<h2>Recipe (how to craft it)</h2>";
    html += madeAt.length ? madeAt.map(recipeBlockHtml).join("") : '<p class="lede">Not craftable, found some other way (drop, purchase, fishing, event reward, etc).</p>';

    var usedIn = recipesByIngredient.get(it.name.toLowerCase()) || [];
    if (usedIn.length) {
      html += "<h2>Used to craft (" + usedIn.length + ")</h2>";
      var seen = new Set();
      var lines = [];
      usedIn.forEach(function (r) {
        var k = r.result + "|" + r.station;
        if (seen.has(k)) return;
        seen.add(k);
        lines.push('<div class="recipeBlock"><div class="station">' + esc(r.station) + "</div><div>" + itemLink(r.result) + "</div></div>");
      });
      html += lines.slice(0, 80).join("");
      if (lines.length > 80) html += '<div class="resultCount">+' + (lines.length - 80) + " more.</div>";
    }

    var from = dropsByItem.get(it.name.toLowerCase()) || [];
    if (from.length) {
      html += "<h2>Obtained from (" + from.length + ")</h2>";
      html += '<table class="dataTable"><tr><th>Source</th><th>Qty</th><th>Rate</th><th>Note</th></tr>';
      from.slice(0, 80).forEach(function (d) {
        html += "<tr><td>" + itemLink(d.src) + "</td><td>" + esc(d.qty) + "</td><td>" + esc(d.rate) + "</td><td>" + esc(d.note) + "</td></tr>";
      });
      html += "</table>";
      if (from.length > 80) html += '<div class="resultCount">+' + (from.length - 80) + " more.</div>";
    }

    html += "</div>";
    return html;
  };

  routes.npc = function (name) {
    var n = npcsByName.get(decodeURIComponent(name).toLowerCase());
    if (!n) return "<h1>NPC not found</h1><p>No NPC named &ldquo;" + esc(name) + "&rdquo; in the pulled data.</p>";
    var html = '<a class="back-link" href="#/npcs">&larr; NPCs &amp; happiness</a>';
    html += '<div class="itemCard"><div class="itemHead"><h1>' + esc(n.name) + "</h1>";
    (n.types || []).forEach(function (t) { html += '<span class="chip">' + esc(t) + "</span>"; });
    html += "</div>";
    html += '<div class="statRow">';
    if (n.life) html += "<span><b>Life:</b> " + esc(n.life) + "</span>";
    if (n.dmg) html += "<span><b>Damage:</b> " + esc(n.dmg) + "</span>";
    if (n.def) html += "<span><b>Defense:</b> " + esc(n.def) + "</span>";
    if (n.kb) html += "<span><b>Knockback resist:</b> " + esc(n.kb) + "</span>";
    if (n.env) html += "<span><b>Found in:</b> " + esc(n.env) + "</span>";
    if (n.immune && n.immune.length) html += "<span><b>Immune to:</b> " + esc(n.immune.join(", ")) + "</span>";
    html += "</div>";

    var h = happinessByName.get(n.name.toLowerCase());
    if (h) {
      html += "<h2>Happiness</h2><div class=\"statRow\">";
      html += "<span><b>Likes biomes:</b> " + (h.biomes.length ? esc(h.biomes.join(", ")) : "&mdash;") + "</span>";
      html += "<span><b>Loves:</b> " + (h.loves.length ? h.loves.map(itemLink).join(", ") : "&mdash;") + "</span>";
      html += "<span><b>Hates:</b> " + (h.hates.length ? h.hates.map(itemLink).join(", ") : "&mdash;") + "</span>";
      html += "</div>";
    }

    var drops = dropsBySource.get(n.name.toLowerCase()) || [];
    if (drops.length) {
      html += "<h2>Drops (" + drops.length + ")</h2><table class=\"dataTable\"><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Note</th></tr>";
      drops.slice(0, 100).forEach(function (d) {
        html += "<tr><td>" + itemLink(d.item) + "</td><td>" + esc(d.qty) + "</td><td>" + esc(d.rate) + "</td><td>" + esc(d.note) + "</td></tr>";
      });
      html += "</table>";
      if (drops.length > 100) html += '<div class="resultCount">+' + (drops.length - 100) + " more.</div>";
    }
    html += "</div>";
    return html;
  };

  // ------------------------------------------------------------------ router --
  function currentRoute() {
    var hash = location.hash.replace(/^#\/?/, "");
    if (!hash) return { name: "overview", arg: null };
    var i = hash.indexOf("/");
    if (i === -1) return { name: hash, arg: null };
    return { name: hash.slice(0, i), arg: hash.slice(i + 1) };
  }

  function render() {
    var r = currentRoute();
    var fn = routes[r.name];
    if (!fn) { $content.innerHTML = "<h1>Not found</h1><p>Unknown section.</p>"; return; }
    $content.innerHTML = fn(r.arg);
    $content.scrollTop = 0;
    window.scrollTo(0, 0);
    document.querySelectorAll(".sidebar a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === r.name);
    });
    if (r.name === "items") mountItemsBrowser();
    if (r.name === "recipes") mountRecipesBrowser();
    if (r.name === "npcs") mountNpcBrowser();
    $sidebar.classList.remove("open");
    document.getElementById("navItemCount").textContent = (G.items || []).length;
    document.getElementById("navRecipeCount").textContent = (G.recipes || []).length;
    var m = G.manifest || {};
    document.getElementById("navFoot").textContent = "Checked " + ((m.versionCheck && m.versionCheck.checkedOn) || m.builtOn || "") + " · " + (m.gameVersion || "");
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", function () {
    render();
    document.getElementById("navToggle").addEventListener("click", function () { $sidebar.classList.toggle("open"); });

    // ---------------------------------------------------------- top search --
    var $box = document.getElementById("searchBox");
    var $res = document.getElementById("searchResults");
    function runSearch() {
      var q = $box.value.trim().toLowerCase();
      if (!q) { $res.hidden = true; $res.innerHTML = ""; return; }
      var hits = searchIndex.filter(function (s) { return s.name.toLowerCase().indexOf(q) !== -1; }).slice(0, 25);
      if (!hits.length) { $res.innerHTML = '<a>No matches.</a>'; $res.hidden = false; return; }
      $res.innerHTML = hits.map(function (h) {
        return '<a href="' + h.route + '"><span class="kind">' + h.kind + "</span>" + esc(h.name) + "</a>";
      }).join("");
      $res.hidden = false;
    }
    $box.addEventListener("input", runSearch);
    $box.addEventListener("focus", runSearch);
    $res.addEventListener("click", function () { $res.hidden = true; $box.value = ""; });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".searchWrap")) $res.hidden = true;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { $res.hidden = true; $box.blur(); }
    });
  });
})();
