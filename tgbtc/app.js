/* Field Guide core: shared helpers, the saved profile, navigation, the router, Home and Search.
   Page renderers live in pages.js (loaded on first use). All imported text is rendered through textContent; no HTML injection. */
'use strict';
/* Started by boot.js once the chosen language's text is loaded (English starts at once). */
window.TGI18N.ready(() => {
const D=window.TGDATA;
const main=document.getElementById('main');
if(!D||!Array.isArray(D.heroes)||!D.guide){main.textContent='Guide data could not load. Extract every file and reopen dist/index.html.';return;}
const heroes=D.heroes, byKey=new Map(heroes.map(h=>[h.key,h])), G=D.guide, E=D.expert, KEY='tgbtc-profile-v1';
let storageWarning=false, toastTimer;

/* ---------- saved profile (browser storage; shape is version 1 and must not change without a migration) ---------- */
const STAT_KEYS=['CP','ATK','DEF','HP'];
const fresh=()=>({version:1,region:'Unspecified',serverDay:1,budget:0,owned:{},favorites:[],teams:[],logs:[],ticks:{},dataFirst:false,notes:'',bannerNotes:'',stats:{}});
/* 10-27: a unit released after the game files (status 'datamined', kit from a fan datamine) can be owned and used in teams. */
function playable(h){return !!h&&(h.status==='archived'||h.status==='datamined');}
function clampInt(x,a,b,f){const n=Number(x);return Number.isInteger(n)&&n>=a&&n<=b?n:f;}
function validateTeam(t){if(!t||typeof t!=='object')throw Error('Invalid team.');const fieldCount=Number(t.fieldCount),reserveCount=Number(t.reserveCount);if(![4,5].includes(fieldCount)||![0,1,2].includes(reserveCount))throw Error('Formation needs 4 or 5 field slots and 0–2 optional reserves.');if(!Array.isArray(t.slots)||t.slots.length!==fieldCount+reserveCount)throw Error('Slot count does not match formation.');const ids=t.slots.filter(Boolean);if(ids.some(k=>!playable(byKey.get(k))))throw Error('Unavailable character in formation.');if(ids.length!==new Set(ids).size)throw Error('A character variant cannot occupy two slots.');return{name:String(t.name||'Untitled formation').slice(0,100),mode:String(t.mode||'Unspecified').slice(0,100),fieldCount,reserveCount,slots:t.slots.map(v=>v||''),confirmed:t.confirmed===true};}
function cleanProfile(raw){
 if(!raw||raw.version!==1)throw Error('Unsupported profile version.');
 const p=fresh();p.region=['Unspecified','NA','EU','Asia','Other'].includes(raw.region)?raw.region:'Unspecified';p.serverDay=clampInt(raw.serverDay,1,9999,1);p.budget=(Number.isFinite(Number(raw.budget))&&Number(raw.budget)>=0&&Number(raw.budget)<=100000?Number(raw.budget):0);p.dataFirst=raw.dataFirst===true;
 for(const [k,v] of Object.entries(raw.owned||{}))if(playable(byKey.get(k)))p.owned[k]=clampInt(v,0,6,0);
 p.favorites=Array.isArray(raw.favorites)?[...new Set(raw.favorites.filter(k=>byKey.has(k)))].slice(0,143):[];
 p.teams=Array.isArray(raw.teams)?raw.teams.slice(0,30).map(validateTeam):[];
 for(const [k,v] of Object.entries(raw.stats&&typeof raw.stats==='object'?raw.stats:{}))if(byKey.has(k)&&v&&typeof v==='object'){const s={};for(const n of STAT_KEYS)if(Number.isSafeInteger(v[n])&&v[n]>=0&&v[n]<=1e9)s[n]=v[n];if(Object.keys(s).length)p.stats[k]=s;}
 p.notes=String(raw.notes||'').slice(0,5000);p.bannerNotes=String(raw.bannerNotes||'').slice(0,3000);
 p.logs=Array.isArray(raw.logs)?raw.logs.slice(0,100).filter(x=>x&&typeof x==='object').map(x=>({boss:String(x.boss||'').slice(0,100),date:String(x.date||'').slice(0,40),setup:String(x.setup||'').slice(0,3000),result:String(x.result||'').slice(0,3000)})):[];
 p.ticks=raw.ticks&&typeof raw.ticks==='object'&&!Array.isArray(raw.ticks)?Object.fromEntries(Object.entries(raw.ticks).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}:\d$/.test(k)&&v===true)):{};
 return p;
}
let profile;try{profile=cleanProfile(JSON.parse(localStorage.getItem(KEY)));}catch(e){profile=fresh();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(profile));return true;}catch(e){storageWarning=true;notify('Browser storage unavailable. Export your profile to keep changes.');return false;}}
function notify(s){const t=document.getElementById('toast');t.textContent=s;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.textContent='',4500);}

