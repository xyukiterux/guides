/* Field Guide pages. Loaded by app.js the first time a page other than Home or Search is opened.
   Each page is a function that fills <main>; app.js loads the data pieces the page needs before calling it.
   All imported text is rendered through textContent; no HTML injection. */
'use strict';
(() => {
const TG=window.TG;
const {D,G,E,heroes,byKey,main,STAT_KEYS,MKEY,setFac,playFaction,playable,validateTeam,cleanProfile,fresh,save,notify,el,text,tag,panel,grid,button,link,arr,words,safeURL,external,srcLink,evidence,image,more,title,brief,field,select,input,fixName,regionLabel,headerContext,card,howBox,howto,render}=TG;
/* The saved profile lives in app.js; pages read and change it through this name. */
let profile=TG.profile;
D.v2=D.v2||{};
const V=D.v2;
/* Full meta data (g-meta) when the page loaded it; the short faction index from the core otherwise. */
const MF=()=>G.meta_factions||TG.MF;
const shownFactions=h=>{const p=playFaction(h);return [p,...h.factions.filter(f=>f!==p&&f!==':re')];};
const cleanNote=n=>{const m=/^How you get it: (.*?)(?:\. Use: .*)?$/.exec(n);return m?'How to get it: '+m[1].replace(/\.$/,'')+'.':n.replace(/^Launch-schedule banner, /,'Launch banner, ');};
function codex(){title('CHARACTERS','All 143 characters.','Tap one for skills, builds and teams.',['The list includes 20 R and SR units that older lists left out.','Being listed does not prove a character is available on your server today.']);main.append(howBox(G.howto.characters,'How to build a character',G.howto_sources.characters));main.append(starsGuide(false));
 const q=input('','search',{placeholder:'Name, variant, alias, skill or ID','aria-label':'Filter characters'}), rarity=select(['All rarities',...new Set(heroes.map(h=>h.rarity))],'All rarities'), attr=select(['All attributes',...new Set(heroes.map(h=>h.attribute).filter(Boolean))],'All attributes'), faction=select(['All factions',...new Set(heroes.flatMap(h=>h.factions).filter(f=>f!==':re'))],'All factions'), owned=select(['All characters','Owned','Favorites','Missing artwork','Announced / placeholder'],'All characters');
 const filters=el('div',{class:'filters'},el('div',{class:'field wide'},field('Search roster',q)),field('Rarity',rarity),field('Attribute',attr),field('Faction',faction),field('Collection',owned));const count=text('','results-count'),out=el('div',{class:'roster'});main.append(filters,count,out);
 const apply=()=>{const term=q.value.toLowerCase();const rows=heroes.filter(h=>(!term||[h.name,h.key,...h.aliases,...h.roles,(D.herotext||{})[h.key]||''].join(' ').toLowerCase().includes(term))&&(rarity.value==='All rarities'||h.rarity===rarity.value)&&(attr.value==='All attributes'||h.attribute===attr.value)&&(faction.value==='All factions'||h.factions.includes(faction.value))&&(owned.value==='All characters'||(owned.value==='Owned'&&profile.owned[h.key]!==undefined)||(owned.value==='Favorites'&&profile.favorites.includes(h.key))||(owned.value==='Missing artwork'&&!h.portrait)||(owned.value==='Announced / placeholder'&&!playable(h))));count.textContent=rows.length+' of '+heroes.length+' characters';out.replaceChildren(...rows.map(card));if(!rows.length)out.append(text('No matches. Try a different variant or clear a filter.','empty'));};for(const n of[q,rarity,attr,faction,owned])n.addEventListener(n===q?'input':'change',apply);apply();
}
function heroDetail(key,tabName='overview'){
 if(!byKey.has(key)){const m=heroes.find(x=>(x.legacy_keys||[]).includes(key));if(m)key=m.key;}   // old links (e.g. upcoming-hinami-halloween)
 const h=(D.hero||{})[key];if(!h){title('NOT FOUND','Character unavailable.');main.append(link('Return to the codex','#characters'));return;}
 main.append(link('← Character codex','#characters','back'));
 const own=button(profile.owned[key]!==undefined?'Owned · '+profile.owned[key]+'★':'Mark as owned',()=>{if(!playable(h)){notify('This character is not released yet.');return;}if(profile.owned[key]!==undefined)delete profile.owned[key];else profile.owned[key]=0;save();render();},'primary');if(!playable(h))own.disabled=true;
 const fav=button(profile.favorites.includes(key)?'★ Favorited':'☆ Favorite',()=>{profile.favorites=profile.favorites.includes(key)?profile.favorites.filter(x=>x!==key):[...profile.favorites,key];save();render();});
 main.append(el('section',{class:'detail-hero'},image(h.portrait,fixName(h.name),'',true),el('div',{},el('p',{class:'eyebrow'},'CHARACTER'),el('h1',{},fixName(h.name)),tag(h.rarity),tag(h.attribute||'Attribute unknown','cyan'),...shownFactions(h).map(f=>tag(f)),h.status==='archived'?null:tag(h.status==='announced'?'Not released yet':h.status==='datamined'?'New: fan datamine':'Placeholder','gold'),el('div',{class:'actions'},own,fav))));
 if(profile.owned[key]!==undefined){main.append(field('Your star level',select([0,1,2,3,4,5,6].map(n=>[String(n),n+'★']),String(profile.owned[key]),v=>{profile.owned[key]=Number(v);save();headerContext();})));main.append(statsBox(key));}
 const tabs=['overview','build','obtain','teams','videos'];main.append(el('div',{class:'tabs','aria-label':'Character sections'},tabs.map(t=>button(t==='obtain'?'How to obtain':t[0].toUpperCase()+t.slice(1),()=>{location.hash='hero/'+key+'/'+t;}))));Array.from(main.querySelectorAll('.tabs button')).forEach((b,i)=>b.setAttribute('aria-pressed',tabs[i]===tabName));
 if(tabName==='overview'){
  const dm=h.source==='fan-datamine';const skills=panel(el('h2',{},'Skills & passives'),dm?tag('Fan datamine, October 26, 2026','gold'):tag('Game data, September 22, 2026','cyan'),dm?text(h.status_note,'notice'):null,dm&&G.spotlight&&G.spotlight.some(x=>x.id===key)?link('How she works, teams and verdict →','#new','button'):null);
  if(h.kit){const unsure=i=>h.kit.star_order_from_data===false&&/star preview/.test(h.passives[i]?.when||'');for(const[k,n]of[['active','Active skill · levels & 6★ change'],['p1','Innate passive'],['p2','1★ passive'],['p3','3★ passive'],['p4_burst_4star','4★ power-burst effect'],['p5_weak_2star','2★ Weak effect']]){if(!h.kit[k])continue;const i=['p1','p2','p3'].indexOf(k),u=i>=0&&unsure(i);const tagStar=i>=0&&!u&&(/^\[(\d)★\]/.exec(h.kit[k])||[])[1],head=tagStar?{0:'Innate passive',1:'1★ passive',3:'3★ passive'}[tagStar]||n:n;skills.append(el('div',{class:'skill'},el('h3',{},u?'Passive '+(i+1)+' · unlock star not confirmed':head),text(u?h.kit[k].replace(/^\[\d★\]\s*/,''):h.kit[k])));}if([0,1,2].some(unsure))skills.prepend(text('The game data does not confirm which star unlocks some of these passives. Check the star preview in game.','notice'));if(h.kit.had_effect_placeholder)skills.prepend(text('Some numbers are missing from the game text. Check the exact effect in game.','notice'));}else skills.append(text('The full skill text for this character is not available yet.','notice'));
  const facts=panel(el('h2',{},'At a glance'),text('Role: '+(h.roles.join(', ')||'Not listed'),'muted'),targetStars(key),text('Also called: '+[...new Set(h.aliases.map(fixName))].join(' · '),'subtle'),text('Check in game how to get it on your server.','notice'),h.acquisition.archived_notes[0]?text(cleanNote(h.acquisition.archived_notes[0]),'subtle'):null,h.rarity_evidence?.note?more(['Rarity: '+h.rarity+' in the old guide; the game text may call it SP. Check in game.'],'Rarity note'):null,external('Fan database entry',h.source_url),evidence(h));main.append(el('div',{class:'grid two'},skills,facts));
 }else if(tabName==='build'){
  main.append(el('div',{class:'grid two'},panel(el('h2',{},'Star upgrades'),text('What each star unlocks, from the game data.','muted'),h.stars.length?el('div',{class:'flow'},h.stars.map((s,i)=>el('div',{class:'step'},el('strong',{},(i+1)+'★'),words(s)))):text('Star data is missing. Check in game.','notice'),targetStars(key),buildBox(key),starsGuide(false)),panel(el('h2',{},'Orb, cells & potential'),h.orb?image(h.orb,'Ability sphere for '+fixName(h.name)):null,text(h.sphere?fixName(h.sphere):'Upgrade costs for the orb are not known.','muted'),link('Open cells & potential →','#cells'))));
  usedIn(key);
 }else if(tabName==='obtain'){
  const routes=Object.entries(h.acquisition.routes),known=routes.filter(([,v])=>v!==null),titleCase=s=>s.replaceAll('_',' ').replace(/(^|\s)\w/g,c=>c.toUpperCase());const routeTable=rs=>el('div',{class:'table-wrap'},el('table',{},el('thead',{},el('tr',{},['Route','Availability'].map(x=>el('th',{},x)))),el('tbody',{},rs.map(([route,value])=>el('tr',{},el('td',{},titleCase(route)),el('td',{},value===null?'Unknown: check in game':words(value)))))));const hint=G.tiers.find(x=>x.id===key)?.get;main.append(panel(el('h2',{},'How to obtain'),hint?text('From the tier list: '+hint,'muted'):null,text(known.length?'Check your game: these routes may differ on your server.':'No route is confirmed for your server yet. Check the shop, banners and events in game.','notice'),known.length?routeTable(known):null,routes.length>known.length?more([routeTable(routes.filter(([,v])=>v===null))],'Routes with no data yet'):null,el('h3',{},'Notes from the old guide'),h.acquisition.archived_notes.length?el('ul',{class:'list'},h.acquisition.archived_notes.map(n=>el('li',{},cleanNote(n)))):text('The old guide has no note on how to get this character.','muted'),el('div',{class:'actions'},link('Banners','#banners','button'))));
 }else if(tabName==='teams'){if(G.spotlight&&G.spotlight.some(x=>x.id===key))main.append(link('Her teams are on the New unit page →','#new','button'));usedIn(key,true);main.append(link('Open team builder','#teams','button primary'));
 }else{const terms=[h.name.split(' [')[0].split(' ')[0],h.name.match(/\[(.*?)\]/)?.[1]].filter(Boolean);const rows=D.videos.filter(v=>terms.some(t=>[v.title,v.what_it_shows].join(' ').toLowerCase().includes(t.toLowerCase())));main.append(text('These videos match the name in their title or topic. They may cover a different version.','notice'),grid(rows.map(videoCard)));if(!rows.length)main.append(link('Search all videos','#videos'));}
}
function usedIn(key,always){const cards=[...G.faction_teams.map(f=>({...f,title:f.title+' meta team',id:'faction-'+f.id})),...G.teams].filter(t=>t.rows.some(r=>r.units.includes(key)));if(!cards.length){if(always)main.append(text('No team on Best teams uses this character yet.','notice'));return;}main.append(el('div',{class:'section-head'},el('h2',{},'Used on Best teams')),el('ul',{class:'list used-in'},cards.map(t=>el('li',{},link(t.title+' →','#best-teams/'+t.id)))));}
const short=id=>G.names[id]||byKey.get(id)?.name||id;
const TIER_NAME={starter:'Starter',mid:'Mid',endgame:'Endgame'};
const getTag=id=>(G.obtain||{})[id];
/* Banners the guide calls "live" carry their last day here. Once that day has passed on the reader's device, every
   "live" label for them reads "ended <date>" instead (the text about the banner is content and is not changed). */
const LIVE_UNTIL={'halloween-hinami':{unit:'1180',day:'2026-11-08',date:'November 8, 2026',short:'Nov 8, 2026'}};
const todayISO=()=>new Date().toLocaleDateString('en-CA');
const endedBanner=id=>{const b=LIVE_UNTIL[id];return b&&todayISO()>b.day?b:null;};
const endedUnit=id=>Object.keys(LIVE_UNTIL).map(endedBanner).find(b=>b&&b.unit===id)||null;
const tagText=id=>{const g=getTag(id);if(!g)return '';const e=g.kind==='live'&&endedUnit(id);return e?'Banner (ended '+e.short+')':g.tag;};
function unitFig(id,i,backup=true){const h=byKey.get(id),bu=backup&&i===4,g=getTag(id),fac=h?FAC_ID[playFaction(h)]:null;return el('a',{href:'#hero/'+id,class:'unit'+(bu?' backup':''),'data-f':fac||null},el('span',{class:'frame'},image(h?.portrait,short(id),'',true)),el('span',{class:'uname'},short(id)),bu?el('small',{class:'bu'},'Back-up'):null,g?el('small',{class:'get g-'+g.tier,title:'How to get: '+(window.TGI18N?window.TGI18N.t(tagText(id)):tagText(id))+' ('+TIER_NAME[g.tier]+')'+(g.fallback?'. Window over? '+g.fallback:'')},tagText(id)):null);}
const FAC_ID={'No Organization':'noorg','Aogiri Tree':'aogiri','Anteiku':'anteiku','CCG':'ccg'};
function startHere(){title('START HERE','Six steps for a new account.','Do them in order. Each step has more details if you want them.');
 main.append(el('h2',{class:'steps-head'},'How to play: your first days'),el('ol',{class:'steps'},G.start.map(s=>el('li',{},el('strong',{},s.step),more([el('ul',{class:'list'},s.more.map(m=>el('li',{},m))),s.link?link(s.link[0]+' →',s.link[1]):null,text('Source: '+s.source,'subtle')])))));
 main.append(more([text('These steps come from the October 19 article.'),el('div',{class:'actions'},link('Full article: planner by server day','legacy/index.html','button'),link('Full article: early, mid and end game','legacy/path.html','button'))],'Sources and full articles'));
}
function attackOrder(o){if(!o)return null;const d=o.kind==='derived';return el('details',{class:'more attack','data-order':o.kind},el('summary',{},'Attack order'),o.note?text(o.note,'subtle'):null,el('ol',{class:'attack-order'},o.steps.map(s=>el('li',{},s))),...(d?[text(G.derived_label,'order-kind'),text('Nobody has tested this order in a fight. '+o.source,'subtle')]:[text('Source: '+o.source,'subtle')]));}
function swapList(r){if(!r.swaps||!r.swaps.length)return null;return el('div',{class:'swaps-box'},el('h3',{},'Don’t have one?'),el('ul',{class:'list swap-ideas'},r.swaps.map(x=>el('li',{},'No '+short(x.unit)+'? Use '+x.alts.map(a=>short(a.unit)+' ('+a.why+')').join(' or ')+'.'))),text(G.obtain_info.swap_note,'subtle'));}
/* bu / su come from the character index (build.py): some skill works from the back-up slot; passive unlock stars not confirmed. */
const worksFromBackup=k=>{const h=byKey.get(k);return !h||!!h.bu;};
const starsUnsure=k=>!!(byKey.get(k)||{}).su;
function rowChecks(r){const out=[],bu=r.backup!==false&&r.units.length===5?r.units[4]:null;if(bu&&!worksFromBackup(bu))out.push(text('Back-up: none of '+short(bu)+'’s skills say they work from back-up, so this slot only helps once it enters the field.','subtle check'));const s=r.units.filter(starsUnsure);if(s.length)out.push(text('Passive stars not confirmed for '+s.map(short).join(', ')+': check the star preview in game.','subtle check'));return out;}
function teamRow(r){const why=r.why.filter(x=>!/^(Source|Fonte|Fuente): /.test(x)),src=r.why.find(x=>/^(Source|Fonte|Fuente): /.test(x)),sw=swapList(r);return el('div',{class:'team-row'+(r.best?' best-row':'')},el('p',{class:'row-label'},r.best?el('a',{href:'#best-teams/faction-'+r.best},r.label):r.label),el('div',{class:'units'},r.units.map((u,i)=>unitFig(u,i,r.backup!==false))),more([el('ul',{class:'list'},why.map(x=>el('li',{},x))),...rowChecks(r),src?text(src,'subtle'):null,sw],'Why this team?'),attackOrder(r.order));}
function factionCard(f){return el('section',{class:'panel team-card faction-card',id:'team-faction-'+f.id},el('h2',{},f.title),...f.rows.map(teamRow),f.none?text(f.none,'notice no-team'):null);}
/* 10-28 chunk 3: every faction's team for this fight (guide.json meta_factions items linked by card), so each boss and mode has several teams. */
function factionAlts(t){const alts=G.meta_factions.map(f=>({f,it:f.items.find(i=>i.card===t.id&&i.rows&&i.rows.length)})).filter(x=>x.it);if(!alts.length)return null;
 return el('section',{class:'faction-alts'},el('h3',{},'Teams from every faction'),text('One team per faction for this fight, from Meta teams. Each team says whether it comes from a source or is worked out from skills.','muted'),
  el('div',{class:'meta-items'},alts.map(({f,it})=>el('details',{class:'meta-item'},el('summary',{},el('span',{class:'meta-title'},f.title,' · ',it.title),' ',itemTag({rows:[it.rows[0]]})),metaRow(it.rows[0],true),link('All '+f.title+' teams →','#meta/'+f.id)))));}
/* 10-28 chunk 9: creator builds (guide.json builds). */
function buildBox(id){const B=G.builds;if(!B||!G.tiers.some(x=>x.id===id))return null;const u=B.per_unit[id];return el('div',{class:'target-stars build-box'},el('p',{class:'row-label'},'Build (creators)'),u?[text(u.build),text(B.unit_note,'subtle'),text('Source: '+u.source,'subtle'),el('p',{class:'subtle'},el('span',{class:'amount'},u.channels+(u.channels===1?' channel':' channels')))]:text(B.none,'muted'),link('General build rules →','#cells'));}
function buildRules(){const B=G.builds;if(!B)return null;return el('section',{class:'build-rules',id:'builds'},el('div',{class:'section-head'},el('h2',{},B.title)),text(B.intro,'muted'),el('ul',{class:'buy-list'},B.rules.map(r=>el('li',{},el('p',{},el('span',{class:'amount'},r.channels?r.channels+(r.channels===1?' channel':' channels'):r.label),' — ',r.text),text('Source: '+r.source,'subtle')))),text('Sources: '+B.sources.join('; '),'subtle'));}
/* 10-28 chunk 10b: best current video per topic (guide.json video_picks). */
function videoPicks(){const V=G.video_picks;if(!V)return null;return el('details',{class:'more video-picks',open:''},el('summary',{},V.title),text(V.intro,'muted'),
 el('ul',{class:'buy-list'},V.picks.map(p=>{const u=p.videos.url,v=D.videos.find(x=>x.url&&u.slice(-11)===(x.url.match(/[\w-]{11}$/)||[''])[0]);return el('li',{},el('p',{},el('strong',{},p.topic)),text(p.why,'muted'),safeURL(u)?el('p',{},el('a',{href:u,target:'_blank',rel:'noopener noreferrer',class:'text-link'},v?v.title:'Open the video',el('span',{'aria-hidden':'true'},' ↗'))):null);})),
 text(V.gap,'notice'),text('Source: '+V.source,'subtle'));}
function bestCard(t){const boss=t.kind==='boss';return el('section',{class:'panel team-card'+(boss?' boss-card':''),id:'team-'+t.id},boss&&t.mode?el('p',{class:'card-mode'},t.mode):null,el('h2',{},t.title),howBox(t.play,boss?'How to fight this boss':'How to play'),...t.rows.map(teamRow),factionAlts(t),more([el('ul',{class:'list'},t.more.map(x=>el('li',{},x))),t.disagree?text(t.disagree,'notice'):null,el('h3',{},'Sources'),el('ul',{class:'list'},t.sources.map(x=>el('li',{},x))),el('div',{class:'actions'},t.lab?link('Boss skills in the Boss Lab →','#bosses/'+t.lab,'button'):null,t.id==='guild-war'?link('Stronghold Takeover guide →','#modes/stronghold','button'):t.id==='carnival'?link('Carnival guide →','#modes/carnival','button'):null,link('Full article →',t.article,'button'))]));}
function jumpTo(id){const n=document.getElementById(id);if(n)n.scrollIntoView({block:'start'});}
function bestTeams(id){title('BEST TEAMS','The team for each situation.');howto('best-teams');main.append(text('Each card shows our pick first, then a free-to-play option. Tap a portrait to open that character.','muted'));
 const modes=G.teams.filter(t=>t.kind!=='boss'),bossCards=G.teams.filter(t=>t.kind==='boss');
 main.append(el('div',{class:'jump',role:'group','aria-label':'Jump to a team'},[button('Meta teams by faction',()=>jumpTo('team-factions')),...[...modes,...bossCards].map(t=>button(t.title.replace(/^World Boss (\d): .*/,'World Boss $1'),()=>jumpTo('team-'+t.id)))]));
 main.append(el('h2',{class:'group-head',id:'team-factions'},'Meta teams by faction'),text('The strongest team for each faction, with the order to cast in.','muted'),el('div',{class:'team-cards'},G.faction_teams.map(factionCard)));
 main.append(el('h2',{class:'group-head'},'Modes'),el('div',{class:'team-cards'},modes.map(bestCard)));
 main.append(el('h2',{class:'group-head',id:'bosses-head'},'Bosses'),el('div',{class:'team-cards'},bossCards.map(bestCard)));
 main.append(more([text('The sources give tips, but not a full team, for these bosses.'),el('ul',{class:'list'},G.no_team.map(n=>el('li',{},el('strong',{},n.name+': '),n.tip))),text('Source: '+G.no_team_source,'subtle')],'Other bosses: tips only'));
 if(id)setTimeout(()=>jumpTo('team-'+id),0);
}
/* Round 7: Meta teams by faction, challenge catalog, "What should I run?" recommender. */
const facById=id=>MF().find(f=>f.id===id);
function getFac(){try{const v=localStorage.getItem(MKEY);return facById(v)?v:'';}catch(e){return '';}}
function kindLine(r){return r.team_kind==='derived'?el('p',{class:'kind-label derived'},G.derived_label):el('p',{class:'kind-label sourced'},'Sourced team');}
/* When every team in an item is worked out, the label is shown once above them; otherwise on each team. */
const allDerived=rows=>rows.length>0&&rows.every(r=>r.team_kind==='derived');
const itemKind=rows=>allDerived(rows)?el('p',{class:'kind-label derived item-kind'},G.derived_label+' All teams below.'):null;
const tierChip=t=>el('span',{class:'tier-chip t-'+t},TIER_NAME[t]);
function metaRow(r,showKind=true,chip=true){return el('div',{class:'team-slot','data-kind':r.team_kind,'data-tier':r.tier||null},(chip&&r.tier)||r.slot?el('p',{class:'slot-where'},chip&&r.tier?tierChip(r.tier):null,r.slot?el('span',{},r.slot):null):null,showKind?kindLine(r):null,teamRow({...r,best:null}));}
const TKEY='tgbtc-meta-tier',TIDS=['starter','mid','endgame'];
function getTier(){try{const v=localStorage.getItem(TKEY);return TIDS.includes(v)?v:'starter';}catch(e){return 'starter';}}
function setTier(v){try{localStorage.setItem(TKEY,v);}catch(e){}}
/* Three levels per faction: tabs (Starter / Mid / Endgame), each with 2-3 different teams. */
function tierTabs(f){const cur=getTier(),tabs=[],panels=[];
 const pick=id=>{setTier(id);tabs.forEach(b=>{const on=b.dataset.tier===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});panels.forEach(p=>{p.hidden=p.dataset.tier!==id;});};
 for(const t of f.tiers){const pid='tier-'+f.id+'-'+t.id;
  const b=el('button',{type:'button',role:'tab',class:'tier-tab t-'+t.id,id:pid+'-tab','data-tier':t.id,'aria-controls':pid,'aria-selected':String(t.id===cur),tabindex:t.id===cur?'0':'-1'},el('span',{class:'tab-name'},t.name),el('small',{},t.rows.length+' teams'));
  b.addEventListener('click',()=>pick(t.id));tabs.push(b);
  const paths=t.paths.length?el('section',{class:'upgrade'},el('h4',{},'Upgrade path'),el('ul',{class:'list'},t.paths.map(x=>el('li',{},el('strong',{},x.row+': '),'start from “'+x.base+'” and replace '+x.swaps.map(w=>short(w.from)+' with '+short(w.to)+' ('+w.tag+')').join(', then ')+'.')))):null;
  const late=[...new Set(t.rows.flatMap(r=>r.units))].filter(u=>getTag(u)&&getTag(u).fallback);const notes=[late.length?text(G.obtain_info.window_note+late.map(u=>short(u)+': '+getTag(u).fallback).join('; ')+'.','notice'):null,text(G.obtain_info.shop_note),text(G.obtain_info.card_note),t.id==='starter'&&f.budget_note?text(f.budget_note):null,text('Source of the tags: '+G.obtain_info.source,'subtle')];
  const p=el('section',{class:'tier-panel t-'+t.id,role:'tabpanel',id:pid,'data-tier':t.id,'aria-labelledby':pid+'-tab'},el('p',{class:'tier-blurb'},tierChip(t.id),' ',t.blurb),paths,itemKind(t.rows),...t.rows.map(r=>metaRow(r,!allDerived(t.rows),false)),more(notes,'How the tags work'));
  p.hidden=t.id!==cur;panels.push(p);}
 const list=el('div',{class:'tier-tabs',role:'tablist','aria-label':'Pick your level'},tabs);
 list.addEventListener('keydown',e=>{const i=TIDS.indexOf(getTier());const n=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!n)return;e.preventDefault();const id=f.tiers[(i+n+3)%3].id;pick(id);tabs.find(b=>b.dataset.tier===id).focus();});
 return el('div',{class:'tiers'},list,...panels);}
function itemTag(it){if(!it.rows.length)return tag('No team','gold');const k=new Set(it.rows.map(r=>r.team_kind));return k.size>1?tag('Sourced + not tested'):k.has('sourced')?tag('Sourced','cyan'):tag('Not tested','gold');}
function factionPicker(sel){return el('div',{class:'faction-picker',role:'group','aria-label':'Pick a faction'},MF().map(f=>el('a',{href:'#meta/'+f.id,class:'faction-pick'+(f.id===sel?' on':''),'data-f':f.id,'aria-current':f.id===sel?'true':null,on:{click:()=>setFac(f.id)}},el('span',{class:'frame'},image(byKey.get(f.icon)?.portrait,'','')),el('span',{},f.name))));}
function roadmap(H='h3'){const R=G.roadmap;return more([el(H,{},'Why you need all four'),el('ul',{class:'list'},R.why.map(w=>el('li',{},w.text,el('br'),el('span',{class:'subtle'},'Source: '+w.source)))),el(H,{},'A sensible order'),el('ol',{class:'list roadmap-order'},R.order.map(o=>el('li',{},el('strong',{},facById(o.faction)?.name+': '),o.text,el('br'),el('span',{class:'subtle'},o.kind==='sourced'?'Source: '+o.source:'Our order (worked out from the sources; no source states it).')))),text(R.derived_note,'subtle'),text(R.disagree,'notice')],'Why build all four factions?');}
function metaLinks(){return el('div',{class:'actions meta-links'},link('What should I run? →','#run','button'),link('Challenge catalog →','#challenges','button'),link('Spend or free: which units to build →','#tiers','button'));}
function metaPage(id){
 let sel=facById(id)?id:getFac();if(facById(id))setFac(id);
 title('META TEAMS','Pick your faction.',sel?null:'Each faction shows its teams for every fight. Your pick is remembered on this device.');
 main.append(factionPicker(sel));
 if(!sel){main.append(metaLinks(),roadmap('h2'));return;}
 const f=facById(sel);
 const view=el('section',{class:'faction-view','data-faction':f.id,'data-f':f.id,'aria-label':f.title+' teams'});
 view.append(el('h2',{class:'faction-title'},f.title),text('Pick your level. Every unit shows how to get it.','muted'),tierTabs(f));
 view.append(el('h2',{class:'group-head'},'Every fight'),text('Tap a fight for its team and attack order.','muted'));
 for(const g of [...new Set(f.items.map(i=>i.group))]){
  view.append(el('h3',{class:'meta-group'},g),el('div',{class:'meta-items'},f.items.filter(i=>i.group===g).map(it=>el('details',{class:'meta-item',id:'meta-'+it.id},el('summary',{},el('span',{class:'meta-title'},it.title),' ',itemTag(it)),text(it.tip,'meta-tip'),it.none?text(it.none,'notice no-team'):null,...[...new Set(Object.values(it.tier_notes||{}))].map(v=>el('p',{class:'tier-note'},...Object.keys(it.tier_notes).filter(k=>it.tier_notes[k]===v).map(tierChip),' ',v)),itemKind(it.rows),...it.rows.map(r=>metaRow(r,!allDerived(it.rows))),it.extra?text(it.extra,'subtle'):null,it.card?link('Full card on Best teams →','#best-teams/'+it.card):null))));
 }
 main.append(view,metaLinks(),roadmap());
}
const watchVideo=id=>{const v=D.videos.find(x=>x.id===id);return v&&safeURL(v.url)?el('li',{},external('Watch: '+v.title.replace(/\s*[|·]\s*Tokyo Ghoul.*$/i,'').trim()+' ('+v.channel+')',v.url)):null;};
function challenges(openId){title('CHALLENGES','Events with entry rules.','Tap one: who can enter, the team, and how to do it.');
 const C=G.challenges;for(const g of [...new Set(C.map(c=>c.group))]){
  main.append(el('h2',{class:'group-head'},g),el('div',{class:'meta-items'},C.filter(c=>c.group===g).map(c=>{const vids=c.videos.map(watchVideo).filter(Boolean);return el('details',{class:'meta-item challenge',id:'ch-'+c.id},el('summary',{},el('span',{class:'meta-title'},c.title)),el('p',{class:'rule'},el('strong',{},'Who can enter: '),c.rule),text('Source: '+c.rule_source,'subtle'),itemKind(c.rows),...c.rows.map(r=>metaRow(r,!allDerived(c.rows))),c.plan?el('section',{class:'plan'},el('h3',{},'How to do it, in order'),el('ol',{class:'attack-order'},c.plan.steps.map(s=>el('li',{},s))),text('Source: '+c.plan.source,'subtle')):null,c.more.length?el('ul',{class:'list'},c.more.map(m=>el('li',{},m))):null,vids.length?el('ul',{class:'list watch'},vids):null);})));
 }
 if(openId){const n=document.getElementById('ch-'+openId);if(n){n.open=true;n.dataset.scrollHere='';}}
}
/* Recommender: ranks every guide team (4+ units) by how many of its units you own. */
/* Recommender: one card per distinct line-up (4+ units), listing every fight the guide uses it for. */
function recTeams(){const by=new Map();const add=(units,ctx,r,fac)=>{if(units.length<4)return;const k=units.slice(0,4).slice().sort().join()+'|'+(units[4]||'');let t=by.get(k);if(!t){t={units,uses:[],facs:new Set(),row:r};by.set(k,t);}t.facs.add(fac);if(!t.uses.some(u=>u.ctx===ctx))t.uses.push({ctx,kind:r.team_kind});};
 for(const f of MF()){for(const t of f.tiers)for(const r of t.rows)add(r.units,f.name+' · '+t.name+': '+r.label,r,f.id);for(const it of f.items)for(const r of it.rows)add(r.units,(it.id==='trial'?'':f.name+' · ')+it.title,r,f.id);}
 for(const c of G.challenges)for(const r of c.rows)add(r.units,c.title,r,'any');return [...by.values()].map(t=>({...t,kind:t.uses.some(u=>u.kind==='sourced')?'sourced':'derived'}));}
const norm=s=>fixName(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=[...Array(n+1).keys()];for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];}
function matchUnit(q,pool){const t=norm(q);if(!t)return null;const qt=t.split(' ');const tol=x=>Math.max(1,Math.floor(x.length/4));let best=null,bs=1e9;for(const k of pool){const h=byKey.get(k);if(!h)continue;const names=[short(k),h.name,...h.aliases].map(norm);for(const nm of names){let s;const w=nm.split(' ');if(nm===t)s=0;else if(nm.split(' ').some(x=>x.startsWith(t))||nm.startsWith(t))s=0.5+nm.length/100;else if(nm.includes(t))s=1+nm.length/100;else{/* word by word: every typed word must be close to some word of the name ("blak rabit" -> Black Rabbit) */const d=qt.map(q=>Math.min(...w.map(x=>lev(x,q))));if(d.some((v,n)=>v>tol(qt[n])))continue;s=2+d.reduce((a,b)=>a+b,0)+(w.length-qt.length)/100;}if(s<bs){bs=s;best=k;}}}return best;}
function bestSwap(miss,team,owned,used=[],backupSlot=false){const m=byKey.get(miss);if(!m)return null;let best=null,bs=0,why='';for(const k of owned){if(team.includes(k)||used.includes(k)||(backupSlot&&!worksFromBackup(k)))continue;const h=byKey.get(k);if(!h)continue;const fac=playFaction(h)===playFaction(m),att=h.attribute===m.attribute,role=h.roles.some(r=>m.roles.includes(r));const s=(fac?3:0)+(att?2:0)+(role?1:0);if(s>bs){bs=s;best=k;why=[fac?'same faction':null,att?'same attribute':null,role?'same role':null].filter(Boolean).join(', ');}}return bs>=2?{key:best,why}:null;}
function recommender(){title('WHAT SHOULD I RUN?','Tick what you own.','The guide’s teams are ranked by how many of their units you own.');
 const rec=recTeams(),pool=[...new Set(rec.flatMap(t=>t.units))].filter(k=>byKey.has(k)).sort((a,b)=>short(a).localeCompare(short(b)));
 const isOwned=k=>profile.owned[k]!==undefined;
 const typed=input('','text',{placeholder:'e.g. Nutcracker, Sen, Naki','aria-label':'Type the characters you own'});
 const found=el('p',{class:'subtle',role:'status'});
 const versions=el('div',{class:'version-pick'});
 /* A name shared by several versions ("Naki", "Sen") is never guessed: the player picks the exact version. */
 const archived=heroes.filter(h=>h.status==='archived'),baseOf=h=>norm(fixName(h.name).split(' [')[0]);
 const sameName=t=>{const g=archived.filter(h=>{const b=baseOf(h);return b===t||b.split(' ').includes(t);});return g.length>1?g:null;};
 const add=button('Add',()=>{const parts=typed.value.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);const hits=[],miss=[];versions.replaceChildren();for(const p of parts){const g=sameName(norm(p).replace(/\btouka\b/g,'toka'));if(g){versions.append(el('div',{class:'version-group'},el('p',{},'Which version of '+p+'?'),el('div',{class:'actions'},g.map(h=>button(fixName(h.name),ev=>{if(!isOwned(h.key))profile.owned[h.key]=0;save();headerContext();ev.target.closest('.version-group').remove();found.textContent='Added: '+fixName(h.name)+'.';drawPicks();draw();})))));continue;}const k=matchUnit(p,pool)||matchUnit(p,archived.map(h=>h.key));if(k){if(!isOwned(k))profile.owned[k]=0;hits.push(short(k));}else miss.push(p);}save();headerContext();found.textContent=(hits.length?'Added: '+hits.join(', ')+'.':'')+(miss.length?' Not found: '+miss.join(', ')+'.':'');typed.value='';drawPicks();draw();},'primary');
 main.append(el('div',{class:'rec-type'},field('Type names',typed),add),found,versions);
 const fac=select([['all','All factions'],...MF().map(f=>[f.id,f.name])],'all',()=>draw());
 const FNAME=Object.fromEntries(Object.entries(FAC_ID).map(([n,i])=>[i,n]));
 const fits=t=>fac.value==='all'||t.facs.has(fac.value)||(t.facs.has('any')&&t.units.every(u=>byKey.get(u)&&playFaction(byKey.get(u))===FNAME[fac.value]));
 const picks=el('div',{class:'own-grid'}),results=el('ol',{class:'rec-results'});
 const clear=button('Untick all',()=>{for(const k of pool)delete profile.owned[k];save();headerContext();drawPicks();draw();});
 main.append(more([text('Tick each character you own. Your picks are saved with your collection (My account).','subtle'),picks,el('div',{class:'actions'},clear)],'Tick your characters ('+pool.length+')'));
 const full=input('','checkbox',{on:{change:()=>draw()}});
 main.append(el('div',{class:'filters'},field('Faction',fac),el('label',{class:'inline-check'},full,'Only teams I fully own')),el('h2',{class:'group-head'},'Your best matches'),results);
 main.append(reviewBox());
 function drawPicks(){picks.replaceChildren(...pool.map(k=>{const cb=input('','checkbox',{'data-key':k,'aria-label':short(k)});cb.checked=isOwned(k);cb.addEventListener('change',()=>{if(cb.checked){if(!isOwned(k))profile.owned[k]=0;}else delete profile.owned[k];save();headerContext();draw();});return el('label',{class:'own-pick'},cb,image(byKey.get(k)?.portrait,'',''),el('span',{},short(k)));}));}
 function draw(){const owned=Object.keys(profile.owned);const rows=rec.filter(fits).map((t,i)=>({...t,i,have:t.units.filter(isOwned).length})).filter(t=>t.have>0&&(!full.checked||t.have===t.units.length)).sort((a,b)=>b.have-a.have||(a.units.length-a.have)-(b.units.length-b.have)||(a.kind==='sourced'?0:1)-(b.kind==='sourced'?0:1)||b.uses.length-a.uses.length||a.i-b.i).slice(0,10);
  results.replaceChildren();if(!rows.length){results.append(el('li',{class:'empty'},full.checked&&owned.length?'None of these teams is complete in your collection yet. Untick “Only teams I fully own” to see close matches.':'Tick or type the characters you own to see teams.'));return;}
  for(const t of rows){const miss=t.units.filter(k=>!isOwned(k));const shown=t.uses.slice(0,8);results.append(el('li',{class:'rec panel','data-units':t.units.join(' ')},el('p',{class:'rec-count'},t.have+' of '+t.units.length+' owned'),el('div',{class:'units mini'},t.units.map((u,i)=>{const n=unitFig(u,i,t.row.backup!==false);n.classList.add(isOwned(u)?'have':'miss');return n;})),miss.length?el('ul',{class:'list swaps'},((used)=>miss.map(m=>{const s=bestSwap(m,t.units,owned,used,t.row.backup!==false&&t.units.indexOf(m)===4);if(s)used.push(s.key);return el('li',{},'Missing: '+short(m)+'. ',s?el('span',{class:'swap'},el('strong',{},'Suggested swap: '),short(s.key)+' ('+s.why+')'):'No close swap in your roster.');}))([])):null,more([el('ul',{class:'list rec-uses'},shown.map(u=>el('li',{},u.ctx,u.kind==='derived'?el('span',{class:'subtle'},' (worked out from skills — not tested)'):el('span',{class:'subtle'},' (sourced)')))),t.uses.length>shown.length?text('And '+(t.uses.length-shown.length)+' more fights.','subtle'):null],'Use for: '+t.uses.slice(0,2).map(u=>u.ctx).join(', ')+(t.uses.length>2?' and '+(t.uses.length-2)+' more':''))));}}
 drawPicks();draw();
}
function statsBox(key){const cur=profile.stats[key]||{};const inputs=STAT_KEYS.map(n=>{const i=input(cur[n]??'','number',{min:0,step:1,inputmode:'numeric'});i.addEventListener('change',()=>{const v=i.value.trim(),num=Number(v);const s={...(profile.stats[key]||{})};if(v==='')delete s[n];else if(Number.isSafeInteger(num)&&num>=0&&num<=1e9)s[n]=num;else{i.value=cur[n]??'';notify('Enter a whole number, or leave it empty.');return;}if(Object.keys(s).length)profile.stats[key]=s;else delete profile.stats[key];save();});return field(n,i);});
 return more([text('Optional. Copy them from the character screen in game. They are saved with your collection and added to a review request; the guide does not rank teams by them.','subtle'),el('div',{class:'grid stat-grid'},inputs)],'Your stats (optional)');}
