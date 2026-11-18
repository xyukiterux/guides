/* Valorant Complete Guide -- client-side app. No build step, no CORS calls:
 * all data is loaded as plain JS globals via <script src> (works from file://).
 */
(function () {
  "use strict";

  var agentBySlug = {}, mapBySlug = {};
  AGENTS.forEach(function (a) { agentBySlug[a.slug] = a; });
  MAPS.forEach(function (m) { mapBySlug[m.slug] = m; });

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fmtPct(n) { return (n === null || n === undefined) ? "n/a" : n + "%"; }

  function agentLink(name) {
    var a = AGENTS.find(function (x) { return x.name === name; });
    if (!a) return esc(name);
    return '<a href="#/agents/' + a.slug + '">' + roleTag(a.role) + esc(name) + '</a>';
  }

  function mapLink(name) {
    var m = MAPS.find(function (x) { return x.name === name; });
    if (!m) return esc(name);
    return '<a href="#/maps/' + m.slug + '">' + esc(name) + '</a>';
  }

  function roleTag(role) {
    if (!role) return "";
    var cls = "role-" + role.toLowerCase();
    return "";
  }

  function roleBadge(role) {
    if (!role) return "";
    return '<span class="tag role-' + role.toLowerCase() + '">' + esc(role) + "</span>";
  }

  function agentIcon(agent, size) {
    size = size || "icon-sm";
    var src = agent.icon ? "assets/" + agent.icon : "";
    return src ? '<img class="' + size + '" src="' + esc(src) + '" alt="' + esc(agent.name) + '">' : "";
  }

  function clipCard(c) {
    return '<div class="clip">' +
      '<a href="https://www.youtube.com/watch?v=' + esc(c.id) + '" target="_blank" rel="noopener">' +
      '<img src="https://i.ytimg.com/vi/' + esc(c.id) + '/mqdefault.jpg" alt="' + esc(c.title) + '"></a>' +
      '<div><a href="https://www.youtube.com/watch?v=' + esc(c.id) + '" target="_blank" rel="noopener">' +
      esc(c.title) + '</a><div class="meta">' + esc(c.channel || "") +
      (c.views ? " &middot; " + c.views.toLocaleString() + " views" : "") + '</div></div></div>';
  }

  function clipsBlock(title, clips) {
    if (!clips || !clips.length) return "";
    return '<div class="card"><h3>' + esc(title) + '</h3>' +
      clips.slice(0, 6).map(clipCard).join("") + '</div>';
  }

  function sourceNote(text) {
    return '<div class="source-note">' + text + '</div>';
  }

  // ---------------------------------------------------------------------
  function renderHome() {
    var topPro = (VLR_PRO_STATS.overallPickRates || []).slice().sort(function (a, b) {
      return b.pickRatePct - a.pickRatePct;
    }).slice(0, 8);
    var inRot = MAPS.filter(function (m) { return m.inRotation; });
    var outRot = MAPS.filter(function (m) { return !m.inRotation; });

    var html = '<div class="masthead"><h1>VALORANT &mdash; Complete Guide</h1>' +
      '<div>Patch <strong>' + esc(GAME_META.patchVersion) + '</strong> (' + esc(GAME_META.patchBranch) + '), ' +
      'client build ' + esc((GAME_META.buildDate || "").slice(0, 10)) + '.</div>' +
      '<div class="checked">Last checked against valorant-api.com on ' + esc(GAME_META.builtOn) +
      ' &middot; pro stats from vlr.gg accessed ' + esc(VLR_PRO_STATS.fetchedAt) +
      ' &middot; ranked stats accessed ' + esc(RANKED_STATS.fetchedAt) +
      ' &middot; pro settings accessed ' + esc(PRO_SETTINGS.fetchedAt) + '</div></div>';

    html += '<div class="grid cols-2">';
    html += '<div class="card"><h2>Current competitive map pool</h2>' +
      '<div class="pillbar">' + inRot.map(function (m) {
        return '<span class="tag badge-in">' + mapLink(m.name) + '</span>';
      }).join("") + '</div>' +
      '<h3 style="margin-top:14px;">Out of rotation</h3>' +
      '<div class="pillbar">' + outRot.map(function (m) {
        return '<span class="tag badge-out">' + mapLink(m.name) + '</span>';
      }).join("") + '</div>' +
      sourceNote('Map pool inferred from zero-vs-nonzero games played across the 4 most recent ' +
        'completed VCT 2026 regional Stage 2 events (610 maps). See ' +
        '<a href="#/maps">Maps</a> for details and sources.') + '</div>';

    html += '<div class="card"><h2>Top agents in pro play right now</h2><table><thead><tr>' +
      '<th>Agent</th><th>Role</th><th>Pro pick rate</th></tr></thead><tbody>' +
      topPro.map(function (r) {
        return '<tr><td>' + agentLink(r.agent) + '</td><td>' + roleBadge(r.role) + '</td>' +
          '<td><div class="bar-outer"><div class="bar-inner" style="width:' + r.pickRatePct +
          '%"></div></div>' + r.pickRatePct + '%</td></tr>';
      }).join("") + '</tbody></table>' +
      sourceNote('Weighted across VCT 2026 Americas/Pacific/EMEA/China Stage 2 (610 maps). ' +
        'Full source list on the <a href="#/agents">Agents</a> page and in data/raw/vlr_pro_stats.json.') +
      '</div>';
    html += '</div>';

    html += '<div class="grid cols-2">';
    html += '<div class="card"><h2>Start here</h2><ul>' +
      '<li><a href="#/agents">All 29 agents</a> &mdash; roles, abilities, playstyle, difficulty</li>' +
      '<li><a href="#/maps">All 13 maps</a> &mdash; callouts, comps, attack/defense plans, lineups</li>' +
      '<li><a href="#/master-picks">Best agent to master</a> per role</li>' +
      '<li><a href="#/fundamentals">Fundamentals</a> &mdash; crosshair, counter-strafe, economy, trading</li>' +
      '<li><a href="#/settings">Settings &amp; aim</a> &mdash; sensitivity/eDPI, crosshair, aim training</li>' +
      '</ul></div>';
    html += '<div class="card well"><h2>How this guide is built</h2>' +
      '<p class="small">Agent roster, roles and abilities: <a href="https://valorant-api.com" target="_blank" rel="noopener">valorant-api.com</a> ' +
      '(official public data API). Ability costs/keybinds/charges: Valorant Fandom wiki ' +
      '(<a href="https://valorant.fandom.com" target="_blank" rel="noopener">valorant.fandom.com</a>), ' +
      'per-ability Infobox data. Pro pick rates: <a href="https://www.vlr.gg" target="_blank" rel="noopener">vlr.gg</a> ' +
      'event agent-composition pages. Ranked pick/win rates: tracker.gg and blitz.gg. ' +
      'Pro sensitivity data: prosettings.net. Lineup videos: real YouTube results harvested into ' +
      'this machine\'s game library. Every number on this site links back to its source page and access date. ' +
      'Run <code>py build.py</code> to re-pull everything fresh.</p></div>';
    html += '</div>';

    document.getElementById("main").innerHTML = html;
  }

  // ---------------------------------------------------------------------
  function renderAgentList() {
    var roles = ["Duelist", "Initiator", "Controller", "Sentinel"];
    var html = '<h1>Agents</h1><p class="small">All ' + AGENTS.length + ' current agents. Pro pick rate ' +
      'is the overall (all-map) weighted average from vlr.gg; ranked rows show every source that reported that agent.</p>';
    roles.forEach(function (role) {
      var list = AGENTS.filter(function (a) { return a.role === role; });
      html += '<h2>' + roleBadge(role) + ' (' + list.length + ')</h2><div class="grid cols-3">';
      list.forEach(function (a) {
        var c = CONTENT.agents[a.slug];
        var pro = c.proPickRate ? c.proPickRate.pickRatePct + '% pro' : "no pro data";
        html += '<a class="card" style="display:block;" href="#/agents/' + a.slug + '">' +
          '<div class="header-row">' + agentIcon(a, "icon-md") +
          '<div><strong>' + esc(a.name) + '</strong><div class="small">' + esc(c.difficulty) +
          ' &middot; ' + pro + '</div></div></div></a>';
      });
      html += '</div>';
    });
    document.getElementById("main").innerHTML = html;
  }

  function abilityRow(ab) {
    var bits = [];
    if (ab.key) bits.push("Key: " + ab.key);
    if (ab.costCredits) bits.push(ab.costCredits + " credits");
    else if (ab.type === "Signature") bits.push("free (signature)");
    else if (ab.type === "Passive") bits.push("passive");
    if (ab.charges) bits.push(ab.charges.replace(/<[^>]+>/g, "") + " charge(s)");
    if (ab.cooldown) bits.push("cooldown " + ab.cooldown.replace(/<[^>]+>/g, ""));
    if (ab.ultPoints) bits.push(ab.ultPoints.replace(/[♦]/g, "").trim() + " ult points");
    return '<div class="ability-row">' +
      (ab.icon ? '<img src="assets/' + esc(ab.icon) + '" alt="">' : "") +
      '<div><div class="slot">' + esc(ab.type || ab.slot) + '</div>' +
      '<strong>' + esc(ab.name) + '</strong> &mdash; <span class="small">' + esc(bits.join(" · ")) +
      '</span><div style="margin-top:4px;">' + esc(ab.description) + '</div></div></div>';
  }

  function renderAgentDetail(slug) {
    var a = agentBySlug[slug];
    if (!a) { document.getElementById("main").innerHTML = "<h1>Agent not found</h1>"; return; }
    var c = CONTENT.agents[slug];
    var html = '<p><a href="#/agents">&larr; All agents</a></p>';
    html += '<div class="header-row">' + agentIcon(a, "icon-md") +
      '<div><h1 style="margin:0;">' + esc(a.name) + '</h1>' +
      roleBadge(a.role) + '<span class="tag">Difficulty: ' + esc(c.difficulty) + '</span>' +
      (a.releaseDate && a.releaseDate.slice(0, 10) !== "1970-01-01" ?
        '<span class="tag">Released ' + esc(a.releaseDate.slice(0, 10)) + '</span>' :
        '<span class="tag" title="valorant-api.com returns the epoch placeholder for agents with no tracked release date -- typically the original 2020 launch roster">No exact release date on record</span>') +
      '</div></div>';

    html += '<div class="grid cols-2">';
    html += '<div class="card"><h2>Pro play</h2>' +
      (c.proPickRate ? ('<p>Overall pick rate: <strong>' + c.proPickRate.pickRatePct + '%</strong></p>' +
        (c.strongMapsPro.length ? ('<h3>Strongest maps (pro pick rate)</h3><table><tbody>' +
          c.strongMapsPro.map(function (r) {
            return '<tr><td>' + mapLink(r.map) + '</td><td>' + r.pickRatePct + '%</td></tr>';
          }).join("") + '</tbody></table>') : "<p class=\"small\">No per-map breakdown recorded.</p>")) :
        '<p class="unverified">No pro pick-rate data recorded for this agent in the current pull.</p>') +
      sourceNote('vlr.gg, VCT 2026 Stage 2 regional events, accessed ' + esc(VLR_PRO_STATS.fetchedAt) + '.') +
      '</div>';

    html += '<div class="card"><h2>Ranked play</h2>' +
      (c.rankedRows.length ? ('<table><thead><tr><th>Source</th><th>Bracket</th><th>Pick rate</th><th>Win rate</th></tr></thead><tbody>' +
        c.rankedRows.map(function (r) {
          return '<tr><td>' + esc(r.source) + '</td><td>' + esc(r.rankBracket) + '</td>' +
            '<td>' + fmtPct(r.pickRatePct) + '</td><td>' + fmtPct(r.winRatePct) + '</td></tr>';
        }).join("") + '</tbody></table>') :
        '<p class="unverified">No ranked stats recorded for this agent in the current pull.</p>') +
      sourceNote('tracker.gg + blitz.gg, accessed ' + esc(RANKED_STATS.fetchedAt) + '.') +
      '</div>';
    html += '</div>';

    html += '<div class="card"><h2>How to play</h2><p>' + c.playstyle + '</p></div>';

    html += '<div class="card"><h2>Kit</h2>' +
      a.abilities.map(abilityRow).join("") +
      sourceNote('Ability text: valorant-api.com. Cost/keybind/charges/cooldown: Valorant Fandom wiki ' +
        '(per-ability Infobox), accessed via this guide\'s build script.') + '</div>';

    html += '<div class="card"><h2>Tips</h2><ul>' +
      c.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul></div>';

    html += '<div class="card"><h2>Lineups &amp; setups</h2><p>Full lineup diagrams for ' + esc(a.name) +
      ' on every map: <a href="' + c.lineupUrl + '" target="_blank" rel="noopener">lineupsvalorant.com &rarr;</a></p></div>';

    html += clipsBlock("Agent guides", (CLIPS.byAgent[a.name] || []).filter(function (x) {
      return x.section === "Agent guides" || x.section === "Fundamentals";
    }));
    html += clipsBlock(a.name + " on specific maps", (CLIPS.byAgent[a.name] || []).filter(function (x) {
      return x.section === "Agent on this map";
    }));
    html += clipsBlock("Lineups & setups", (CLIPS.byAgent[a.name] || []).filter(function (x) {
      return x.section === "Lineups" || x.section === "Setups" || x.section === "Smokes";
    }));

    document.getElementById("main").innerHTML = html;
  }

  // ---------------------------------------------------------------------
  function renderMapList() {
    var inRot = MAPS.filter(function (m) { return m.inRotation; });
    var outRot = MAPS.filter(function (m) { return !m.inRotation; });
    function grid(list) {
      return '<div class="grid cols-3">' + list.map(function (m) {
        return '<a class="card" style="display:block;" href="#/maps/' + m.slug + '">' +
          (m.listIcon ? '<img src="assets/' + esc(m.listIcon) + '" style="width:100%;border-radius:8px;margin-bottom:8px;">' : "") +
          '<strong>' + esc(m.name) + '</strong><div class="small">' + esc(m.sites) + '</div></a>';
      }).join("") + '</div>';
    }
    var html = '<h1>Maps</h1>';
    html += '<h2><span class="badge-in">In rotation</span> (' + inRot.length + ')</h2>' + grid(inRot);
    html += '<h2 style="margin-top:20px;"><span class="badge-out">Out of rotation</span> (' + outRot.length + ')</h2>' + grid(outRot);
    html += sourceNote('Rotation status inferred from vlr.gg pro play (610 maps across the 4 latest ' +
      'completed VCT 2026 Stage 2 regional events) -- see each map page for detail.');
    document.getElementById("main").innerHTML = html;
  }

  function renderMapDetail(slug) {
    var m = mapBySlug[slug];
    if (!m) { document.getElementById("main").innerHTML = "<h1>Map not found</h1>"; return; }
    var c = CONTENT.maps[slug];
    var html = '<p><a href="#/maps">&larr; All maps</a></p>';
    html += '<div class="header-row"><div><h1 style="margin:0;">' + esc(m.name) + '</h1>' +
      (m.inRotation ? '<span class="badge-in">In rotation</span>' : '<span class="badge-out">Out of rotation</span>') +
      ' <span class="tag">' + esc(m.sites) + '</span></div></div>';

    html += '<div class="two-col">';
    html += '<div class="card minimap-wrap"><h2>Minimap &amp; callouts</h2>' +
      (m.minimap ? '<img src="assets/' + esc(m.minimap) + '" alt="' + esc(m.name) + ' minimap">' : '') + '</div>';
    var calloutsHtml = Object.keys(c.calloutsBySite).sort().map(function (site) {
      return '<h3>Site ' + esc(site) + '</h3><div class="callout-list">' +
        c.calloutsBySite[site].map(function (n) { return "<div>" + esc(n) + "</div>"; }).join("") + '</div>';
    }).join("");
    html += '<div class="card"><h2>Callout list</h2>' + calloutsHtml +
      sourceNote('Callout names: valorant-api.com map data.') + '</div>';
    html += '</div>';

    html += '<div class="card"><h2>Most-played comps in pro play</h2>' +
      (c.proComps ? ('<table><thead><tr><th>Agent</th><th>Role</th><th>Pick rate on ' + esc(m.name) + '</th></tr></thead><tbody>' +
        c.proComps.slice().sort(function (a, b) { return b.pickRatePct - a.pickRatePct; }).map(function (r) {
          var ag = AGENTS.find(function (x) { return x.name === r.agent; });
          return '<tr><td>' + agentLink(r.agent) + '</td><td>' + (ag ? roleBadge(ag.role) : "") + '</td>' +
            '<td>' + r.pickRatePct + '%</td></tr>';
        }).join("") + '</tbody></table>') :
        '<p class="unverified">' + (m.inRotation ?
          'No per-map pro data recorded for this map in the current pull.' :
          'This map was not played in the pro events pulled for this guide (consistent with it being ' +
          'out of the current competitive rotation).') + '</p>') +
      sourceNote('vlr.gg, VCT 2026 Stage 2 regional events, accessed ' + esc(VLR_PRO_STATS.fetchedAt) + '.') +
      '</div>';

    if (c.bestPerRole) {
      html += '<div class="card"><h2>Best agents per role on ' + esc(m.name) + '</h2><div class="grid cols-4">';
      ["Duelist", "Initiator", "Controller", "Sentinel"].forEach(function (role) {
        var rows = c.bestPerRole[role] || [];
        html += '<div><h3>' + roleBadge(role) + '</h3>' + rows.map(function (r) {
          return '<div class="agent-chip">' + agentLink(r.agent) + ' <span class="small">' + r.pickRatePct + '%</span></div>';
        }).join("") + '</div>';
      });
      html += '</div></div>';
    }

    html += '<div class="two-col">';
    html += '<div class="card"><h2>Attack plan</h2><p>' + c.attackPlan + '</p></div>';
    html += '<div class="card"><h2>Defense &amp; retakes</h2><p>' + c.defensePlan + '</p></div>';
    html += '</div>';

    html += '<div class="card"><h2>Key lineups on ' + esc(m.name) + '</h2>' +
      '<p>Agents whose utility is worth drilling map-specific lineups for here: ' +
      c.lineupAgents.map(agentLink).join(", ") + '.</p>' +
      '<p>Full diagrammed lineups: <a href="' + c.lineupUrl + '" target="_blank" rel="noopener">lineupsvalorant.com for ' +
      esc(m.name) + ' &rarr;</a></p></div>';

    html += clipsBlock("Map guide", (CLIPS.byMap[m.name] || []).filter(function (x) { return x.section === "Map guides"; }));
    html += clipsBlock("Entry & executes", (CLIPS.byMap[m.name] || []).filter(function (x) { return x.section === "Entry & executes"; }));
    html += clipsBlock("Defense & retakes", (CLIPS.byMap[m.name] || []).filter(function (x) { return x.section === "Defense"; }));
    html += clipsBlock("Lineups on this map", (CLIPS.byMap[m.name] || []).filter(function (x) {
      return x.section === "Lineups" || x.section === "Setups" || x.section === "Smokes";
    }));

    // Sova/Brimstone/Viper/KAY-O/Killjoy specific lineup blocks when they're relevant here
    ["Sova", "Brimstone", "Viper", "KAY/O", "Killjoy", "Omen", "Astra", "Cypher"].forEach(function (agentName) {
      var key = agentName + "|" + m.name;
      var clips = CLIPS.byAgentMap[key];
      if (clips && clips.length) {
        html += clipsBlock(agentName + " on " + m.name, clips);
      }
    });

    document.getElementById("main").innerHTML = html;
  }

  // ---------------------------------------------------------------------
  function renderMasterPicks() {
    var html = '<h1>Best agent to master, per role</h1>' +
      '<p class="small">Picked from the pulled data: pro pick rate (vlr.gg) weighted by a guide-author ' +
      'difficulty rating, plus average ranked win rate where available. Difficulty is an editorial rating, ' +
      'not from a cited source -- everything else here is.</p>';
    html += '<div class="grid cols-2">';
    CONTENT.masterPicks.forEach(function (mp) {
      var a = agentBySlug[mp.slug];
      html += '<div class="card"><div class="header-row">' + agentIcon(a, "icon-md") +
        '<div><h2 style="margin:0;">' + roleBadge(mp.role) + ' ' + esc(mp.agent) + '</h2>' +
        '<span class="tag">Difficulty: ' + esc(mp.difficulty) + '</span>' +
        (mp.proPickRatePct !== null ? '<span class="tag">Pro pick: ' + mp.proPickRatePct + '%</span>' : '') +
        (mp.rankedAvgWinPct !== null ? '<span class="tag">Ranked win: ' + mp.rankedAvgWinPct + '%</span>' : '') +
        '</div></div><p class="small">' + esc(mp.reason) + '</p>' +
        '<p><a href="#/agents/' + mp.slug + '">Full ' + esc(mp.agent) + ' page &rarr;</a></p></div>';
    });
    html += '</div>';
    document.getElementById("main").innerHTML = html;
  }

  // ---------------------------------------------------------------------
  function listCard(title, items) {
    return '<div class="card"><h2>' + esc(title) + '</h2><ul>' +
      items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + '</ul></div>';
  }

  function renderFundamentals() {
    var F = CONTENT.fundamentals;
    var html = '<h1>Fundamentals</h1>';
    html += listCard("Crosshair placement", F.crosshairPlacement);
    html += listCard("Counter-strafing", F.counterStrafing);

    var E = F.economy;
    html += '<div class="card"><h2>Economy</h2><table><tbody>' +
      '<tr><td>Pistol round starting credits</td><td>' + E.pistolRoundStart + '</td></tr>' +
      '<tr><td>Max credits</td><td>' + E.maxCredits + '</td></tr>' +
      '<tr><td>Per kill</td><td>+' + E.perKill + '</td></tr>' +
      '<tr><td>Spike plant bonus (attackers)</td><td>+' + E.spikePlantBonus + '</td></tr>' +
      '<tr><td>Round win bonus</td><td>+' + E.roundWinBonus + '</td></tr>' +
      '<tr><td>Round loss bonus (1st/2nd/3rd+ in a row)</td><td>+' + E.roundLossBonus.join(" / +") + '</td></tr>' +
      '<tr><td>Survived a loss without planting/after detonation</td><td>+' + E.survivedLossNoBonus + ' only</td></tr>' +
      '</tbody></table><ul>' + E.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + '</ul>' +
      sourceNote(F.source) + '</div>';

    html += listCard("Trading", F.trading);
    html += listCard("Utility usage", F.utilityUsage);
    html += listCard("Learning lineups", F.learningLineups);
    html += listCard("Comms", F.comms);
    html += clipsBlock("Fundamentals videos", CLIPS.fundamentals);
    document.getElementById("main").innerHTML = html;
  }

  function renderSettings() {
    var S = CONTENT.settings;
    var html = '<h1>Settings &amp; aim</h1>';
    html += '<div class="card"><h2>Sensitivity &amp; eDPI</h2><p>' + esc(S.edpiExplainer) + '</p>';
    if (S.edpi) {
      html += '<table><tbody>' +
        '<tr><td>Low</td><td>' + S.edpi.low + '</td></tr>' +
        '<tr><td>Median</td><td>' + S.edpi.median + '</td></tr>' +
        '<tr><td>High</td><td>' + S.edpi.high + '</td></tr>' +
        '</tbody></table><p class="small">' + esc(S.edpi.note) + '</p>';
    }
    html += '<p class="small">Based on ' + S.proPlayerSampleSize + ' current pro players.</p>' +
      sourceNote(S.source) + '</div>';

    var rows = (PRO_SETTINGS.players || []).slice().sort(function (a, b) { return a.edpi - b.edpi; });
    html += '<div class="card"><h2>Pro player sensitivities (sample)</h2>' +
      '<table><thead><tr><th>Player</th><th>Team</th><th>DPI</th><th>Sens</th><th>eDPI</th><th>Resolution</th></tr></thead><tbody>' +
      rows.slice(0, 25).map(function (p) {
        return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.team) + '</td><td>' + p.dpi + '</td><td>' +
          p.sens + '</td><td>' + p.edpi + '</td><td>' + esc(p.resolution) + '</td></tr>';
      }).join("") + '</tbody></table><p class="small">Showing 25 of ' + rows.length +
      ' pulled players, sorted by eDPI low to high.</p></div>';

    html += listCard("Graphics & keybinds", S.graphicsKeybinds);
    html += listCard("Crosshair", S.crosshair);
    html += listCard("Aim training routine", S.aimTraining);
    html += clipsBlock("Settings & aim videos", CLIPS.settingsAim);
    document.getElementById("main").innerHTML = html;
  }

  // ---------------------------------------------------------------------
  // Search index
  var SEARCH_INDEX = [];
  AGENTS.forEach(function (a) {
    SEARCH_INDEX.push({ type: "Agent", name: a.name, hash: "#/agents/" + a.slug });
    a.abilities.forEach(function (ab) {
      SEARCH_INDEX.push({ type: a.name + " ability", name: ab.name, hash: "#/agents/" + a.slug });
    });
  });
  MAPS.forEach(function (m) {
    SEARCH_INDEX.push({ type: "Map", name: m.name, hash: "#/maps/" + m.slug });
    (m.callouts || []).forEach(function (c) {
      if (c.region) SEARCH_INDEX.push({ type: m.name + " callout (Site " + c.site + ")", name: c.region, hash: "#/maps/" + m.slug });
    });
  });
  ["Fundamentals", "Settings & aim", "Best agent to master"].forEach(function (name) {
    var hash = "#/" + name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
    if (name === "Fundamentals") hash = "#/fundamentals";
    if (name === "Settings & aim") hash = "#/settings";
    if (name === "Best agent to master") hash = "#/master-picks";
    SEARCH_INDEX.push({ type: "Section", name: name, hash: hash });
  });

  function renderSearchResults(q) {
    var box = document.getElementById("searchResults");
    if (!q) { box.innerHTML = ""; return; }
    var ql = q.toLowerCase();
    var results = SEARCH_INDEX.filter(function (r) { return r.name.toLowerCase().indexOf(ql) !== -1; }).slice(0, 20);
    if (!results.length) { box.innerHTML = '<div class="small" style="padding:6px;">No matches.</div>'; return; }
    box.innerHTML = results.map(function (r) {
      return '<a class="sr" href="' + r.hash + '">' + esc(r.name) + '<div class="kind">' + esc(r.type) + '</div></a>';
    }).join("");
  }

  // ---------------------------------------------------------------------
  var ROUTES = {
    "": renderHome,
    "home": renderHome,
    "agents": renderAgentList,
    "maps": renderMapList,
    "master-picks": renderMasterPicks,
    "fundamentals": renderFundamentals,
    "settings": renderSettings,
  };

  function setActiveNav(page) {
    document.querySelectorAll("#navlist a").forEach(function (a) {
      a.classList.toggle("active", a.dataset.page === page);
    });
  }

  function router() {
    var hash = location.hash.replace(/^#\//, "");
    var parts = hash.split("/").filter(Boolean);
    var page = parts[0] || "";
    window.scrollTo(0, 0);
    if (page === "agents" && parts[1]) { renderAgentDetail(parts[1]); setActiveNav("agents"); return; }
    if (page === "maps" && parts[1]) { renderMapDetail(parts[1]); setActiveNav("maps"); return; }
    var fn = ROUTES[page] || renderHome;
    fn();
    setActiveNav(page || "home");
  }

  function buildNav() {
    var nav = document.getElementById("navlist");
    var items = [
      ["home", "Home"], ["agents", "Agents"], ["maps", "Maps"],
      ["master-picks", "Best agent to master"], ["fundamentals", "Fundamentals"],
      ["settings", "Settings & aim"],
    ];
    nav.innerHTML = items.map(function (i) {
      return '<a href="#/' + i[0] + '" data-page="' + i[0] + '">' + i[1] + '</a>';
    }).join("");
  }

  document.getElementById("patchLine").textContent =
    "Patch " + GAME_META.patchVersion + " \u2014 built " + GAME_META.builtOn;
  buildNav();
  document.getElementById("searchBox").addEventListener("input", function (e) {
    renderSearchResults(e.target.value.trim());
  });
  window.addEventListener("hashchange", router);
  router();
})();