/* ---------- DOM helpers ---------- */
function el(tag,attrs={},...kids){const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(v==null)continue;if(k==='class')n.className=v;else if(k==='on')for(const[event,fn]of Object.entries(v))n.addEventListener(event,fn);else if(k==='checked')n.checked=!!v;else if(k==='value')n.value=v;else n.setAttribute(k,String(v));}for(const k of kids.flat(Infinity)){if(k!==null&&k!==undefined)n.append(k instanceof Node?k:document.createTextNode(String(k)));}return n;}
const text=(t,cls)=>el('p',{class:cls||''},t), tag=(s,cls='')=>el('span',{class:'tag '+cls},s), panel=(...kids)=>el('section',{class:'panel'},...kids), grid=(...kids)=>el('div',{class:'grid'},...kids);
const button=(s,fn,cls='')=>el('button',{type:'button',class:cls,on:{click:fn}},s);
const link=(s,to,cls='text-link')=>el('a',{href:to,class:cls},s);
const arr=x=>Array.isArray(x)?x:x==null?[]:[x];
const words=x=>typeof x==='string'?x:JSON.stringify(x);
function safeURL(s){try{const u=new URL(s);return u.protocol==='https:'||u.protocol==='http:';}catch{return false;}}
function external(s,url){if(!safeURL(url))return text(s+' — source URL unavailable','subtle');return el('a',{href:url,target:'_blank',rel:'noopener noreferrer',class:'text-link'},s+' ↗');}
function srcLink(src,label='Read source'){if(!src)return tag('Source needed','gold');if(safeURL(src))return external(label,src);if(/^(data|research)\/[\w/., -]+\.(json|txt|md)$/.test(src))return el('a',{href:src,class:'text-link',target:'_blank',rel:'noopener noreferrer'},label+' ↗');return text(src,'subtle');}
function evidence(v){const box=el('details',{class:'more'},el('summary',{},'Source'));if(v.source==='game-data')box.append(text('Game data (EU build of September 22, 2026).','subtle'));else if(v.source==='fan-datamine'){box.append(text('Fan datamine of established servers (gluttony.dev), fetched October 26, 2026. Not in the game files this guide uses.','subtle'),external('gluttony.dev',v.source_url));}else if(Array.isArray(v.sources))box.append(el('ul',{class:'list'},v.sources.map(x=>el('li',{},x))));else if(v.source)box.append(srcLink(v.source));const when=v.source_date||v.as_of||v.date;if(when)box.append(text('Date: '+words(when),'subtle'));return box;}
function image(path,alt,cls='',eager=false){if(!path||!/^assets\/[\w/.-]+$/.test(path))return el('span',{class:'missing',role:'img','aria-label':'Artwork unavailable'},'◇');const im=el('img',{src:path,alt,class:cls,loading:eager?'eager':'lazy',decoding:'async'});im.addEventListener('error',()=>im.replaceWith(el('span',{class:'missing',role:'img','aria-label':'Artwork unavailable'},'◇')),{once:true});return im;}
function more(kids,label='More details'){return el('details',{class:'more'},el('summary',{},label),...arr(kids).map(k=>typeof k==='string'?text(k):k));}
function title(eyebrow,heading,intro,extra){main.append(el('p',{class:'eyebrow'},eyebrow),el('h1',{},heading));if(intro)main.append(text(intro,'section-intro'));if(extra)main.append(more(extra));}
function brief(short,rest){return el('div',{class:'notice'},el('p',{},short),rest?more(rest):null);}
function field(label,input){const id='f-'+(++field.count);input.id=id;return el('div',{class:'field'},el('label',{for:id},label),input);}field.count=0;
function select(values,value,fn){const s=el('select',{on:fn?{change:()=>fn(s.value)}:{}});for(const v of values){const [id,t]=Array.isArray(v)?v:[v,v];s.append(el('option',{value:id},t));}s.value=value;return s;}
const input=(value='',type='text',attrs={})=>el('input',{type,value,...attrs});
const fixName=s=>String(s||'').replace('[Scorpion1/56]','[Scorpion]').replace(/^Scorpion1\/56 /,'Scorpion ').replace(/\bTouka /g,'Toka ').replace(/ /g,' ');
const PLAY=['No Organization','Aogiri Tree','Anteiku','CCG'];
const playFaction=h=>h.factions.find(f=>PLAY.includes(f))||h.factions.find(f=>f!==':re')||'Unknown';
const regionLabel=()=>profile.region==='Unspecified'?'Region not set':profile.region;
function headerContext(){document.getElementById('context').textContent=regionLabel()+' · day '+profile.serverDay+' · '+Object.keys(profile.owned).length+' owned →';document.body.classList.toggle('data-first',profile.dataFirst);}
function searchForm(value='',onSearch){const q=input(value,'search',{placeholder:'Search…','aria-label':'Search the guide'});const f=el('form',{class:'searchform',role:'search',on:{submit:ev=>{ev.preventDefault();(onSearch||((v)=>location.hash='search/'+encodeURIComponent(v)))(q.value);}}},q,el('button',{type:'submit',class:'primary'},'Search →'));return f;}
function card(h){const nm=fixName(h.name),parts=nm.split(' [');return el('a',{href:'#hero/'+h.key,class:'character','aria-label':nm},el('div',{class:'char-meta'},tag(h.rarity),profile.owned[h.key]!==undefined?tag('OWNED','cyan'):null),el('div',{class:'portrait'},image(h.portrait,nm)),el('div',{class:'character-copy'},el('strong',{},parts[0]),el('small',{},parts[1]?'['+parts[1]:h.status==='announced'?'Not released yet':'Character'),tag(h.attribute||'Unknown'),tag(playable(h)?playFaction(h):h.status==='announced'?'Not released':'Placeholder','gold')));}
const tipLi=b=>el('li',{},b.tip?el('span',{class:'tag gold guild-tip'},G.guild_tip):null,b.tip?el('br'):null,b.text);
function howBox(bullets,heading='How to play',source){return el('section',{class:'howto','aria-label':heading},el('h2',{},heading),el('ul',{},bullets.map(b=>tipLi(typeof b==='string'?{text:b}:b))),source?more([text('Source: '+source,'subtle')],'Source'):null);}
function howto(page){if(G.howto[page])main.append(howBox(G.howto[page],page==='buy'?'How to spend':'How to play',G.howto_sources[page]));}
const MKEY='tgbtc-meta-faction', MF=G.mf_index||[];
function setFac(v){try{localStorage.setItem(MKEY,v);}catch(e){}}