function reviewBox(){let shots=[];const tr=s=>window.TGI18N?window.TGI18N.t(s):s;
 const file=el('input',{type:'file',accept:'image/png,image/jpeg,image/webp',multiple:'multiple',class:'visually-hidden',id:'shot-file'}),prev=el('div',{class:'shot-preview'}),stat=el('p',{class:'subtle',role:'status'});
 const drawShots=()=>{prev.replaceChildren(...shots.map(x=>el('figure',{},el('img',{src:x.url,alt:x.name}),el('figcaption',{},x.name))));stat.textContent=shots.length?shots.length+' screenshot(s) shown here only. They are not saved or sent.':'';};
 const clear=()=>{shots.forEach(x=>URL.revokeObjectURL(x.url));shots=[];drawShots();};
 file.addEventListener('change',()=>{for(const f of file.files){if(shots.length>=6||f.size>8e6||!/^image\/(png|jpeg|webp)$/.test(f.type))continue;shots.push({url:URL.createObjectURL(f),name:f.name.slice(0,80)});}file.value='';drawShots();});
 window.addEventListener('hashchange',clear,{once:true});
 const notes=el('textarea',{rows:3,maxlength:'2000',placeholder:'Mode, enemy team, your budget, what you want to beat…'}),out=el('textarea',{rows:8,readonly:'readonly','aria-label':'Review request text'});
 const build=()=>{const own=heroes.filter(h=>profile.owned[h.key]!==undefined).map(h=>{const st=profile.stats[h.key]||{};const extra=STAT_KEYS.filter(n=>st[n]!==undefined).map(n=>n+' '+st[n]).join(', ');return '- '+fixName(h.name)+' · '+profile.owned[h.key]+'★'+(extra?' · '+extra:'');});
  return [tr('Please check my Tokyo Ghoul: Break the Chains teams.'),tr('Server')+': '+tr(regionLabel())+' · '+tr('day')+' '+profile.serverDay,'',tr('Characters I own')+' ('+own.length+'):',...(own.length?own:[tr('none marked yet')]),'',tr('What I need')+': '+(notes.value.trim()||'—'),shots.length?'\n'+tr('I will attach my screenshots separately.'):''].join('\n').trim();};
 const copy=button('Copy review request',async()=>{out.value=build();try{await navigator.clipboard.writeText(out.value);notify('Copied. Paste it with your screenshots to a guildmate or helper.');}catch(e){out.focus();out.select();notify('Select the text below and copy it.');}},'primary');
 return more([text('Want a second opinion? This gathers your owned characters, stars, stats and notes into text you can send to a guildmate or helper. The guide does not read screenshots; you can preview them here, then attach them yourself.','subtle'),el('p',{class:'row-label'},'Screenshots (up to 6, preview only)'),el('label',{class:'button',for:'shot-file'},'Choose screenshots',file),prev,stat,button('Clear screenshots',clear),field('What do you need help with?',notes),el('div',{class:'actions'},copy),out],'Ask someone to check your teams');}
function buy(){title('WHAT TO BUY','Top picks, good, and skip.');howto('buy');
 main.append(el('p',{class:'notice'},el('strong',{},'Prices as of '+G.as_of+'. '),'Check the in-game shop before you spend.'));
 for(const[k,h]of[['must','Top picks if you spend'],['good','Good'],['skip','Skip'],['gone','Gone on older servers']].filter(([k])=>G.buy[k]))main.append(el('h2',{class:'buy-head '+k},h),el('ul',{class:'buy-list'},G.buy[k].map(b=>el('li',{},el('p',{},el('strong',{},b.name),' · ',el('span',{class:'price'},b.price),' — ',b.why),more([text(b.math),text('Source: '+b.source,'subtle')])))));
 main.append(more([el('ul',{class:'list'},G.buy_rules.map(r=>el('li',{},r))),link('Full article: pull and spend →','legacy/spend.html')],'How the value math works'));
 economy();
 vipBlock();
 main.append(el('div',{class:'actions'},link('Compare your own offers →','#spend','button primary'),link('Which units are meta if you spend, and which if you don’t →','#tiers','button')));
}
/* 10-28: free Diamond income, shop buys and mode payouts (guide.json economy). */
function economy(){const E=G.economy;if(!E)return;const src=s=>text('Source: '+s,'subtle');
 main.append(el('section',{class:'economy',id:'economy'},el('h2',{class:'buy-head'},E.title),text(E.intro,'muted'),
  el('ul',{class:'buy-list'},E.income.map(r=>el('li',{},el('p',{},el('strong',{},r.name),' · ',el('span',{class:'amount'},r.amount)),more([text(r.note),src(r.source)])))),
  panel(el('h3',{},'Totals'),el('ul',{class:'list'},E.totals.map(t=>el('li',{},t))),link('Free Diamonds per day calculator →','#spend','button')),
  el('h2',{class:'buy-head'},E.shops_title),text(E.shops_intro,'muted'),
  el('ul',{class:'buy-list'},E.shops.map(r=>el('li',{},el('p',{},el('strong',{},r.name),' · ',el('span',{class:'amount'},r.channels+(r.channels===1?' channel':' channels')),' — ',r.buy),more([r.skip?text('Skip: '+r.skip):null,src(r.source)])))),
  el('h2',{class:'buy-head'},E.payouts_title),
  el('ul',{class:'buy-list'},E.payouts.map(r=>el('li',{},el('p',{},el('strong',{},r.name),' — ',r.text),more([src(r.source),r.link?link('Open the mode guide →',r.link):null])))),
  text('Sources: '+E.sources.join('; '),'subtle')));
}
/* 10-28: VIP value (guide.json vip). */
function vipBlock(){const V=G.vip;if(!V)return;const rows=(list,cls)=>el('ul',{class:'list '+(cls||'')},list.map(([a,b,c])=>el('li',{},a+' — '+b,c?el('span',{class:'subtle'},' · '+c):null)));
 main.append(el('section',{class:'vip',id:'vip'},el('h2',{class:'buy-head'},V.title),text(V.intro,'muted'),
  panel(el('ul',{class:'list'},V.verdict.map(t=>el('li',{},t)))),
  more([text(V.daily_note,'muted'),rows(V.daily)],V.daily_title),
  more([el('ul',{class:'list'},V.perks.map(t=>el('li',{},t)))],V.perks_title),
  more([rows(V.levels)],V.levels_title),
  text('Sources: '+V.sources.join('; '),'subtle')));
}
/* 10-27: spender vs free-player split (guide.json spend_split), shown at the top of the tier list. */
function spendSplit(){const S=G.spend_split;if(!S)return;const pick=p=>{const g=getTag(p.id);return el('li',{class:'split-pick'},el('a',{href:'#hero/'+p.id,class:'split-unit'},image(byKey.get(p.id)?.portrait,'',''),el('strong',{},short(p.id))),g?el('small',{class:'get g-'+g.tier},tagText(p.id)):null,el('span',{},p.why));};
 main.append(el('section',{class:'panel spend-split',id:'spend-split'},el('h2',{},S.title),text(S.intro,'section-intro'),more([el('ul',{class:'list'},S.why.map(w=>el('li',{},w)))],'Why a “weaker” unit can be the right pick'),el('div',{class:'split-grid'},S.groups.map(g=>el('div',{class:'split-group split-'+g.id},el('h3',{},g.title),text(g.blurb,'muted'),el('ul',{class:'split-list'},g.picks.map(pick))))),text('Source: '+S.source,'subtle')));}