/* ---------- navigation: six groups; every page of the guide is listed once ---------- */
const topic=id=>(G.rule_topics||[]).find(t=>t.id===id);
const has=k=>(G.parts||[]).includes(k);   // optional sections this build carries
/* The newest released unit, from the data: the latest SEA release date that is not in the future (build.py leaves out
   placeholder rows such as all-0 stats or a 2099 date); ties go to the higher id. Null when the data has none. */
const PLACEHOLDER=new Set(D.placeholder||[]);
function newestUnit(){const now=new Date(),today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');let best=null;
 for(const[k,d]of Object.entries(D.release||{})){if(d>today||PLACEHOLDER.has(k)||!byKey.has(k))continue;if(!best||d>best[1]||(d===best[1]&&+k>+best[0]))best=[k,d];}
 return best?best[0]:null;}
/* A rule topic's directory line: the first sentence of its first card intro, in this language (no new wording). The four
   built-in cards (pages.js) keep their lead line here; pages.js shows the same strings. */
const BUILTIN_LEAD={'b-hand':'Cards in your hand and plays per turn depend on how many of your characters are still alive. 4 plays is the max.',
 'b-weekly':'Points = 500 + total damage × 0.004 + best single hit × 0.005 + damage from attacking the attribute you counter × 0.0065. Higher difficulty adds a percent on top. Each borrowed character takes 20% off. Beat it in 5 turns or it fails.',
 'b-orgtech':'Each tier opens when every tech in the tier above is activated and the server is old enough (T5 = day 10 … T20 = day 230). You must be in the org 24 h before you can research.'};
/* The first sentence that describes the topic. A sentence that is a date ("The event runs November 10 to …"), a source note
   ("Seen on our own accounts …", "Our server's day 1 is …") is skipped. A topic that opens with a formula ("Points = 500 + …"), or
   has no other sentence, has no line (L-2, fix round 3). The same in EN/PT/ES. */
const NOT_LEAD=[/\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}\b|\b\d{1,2} de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|enero|febrero|marzo|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\b(day|dia|día) 1\b/,
 /^(Seen|Source|Visto|Vistos|Fonte|Fuente)\b/i],FORMULA=/=|×\s*\d*[.,]\d/;