/* 10-27: the new-unit page (guide.json spotlight): which unit, verdict, how it works, teams, sources. */
function newUnit(){const nu=TG.newestUnit(),sp=G.spotlight||[];
 /* The newest released unit from the data; the written page when the guide has one for it, else its character card. */
 if(nu&&!sp.some(x=>x.id===nu)){const h=byKey.get(nu);title('NEW UNIT',fixName(h.name));main.append(el('div',{class:'roster'},card(h)),el('div',{class:'actions'},link('Character page →','#hero/'+nu,'button')));return;}
 const s=sp.find(x=>x.id===nu)||sp[0];if(!s){TG.pages.home();return;}const h=byKey.get(s.id);title('NEW UNIT',s.title,s.reported);
 main.append(el('section',{class:'detail-hero'},image(h?.portrait,short(s.id),'',true),el('div',{},el('p',{class:'eyebrow'},'IS SHE META?'),el('ul',{class:'list verdict'},s.verdict.map(v=>el('li',{},v))),el('div',{class:'actions'},link('Character page →','#hero/'+s.id,'button'),link('Anteiku meta teams →','#meta/anteiku','button')))));
 main.append(brief(s.which[0],[s.which[1]]));
 main.append(panel(el('h2',{},'How she works'),el('div',{class:'flow'},s.how.map(([n,t])=>el('div',{class:'step'},el('strong',{},n),t))),text(s.patch,'subtle')));
 main.append(el('div',{class:'section-head'},el('h2',{},'Teams with her')),text('Every team is 4 on the field plus 1 back-up. Tap a portrait to open that character.','muted'),el('section',{class:'panel team-card'},...s.rows.map(teamRow)));
 main.append(more([el('h3',{},'Sources'),el('ul',{class:'list'},s.sources.map(x=>el('li',{},x))),el('h3',{},'Still to confirm in game'),el('ul',{class:'list'},s.gaps.map(x=>el('li',{},x)))],'Sources and open questions'),el('div',{class:'actions'},link('Spend or free: which units to build →','#tiers','button'),link('Banners →','#banners','button')));}
/* 10-27: what each star gives (guide.json stars_guide) and a per-unit target star (rating + how to get + kit). */
function starsGuide(open){const S=G.stars_guide;if(!S)return null;return el('details',{class:'more stars-guide',id:'stars-guide',...(open?{open:''}:{})},el('summary',{},S.title),text(S.intro),S.check?text(S.check,'notice'):null,el('div',{class:'flow'},S.steps.map(([n,t])=>el('div',{class:'step'},el('strong',{},n),t))),text(S.note,'subtle'),el('h3',{},'Star-up materials'),el('ul',{class:'list'},S.materials.map(x=>el('li',{},x))),el('h3',{},'Don’t waste'),el('ul',{class:'list'},S.avoid.map(x=>el('li',{},x))),text('Source: '+S.source,'subtle'));}
function targetStars(id){const u=G.tiers.find(x=>x.id===id);if(!u)return null;const h=byKey.get(id),g=getTag(id),R='SABCD',a=R.indexOf(u.t0),b=R.indexOf(u.tf);
 const p2=((h&&h.ps)||[]).filter(Boolean).map(x=>[0,x[0],x[1]]).find(m=>m[1]==='1')||null;   // the passive tagged [1★], whichever slot holds it
 const S=G.spend_split||{groups:[]},inGroup=gid=>(S.groups.find(x=>x.id===gid)||{picks:[]}).picks.some(x=>x.id===id);
 if(inGroup('short')||'CD'.includes(u.tf))return el('div',{class:'target-stars'},el('p',{class:'row-label'},'Target stars'),text('Stay at 0★: level it only; don’t spend star-up items on it.'),text(inGroup('short')?'It is on the “Invest short term” list: use it now, replace it later.':'Rated '+u.tf+' even at full stars, so stars are better spent elsewhere.'));
 const banner=g&&(g.kind==='live'||g.kind==='past')||inGroup('pay'),F=g&&(g.kind==='past'||g.fallback==='Past banner')?'If you own it, first target: ':banner?'If you pull, first target: ':'First target: ';
 const first=!p2?F+'1★, which unlocks a passive.':starsUnsure(id)?F+'1★, which probably unlocks '+p2[2]+' (unlock star not confirmed).':F+p2[1]+'★, which unlocks '+p2[2]+'.';
 const now='SA'.includes(u.t0)?'It already works at one copy (rated '+u.t0+' at 0★).':null;
 const shop=g&&g.kind==='shop',limited=g&&g.kind==='live';
 const long='CD'.includes(u.tf)||b>a?'Long term: no star-up items beyond 1★; other units gain more from stars (rated '+u.tf+' at full stars).':!g?'Long term: no current way to get more copies, so use the stars you have.':limited?'Long term: finishing the banner usually gives a second copy (1% per pull plus the guarantee), so 1★; 6★ takes many more pulls (spenders).':g.tier==='endgame'||g.fallback==='Past banner'?'Long term: its banner is over; more copies only from a rerun or a Legacy Custom banner, so keep the stars you have.':g.fallback?'Long term: 6★ once the Legacy pool opens (server day 33+); until then, keep the stars you have.':g.tier==='starter'&&shop?'Long term: 6★ once the shop sells it (shop listing unconfirmed).':g.tier==='starter'?'Long term: 6★. A free unit, so you can collect the copies.':shop?'Long term: until the day-75 shop listing (unconfirmed) opens, copies come from Carnival or banner pulls; 6★ is for spenders before then.':'Long term: 6★ once the pool gives you copies.';
 return el('div',{class:'target-stars'},el('p',{class:'row-label'},'Target stars'),text(first),now?text(now):null,text(long));}