const lead=s=>{if(!s)return'';let r=s.trim();
 while(r){const m=/^([\s\S]+?(?<!\b[A-Z]{1,2})[.!?])(?=\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ¿¡"(\d]|$)/.exec(r),o=m?m[1]:r;r=r.slice(o.length).trim();
  const c=o.replace(/\s*\([^()]*\)(?=[.!?]$)/,'');if(FORMULA.test(c))return'';if(NOT_LEAD.some(x=>x.test(c)))continue;
  return c.length>120?c.slice(0,c.lastIndexOf(' ',117))+' …':c;}
 return'';};
const T=id=>{const t=topic(id)||{},b=BUILTIN_LEAD[(t.cards||[])[0]];return['rules/'+id,t.title||id,lead(b?window.TGI18N.t(b):t.intro)];};
const NAV=[
 {id:'start',label:'Start',pages:[['start','Start here','Six steps for a new account'],['progression','Daily plan','Checklist and milestones'],T('daily'),['new','New unit','How she works and her teams'],['account','My account','Mark your characters and stars, then build teams from them.']]},
 {id:'teams',label:'Teams',pages:[['meta','Meta teams','Pick your faction: a team for every fight'],['best-teams','Best teams','The team for each mode and boss'],['challenges','Challenges','Events with entry rules.'],['run','What should I run?','Tick what you own, get teams'],['teams','Team builder','Build and save teams'],['sim','Battle replay','Watch the simulator play a boss fight, card by card']]},
 {id:'build',label:'Characters',pages:[['characters','Characters','All 143, with skills'],['tiers','Tier list','Spend or free? 122 rated units'],['talents','Force Talents','The tree in four pictures'],T('lr'),['cells','Cells','Cells and potential.'],T('leveling'),T('org-tech')]},
 {id:'modes',label:'Modes',pages:[['modes','Game modes','How to unlock and play each one.'],['bosses','Boss Lab','Boss skills and plans'],['stronghold','Stronghold','Maps, what each building pays, what top orgs earn'],T('arena'),T('weekly'),T('combat'),['rules','Game rules','RTA numbers, Weekly Challenge points calculator, Org Tech map']]},
 {id:'spend',label:'Spending',pages:[['buy','What to buy','Top picks, good and skip'],['plan','Gem planner','Free, VIP 5 or VIP 10: Diamonds in 1–4 weeks, and what to buy'],['spend','Tools','Diamond and pull math'],['banners','Banners','Live banner and history'],T('events'),T('shops')]},
 {id:'library',label:'Library',pages:[['videos','Videos','Search by topic, creator or title.'],['data','Data book','Game data only: characters, stats, skills, banners, shop prices and more.'],['coffee','Coffee','24 coffee recipes.'],['sources','Sources','Sources and full articles.']]},
].map(g=>({...g,pages:g.pages.filter(p=>!p[0].startsWith('rules/')||topic(p[0].slice(6))).filter(p=>p[0]!=='data'||has('databook')).filter(p=>p[0]!=='talents'||has('force_talents'))}));
/* Extra search words per page (English, Portuguese, Spanish), so a search finds the page by what it is about. */
const KEYWORDS={talents:'force talent talents tree certificate certificates branch middle top bottom row node org talento talentos árvore árbol certificado certificados ramo rama força fuerza fileira fila nó nodo de linha do meio del medio',
 start:'new account first steps beginner begin conta nova primeiros passos cuenta nueva primeros pasos comece aqui começar iniciante empieza aquí empezar principiante dias guia inicial días guía',progression:'daily checklist milestones routine diário diaria rotina rutina plano plan lista marcos hitos diária tarefas diárias metas dia do servidor diario tareas diarias día del',
 new:'hinami halloween anteiku support new unit unidade nova unidad nueva suporte personagem novo soporte apoyo personaje nuevo',account:'profile server collection backup export import perfil servidor coleção colección minha conta meus personagens exportar importar mi cuenta mis personajes copia de seguridad',
 meta:'meta teams faction anteiku aogiri ccg no org starter mid endgame equipes equipos facção facción times sem organização inicial intermediário sin organización intermedio','best-teams':'best teams pve arena guild war carnival boss world boss owl bin noro centipede weekly challenge organization capture melhores equipes mejores equipos chefe jefe guerra de guild melhor time equipe para cada modo chefes mundial mejor equipo jefes',
 challenges:'events entry rules restricted eventos regras reglas desafios desafíos de entrada restrições quem pode entrar restricciones quién puede',run:'recommender owned roster what to run recomendador o que usar qué usar devo minhas unidades meus personagens sugestão de equipe debo mis personajes sugerencia equipo',teams:'team builder formation save export montar equipe crear equipo montador creador formação formación de equipes salvar exportar equipos armar guardar',
 sim:'battle replay simulator cards hand simulador batalha batalla replay repetição repetición de simulação luta chefe cartas mão turno simulación pelea jefe mano',characters:'characters codex roster skills kits personagens personajes habilidades unidades lista de passivas kit pasivas',tiers:'tier list ranking spend free pay-to-win invest short term long term stars classificação clasificación estrelas estrellas grátis gratis notas melhores unidades gastar ou mejores o',
 cells:'cells potential equipment rc cell orb builds células celdas potencial equipamento equipo potenciais esfera potenciales',modes:'game modes walkthrough unlock modos modos de jogo modos de juego desbloquear',bosses:'boss lab skills plan fight log chefes jefes chefe jefe chefão habilidades do plano de luta registro del pelea',
 stronghold:'stronghold guild war maps rewards core buildings org saturday mapas recompensas fortaleza fortalezas guerra de guild guilda gremio gremios núcleo sábado construções del edificios',rules:'game rules how the game works numbers regras do jogo reglas del juego regra regla números como o funciona cómo el',
 'rules/combat':'battle basics hand cards plays turn order cp match merge who moves first batalha combate noções básicas cartas mão turno ordem batalla conceptos básicos mano orden de jogadas por juntar jugadas fusionar',
 'rules/arena':'rta real-time arena real time pvp org ranking strongest faction arena em tempo real ranking de orgs facção mais forte arena en tiempo real facción más fuerte pontos sequência vitórias puntos racha victorias',
 'rules/weekly':'weekly challenge points calculator borrowed desafio semanal pontos calculadora desafío semanal puntos de dano emprestado vantagem atributo daño prestado ventaja',
 'rules/org-tech':'org tech technology upgrade research tecnologia da org organização pesquisa melhorar tecnología de la org organización investigación mejorar árvore melhorias árbol mejoras',
 'rules/lr':'lr cell cells lr tactics cell creation célula células lr táticas celda celdas lr tácticas criação creación equipamento equipo',
 'rules/leveling':'level cap promotion scenes limit levels past 200 nível níveis limite de nível promoção cenas nivel niveles límite de nivel promoción escenas subir máximo rank rango',
 'rules/events':'events group buy anniversary free paid eventos compra em grupo compra coletiva aniversário grátis pago compra grupal aniversario gratis de pago evento calendário recompensas calendario',
 'rules/shops':'exchange shop shops prices store loja lojas de troca preços tienda tiendas de intercambio precios das moedas da arena org las monedas la',
 'rules/daily':'daily routine mode costs time savers limits rotina diária custos dos modos limites rutina diaria costes costos de los modos límites diárias energia tentativas o que fazer todo dia diarias energía intentos qué hacer cada día',
 buy:'what to buy shop prices passes packs monthly card pity diamond spring comprar loja tienda o que comprar qué comprar passes pases pacotes paquetes cartão mensal vale a pena diamantes grátis tarjeta mensual la gratis',plan:'gem planner diamonds income vip weeks planejador diamantes planificador gemas renda ingresos semanas de quantos cuántos',spend:'diamond spring spending budget pity calculator pull chance calculadora ferramentas herramientas orçamento presupuesto',
 banners:'banner banners live halloween hinami history green juzo histórico historial recrutamento reclutamiento invocação invocación ativo limitado de activo',videos:'videos creators youtube vídeos creadores criadores videoteca canal',data:'data book tables csv stats skills banners spreadsheet tabelas tablas dados datos livro de dados libro de datos atributos estadísticas planilha estatísticas habilidades preços do jogo hoja cálculo precios del juego',
coffee:'coffee recipes ingredients café receitas recetas de ingredientes',sources:'sources old articles full articles unknown fontes fuentes artigos artículos completos antigos de onde vem o que não se sabe antiguos dónde sale lo no'};
const PAGE_OF=new Map(NAV.flatMap(g=>g.pages.map(p=>[p[0],{group:g,label:p[1],desc:p[2]}])));
const SHOTS=['home',...NAV.flatMap(g=>g.pages.map(p=>p[0])),'search/talent','hero/1174','meta/anteiku','data/characters','bosses/one-eyed-owl','modes/stronghold'];

/* ---------- routes: data each page needs, and its window title ---------- */
const HERO=id=>{const k=byKey.has(id)?id:(heroes.find(x=>(x.legacy_keys||[]).includes(id))||{}).key;return k?['hero/'+k]:[];};
const ROUTES={
 home:{t:'Home',deps:[]},search:{t:'Search',deps:['d-search']},
 start:{t:'Start here',deps:['g-start']},progression:{t:'Daily plan',deps:[]},new:{t:'New unit',deps:['g-units']},account:{t:'My account',deps:[]},
 meta:{t:'Meta teams',deps:['g-meta']},'best-teams':{t:'Best teams',deps:['g-teams','g-meta']},challenges:{t:'Challenges',deps:['g-meta','d-videos']},
 run:{t:'What to run',deps:['g-meta']},teams:{t:'Team builder',deps:['d-teams']},sim:{t:'Battle replay',deps:['d-sim']},
 characters:{t:'Characters',deps:['g-units','d-herotext']},hero:{t:'Character',deps:(id,tab)=>[...HERO(id),'g-units','g-teams',...(tab==='videos'?['d-videos']:[])]},
 tiers:{t:'Tier list',deps:['g-units']},talents:{t:'Force Talents',deps:['g-rules']},cells:{t:'Cells',deps:['d-cells','g-units']},
 modes:{t:'Game modes',deps:['d-modes']},bosses:{t:'Boss Lab',deps:['d-bosses','g-teams']},stronghold:{t:'Stronghold',deps:['d-stronghold']},
 rules:{t:'Game rules',deps:['g-rules']},buy:{t:'What to buy',deps:['g-spend']},plan:{t:'Gem planner',deps:['d-plan']},spend:{t:'Tools',deps:[],code:['economy.js']},
 banners:{t:'Banners',deps:[]},videos:{t:'Videos',deps:['d-videos','g-start']},data:{t:'Data book',deps:['g-book','d-book']},
 coffee:{t:'Coffee',deps:['d-coffee']},sources:{t:'Sources',deps:[]},
};
/* Old addresses that moved. Every other old address is unchanged. */
const ALIAS=parts=>{if(parts[0]==='rules'&&parts[1]==='force-talents')return['talents',...parts.slice(2)];return parts;};
const navKey=(r,id)=>r==='hero'?'characters':PAGE_OF.has(r+'/'+id)?r+'/'+id:r;

/* ---------- shell: top tabs, section list, mobile bar, menu ---------- */
const navEl=document.getElementById('nav'),sideEl=document.getElementById('side'),mobEl=document.getElementById('mobile-nav'),menu=document.getElementById('menu');
for(const g of NAV)navEl.append(el('a',{href:'#'+g.pages[0][0],'data-group':g.id},g.label));
const mobItems=[['home','Home','M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z'],['start','Start','M5 3v18M5 4h12l-2 4 2 4H5'],['meta','Teams','M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5m2-5c3 0 6 2 6 5'],['characters','Characters','M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9c0-4 4-6 8-6s8 2 8 6']];
const icon=d=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);s.append(p);return s;};
for(const[r,n,d]of mobItems)mobEl.append(el('a',{href:'#'+r,'data-group':r==='home'?'home':PAGE_OF.get(r).group.id},icon(d),el('span',{},n)));
const moreBtn=el('button',{type:'button','aria-haspopup':'dialog','aria-controls':'menu'},icon('M4 7h16M4 12h16M4 17h16'),el('span',{},'More'));mobEl.append(moreBtn);
function directory(cls){return el('div',{class:cls},NAV.map(g=>el('section',{class:'dir-group','data-group':g.id},el('h3',{},g.label),el('ul',{},g.pages.map(([r,n,s])=>el('li',{},el('a',{href:'#'+r},el('strong',{},n),s?el('small',{},s):null)))))));}
document.getElementById('menu-body').append(directory('directory'));
const openMenu=()=>{if(menu.showModal)menu.showModal();else menu.setAttribute('open','');},closeMenu=()=>{if(menu.open)menu.close();};
moreBtn.addEventListener('click',openMenu);document.getElementById('menu-open').addEventListener('click',openMenu);document.getElementById('menu-close').addEventListener('click',closeMenu);
menu.addEventListener('click',e=>{if(e.target===menu||e.target.closest('a'))closeMenu();});
function shell(r,id){
 const key=navKey(r,id),page=PAGE_OF.get(key),group=page?page.group:null;
 for(const a of [...navEl.children,...mobEl.querySelectorAll('a')]){const on=a.dataset.group===(group?group.id:r==='home'?'home':'');a.classList.toggle('on',on);if(on)a.setAttribute('aria-current',a.getAttribute('href')==='#'+key?'page':'true');else a.removeAttribute('aria-current');}
 document.body.classList.toggle('no-side',!group);
 sideEl.replaceChildren();
 if(!group)return;
 const list=el('ul',{},group.pages.map(([pr,n])=>el('li',{},el('a',{href:'#'+pr,class:pr===key?'on':null,'aria-current':pr===key?'page':null},n))));
 const head=el('button',{type:'button',class:'side-head','aria-expanded':'false'},el('span',{class:'side-group'},group.label),el('span',{class:'side-page'},page.label));
 head.addEventListener('click',()=>{const open=sideEl.classList.toggle('open');head.setAttribute('aria-expanded',String(open));});
 sideEl.classList.remove('open');sideEl.append(head,list);
}

/* ---------- Home ---------- */
/* Home's "New unit" panel follows the data: the written panel when the newest unit is the one the guide has a page for,
   otherwise the newest unit's name and a link to its character page (no new wording). */
function newUnitPanel(){const nu=newestUnit(),sp=D.spotlight_ids||[];
 if(!nu||sp.includes(nu))return panel(el('h3',{},'New unit: Hinami [Halloween]'),text('The new Anteiku support. Meta for spenders; free players: only if you play Anteiku and can reach 300 pulls.','muted'),link('How she works and her teams →','#new'));
 return panel(el('h3',{},'New unit'),el('p',{'data-no-i18n':''},fixName(byKey.get(nu).name)),link('Character page →','#hero/'+nu));}
function home(){
 const hero=el('section',{class:'hero'},el('div',{class:'hero-art'},image('assets/units/1168.png','Ken Kaneki [√A]','hero-character',true),image('assets/units/1155.png','Ayato Kirishima [Black Rabbit]','hero-character rear',true)),el('p',{class:'eyebrow'},'TOKYO GHOUL: BREAK THE CHAINS'),el('h1',{},'Know your roster.',el('br'),el('em',{},'Break the chains.')),text('A guide for every player: what to do first, which teams to build and what to buy.'),searchForm(),el('nav',{class:'hero-crests','aria-label':'Teams by faction'},MF.map(f=>el('a',{href:'#meta/'+f.id,class:'crest','data-f':f.id,on:{click:()=>setFac(f.id)}},el('span',{class:'frame'},image(byKey.get(f.icon)?.portrait,'','')),el('span',{},f.name)))),el('span',{class:'hero-number'},'TOKYO / 20TH WARD'));
 main.append(hero);
 main.append(el('div',{class:'section-head'},el('h2',{},'Start here')));
 main.append(el('div',{class:'grid guide-tiles'},[['start','Start here','Six steps for a new account','1'],['meta','Meta teams','Pick your faction: a team for every fight','2'],['run','What should I run?','Tick what you own, get teams','3'],['best-teams','Best teams','The team for each mode and boss','4'],['buy','What to buy','Top picks, good and skip','5'],['tiers','Tier list','Spend or free? 122 rated units','6']].map(([r,n,s,i])=>el('a',{href:'#'+r,class:'panel guide-link'},el('span',{class:'guide-num','aria-hidden':'true'},i),el('h3',{},n),text(s,'muted'),el('span',{class:'text-link'},'Open →')))));
 howto('home');
 main.append(el('div',{class:'section-head'},el('h2',{},'Tools and library')),directory('directory home-directory'));
 main.append(el('div',{class:'section-head'},el('h2',{},'Popular characters'),link('Browse all 143 →','#characters','')));
 const picks=['1174','1102','1155','1173','1001','1169'].map(k=>byKey.get(k)).filter(Boolean);main.append(el('div',{class:'roster home-roster'},picks.map(card)));
 main.append(el('div',{class:'section-head'},el('h2',{},'More to explore')));
 main.append(grid(newUnitPanel(),panel(el('h3',{},'Coffee and cells'),text('24 coffee recipes and the equipment cells.','muted'),el('div',{class:'actions'},link('Coffee','#coffee','button'),link('Cells','#cells','button'))),panel(el('h3',{},D.counts.videos+' creator videos'),text('Search by topic, creator or title.','muted'),link('Video library →','#videos')),panel(el('h3',{},Object.keys(profile.owned).length?'Your collection':'Mark what you own'),text('Mark your characters and stars, then build teams from them.','muted'),link('Open your account →','#account'))));
 main.append(brief('Guide updated November 23, 2026. Prices as of October 19: check the in-game shop before you spend.',['Teams and boss tips: research of October 26, 2026. Game data: EU build of September 22, 2026.','Banners, prices and availability change by server, so confirm them in your game.',el('p',{},'The old full articles are on the ',link('Sources page','#sources'),'.')]));
}