const TIER_ADVICE={S:'build your team around it',A:'it is strong in the right team',B:'it is useful but limited',C:'only level it',D:'skip it'};
function tierLine(u){const a=t=>TIER_ADVICE[t]||'no advice';return u.t0===u.tf?'At 0★ and at full stars ('+u.t0+'), '+a(u.t0)+'.':'At 0★ ('+u.t0+'), '+a(u.t0)+'; at full stars ('+u.tf+'), '+a(u.tf)+'.';}
function tierList(){title('TIER LIST','All 122 rated units, S to D.','Tap a unit to see why. “At 0★” means one copy; “At full stars” means fully upgraded.');howto('tiers');spendSplit();main.append(starsGuide(false));
 main.append(more([text('Ratings come from the game’s own skill text and stats (EU data of September 22, 2026) plus creator videos. They may lag the October 14 patch.'),text('Use “At full stars” for the weekly Abyssal Battlefield, which treats your unit as full stars.'),text('Attributes: STR beats SKL, SKL beats SPD, SPD beats STR. PSY and WIT beat each other. DST beats every other attribute; only DST beats DST. Some fights switch attribute advantage off.'),text(G.tier_disagree,'notice'),text('Source: '+G.tier_source,'subtle'),link('Full article: tier list →','legacy/tiers.html')]));
 let mode='t0',fac='all',get='all';const out=el('div');
 const seg=(label,opts,get,set)=>{const bs=opts.map(([v,l])=>button(l,()=>{set(v);bs.forEach((b,i)=>b.setAttribute('aria-pressed',opts[i][0]===v));draw();}));bs.forEach((b,i)=>b.setAttribute('aria-pressed',opts[i][0]===get()));return el('div',{},el('p',{class:'row-label'},label),el('div',{class:'switch',role:'group','aria-label':label},bs));};
 main.append(el('div',{class:'filters tier-filters'},seg('Rating',[['t0','At 0★'],['tf','At full stars']],()=>mode,v=>mode=v),seg('Faction',[['all','All'],...Object.entries(G.factions)],()=>fac,v=>fac=v),seg('How to get',[['all','All'],['starter','Free or early shop'],['mid','Later shop or pool'],['endgame','Banner, Carnival or paid pack']],()=>get,v=>get=v)),out);
 function draw(){out.replaceChildren();for(const t of['S','A','B','C','D']){const rows=G.tiers.filter(u=>u[mode]===t&&(fac==='all'||u.faction===fac)&&(get==='all'||(getTag(u.id)||{}).tier===get));if(!rows.length)continue;const info=el('div',{class:'tier-info'});info.hidden=true;
  const units=rows.map(u=>{const b=el('button',{type:'button',class:'tier-unit','aria-expanded':'false'},image(byKey.get(u.id)?.portrait,'',''),el('span',{},u.name),u.note?el('small',{class:'free-mark'},'Free team'):null,u.new&&!TG.PLACEHOLDER.has(u.id)?el('small',{class:'free-mark new-mark'},'New'):null,getTag(u.id)?el('small',{class:'get g-'+getTag(u.id).tier},tagText(u.id)):null);b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')==='true';units.forEach(x=>x.setAttribute('aria-expanded','false'));info.hidden=open;if(open)return;b.setAttribute('aria-expanded','true');info.replaceChildren(el('h3',{},u.name),text((G.factions[u.faction]||u.faction)+' · '+u.attribute,'subtle'),text(tierLine(u),'tier-line'),...[targetStars(u.id)].filter(Boolean),...(u.note?[text(u.note,'notice')]:[]),...(starsUnsure(u.id)?[text('The game data does not confirm which star unlocks each passive of this unit, so the “At 0★” rating may be off.','subtle')]:[]),more([text(u.why)],'Why (kit numbers)'),text('How to get: '+u.get,'muted'),...(u.new?[link('How she works and her teams →','#new')]:[]),link('Open the codex page →','#hero/'+u.id));});return b;});
  out.append(el('section',{class:'tier'},el('h2',{},el('span',{class:'tier-badge t-'+t},t),' '+G.tier_labels[t]+' ',el('small',{},'· '+rows.length)),el('div',{class:'tier-grid'},units),info));}}
 draw();
}
function teams(templateId){title('TEAM BUILDER','Build your own team.','Pick characters, then save or export the team. For ready-made teams, see Best teams.');howto('teams');main.append(link('Best teams →','#best-teams','button'));
 let draft={name:'My formation',mode:'PvE',fieldCount:4,reserveCount:1,slots:['','','','',''],confirmed:false};let template=E.teams.find(t=>t.id===templateId);if(template){draft.name=template.name;draft.mode=template.mode;draft.slots=[...template.unit_ids.slice(0,4),template.reserve_candidates[0]||''];}
 const editor=panel(), slots=el('div',{class:'slot-grid'}),analysis=el('div'),out=el('textarea',{'aria-label':'Formation JSON',placeholder:'Exported formation appears here. Paste a formation JSON here to import.'}),name=input(draft.name),mode=input(draft.mode),count=select(['4','5'],'4'),reserves=select(['0','1','2'],'1'),confirmed=input('','checkbox'),error=text('','notice'),savedBox=el('div');error.hidden=true;
 const ownedOnly=input('','checkbox');
 function sync(){draft.name=name.value;draft.mode=mode.value;draft.confirmed=confirmed.checked;}
 function showSlots(){slots.replaceChildren();for(let i=0;i<draft.fieldCount+draft.reserveCount;i++){const h=byKey.get(draft.slots[i]);const candidates=heroes.filter(x=>playable(x)&&(!ownedOnly.checked||profile.owned[x.key]!==undefined||x.key===draft.slots[i]));const selector=select([['','Choose a character'],...candidates.map(x=>[x.key,fixName(x.name)])],draft.slots[i]||'',v=>{if(v&&draft.slots.some((id,j)=>id===v&&i!==j)){notify('That exact variant is already in this formation.');selector.value=draft.slots[i];return;}draft.slots[i]=v;showSlots();});const slot=el('div',{class:'slot'},el('p',{class:'eyebrow'},i<draft.fieldCount?'FIELD '+(i+1):'RESERVE '+(i-draft.fieldCount+1)),h?image(h.portrait,fixName(h.name)):el('div',{class:'slot-empty'},'+'),field('Character in slot '+(i+1),selector));if(h)slot.append(link('Read kit →','#hero/'+h.key,'subtle'),text(profile.owned[h.key]!==undefined?'Owned · '+profile.owned[h.key]+'★':'Not marked owned','subtle'));if(i>0)slot.append(button('← Swap',()=>{[draft.slots[i-1],draft.slots[i]]=[draft.slots[i],draft.slots[i-1]];showSlots();}));slots.append(slot);}analyze();}
 function analyze(){const chosen=draft.slots.map(k=>byKey.get(k)).filter(Boolean),factions={};draft.slots.slice(0,draft.fieldCount).map(k=>byKey.get(k)).filter(Boolean).forEach(h=>shownFactions(h).forEach(f=>factions[f]=(factions[f]||0)+1));analysis.replaceChildren(el('h3',{},'Formation review'),text('Field faction counts: '+(Object.entries(factions).map(([f,n])=>f+' '+n).join(' · ')||'Choose characters above.'),'muted'),text('Missing from your recorded collection: '+(chosen.filter(h=>profile.owned[h.key]===undefined).map(h=>fixName(h.name)).join('; ')||'None among selected characters.'),'subtle'));if(template)analysis.append(text(template.notes,'muted'),text(template.slot_rule,'notice'),...Object.entries(template.star_requirements).map(([id,note])=>text(fixName(byKey.get(id)?.name||id)+': '+note,'subtle')));analysis.append(text('Counts help you plan. Check passives, assists and mode bans on the game screen.','subtle'));}
 function resize(){sync();const oldField=draft.slots.slice(0,draft.fieldCount),oldReserve=draft.slots.slice(draft.fieldCount);draft.fieldCount=Number(count.value);draft.reserveCount=Number(reserves.value);draft.slots=[...Array.from({length:draft.fieldCount},(_,i)=>oldField[i]||''),...Array.from({length:draft.reserveCount},(_,i)=>oldReserve[i]||'')];draft.confirmed=false;confirmed.checked=false;showSlots();}
 count.addEventListener('change',resize);reserves.addEventListener('change',resize);ownedOnly.addEventListener('change',showSlots);
 function apply(t){draft=validateTeam(t);template=E.teams.find(x=>x.name===draft.name)||null;name.value=draft.name;mode.value=draft.mode;count.value=draft.fieldCount;reserves.value=draft.reserveCount;confirmed.checked=draft.confirmed;showSlots();}
 function saved(){savedBox.replaceChildren(el('h3',{},'Saved formations'),profile.teams.length?el('div',{class:'card-list'},profile.teams.map((t,i)=>el('div',{class:'daily-row'},button(t.name,()=>apply(t)),button('Delete',()=>{profile.teams.splice(i,1);save();saved();},'danger')))):text('No saved formations yet.','muted'));}
 editor.append(el('div',{class:'grid two'},field('Team name',name),field('Mode / encounter',mode)),el('div',{class:'grid two'},field('Field slots — confirm in game',count),field('Optional reserve slots',reserves)),el('label',{class:'inline-check'},ownedOnly,'Show owned characters only'),slots,el('label',{class:'inline-check'},confirmed,'I checked these slot rules in this mode’s current screen.'),analysis,error,el('div',{class:'actions'},button('Save formation',()=>{try{sync();if(!draft.confirmed)throw Error('Confirm the mode’s slot rules before saving.');if(draft.slots.slice(0,draft.fieldCount).some(k=>!k))throw Error('Fill every field slot before saving.');const t=validateTeam(draft);profile.teams.push(t);profile.teams=profile.teams.slice(-30);save();saved();error.hidden=true;notify('Formation saved in this browser.');}catch(e){error.textContent=e.message;error.hidden=false;}},'primary'),button('Export JSON',()=>{sync();out.value=JSON.stringify(validateTeam(draft),null,2);}),button('Import JSON',()=>{try{apply(JSON.parse(out.value));notify('Imported formation. Review the rules before saving.');error.hidden=true;}catch(e){error.hidden=false;error.textContent=e.message;}}),button('Clear slots',()=>{draft.slots.fill('');showSlots();})),field('Share / import a formation',out),savedBox);main.append(editor);showSlots();saved();
}
const bossCard=id=>G.teams.find(t=>t.lab===id);
function bosses(id){title('BOSS LAB','Boss skills and fight plans.','Read each boss’s skills, step through a plan, and log your own fights.',['Skill text is copied from the game files. No plan here has been tested in a real fight.']);if(!id)howto('bosses');
 if(!id){main.append(grid(E.encounters.map(b=>{const c=bossCard(b.id);return panel(tag(b.mode,'red'),el('h3',{},b.name),c?el('ul',{class:'list boss-tips'},c.play.map(x=>el('li',{},x.text))):null,el('div',{class:'actions'},c?link('Best team →','#best-teams/'+c.id,'button primary'):null,link('Skills and plan →','#bosses/'+b.id,'button')));})));return;}
 const b=E.encounters.find(x=>x.id===id);if(!b){main.append(link('Back to all bosses','#bosses'));return;}const c=bossCard(b.id);main.append(link('← All bosses','#bosses','back'),el('h2',{},b.name));if(c)main.append(howBox(c.play.map(x=>x.text),'How to fight this boss'),link('Best team for this boss →','#best-teams/'+c.id,'button primary'));main.append(brief('This plan is not tested in a fight.',[b.expected_result]));
 const mech=panel(el('h2',{},'Boss skills'),...b.mechanics.map(m=>el('div',{class:'skill'},el('h3',{},m.name),text(m.text))),evidence(b));let step=0;const display=panel();const draw=()=>{const r=b.rotation[step];display.replaceChildren(tag('STEP '+(step+1)+' OF '+b.rotation.length,'gold'),el('h2',{},r.phase[0].toUpperCase()+r.phase.slice(1)),text(r.action),text('When: '+r.condition,'notice'),...(r.actor_id?[link('Uses: '+fixName(byKey.get(r.actor_id)?.name||r.actor_id),'#hero/'+r.actor_id)]:[]),el('div',{class:'actions'},button('← Previous',()=>{step=Math.max(0,step-1);draw();}),button('Next step →',()=>{step=Math.min(b.rotation.length-1,step+1);draw();},'primary')));};draw();main.append(el('div',{class:'grid two'},mech,display));
 main.append(el('div',{class:'section-head'},el('h2',{},'Log a fight')));
 const setup=el('textarea',{placeholder:'Difficulty, CP, team and stars, cells, starting cards…','aria-label':'Combat setup'}),result=el('textarea',{placeholder:'What you cast each turn, phase changes, damage, what went wrong…','aria-label':'Combat results'});const logs=el('div');function drawLogs(){logs.replaceChildren(...profile.logs.filter(x=>x.boss===id).map(x=>el('details',{class:'more'},el('summary',{},x.date.slice(0,10)+' · your fight'),text(x.setup),text(x.result))));}main.append(panel(more([el('ul',{class:'list'},b.test_required.map(t=>el('li',{},t)))],'What to write down'),field('Your setup',setup),field('What happened',result),button('Save this fight',()=>{if(!setup.value.trim()||!result.value.trim()){notify('Fill in both boxes first.');return;}profile.logs.push({boss:id,date:new Date().toISOString(),setup:setup.value.slice(0,3000),result:result.value.slice(0,3000)});profile.logs=profile.logs.slice(-100);save();drawLogs();notify('Fight saved in this browser.');},'primary'),logs));drawLogs();
}
function banners(){title('BANNERS','Live banner and banner history.','What is on now, what came before, and your own notes.');const over=endedBanner('halloween-hinami');main.append(panel(over?el('span',{class:'tag gold'},'ENDED',' ',el('span',{},over.date)):tag('LIVE NOW','cyan'),el('h2',{},'Hinami [Halloween]'),text('Limited banner on established servers, October 25 – November 8, 2026. The unit is guaranteed at 300 pulls (90,000 Diamonds). The owner reports she is out on the NA relaunch server (October 27, 2026); check the end date in game.'),text('Free-to-play: pull only if you play Anteiku and can finish the 300 pulls.','muted'),link('How she works and her teams →','#new','button'),more(['She drops at 1% per pull (fan datamine), so finishing the 300 pulls usually gives 2 or more copies.','Pulls 100 and 200 pay a random chest (about a 10% chance at her), not a pick.','Her 1★ passive (standard star order; check in game) gives Anteiku allies +50% ATK and max HP and cuts enemy healing by 60% and lifesteal by 30%; her 0★ passive adds a "can\'t drop below 1 HP" effect to all-Anteiku teams.',el('p',{},'Your server: '+regionLabel()+' · day '+profile.serverDay+'. ',link('Change it →','#account'))])));
 const filter=select(['All banners','Live now','Past banners'],'All banners'),rows=el('div',{class:'card-list'});main.append(field('Show',filter),rows);function draw(){rows.replaceChildren(...E.banners.filter(b=>filter.value==='All banners'||filter.value==='Past banners'&&(b.id.startsWith('historical')||endedBanner(b.id))||filter.value==='Live now'&&b.id==='halloween-hinami'&&!endedBanner(b.id)).map(b=>panel(endedBanner(b.id)?el('span',{class:'tag gold'},'Ended',' ',el('span',{},endedBanner(b.id).date)):tag(b.status,'gold'),el('h3',{},b.name),b.region?text('Region: '+b.region,'muted'):null,b.note?text(b.note,'muted'):null,evidence(b))));}filter.addEventListener('change',draw);draw();
 const obs=el('textarea',{value:profile.bannerNotes,placeholder:'Banner name, exact version, server, start and end time, rates, pity, screenshot file…'});main.append(el('div',{class:'section-head'},el('h2',{},'Your banner notes')),panel(text('Saved only in this browser.','muted'),field('Banner notes',obs),button('Save notes',()=>{profile.bannerNotes=obs.value.slice(0,3000);save();notify('Notes saved.');},'primary')),link('Calculate your pull budget →','#spend','button'));
}
const WAR_MODES=['stronghold','annihilation','carnival','carnival-arena','region','paragon'];
function modeLibrary(id){title('GAME MODES','All 20 modes.','How to unlock and play each one.',['Unlocks and daily limits for the other modes come from the old guide and may differ on your server.','The Guild War and Carnival guides (October 27, 2026) follow the game text of September 22, 2026; creator and guild tips are labeled.']);if(!id){const tile=m=>panel(tag(m.kind,'cyan'),el('h3',{},m.name),text(m.unlock||'Unlock not documented','muted'),link('Open walkthrough →','#modes/'+m.id));const war=WAR_MODES.map(x=>D.modes.modes.find(m=>m.id===x)).filter(Boolean);main.append(el('div',{class:'section-head'},el('h2',{},'Guild War and Carnival')),grid(war.map(tile)),el('div',{class:'section-head'},el('h2',{},'Other modes')),grid(D.modes.modes.filter(m=>!WAR_MODES.includes(m.id)).map(tile)));return;}const m=D.modes.modes.find(x=>x.id===id);if(!m)return;main.append(link('← All modes','#modes','back'),panel(el('h2',{},m.name),text(m.unlock?'Unlock: '+m.unlock:'Unlock not documented','muted'),m.why?text(m.why):null,m.teams_needed?el('h3',{},'Rules'):null,el('div',{class:'flow'},arr(m.steps).map(s=>el('div',{class:'step'},s))),m.tip?text(m.tip,'notice'):null,m.team?text('Team note from the old guide: '+m.team,'subtle'):null,m.teams_needed?el('div',{class:'mode-guide'},el('h3',{},'Teams you need'),text(m.teams_needed),arr(m.build).length?[el('h3',{},'What to build'),el('ul',{class:'list'},arr(m.build).map(x=>el('li',{},x)))]:null,m.missing_shots?text(m.missing_shots,'notice'):null,arr(m.shots).length?el('div',{class:'mode-shots'},arr(m.shots).map(sh=>el('figure',{},image(sh.file,sh.caption,'mode-shot'),el('figcaption',{},sh.caption,' ',external(sh.channel+' · '+sh.timestamp,sh.url))))):null,m.org_plan?el('section',{class:'org-plan',id:'org-plan'},el('h3',{},m.org_plan.title),text(m.org_plan.intro,'subtle'),el('ul',{class:'list'},m.org_plan.items.map(x=>el('li',{},x)))):null,arr(m.sections).map(sec=>el('section',{class:'mode-section'},el('h3',{},sec.title),el('ul',{class:'list'},sec.items.map(x=>el('li',{},x))))),el('h3',{},arr(m.sections).length?'Common mistakes and tips':'Tips'),el('ul',{class:'list'},arr(m.tips).map(x=>el('li',{},x)))):null,el('div',{class:'actions'},m.card?link(m.card==='guild-war'?'Guild War teams on Best teams →':'Carnival Arena teams on Best teams →','#best-teams/'+m.card,'button'):link('Best teams','#best-teams','button'),m.card?link('Meta teams by faction →','#meta','button'):link('Boss Lab','#bosses','button')),evidence(m)));
}
function cells(){title('CELLS','Cells and potential.','72 cell families and 4 LR cells, searchable.',['The full 105-cell LR catalog is still missing from the data.']);main.append(brief('24 cell descriptions don’t match their attribute in the data.',['Those entries stay flagged; don’t use them for color matching. The LR cells have no confirmed full effect text.']));
 const q=input('','search',{placeholder:'Cell name, stat, effect or attribute','aria-label':'Search cells'}),rar=select(['All rarities',...new Set(E.cells.map(x=>x.rarity))],'All rarities'),out=el('div',{class:'grid'});main.append(el('div',{class:'filters'},field('Search cells',q),field('Rarity',rar)),out);function draw(){const rows=E.cells.filter(c=>(rar.value==='All rarities'||c.rarity===rar.value)&&JSON.stringify(c).toLowerCase().includes(q.value.toLowerCase()));out.replaceChildren(...rows.map(c=>panel(c.image?image(c.image,c.name,'coffee-img'):null,tag(c.rarity,'cyan'),el('h2',{class:'card-title'},c.name),text(c.attribute?'Attribute: '+c.attribute:'Attribute unknown','subtle'),text(c.effect_full||c.summary||'Full effect text unavailable.','muted'),c.attribute_conflict?tag('Text does not match its attribute','gold'):null,text('How to get it: '+(c.acquisition||'unknown'),'subtle'),c.character_id?link('Related character →','#hero/'+c.character_id):null,evidence(c))));if(!rows.length)out.append(text('No matching cell entries.','empty'));}q.addEventListener('input',draw);rar.addEventListener('change',draw);draw();main.append(el('div',{class:'section-head'},el('h2',{},'Potential & orbs')),panel(text('Star effects and orb art are on each character page. Potential nodes and costs are not in the game files; what creators run is below.','muted'),link('Browse characters →','#characters')),buildRules());
}
function coffee(){title('COFFEE','24 coffee recipes.','Collect the illustrations and check Organization Supply.',['No combat bonus from coffee is known.']);const q=input('','search',{placeholder:'Recipe or ingredient','aria-label':'Search coffee'}),temp=select(['All temperatures','hot','iced'],'All temperatures'),out=el('div',{class:'grid'});main.append(el('div',{class:'filters'},field('Find a recipe',q),field('Temperature',temp)),out);function draw(){const rows=E.coffee.filter(c=>(temp.value==='All temperatures'||c.temperature===temp.value)&&JSON.stringify(c).toLowerCase().includes(q.value.toLowerCase()));out.replaceChildren(...rows.map(c=>panel(image(c.image,c.name,'coffee-img'),tag(c.temperature,'cyan'),el('h2',{class:'card-title'},c.name),el('ul',{class:'list'},c.ingredients.map(i=>el('li',{},i.quantity+' × '+i.name))),text(c.description,'muted'),text('Rarity is random; ingredients do not guarantee it.','subtle'),external('Recipe video',c.source))));if(!rows.length)out.append(text('No recipes match these filters.','empty'));}q.addEventListener('input',draw);temp.addEventListener('change',draw);draw();}
const TOPICS={guild_war_stronghold:'Guild war',summons_pull_data:'Pulls and banners',arena_pvp:'Arena',news_events:'News',pve_modes:'PvE modes',beginner_tierlist:'Tier lists',f2p_progress:'Free-to-play progress',beginner_guides:'Beginner guides',spending_shops:'Spending'};
const topicLabel=k=>TOPICS[k]||String(k||'Guide').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
const SUMMARY_FROM={'title only':'the video title','title/desc only; transcript IP-blocked':'the video title and description','transcript':'the video transcript','description':'the video description'};
function videoSummary(s){s=String(s||'');const m=/^\s*\[([^\]]*)\]\s*/.exec(s);let from=null;if(m&&SUMMARY_FROM[m[1]]){from=SUMMARY_FROM[m[1]];s=s.slice(m[0].length);}s=s.replace(/\(transcript disabled;\s*([^)]*)\)/gi,'($1)').replace(/;?\s*\(?transcript disabled\)?\.?/gi,'.').replace(/;?\s*no narration info available\.?/gi,'.').replace(/\s*Transcript blocked\.?/gi,'').replace(/optimis/g,'optimiz').replace(/organis/g,'organiz').replace(/colour/g,'color').replace(/\.\.+/g,'.').replace(/\s+\./g,'.').trim();return{text:s||'No summary yet.',from};}
function videoCard(v){const s=videoSummary(v.what_it_shows);return panel(tag(topicLabel(v.topic),'cyan'),el('h2',{class:'card-title'},v.title),text(v.channel+' · '+(v.upload_date_if_known||'Date not recorded'),'subtle'),text(s.text,'muted'),s.from?more(['This summary comes from '+s.from+'.'],'Where this summary comes from'):null,external('Watch on YouTube',v.url));}
function videos(query=''){title('VIDEOS','157 creator videos.','Search by creator, topic, character or title.',['Videos can be outdated or removed. A title match is not checked advice. No video autoplays.']);const q=input(query,'search',{placeholder:'Creator, topic, character or title','aria-label':'Search videos'}),topic=select([['All topics','All topics'],...[...new Set(D.videos.map(v=>v.topic))].map(k=>[k,topicLabel(k)])],'All topics'),out=el('div',{class:'grid'}),count=text('','results-count');{const vp=videoPicks();if(vp)main.append(vp);}main.append(el('div',{class:'filters'},field('Search videos',q),field('Topic',topic)),count,out);function draw(){const rows=D.videos.filter(v=>(topic.value==='All topics'||v.topic===topic.value)&&[v.title,v.channel,v.what_it_shows,v.topic,topicLabel(v.topic)].join(' ').toLowerCase().includes(q.value.toLowerCase()));count.textContent=rows.length+' videos';out.replaceChildren(...rows.map(videoCard));if(!rows.length)out.append(text('No matching videos. Try a broader name.','empty'));}q.addEventListener('input',draw);topic.addEventListener('change',draw);draw();}
const routine=['Claim event and daily rewards before their timers end','Spend your daily tries (Arena, bosses, sweeps)','Collect idle rewards and fill Organization Supply','Check the next passive you can unlock before you spend','Spend guild-war attack charges on Saturday; never sit at 10'];
function progression(){title('DAILY PLAN','Your daily checklist and milestones.','Tick off today’s tasks. Your server day is set on the Account page.',['Server day helps you plan; it does not prove an event or shop has opened.']);main.append(howBox(G.howto.progression,'How to build a character',G.howto_sources.progression));main.append(panel(el('h2',{},'Day '+profile.serverDay+' · '+regionLabel()),link('Update your server →','#account'),brief('Account age, server age and Chain depth unlock different things.',['Check which one a mode uses.'])));const daily=panel(el('h2',{},'Today’s checklist'),text('The checklist resets at midnight on your device, not at the game reset.','subtle'));const today=new Date().toLocaleDateString('en-CA');routine.forEach((t,i)=>{const k=today+':'+i;const c=input('','checkbox',{checked:profile.ticks[k],on:{change:()=>{profile.ticks[k]=c.checked;save();}}});daily.append(el('label',{class:'inline-check'},c,t));});main.append(daily,el('div',{class:'section-head'},el('h2',{},'Milestones')),el('div',{class:'card-list'},E.progression.map(p=>panel(tag('DAY '+p.day,profile.serverDay>=p.day?'cyan':''),el('h3',{},p.name),el('ul',{class:'list'},p.actions.map(a=>el('li',{},a))),evidence(p)))));
}
function account(){title('MY ACCOUNT','Make this guide yours.','Your collection, teams and notes stay in this browser. Export a backup before you change device.',['Clearing browser data also clears this profile. Calculator numbers have their own reset.']);
 const region=select([['Unspecified','Region not set'],'NA','EU','Asia','Other'],profile.region),day=input(profile.serverDay,'number',{min:1,max:9999}),budget=input(profile.budget,'number',{min:0,max:100000}),dataFirst=input('','checkbox',{checked:profile.dataFirst}),notes=el('textarea',{value:profile.notes});main.append(panel(el('div',{class:'grid'},field('Server region',region),field('Server age in days',day),field('Optional budget cap (your currency)',budget)),el('label',{class:'inline-check'},dataFirst,'Simple mode · hide decorative artwork'),field('Account plan / resources / cells',notes),button('Save profile',()=>{const d=Number(day.value),b=Number(budget.value);if(!Number.isInteger(d)||d<1||d>9999||!Number.isFinite(b)||b<0||b>100000){notify('Enter a valid server day and non-negative budget.');return;}profile.region=region.value;profile.serverDay=d;profile.budget=b;profile.notes=notes.value.slice(0,5000);profile.dataFirst=dataFirst.checked;save();headerContext();notify('Profile saved locally.');},'primary')));
 main.append(el('div',{class:'section-head'},el('h2',{},'Your collection'),link('Add characters →','#characters','')));const owned=heroes.filter(h=>profile.owned[h.key]!==undefined);main.append(owned.length?el('div',{class:'roster'},owned.map(card)):text('Open any character page to mark it owned and record its stars.','empty'));
 const box=el('textarea',{'aria-label':'Profile backup JSON',placeholder:'Export appears here. Paste a saved profile JSON to restore.'});const resetConfirm=input('','checkbox');main.append(el('div',{class:'section-head'},el('h2',{},'Backup & privacy')),panel(field('Profile backup',box),el('div',{class:'actions'},button('Export profile',()=>{box.value=JSON.stringify(profile,null,2);download('tgbtc-profile.json',box.value);}),button('Import profile',()=>{try{if(box.value.length>200000)throw Error('Profile is too large.');const next=cleanProfile(JSON.parse(box.value));profile=TG.profile=next;save();render();notify('Profile imported.');}catch(e){notify('Import rejected: '+e.message);}})),el('label',{class:'inline-check'},resetConfirm,'I exported anything I need and want to clear this guide’s profile.'),button('Clear local profile',()=>{if(!resetConfirm.checked){notify('Check the confirmation box first.');return;}profile=TG.profile=fresh();save();render();notify('Profile cleared. Calculator observations have their own reset.');},'danger'),more(['No sign-in, analytics or syncing. Some browsers limit storage for local files; JSON backups always work.'])));
}
function download(filename,content){const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=el('a',{href:url,download:filename});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function sources(){title('MORE','Sources and full articles.','Where the guide’s facts come from, and the old full articles.',['Game facts, creator tips and guild tips are labeled. This guide is saved research, not a live feed from your account.','Teams and boss tips: research of October 26, 2026. Game data: EU build of September 22, 2026.']);main.append(el('div',{class:'mini-grid'},...[[143,'Characters'],[D.counts.kits,'Full skill sets'],[101,'Attribute fixes'],[heroes.filter(h=>!h.portrait).length,'No portrait yet']].map(([n,s])=>el('div',{class:'metric'},el('small',{},s),el('strong',{},n)))));
 main.append(el('div',{class:'section-head'},el('h2',{},'Full articles (October 19, 2026)')),text('The old full articles, kept for reference. Their dates and offers are not updated.','muted'),grid([['index','Planner by server day'],['meta','Meta teams'],['tiers','Tier list'],['guildwar','Guild war and Carnival'],['path','Early, mid and end game'],['spend','Pull and spend'],['calendar','Server calendar'],['tips','Tips and tricks'],['early-tiers','Unlimited Recruitment tiers']].map(([p,n])=>panel(el('h3',{},n),link('Full article →','legacy/'+p+'.html')))));
 main.append(el('div',{class:'section-head'},el('h2',{},'What is not known yet')),el('div',{class:'card-list'},E.unknowns.map(u=>panel(el('h3',{},u.name),tag(u.status,'gold'),text(u.detail,'muted')))));
 main.append(el('div',{class:'section-head'},el('h2',{},'Source list')),el('div',{class:'card-list'},E.sources.map(s=>panel(el('h3',{},s.name),text(s.status+' · '+(s.date||'no date'),'muted'),s.url?srcLink(s.url):null))));
 main.append(panel(el('h2',{},'Artwork & rights'),text('This is an unofficial fan guide. Character art belongs to the game’s rights holders and is not licensed for redistribution.','muted'),srcLink('data/platform/assets.json','Where each image comes from'),text((n=>n===1?'1 character has no portrait yet and shows a placeholder instead: '+heroes.filter(h=>!h.portrait).map(h=>fixName(h.name)).join(', ')+' (not released; the game files have no art for it).':n+' characters have no portrait yet and show a placeholder instead.')(heroes.filter(h=>!h.portrait).length),'subtle')),panel(el('h2',{},'Data checks'),srcLink('data/platform/review_queue.json','Open questions in the data'),el('br'),srcLink('data/platform/attribute_conflicts.json','101 attribute fixes'),el('br'),srcLink('data/platform/rarity_conflicts.json','Rarity fix')));
}
/* PT/ES: say exactly which text on the page stays in English (only text copied from the game files, and creator video
   titles). Everything else on these pages is translated. Pages with no such text get no note. */
const EN_NOTE={hero:t=>!t||t==='overview'?'Skill text on this page is in English, copied from the game files. Everything else is translated.':t==='build'?'Star upgrade text on this page is in English, copied from the game files. Everything else is translated.':t==='videos'?'Video titles are shown as their creators wrote them. The summaries are translated.':null,
 bosses:(t,id)=>id?'Boss skill names and skill text are in English, copied from the game files. The plan and the fight log are translated.':null,
 cells:()=>'Cell names and effects are in English, copied from the game files. Everything else is translated.',
 coffee:()=>'Recipe names, ingredients and descriptions are in English, copied from the game files. Everything else is translated.',
 videos:()=>'Video titles are shown as their creators wrote them. The summaries are translated.',
 data:()=>'Tables are in English, as in the game data. Page titles and descriptions are translated.',
 talents:()=>'The pictures are in-game screens, in English. Character names are shown as in the game.'};
function enNote(r,id,tab){const L=window.TGI18N,f=EN_NOTE[r];if(!L||L.lang==='en'||!f)return;const msg=f(tab,id);if(!msg)return;const h=main.querySelector('h1'),n=text(msg,'subtle en-note');if(h)(h.nextElementSibling&&h.nextElementSibling.classList.contains('section-intro')?h.nextElementSibling:h).after(n);else main.prepend(n);}
/* ===== Diamonds, Stronghold, Battle replay, game stats, game rules (data: d-plan, d-stronghold, d-sim, hero pieces, g-rules) ===== */
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
          el('h2', { class: 'card-title' }, 'Cards you keep running'),
          P.cards.map(c => el('label', { class: 'inline-check' }, el('input', { type: 'checkbox', checked: cards.includes(c.id), on: { change: e => { const s = new Set(cards); e.target.checked ? s.add(c.id) : s.delete(c.id); st.cards = [...s]; draw(); } } }), c.name + ' (+' + fmt(c.per_day) + ' a day)')),
          el('label', { class: 'inline-check' }, el('input', { type: 'checkbox', checked: st.freepass, on: { change: e => { st.freepass = e.target.checked; draw(); } } }), 'My server is new (Free Monthly Pass, +100 a day for 30 days)'),
          el('h2', { class: 'card-title' }, 'Stronghold (Saturday war)'),
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
    const s = (D.stats || {})[id];
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
  /* ---------- Game rules: topic pages (guide.json rule_topics), data cards (game_rules.cards) and four built-in panels ---------- */
  const cardLink = (route, label) => el('a', { class: 'card-link', href: '#' + route, 'aria-label': 'Link to this card', title: 'Link to this card' }, '#');
  const grCard = c => panel(el('h2', {}, c.title), c.intro ? text(c.intro, 'muted') : null,
      c.verify ? el('div', { class: 'notice' }, c.verify) : null,
      c.table ? el('div', { class: 'table-wrap v2-gr-table' }, el('table', {}, el('thead', {}, el('tr', {}, c.table.head.map(h => el('th', {}, h)))),
        el('tbody', {}, c.table.rows.map(r => el('tr', {}, r.map((v, i) => el('td', {}, i === 5 ? el('span', { class: 'tag ' + (c.table.rows.length && /^(Buy|Compre|Compra)$/.test(v) ? 'red' : /^(Skip|Pule|Sáltala)$/.test(v) ? '' : 'gold') }, v) : i === 4 ? el('strong', {}, v) : v))))))) : null,
      c.table && c.table.note ? text(c.table.note, 'muted') : null,
      c.table && c.table.source ? text('Source: ' + c.table.source, 'subtle') : null,
      c.lines.length ? el('ul', { class: 'list v2-gr-list' }, c.lines.map(l => el('li', {}, el('span', {}, l.text), l.source ? text('Source: ' + l.source, 'subtle') : null))) : null,
      c.source ? text('Source: ' + c.source, 'subtle') : null);
  /* Built-in panels: numbers from the game's own tables, with a chart or a calculator. */
  const BUILTIN = {
    'b-hand': () => {
    const hand = [[1, 3, 1], [2, 4, 2], [3, 5, 3], [4, 6, 4], [5, 7, 4]];
    const pn = panel(el('h2', {}, 'More characters alive = more cards'),
      el('div', { class: 'v2-hands' }, hand.map(([u, c, p]) => el('div', { class: 'v2-hcol v2-tilt' },
        el('div', { class: 'v2-hbar', style: '--h:' + c * 13 + '%' }, el('b', {}, c)), el('small', {}, u + ' alive'), el('small', { class: 'subtle' }, p + (p > 1 ? ' plays' : ' play'))))),
      text(TG.BUILTIN_LEAD['b-hand'], 'muted'),
      el('div', { class: 'notice' }, el('strong', {}, 'Does running fewer characters help? '), 'Not proven. You lose cards and plays, but your best units get all the cards, so you merge to Lv3 more often. It can pay off if your 4th and 5th units are weak. We are testing it with recorded matches.'),
      src('game data, Const.json BattlePlayerCardNum / BattlePlayerCardUseNum'));
      return pn;
    },
    'b-rta': () => {
    const pn = panel(el('h2', {}, 'Real-Time Arena'),
      el('div', { class: 'mini-grid' },
        ...[['Open', '11:00–13:00 + 18:00–20:00', 'server time'], ['Turn timer', '40 s', 'then 30, 30, 30, 20, 15'], ['Sudden death', '+10% → +50%', 'damage from round 5 to round 10 (PvP)'], ['Win streak', '+1 / +2 / +3', 'at 2–3 / 4 / 5+ wins (arena table)']]
          .map(([a, b, c]) => el('div', { class: 'metric v2-tilt' }, el('small', {}, a), el('strong', {}, b), el('small', {}, c)))),
      el('ul', { class: 'list' }, el('li', {}, 'Beating someone ranked above you pays up to 1.3× points. Losing to them costs only 0.8×. Losing to someone below you costs up to 1.2×. So challenge up, not down.'),
        el('li', {}, 'Unlocks at Chain Campaign depth 75. One challenge comes back every hour; you can buy 10 more a day with Diamonds.'),
        el('li', {}, 'Points and rank reset on Monday from Sunday\'s finish.')),
      src('game data, Const.json ArenaRealBattleTime, ArenaRoundTimeList, PVPOverRoundDamageFactor, ArenaWinStreak, ArenaWinFactor; rule text Arena_RuleDesc_3_*'));
      return pn;
    },
    'b-weekly': () => {
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
    const pn = panel(el('h2', {}, 'Weekly Challenge: how points work'),
      text(TG.BUILTIN_LEAD['b-weekly'], 'muted'),
      el('div', { class: 'flex' }, wnum('total', 'Total damage', 1e12), wnum('best', 'Best single hit', 1e12), wnum('counter', 'Counter-attribute damage', 1e12), wnum('borrow', 'Borrowed characters', 5)), wout,
      el('ul', { class: 'list' }, el('li', {}, 'Bring the attribute that counters the boss: that damage counts 1.6× more than plain damage.'), el('li', {}, 'One huge hit adds extra points, so save your biggest card for the boss\'s weakest moment.'), el('li', {}, 'Only your best run counts, and switching difficulty doesn\'t add runs together.')),
      src('game rule text UnionBattle_RuleDesc_* (Weekly Challenge)'));
    wcalc();
      return pn;
    },
    'b-orgtech': () => {
    const tiers = TECH.map((t, i) => el('div', { class: 'v2-tier' + (TECH_GATE[i + 1] ? ' gate' : '') },
      el('div', { class: 'v2-tn' }, 'T' + (i + 1)),
      el('div', { class: 'v2-tnodes' }, t.map(([ic, v, wh, m, p]) => el('div', { class: 'v2-tnode v2-tilt ' + modeCls(m) + ' p' + p },
        el('span', { class: 'v2-tag' }, p === 'B' ? 'BEST' : p === 'M' ? 'MAX' : 'Lv 1'), icon(ic), el('b', {}, v), el('small', {}, wh), el('em', {}, m)))),
      TECH_GATE[i + 1] ? el('div', { class: 'v2-tgate' }, '▲ next tier needs ' + TECH_GATE[i + 1] + ' total levels here') : null));
    const pn = panel(el('h2', {}, 'Org Tech: what to upgrade'),
      text('Gold = level it up. Faded = Lv 1 only, just to open the next tier. Red = best tech in the tree (+2 Stronghold attempts). Leaders: tap a tech and press Mark so members know what to research.', 'muted'),
      el('div', { class: 'v2-legend' }, [['sh', 'Stronghold'], ['pve', 'PvE'], ['pvp', 'PvP'], ['ut', 'Free stuff']].map(([c, n]) => el('span', {}, el('i', { class: 'v2-dot ' + c }), n))),
      el('div', { class: 'v2-tree' }, tiers),
      text(TG.BUILTIN_LEAD['b-orgtech'], 'subtle'),
      src('game text S01Tech–S20Tech, Unlock_UnionTechStage02–20, UnionTech_UI4 "Mark"'));
      return pn;
    },
  };
  const BUILTIN_TITLE = { 'b-hand': 'More characters alive = more cards', 'b-rta': 'Real-Time Arena', 'b-weekly': 'Weekly Challenge: how points work', 'b-orgtech': 'Org Tech: what to upgrade' };
  const ruleCards = () => (G.game_rules || { cards: [] }).cards;
  const topicRoute = t => t.id === 'force-talents' ? 'talents' : 'rules/' + t.id;
  /* One card of a topic page, with its own address (#rules/<topic>/<card>). */
  function ruleCard(t, id, focus) {
    const c = ruleCards().find(x => x.id === id), node = BUILTIN[id] ? BUILTIN[id]() : c ? grCard(c) : null;
    if (!node) return null;
    node.id = 'card-' + id; node.classList.add('rule-card');
    const h = node.querySelector('h2'); if (h) h.append(' ', cardLink(topicRoute(t) + '/' + id));
    if (focus === id) { node.dataset.scrollHere = ''; node.classList.add('focus'); }
    return node;
  }
  function rules(id, cardId) {
    const topics = G.rule_topics || [], t = topics.find(x => x.id === id);
    if (t && t.id === 'force-talents') return talents(cardId);
    if (!t) {
      title('GAME RULES', 'How the game actually works.', 'Numbers come from the game\'s own data tables or in-game screenshots. Each section names its source.');
      main.append(el('div', { class: 'topic-grid' }, topics.map(x => el('section', { class: 'panel topic' },
        el('h2', {}, el('a', { href: '#' + topicRoute(x) }, x.title)),
        el('ul', { class: 'topic-cards' }, x.cards.map(c => { const d = ruleCards().find(k => k.id === c); return el('li', {}, el('a', { href: '#' + topicRoute(x) + '/' + c }, d ? d.title : BUILTIN_TITLE[c] || c)); }))))));
      return;
    }
    main.append(link('← Game rules', '#rules', 'back'));
    title('GAME RULES', t.title);
    if (t.cards.length > 1) main.append(el('nav', { class: 'jump', 'aria-label': 'On this topic' }, t.cards.map(c => { const d = ruleCards().find(k => k.id === c); return el('a', { class: 'button', href: '#rules/' + t.id + '/' + c }, d ? d.title : BUILTIN_TITLE[c] || c); })));
    main.append(...t.cards.map(c => ruleCard(t, c, cardId)).filter(Boolean));
  }

  /* ---------- Force Talents: the tree in pictures, the buy order (the main guide's own card lines), numbers per org ---------- */
  function talents(anchor) {
    const F = G.force_talents;
    if (!F) { rules(); return; }
    const cards = ruleCards(), card = id => cards.find(x => x.id === id), line = ([c, n]) => (card(c) || { lines: [] }).lines[n];
    const later = F.later_lines || [];
    const used = new Set([...F.order_lines, ...later, ...F.warn_lines].map(([c, n]) => c + ':' + n));
    const lineItem = l => el('li', {}, el('p', {}, l.text), srcLine(l));
    const sec = (id, ...kids) => { const n = el('section', { class: 'ft-section', id: 'ft-' + id }, ...kids); if (anchor === id) n.dataset.scrollHere = ''; return n; };
    const srcLine = l => l && l.source ? text('Source: ' + l.source, 'subtle') : null;
    title('FORCE TALENTS', F.title, F.intro);
    /* ONE buy order, at the top: the strip, the main guide's own order line with its source, and the no-reset warning. */
    const strip = sec('order', el('h2', {}, F.order_title),
      el('ol', { class: 'ft-rows' }, F.rows.map(([n, a, b]) => el('li', { class: 'ft-row r' + n }, el('span', { class: 'ft-num', 'aria-hidden': 'true' }, n), el('strong', {}, a), el('small', {}, b)))),
      F.order_lines.length ? el('ul', { class: 'ft-lines' }, F.order_lines.map(line).filter(Boolean).map(lineItem)) : null,
      F.rows_note ? text(F.rows_note, 'subtle') : null,
      ...F.warn_lines.map(line).filter(Boolean).map(l => el('div', { class: 'notice' }, el('p', {}, l.text), srcLine(l))));
    strip.classList.add('ft-strip');
    main.append(strip);
    main.append(el('nav', { class: 'jump', 'aria-label': 'On this page' }, [['pictures', F.pictures_title], ['gains', F.gains_title], ['orgs', F.orgs_title], later.length ? ['later', F.later_title] : null, ['details', F.details_title], ['sources', F.sources_title]]
      .filter(Boolean).map(([id, t]) => el('a', { class: 'button', href: '#talents/' + id }, t))));
    main.append(sec('pictures', el('h2', {}, F.pictures_title), text(F.pictures_intro, 'muted'),
      el('div', { class: 'ft-pictures' }, F.pictures.map((x, i) => el('figure', { class: 'ft-picture' },
        el('a', { href: x.img, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Open the picture at full size' }, image(x.img, x.title, '', i < 2)),
        el('figcaption', {}, el('span', { class: 'ft-num', 'aria-hidden': 'true' }, i + 1), el('div', {}, el('h3', {}, x.title), text(x.text)))))),
      text(F.credit, 'subtle')));
    main.append(sec('gains', el('h2', {}, F.gains_title), text(F.gains_intro, 'muted'),
      el('div', { class: 'ft-gains' }, F.gains.map(g => el('div', { class: 'metric' }, el('small', {}, g.label), el('strong', {}, g.value), el('p', g.names ? { 'data-no-i18n': '' } : {}, g.text || g.names)))),
      text('Source: ' + F.gains_source, 'subtle')));
    main.append(sec('orgs', el('h2', {}, F.orgs_title), text(F.orgs_intro, 'muted'),
      el('div', { class: 'ft-orgs' }, F.orgs.map(o => { const n = el('section', { class: 'panel ft-org', id: 'ft-org-' + o.id, 'data-f': o.id },
        el('h3', {}, o.name),
        el('div', { class: 'ft-stars' }, el('div', { class: 'metric' }, el('strong', {}, o.stars_top), el('small', {}, F.stars_top_label)), el('div', { class: 'metric' }, el('strong', {}, o.stars_last), el('small', {}, F.stars_last_label))),
        el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, F.node_head.map(h => el('th', { scope: 'col' }, h)))), el('tbody', { 'data-no-i18n': '' }, o.nodes.map(r => el('tr', {}, r.map(v => el('td', {}, v))))))),
        text(o.note, 'muted')); if (anchor === 'org-' + o.id) n.dataset.scrollHere = ''; return n; })),
      text('Source: ' + F.orgs_source, 'subtle')));
    /* The card lines that go on past the order above and do not agree with each other: shown once, each with its source. */
    if (later.length) main.append(sec('later', el('h2', {}, F.later_title), text(F.later_intro, 'muted'),
      el('ul', { class: 'ft-lines' }, later.map(line).filter(Boolean).map(lineItem))));
    main.append(sec('details', el('h2', {}, F.details_title), ...['force-talents-numbers', 'force-talents'].map(card).filter(Boolean).map(c => {
      const rest = c.lines.filter((l, n) => !used.has(c.id + ':' + n));
      const n = el('section', { class: 'panel rule-card', id: 'card-' + c.id }, el('h3', {}, c.title, ' ', cardLink('talents/' + c.id)), c.intro ? text(c.intro, 'muted') : null,
        rest.length ? el('ul', { class: 'list v2-gr-list' }, rest.map(l => el('li', {}, el('span', {}, l.text), srcLine(l)))) : link(F.order_title + ' ↑', '#talents/order'),
        c.source ? text('Source: ' + c.source, 'subtle') : null);
      if (anchor === c.id) { n.dataset.scrollHere = ''; n.classList.add('focus'); }
      return n; })));
    main.append(sec('sources', el('h2', {}, F.sources_title),
      el('div', { class: 'table-wrap' }, el('table', {}, el('thead', {}, el('tr', {}, F.sources_head.map(h => el('th', { scope: 'col' }, h)))), el('tbody', {}, F.sources.map(r => el('tr', {}, r.map((v, i) => el('td', {}, i ? v : el('strong', { 'data-no-i18n': '' }, v)))))))),
      el('h2', {}, F.unknown_title), el('ul', { class: 'list' }, F.unknown.map(x => el('li', {}, x)))));
  }

  /* ---------- Data book: the public game-data tables, opened inside the guide (tables: d/book/<id>.js) ---------- */
  const ORG_CLASS = { 'No Organization': 'noorg', 'Anteiku': 'anteiku', 'Aogiri Tree': 'aogiri', 'CCG': 'ccg' };
  const bookBox = rows => el('div', { class: 'book-box' }, rows.map(([k, v]) => el('p', {}, el('b', {}, k), ' ', v)));
  function bookCell(c, v, first) {
    if (c.img) return el('td', { class: 'pic' }, v && first && byKey.get(String(v))?.portrait ? image(byKey.get(String(v)).portrait, '', '') : null);
    if (v === null || v === undefined || v === '') return el('td', {});
    const cls = [];
    let kid;
    if (typeof v === 'number') { cls.push(c.center ? 'c' : 'r', 'n'); kid = c.pct ? (v * 100).toFixed(v < 0.1 && v > 0 ? 1 : 0) + '%' : c.x ? v.toFixed(2) + 'x' : v.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
    else {
      const t = String(v); if (c.center) cls.push('c');
      kid = c.kind === 'org' ? el('span', { class: 'tag org', 'data-f': ORG_CLASS[t] || null }, t) : c.kind === 'grade' ? el('span', { class: 'tier-badge small t-' + t[0] }, t)
        : c.islink && safeURL(t) ? el('a', { href: t, target: '_blank', rel: 'noopener noreferrer', class: 'text-link' }, (c.label || t) + ' ↗') : t;
      if (t.length > 70) cls.push('w'); else if (t.length < 28) cls.push('n');
    }
    if (c.bold) cls.push('b'); if (c.dim || (!first && c.grp)) cls.push('dim');
    return el('td', { class: cls.join(' ') || null }, kid);
  }
  /* The data book is a snapshot (scripts/import_databook.py); the rest of the guide is rebuilt every day. So every data
     book page shows the book's date and game-data version, and says so when the guide's own game data is newer. */
  const buildNo = s => { const m = /(\d{4,6})\D*$/.exec(String(s || '')); return m ? +m[1] : 0; };
  function bookStamp(M, built = true) {
    const mine = buildNo(V.stats_source), book = buildNo(M.game_data);
    const newer = mine > book ? 'The character pages of this guide use newer game data (build ' + mine + '). Where the two differ, the character pages are current.' : null;
    return built || newer ? el('p', { class: 'subtle book-stamp' }, built ? 'Data book built ' + M.built + ' from game data ' + M.game_data + '.' : null, built && newer ? ' ' : null, newer) : null;
  }
  /* A table that lists characters the guide's own list does not have says which list is the current one. */
  function bookRosterNote(names) {
    return el('p', { class: 'notice book-note' }, names.length + (names.length === 1 ? ' character in this table is not in the guide’s own character list:' : ' characters in this table are not in the guide’s own character list:'), ' ',
      el('span', { 'data-no-i18n': '' }, names.join(', ')), '. ', 'The guide’s own list is the current one.', ' ', link('Browse characters →', '#characters'));
  }
  function bookTable(B, M, page, raw) {
    const info = page || raw, id = info.id;
    main.append(link('← ' + B.title, '#data', 'back'));
    title('DATA BOOK', page ? page.title : raw.title);
    main.append(bookStamp(M));
    main.append(page ? bookBox([['WHAT THIS IS', page.what], ['HOW TO USE IT', page.how + ' ' + B.how_web]]) : bookBox([['WHAT THIS IS', raw.what], ['SOURCE', raw.source + '.']]));
    const holder = el('div', {}, text('Loading the table…', 'notice loading')); main.append(holder);
    window.TG_LOAD(['book/' + id]).then(() => {
      const T = (D.book || {})[id]; if (!T || !holder.isConnected) return;
      const cols = T.cols, oi = cols.findIndex(c => c.kind === 'org'), group = T.group;
      if (group != null) cols[group].grp = true;
      let sort = -1, dir = 1, q = '', of = '', shown = 200;
      const qin = input('', 'search', { placeholder: 'Search this page, for example a character name', 'aria-label': 'Search this table' });
      const osel = oi >= 0 ? select([['', 'All orgs'], ...Object.keys(ORG_CLASS)], '', v => { of = v; shown = 200; draw(); }) : null;
      const count = text('', 'results-count'), tb = el('tbody', { 'data-no-i18n': '' }), moreBtn = button('Show more rows', () => { shown += 400; draw(); });
      count.setAttribute('role', 'status');
      /* Column kinds from the data: numbers and short codes stay on one line, longer text wraps inside a column wide
         enough to keep rows short (M-A, fix round 2). */
      const kinds = [], colMin = cols.map((c, i) => { kinds[i] = ''; if (c.img) return 0; const lens = [];
        for (const r of T.rows) { const v = r[i]; if (v == null || v === '') continue; if (typeof v === 'number') lens.push(0); else lens.push(String(v).length); }
        lens.sort((a, b) => a - b); const max = lens[lens.length - 1] || 0, p90 = lens[Math.floor(lens.length * 0.9)] || 0;
        if (max <= 28) { kinds[i] = 'col-short'; return 0; }
        kinds[i] = 'col-text'; return Math.round(Math.min(640, Math.max(200, p90 * 7.6 / 2))); });   /* the typical long cell in about two lines */
      const ths = cols.map((c, i) => { const th = el('th', { scope: 'col', class: [c.center ? 'c' : '', kinds[i]].join(' ').trim() || null, 'aria-sort': 'none' });
        if (colMin[i]) th.style.minWidth = colMin[i] + 'px';
        if (c.img) return th;
        th.append(el('button', { type: 'button', class: 'th-sort', on: { click: () => { dir = sort === i ? -dir : 1; sort = i; shown = 200; draw(); } } }, c.h || '·'), c.hint ? el('small', {}, c.hint) : '');
        return th; });
      function draw() {
        let rows = T.rows.filter(r => (!of || r[oi] === of) && (!q || r.some(v => v != null && String(v).toLowerCase().includes(q))));
        if (sort >= 0) rows = rows.slice().sort((a, b) => { const x = a[sort], y = b[sort]; if (x === y) return 0; if (x === '' || x == null) return 1; if (y === '' || y == null) return -1; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir; });
        ths.forEach((th, i) => th.setAttribute('aria-sort', sort === i ? (dir > 0 ? 'ascending' : 'descending') : 'none'));
        let prev = null;
        tb.replaceChildren(...rows.slice(0, shown).map(r => { const first = group == null || r[group] !== prev; if (group != null) prev = r[group]; return el('tr', {}, cols.map((c, i) => { const td = bookCell(c, r[i], first); if (kinds[i] === 'col-short') td.classList.add('n'); return td; })); }));
        count.textContent = rows.length.toLocaleString('en-US') + ' of ' + T.rows.length.toLocaleString('en-US') + ' rows';
        moreBtn.hidden = rows.length <= shown;
      }
      qin.addEventListener('input', () => { q = qin.value.trim().toLowerCase(); shown = 200; draw(); });
      const ni = cols.findIndex(c => /^(Character|name)$/.test(c.h || '')), extra = new Map();
      if ((cols[0].img || cols[0].h === 'unit id') && ni > 0) for (const r of T.rows) if (/^\d{4}$/.test(String(r[0])) && !byKey.has(String(r[0]))) extra.set(String(r[0]), r[ni]);
      const wrap = el('div', { class: 'table-wrap book-table', tabindex: '0', role: 'region', 'aria-label': info.title }, el('table', {}, el('thead', {}, el('tr', {}, ths)), tb));
      const cue = el('p', { class: 'subtle scroll-cue', hidden: '' }, 'This table is wider than the screen. Scroll it sideways to see every column →');
      const box = el('div', { class: 'book-scroll' }, wrap);
      /* Sideways-scroll cue: a line above the table and a fade on the edge that still has columns behind it. */
      const edge = () => { const over = wrap.scrollWidth - wrap.clientWidth > 2; cue.hidden = !over; box.style.setProperty('--sbw', (wrap.offsetWidth - wrap.clientWidth - 2) + 'px');
        box.classList.toggle('more-right', over && wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 2); box.classList.toggle('more-left', over && wrap.scrollLeft > 2); };
      wrap.addEventListener('scroll', edge, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(edge).observe(wrap);
      holder.replaceChildren(extra.size ? bookRosterNote([...extra.values()]) : '',el('div', { class: 'filters book-tools' }, field('Search', qin), osel ? field('Org', osel) : null), count, cue, box, moreBtn);
      draw();
      /* Header cells get a min-width that fits their label and hint in at most two lines each, measured on the text as
         shown (after the PT/ES translation has run), so no header row grows tall around a narrow column. */
      const fitHeads = () => { if (!wrap.isConnected) return; const cx = document.createElement('canvas').getContext('2d');
        for (const th of ths) { let need = 0;
          for (const node of [th.querySelector('.th-sort'), th.querySelector('small')]) { if (!node || !node.textContent.trim()) continue;
            const cs = getComputedStyle(node), ls = parseFloat(cs.letterSpacing) || 0, txt = cs.textTransform === 'uppercase' ? node.textContent.toUpperCase() : node.textContent;
            cx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
            const words = txt.trim().split(/\s+/), w = t => cx.measureText(t).width + ls * t.length;
            let best = w(words.join(' '));
            for (let k = 1; k < words.length; k++) best = Math.min(best, Math.max(w(words.slice(0, k).join(' ')), w(words.slice(k).join(' '))));
            need = Math.max(need, best + (node.tagName === 'BUTTON' ? 22 : 4)); }
          const i = ths.indexOf(th); if (need || colMin[i]) th.style.minWidth = Math.max(colMin[i], Math.min(340, Math.ceil(need + 24))) + 'px'; }
        edge(); };
      requestAnimationFrame(() => { fitHeads(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeads); });
    }).catch(() => { holder.replaceChildren(text('This table could not be loaded', 'notice'), link('← ' + B.title, '#data')); });
  }
  function orgPower(B, M) {
    const O = B.org, P = M.org_power;
    main.append(link('← ' + B.title, '#data', 'back'));
    title('DATA BOOK', O.title);
    main.append(bookStamp(M));
    main.append(bookBox([['WHAT THIS IS', O.what], ['HOW TO USE IT', O.how]]), el('div', { class: 'notice' }, O.say));
    main.append(el('div', { class: 'book-orgs' }, P.orgs.map(o => el('section', { class: 'panel book-org', 'data-f': ORG_CLASS[o.name] || null },
      el('p', { class: 'book-rank' }, o.rank), el('h2', { 'data-no-i18n': '' }, o.name), el('p', { class: 'v2-gem' }, o.best5), text(O.best5_label, 'muted'), el('p', { class: 'subtle', 'data-no-i18n': '' }, o.delta),
      el('ul', { class: 'list', 'data-no-i18n': '' }, o.stats.map(([n, l]) => el('li', {}, el('strong', {}, n), ' ', l))),
      el('p', { class: 'book-top' }, byKey.get(o.top_id)?.portrait ? image(byKey.get(o.top_id).portrait, '', '') : null, el('span', {}, el('small', {}, O.top_label), el('br'), byKey.has(o.top_id) ? el('a', { href: '#hero/' + o.top_id, 'data-no-i18n': '' }, o.top_name) : el('strong', { 'data-no-i18n': '' }, o.top_name), ' ', o.top_cp))))));
    main.append(el('h2', {}, O.growth_title), el('ul', { class: 'list', 'data-no-i18n': '' }, P.growth.map(([n, t]) => el('li', {}, el('strong', {}, n + ': '), t))));
    main.append(el('h2', {}, O.table_title), text(O.table_note, 'muted'),
      el('div', { class: 'table-wrap book-table' }, el('table', {}, el('thead', {}, el('tr', {}, P.head.map(h => el('th', { scope: 'col' }, h)))), el('tbody', { 'data-no-i18n': '' }, P.rows.map(r => el('tr', {}, r.map((v, i) => el('td', { class: i ? 'r n' : 'b' }, v))))))),
      text(O.projection_note, 'subtle'));
  }
  function dataBook(id) {
    const B = G.databook, M = D.bookmeta;
    if (!B || !M) { TG.pages.home(); return; }
    if (id === 'org-power') return orgPower(B, M);
    const page = B.pages.find(p => p.id === id), raw = M.raw.find(p => p.id === id);
    if (page || raw) return bookTable(B, M, page, raw);
    const pageTitle = pid => pid === 'org-power' ? B.org.title : (B.pages.find(p => p.id === pid) || {}).title;
    title('DATA BOOK', B.title, B.intro);
    main.append(...[bookStamp(M, false), text(B.open_note, 'muted')].filter(Boolean));
    main.append(el('div', { class: 'mini-grid' }, [['Characters', M.characters], ['Pages', B.pages.length + 1], ['Rows of data', M.rows_total.toLocaleString('en-US')], ['Game data version', M.game_data]].map(([l, v]) => el('div', { class: 'metric' }, el('small', {}, l), el('strong', {}, v)))));
    if (M.characters !== heroes.length) main.append(el('p', { class: 'notice book-note' }, 'The data book counts ' + M.characters + ' characters; the guide’s own character list has ' + heroes.length + ' and is the current one.', ' ', link('Browse characters →', '#characters')));
    main.append(el('h2', {}, B.questions_title), el('div', { class: 'book-cards' }, B.questions.map(x => el('a', { class: 'panel book-card', href: '#data/' + x.page }, el('small', {}, pageTitle(x.page)), el('strong', {}, x.q), el('span', {}, x.what)))));
    main.append(el('div', { class: 'actions' }, link('Calculate your pull budget →', '#spend', 'button')));
    main.append(el('h2', {}, B.words_title), el('dl', { class: 'book-defs' }, B.words.map(([w, d]) => el('div', {}, el('dt', {}, w), el('dd', {}, d)))));
    main.append(el('h2', {}, B.good_title), el('ul', { class: 'list' }, B.good.map(x => el('li', {}, x))));
    main.append(el('h2', {}, B.fact_title), el('dl', { class: 'book-defs' }, B.fact.map(([w, d]) => el('div', {}, el('dt', {}, w), el('dd', {}, d)))));
    main.append(el('h2', {}, B.raw_title), text(B.raw_intro, 'muted'), el('div', { class: 'book-cards' }, M.raw.map(x => el('a', { class: 'panel book-card', href: '#data/' + x.id }, el('small', {}, x.rows.toLocaleString('en-US') + ' rows'), el('strong', {}, x.title), el('span', {}, x.what)))));
  }

  function spendPage() { title('TOOLS', 'Diamond and pull calculators.', 'Enter the numbers from your game. Nothing is assumed.'); howto('spend'); const tools = el('div'); main.append(tools); window.Economy.mount(tools, profile); }

  /* ---------- registration ---------- */
  Object.assign(TG.pages, { new: newUnit, start: startHere, 'best-teams': id => bestTeams(id), meta: id => metaPage(id), challenges: id => challenges(id), run: recommender, buy,
    tiers: tierList, characters: codex, hero: (id, tab) => heroDetail(id, tab), teams: id => teams(id), bosses: id => bosses(id), banners, spend: spendPage, modes: id => modeLibrary(id),
    cells, coffee, videos: id => videos(id), progression, account, sources, plan, stronghold, sim, rules, talents, data: dataBook });
  TG.after = (r, id, tab) => { enNote(r, id, tab); if (r === 'hero' && id) statsPanel(id); };
})();