/* ---------- Search: pages, rule topics and cards, characters, bosses, modes, teams, recipes, tables, videos ---------- */
const fold=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/\btouka\b/g,'toka');
function searchIndex(){
 const tr=window.TGI18N.t,rows=[];
 for(const g of NAV)for(const[r,n,s]of g.pages)rows.push({t:n,r,y:g.label,k:[s,tr(s),g.label,tr(g.label),KEYWORDS[r]||'',r.startsWith('rules/')?(topic(r.slice(6)).cards||[]).join(' '):''].join(' '),kw:fold(KEYWORDS[r]||'').split(' '),w:30});
 for(const h of heroes)rows.push({t:fixName(h.name),r:'hero/'+h.key,y:'Character · '+h.attribute,k:[h.key,...h.aliases].join(' '),w:10,raw:true});
 for(const x of D.search||[])rows.push({...x,w:x.y==='Video'?0:x.y==='Game rules'||x.y==='Force Talents'?20:8,raw:x.y!=='Data book'});   /* data book titles are in the translation table */
 return rows;
}
function searchRows(query){
 const tr=window.TGI18N.t,q=fold(query.trim()),toks=q.split(/\s+/).filter(Boolean);if(!toks.length)return[];
 const out=[];
 /* A word of 3 letters or less matches at the start of a word only ("eto" finds Eto, not "Completo"; L-4, fix round 3). */
 const hit=toks.map(t=>t.length>3?(h=>h.includes(t)):(re=>h=>re.test(h))(new RegExp('(^|[^a-z0-9])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))));
 for(const x of searchIndex()){const name=fold(x.t)+' '+fold(tr(x.t)),hay=name+' '+fold(x.k)+' '+fold(x.c);if(!hit.every(f=>f(hay)))continue;
  const s=x.w+(name.startsWith(q)?100:0)+(name.includes(q)?60:0)+(hit.every(f=>f(name))?30:0)+(x.kw&&toks.every(t=>x.kw.includes(t))?120:0);
  out.push({...x,s:x.y==='Video'?Math.min(s,149):s});}   /* a page found by its keywords (150 or more) ranks above any video title */
 out.sort((a,b)=>b.s-a.s||a.t.localeCompare(b.t));
 /* A mode walkthrough the search found always comes before the videos. */
 const v=out.findIndex(x=>x.y==='Video');if(v<0)return out;
 return[...out.slice(0,v),...out.slice(v).filter(x=>x.y==='Mode walkthrough'),...out.slice(v).filter(x=>x.y!=='Mode walkthrough')];
}
function search(query=''){title('SEARCH','Search the guide.');
 const count=text('','results-count'),list=el('div',{class:'search-results'});count.setAttribute('role','status');
 const draw=v=>{list.replaceChildren();if(!v.trim()){count.textContent='';list.append(text('Search an exact variant, nickname, boss, recipe, mode or guide.','muted'));return;}
  const rows=searchRows(v);count.textContent=rows.length+' results';if(!rows.length)list.append(text('No exact match. Try a shorter name or variant.','empty'));
  for(const r of rows.slice(0,80))list.append(el('a',{href:r.u||'#'+r.r,class:'search-result',...(r.u?{target:'_blank',rel:'noopener noreferrer'}:{})},el('strong',{...(r.raw?{'data-no-i18n':''}:{})},r.t),el('small',{},r.y+(r.c?' · '+r.c:''))));
  if(rows.length>80)list.append(text('Showing the first 80. Add a word to narrow it down.','subtle'));};
 const form=searchForm(query,v=>{history.replaceState(null,'','#search/'+encodeURIComponent(v));draw(v);});
 form.querySelector('input').addEventListener('input',e=>draw(e.target.value));
 main.append(form,count,list);draw(query);
}

/* ---------- router ---------- */
const TG=window.TG={D,G,E,heroes,byKey,main,NAV,SHOTS,topic,BUILTIN_LEAD,newestUnit,PLACEHOLDER,STAT_KEYS,MF,MKEY,setFac,playFaction,playable,validateTeam,cleanProfile,fresh,
 get profile(){return profile;},set profile(p){profile=p;},save,notify,el,text,tag,panel,grid,button,link,arr,words,safeURL,external,srcLink,evidence,image,more,title,brief,field,select,input,
 fixName,regionLabel,headerContext,card,howBox,howto,render,pages:{home,search:(id,tab,p)=>search(p.slice(1).join('/'))}};
let turn=0;
function parts(){let p;try{p=decodeURIComponent(location.hash.slice(1)||'home').split('/');}catch{p=['home'];}p=ALIAS(p);if(!ROUTES[p[0]])p=['home'];return p;}
async function render(){
 const p=parts(),[r,id,tab]=p,route=ROUTES[r],mine=++turn;
 headerContext();shell(r,id);
 const deps=typeof route.deps==='function'?route.deps(id,tab):route.deps;
 const wait=setTimeout(()=>{if(mine===turn)main.replaceChildren(text('Loading…','notice loading'));},250);
 let failed=null;
 try{await Promise.all([TG.pages[r]?null:window.TG_SCRIPT('pages.js'),...(route.code||[]).map(window.TG_SCRIPT),window.TG_LOAD(deps)]);}catch(e){failed=e;}
 clearTimeout(wait);if(mine!==turn)return;
 main.replaceChildren();
 try{if(failed)throw failed;(TG.pages[r]||home)(id,tab,p);TG.after&&TG.after(r,id,tab);}
 catch(e){main.append(text('This section could not render. Your saved profile remains local. Try another section or export a backup.','notice'));console.error(e);}
 if(storageWarning)main.prepend(text('Storage unavailable: changes last for this tab only. Export a profile backup.','notice'));
 const target=main.querySelector('[data-scroll-here]');if(target)target.scrollIntoView({block:'start'});else window.scrollTo(0,0);
 const tk=topic(id);
 document.title='Tokyo Ghoul · '+(r==='hero'?byKey.get(id)?.name||'Character':r==='rules'&&tk?tk.title:route.t);
 document.body.dataset.route=r;
 main.dispatchEvent(new CustomEvent('tg:rendered',{detail:{route:p.join('/')}}));
 window.__tgRendered=(window.__tgRendered||0)+1;
}
/* Every table outside the data book gets the data book's sideways-scroll cue and edge fade, and its short cells (numbers,
   prices with their unit, dates) stay on one line (M-2, fix round 3). Two-column tables wrap instead of scrolling. A long text column gets a
   min-width on its first cell (header or not; the Stronghold pay table has no header row). Runs after
   the PT/ES text is in place, so it measures the words as shown. */
/* A number and the word after it stay on one line ("100,000,000 gold", "5,000 Diamonds"): the space between them becomes a
   no-break space, in the same text node, so the words read exactly as before. The text is already in its language: it sits
   in a data-no-i18n span so boot.js does not translate it a second time. */
const NUM_UNIT=/(\d) +(?=[^\s\d()])/g;
function keepUnits(td){const w=document.createTreeWalker(td,NodeFilter.SHOW_TEXT),ns=[];let n;
 while((n=w.nextNode()))if(/\d +[^\s\d()]/.test(n.nodeValue))ns.push(n);
 for(const n of ns)n.replaceWith(el('span',{'data-no-i18n':''},n.nodeValue.replace(NUM_UNIT,'$1\u00a0')));}
function fitTables(){
 for(const wrap of main.querySelectorAll('.table-wrap')){
  if(wrap.closest('.book-scroll,.tbl-scroll'))continue;
  const t=wrap.querySelector('table');if(!t)continue;
  const rows=[...t.rows],cols=Math.max(0,...rows.map(r=>r.cells.length));
  if(cols<=2)wrap.classList.add('t-wrap');
  else for(let i=0;i<cols;i++){const cells=rows.map(r=>r.cells[i]).filter(c=>c&&c.tagName==='TD'&&c.colSpan===1);
   const lens=cells.map(c=>c.textContent.trim().length).filter(Boolean).sort((a,b)=>a-b),max=lens[lens.length-1]||0,p90=lens[Math.floor(lens.length*0.9)]||0;
   if(max&&max<=28)cells.forEach(c=>c.classList.add('n'));
   else if(max){const th=rows[0]&&rows[0].cells[i];cells.forEach(c=>c.classList.add('w'));if(th&&th.colSpan===1){th.classList.add('w');if(!th.style.minWidth)th.style.minWidth=Math.round(Math.min(420,Math.max(160,p90*7.6/2)))+'px';}}}
  for(const td of t.querySelectorAll('td:not(.n)'))keepUnits(td);
  const box=el('div',{class:'tbl-scroll'}),cue=el('p',{class:'subtle scroll-cue',hidden:''},'This table is wider than the screen. Scroll it sideways to see every column →');
  wrap.replaceWith(cue,box);box.append(wrap);
  const edge=()=>{const over=wrap.scrollWidth-wrap.clientWidth>2;cue.hidden=!over;box.style.setProperty('--sbw',(wrap.offsetWidth-wrap.clientWidth-2)+'px');
   box.classList.toggle('more-right',over&&wrap.scrollLeft+wrap.clientWidth<wrap.scrollWidth-2);box.classList.toggle('more-left',over&&wrap.scrollLeft>2);
   if(over!==(wrap.tabIndex===0))over?wrap.setAttribute('tabindex','0'):wrap.removeAttribute('tabindex');};   /* a table that scrolls can be scrolled with the keys */
  wrap.addEventListener('scroll',edge,{passive:true});
  if(window.ResizeObserver)new ResizeObserver(edge).observe(wrap);edge();
 }
}
let fitQueued=0;
new MutationObserver(()=>{if(!fitQueued)fitQueued=requestAnimationFrame(()=>{fitQueued=0;fitTables();});}).observe(main,{childList:true,subtree:true});
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();main.focus();main.scrollIntoView();});
const topQ=document.getElementById('top-q');
document.getElementById('top-search').addEventListener('submit',e=>{e.preventDefault();location.hash='search/'+encodeURIComponent(topQ.value);topQ.value='';topQ.blur();});
window.addEventListener('hashchange',()=>{render().then(()=>main.focus({preventScroll:true}));});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();if(topQ.offsetParent)topQ.focus();else location.hash='search';}});
render();
if('serviceWorker'in navigator&&/^https?:$/.test(location.protocol)){navigator.serviceWorker.register('sw.js').catch(()=>{});
 /* Portuguese and Spanish pieces are not stored on install: fetch them once, in the background, so they work offline too. */
 const L=window.TGI18N.lang;if(L!=='en')addEventListener('load',()=>setTimeout(()=>fetch('d/index.json').then(x=>x.json()).then(j=>{for(const c of j.chunks)if(c.endsWith('.'+L+'.js'))fetch(c).catch(()=>{});}).catch(()=>{}),4000));}
});
