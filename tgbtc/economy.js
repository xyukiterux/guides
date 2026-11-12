/* Evidence-controlled calculators. Inputs are observations, never live offer claims. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Economy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE = 'tgbtc-economy-v1';
  function number(value, name, options = {}) {
    if ((typeof value === 'string' && value.trim() === '') || value === null || value === undefined || typeof value === 'boolean') throw new Error(name + ' is required.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || (options.positive && n <= 0) || (options.integer && !Number.isInteger(n)))
      throw new Error(name + ' must be a ' + (options.positive ? 'positive' : 'non-negative') + (options.integer ? ' whole number.' : ' number.'));
    if (n > 1e12) throw new Error(name + ' is too large.');
    return n;
  }
  function spring(stake, payout) {
    const a = number(stake, 'Stake', {positive: true}), b = number(payout, 'Total returned');
    return {net: b - a, roi: (b - a) / a * 100};
  }
  function pity(cost, pityCount, pullsDone, balance, tickets) {
    const c = number(cost, 'Cost per pull', {positive:true}), p = number(pityCount, 'Guarantee threshold', {integer:true,positive:true});
    const d = number(pullsDone, 'Eligible pulls already made', {integer:true}), b = number(balance, 'Available diamonds'), t = number(tickets, 'Eligible tickets', {integer:true});
    if (d > p) throw new Error('Eligible pulls cannot exceed the entered guarantee threshold; check the reset rule.');
    const remaining = p-d, paidPulls = Math.max(0,remaining-t), required = paidPulls*c;
    return {remaining, ticketsUsed:Math.min(t,remaining), paidPulls, required, shortfall:Math.max(0,required-b), balanceAfter:b-required};
  }
  function chance(ratePct, pulls) {
    const r = number(ratePct, 'Target rate'), n = number(pulls, 'Number of pulls', {integer:true});
    if (r > 100) throw new Error('Target rate must be between 0 and 100%.');
    return {probability:n === 0 ? 0 : (r === 100 ? 1 : -Math.expm1(n*Math.log1p(-r/100))), pulls:n, ratePct:r};
  }
  function comparePack(pack) {
    const price = number(pack.price, 'Pack price', {positive:true}), diamonds = number(pack.diamonds, 'Pack diamonds');
    const tickets = number(pack.tickets, 'Pack tickets', {integer:true}), ticketValue = number(pack.ticketValue, 'Assumed diamond value per ticket');
    const days = number(pack.durationDays, 'Collection days', {positive:true,integer:true});
    const maxPurchases = number(pack.maxPurchases, 'Purchase cap', {positive:true,integer:true});
    const utility = diamonds+tickets*ticketValue;
    if (utility <= 0) throw new Error('Pack must contain a positive diamond or ticket utility.');
    return {price,utility,diamonds,tickets,ticketValue,durationDays:days,maxPurchases,pricePer1000:price/utility*1000,utilityPerCurrency:utility/price,utilityPerCollectionDay:utility/days,
      // Actual Diamonds only (tickets left out): what one unit of cash buys, and what one Diamond costs.
      diamondsPerCurrency:diamonds/price,pricePer1000Diamonds:diamonds>0?price/diamonds*1000:null};
  }
  // Login rewards: count only the days you will really claim; a missed day is lost, not delayed.
  function loginRewards(upfront, daily, claimDays, totalDays) {
    const u = number(upfront, 'Diamonds you get at once'), d = number(daily, 'Diamonds per claimed day');
    const n = number(totalDays, 'Days in the contract', {integer:true,positive:true}), c = number(claimDays, 'Days you will claim', {integer:true});
    if (c > n) throw new Error('Days you will claim cannot be more than the days in the contract.');
    return {collectible:u+d*c, missed:d*(n-c), full:u+d*n};
  }
  function forecast(balance, daily, target) {
    const b=number(balance,'Current balance'), d=number(daily,'Net daily income'), t=number(target,'Target');
    return {gap:Math.max(0,t-b),days:t<=b?0:(d===0?null:Math.ceil((t-b)/d))};
  }
  // Free Diamonds per day: the sum of the daily sources you enter (blank counts as 0).
  const INCOME_KEYS = ['incPass','incWish','incQuests','incSpring','incSpring2','incWeekend','incOther'];
  function dailyIncome(parts) {
    let day = 0, entered = 0;
    for (const k of INCOME_KEYS) {
      const v = parts[k];
      if (v === '' || v === undefined || v === null) continue;
      day += number(v, 'Diamonds per day'); entered++;
    }
    if (day > 1e12) throw new Error('Diamonds per day is too large.');
    return {day, week: day*7, entered};
  }
  // The guide's typical numbers (What to buy › Free Diamonds): game data, plus 50 a day from daily quests (creator report).
  const INCOME_PRESETS = {vip0:{incPass:'100',incWish:'187',incQuests:'50',incSpring:'520',incSpring2:'0',incWeekend:'86',incOther:'0'},
    vip5:{incPass:'100',incWish:'187',incQuests:'50',incSpring:'520',incSpring2:'520',incWeekend:'86',incOther:'0'}};
  // Copies of the featured unit after n pulls on one banner cycle: n random pulls at rate p, plus one chest roll (chance q)
  // at every chestEvery pulls before the guarantee, plus one sure copy at the guarantee pull. Exact distribution, no sampling.
  function copies(ratePct, pulls, guaranteeAt, chestEvery, chestPct) {
    const p = number(ratePct, 'Target rate')/100, n = number(pulls, 'Number of pulls', {integer:true});
    const g = number(guaranteeAt, 'Pulls to the guarantee', {integer:true}), c = number(chestEvery, 'Pulls per chest', {integer:true}), q = number(chestPct, 'Chest chance')/100;
    if (p > 1) throw new Error('Target rate must be between 0 and 100%.');
    if (q > 1) throw new Error('Chest chance must be between 0 and 100%.');
    if (g > 0 && n > g) throw new Error('This tool models one banner cycle: pulls cannot be more than the guarantee.');
    if (n > 5000) throw new Error('Number of pulls is too large.');
    const chests = c > 0 ? Math.floor((g > 0 && n === g ? n - 1 : n) / c) : 0, sure = g > 0 && n === g ? 1 : 0;
    let dist = [1];
    const add = (prob, times) => { for (let i = 0; i < times; i++) { const next = new Array(dist.length + 1).fill(0);
      dist.forEach((v, k) => { next[k] += v*(1-prob); next[k+1] += v*prob; }); dist = next; } };
    add(p, n); add(q, chests);
    if (sure) dist = [0, ...dist];
    const atLeast = k => Math.max(0, 1 - dist.slice(0, k).reduce((a, b) => a + b, 0));
    const expected = dist.reduce((a, v, k) => a + v*k, 0);
    return {atLeast1: atLeast(1), atLeast2: atLeast(2), atLeast3: atLeast(3), expected, chests, sure};
  }
  const COPY_PRESETS = {limited:{copyRate:'1',copyPulls:'300',copyGuarantee:'300',copyChestEvery:'100',copyChest:'10'},
    carnival1:{copyRate:'1',copyPulls:'100',copyGuarantee:'0',copyChestEvery:'100',copyChest:'30'}};
  function maturity(startLocal) {
    if (!startLocal) throw new Error('Choose the stake start time.');
    const start = new Date(startLocal);
    if (!Number.isFinite(start.getTime())) throw new Error('Enter a valid stake start time.');
    return {startUTC:start.toISOString(),dueUTC:new Date(start.getTime()+48*60*60*1000).toISOString()};
  }
  const defaults = {
    region:'',currency:'USD',budget:'0',springStake:'',springPayout:'',springStart:'',springSource:'',springDate:'',
    pullCost:'',threshold:'',pullsDone:'0',balance:'0',tickets:'0',rate:'',chancePulls:'',pityConfirmed:false,pitySource:'',pityDate:'',
    forecastBalance:'0',dailyIncome:'',target:'',copyRate:'',copyPulls:'',copyGuarantee:'0',copyChestEvery:'0',copyChest:'0',incPass:'',incWish:'',incQuests:'',incSpring:'',incSpring2:'',incWeekend:'',incOther:'',loginUpfront:'',loginDaily:'',loginTotal:'',loginClaim:'',
    offerAName:'',offerAPrice:'',offerADiamonds:'',offerATickets:'0',offerATicketValue:'0',offerADays:'1',offerACap:'1',offerAQuantity:'0',offerASource:'',offerADate:'',offerARegion:'',offerARecurring:false,
    offerBName:'',offerBPrice:'',offerBDiamonds:'',offerBTickets:'0',offerBTicketValue:'0',offerBDays:'1',offerBCap:'1',offerBQuantity:'0',offerBSource:'',offerBDate:'',offerBRegion:'',offerBRecurring:false
  };
  // Old builds stored English placeholder words as values; they now mean "not entered" (an empty field with a translated placeholder).
  const PLACEHOLDER_VALUES = ['Unspecified','Unconfirmed','Offer A','Offer B'];
  const blankIfPlaceholder = v => PLACEHOLDER_VALUES.includes(v.trim()) ? '' : v;
  function readStored(profile) {
    const state = Object.assign({},defaults);
    if(profile && typeof profile.region==='string') state.region=blankIfPlaceholder(profile.region);
    try {
      const stored=JSON.parse(localStorage.getItem(STORAGE)||'null');
      if(stored && stored.version===1 && stored.values && typeof stored.values==='object') {
        for(const key of Object.keys(defaults)) {
          const value=stored.values[key];
          if(typeof defaults[key]==='boolean' ? typeof value==='boolean' : typeof value==='string' && value.length<2000) state[key]=/Region$|^region$|Name$/.test(key)?blankIfPlaceholder(value):value;
        }
      }
    } catch (_) { /* Corrupt or unavailable storage must not stop calculators. */ }
    return state;
  }
  function mount(container,profile) {
    if(!container || !container.ownerDocument) throw new Error('A DOM container is required.');
    const doc=container.ownerDocument;
    let values=readStored(profile), disabledStorage=false;
    const inputs={};
    const el=(tag,text,cls)=>{const n=doc.createElement(tag); if(text!==undefined)n.textContent=String(text); if(cls)n.className=cls;return n;};
    const append=(parent,...children)=>{children.forEach(c=>parent.append(c));return parent;};
    // In Portuguese and Spanish, numbers follow that language (90.000; US$4,99), whatever the browser locale is.
    const L=(typeof window!=='undefined'&&window.TGI18N)?window.TGI18N.lang:'en',LOC=L==='pt'?'pt-BR':L==='es'?'es':undefined;
    // Spanish Intl leaves 4-digit numbers ungrouped (1767,83); the guide text groups them (1.767,83), so grouping is forced.
    const NF=(o)=>{try{return new Intl.NumberFormat(LOC,LOC?Object.assign({useGrouping:'always'},o):o);}catch(_){return new Intl.NumberFormat(LOC,o);}};
    const money=n=>{const cur=['USD','EUR','JPY','BRL'].includes(values.currency)?values.currency:'USD';
      return LOC&&cur==='USD'?(n<0?'-':'')+'US$'+NF({minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(n)):NF({style:'currency',currency:cur}).format(n);};
    const fmt=n=>NF({maximumFractionDigits:2}).format(n);
    const clear=n=>n.replaceChildren();
    const info=(parent,text)=>{const d=el('details',undefined,'more');d.append(el('summary','More details'),el('p',text,'muted'));parent.append(d);};
    const panel=(title,intro,extra)=>{const p=el('section',undefined,'panel economy-panel');p.append(el('h2',title,'section-title'));if(intro)p.append(el('p',intro,'muted'));if(extra)info(p,extra);container.append(p);return p;};
    const fields=parent=>append(parent,el('div',undefined,'grid economy-fields')).lastElementChild;
    function field(parent,key,label,type='number',attrs={}) {
      const wrap=el('label',undefined,'field'), input=el('input');
      input.type=type;input.id='economy-'+key;input.name=key;
      if(type==='checkbox')input.checked=Boolean(values[key]);else input.value=values[key];
      if(type==='number'){input.min='0';input.step='any';input.inputMode='decimal';}
      Object.entries(attrs).forEach(([k,v])=>input.setAttribute(k,v));
      wrap.append(el('span',label),input);parent.append(wrap);inputs[key]=input;
      input.addEventListener('input',()=>{values[key]=type==='checkbox'?input.checked:input.value;save();update();});
      return input;
    }
    function select(parent,key,label,options){
      const wrap=el('label',undefined,'field'), input=el('select');input.id='economy-'+key;
      options.forEach(([v,t])=>{const o=el('option',t);o.value=v;input.append(o);});input.value=values[key];
      wrap.append(el('span',label),input);parent.append(wrap);inputs[key]=input;
      input.addEventListener('change',()=>{values[key]=input.value;save();update();});return input;
    }
    function result(parent){const n=el('div',undefined,'economy-result');n.setAttribute('role','status');n.setAttribute('aria-live','polite');parent.append(n);return n;}
    function output(node,text,error=false){clear(node);node.append(el('p',text,error?'notice':'metric'));}
    function save(){try{localStorage.setItem(STORAGE,JSON.stringify({version:1,values}));}catch(_){disabledStorage=true;}}
    function observed(parent,prefix){
      const f=fields(parent);field(f,prefix+'Source','Note (for example a screenshot name)','text',{maxlength:'1000',placeholder:'Your screenshot or source (this tool does not check it)'});
      field(f,prefix+'Date','Date you checked','date');
    }
    container.replaceChildren();
    const head=panel('Spend with a plan','These tools only calculate what you enter. Spending nothing is a fine plan.','They do not know your current shop, payout table, banner rules or live prices.');
    const settings=fields(head);
    field(settings,'region','Your server / region','text',{maxlength:'80',placeholder:'Region not set'});
    select(settings,'currency','Cash currency (no conversion)',[['USD','USD'],['EUR','EUR'],['JPY','JPY'],['BRL','BRL']]);
    field(settings,'budget','Optional cash budget','number');
    const presets=el('div',undefined,'economy-presets');
    for(const amount of [0,5,10,20,50,100]){const b=el('button',String(amount),'button');b.type='button';b.addEventListener('click',()=>{values.budget=String(amount);inputs.budget.value=String(amount);save();update();});presets.append(b);}head.append(presets);
    info(head,'Budget presets are amounts in the selected currency. Changing currency does not convert existing prices. Start at 0; purchases are optional. Nothing is purchased or sent from this page.');
    const storageStatus=result(head);
    const springPanel=panel('48-hour Diamond Spring','Enter your stake and the TOTAL Diamonds returned, including the stake.','No payout is filled in for you: read both numbers from your game.');
    const springFields=fields(springPanel);
    field(springFields,'springStake','Diamonds staked');field(springFields,'springPayout','Total diamonds returned');field(springFields,'springStart','Stake start (your local time)','datetime-local');
    observed(springPanel,'spring');const springResult=result(springPanel), timerResult=result(springPanel);
    info(springPanel,'ROI = (total returned − stake) ÷ stake × 100. The timer adds exactly 48 elapsed hours; it does not assume a second daily collection or any VIP perk. Compare the locked stake with the resources needed for your next guarantee.');
    const pullPanel=panel('Banner budget & chance','Enter this banner’s rules from the game screen.','The chance assumes every pull has the same rate. It ignores pity and rate changes.');
    const pullFields=fields(pullPanel);
    field(pullFields,'pullCost','Diamonds per pull');field(pullFields,'threshold','Pulls to the guarantee (from the game screen)','number',{step:'1'});field(pullFields,'pullsDone','Eligible pulls already made','number',{step:'1'});field(pullFields,'balance','Available diamonds');field(pullFields,'tickets','Eligible tickets (1 pull each)','number',{step:'1'});
    field(pullPanel,'pityConfirmed','I checked in game that this guarantee gives my unit and that these pulls and tickets count','checkbox');observed(pullPanel,'pity');const pityResult=result(pullPanel);
    const probabilityFields=fields(pullPanel);field(probabilityFields,'rate','Target-unit rate (%)','number',{max:'100'});field(probabilityFields,'chancePulls','Number of pulls','number',{step:'1'});const probabilityResult=result(pullPanel);
    info(pullPanel,'This is a first-copy / one-guarantee calculation. Star upgrades may require different materials or additional copies. No carry-over, selected-unit guarantee or ticket eligibility is assumed. A probability is never a promise.');
    const copyPanel=panel('Pull simulator: how many copies','Enter the banner rules from the game screen, or fill in a preset and check it against your banner.','Exact odds for one banner cycle: every pull has the same rate, each chest rolls once, and the guarantee pull adds one copy. Presets: limited banner 1% per pull, guarantee at 300, chests at 100 and 200 with about 10% for the unit (fan datamine); Carnival Season 1 chest every 100 pulls with 30% for the unit (game data). A probability is never a promise.');
    const copyFields=fields(copyPanel);
    field(copyFields,'copyRate','Target-unit rate (%)','number',{max:'100'});field(copyFields,'copyPulls','Number of pulls','number',{step:'1'});
    field(copyFields,'copyGuarantee','Pulls to the guarantee (0 = none)','number',{step:'1'});field(copyFields,'copyChestEvery','Pulls per chest (0 = none)','number',{step:'1'});field(copyFields,'copyChest','Chest chance for the unit (%)','number',{max:'100'});
    const copyButtons=el('div',undefined,'economy-presets');
    for(const [key,label] of [['limited','Fill limited banner preset'],['carnival1','Fill Carnival Season 1 preset']]){const b=el('button',label,'button');b.type='button';b.addEventListener('click',()=>{for(const [k,v] of Object.entries(COPY_PRESETS[key])){values[k]=v;inputs[k].value=v;}save();update();});copyButtons.append(b);}
    copyPanel.append(copyButtons);const copyResult=result(copyPanel);
    const packsPanel=panel('Compare offers you see','Enter the TOTAL Diamonds you can collect, not a daily reward.','Compare the same region, currency and date. Only give tickets a value when they help the same goal. Random rewards and non-Diamond items are left out.');
    const packResults={};
    for(const p of ['offerA','offerB']){
      const box=el('section',undefined,'panel');packsPanel.append(box);box.append(el('h3',p==='offerA'?'Offer A':'Offer B'));
      const fs=fields(box);field(fs,p+'Name','Offer name','text',{maxlength:'100',placeholder:p==='offerA'?'Offer A':'Offer B'});field(fs,p+'Price','Cash price');field(fs,p+'Diamonds','Total collectible diamonds');field(fs,p+'Tickets','Eligible tickets','number',{step:'1'});field(fs,p+'TicketValue','Diamonds you count per ticket');field(fs,p+'Days','Days to collect total rewards','number',{step:'1',min:'1'});field(fs,p+'Cap','Purchase cap for this window','number',{step:'1',min:'1'});field(fs,p+'Quantity','Copies in your plan','number',{step:'1'});field(fs,p+'Region','Server or region','text',{maxlength:'80',placeholder:'Region not set'});field(box,p+'Recurring','Recurring / subscription (price entered is one billing period)','checkbox');observed(box,p);packResults[p]=result(box);
    }
    const packSummary=result(packsPanel);
    info(packsPanel,'Diamond-equivalent utility is your assumption, not an exchange guarantee. A recurring plan here counts only the entered number of billing periods; it does not cancel automatically. Uncollected daily rewards reduce actual value. First-purchase bonuses and caps must be included from your game screen.');
    const loginPanel=panel('Login rewards you will really get','For a login contract or sign-in track: count only the days you will actually claim.','A missed day is usually lost, not added at the end. Check the claim rules and the end date in game.');
    const loginFields=fields(loginPanel);field(loginFields,'loginUpfront','Diamonds you get at once');field(loginFields,'loginDaily','Diamonds per claimed day');field(loginFields,'loginTotal','Days in the contract','number',{step:'1',min:'1'});field(loginFields,'loginClaim','Days you will claim','number',{step:'1'});const loginResult=result(loginPanel);
    const incomePanel=panel('Free Diamonds per day','Enter what you collect each day, or fill in the guide’s typical numbers and change them to match your game.','The typical numbers come from What to buy › Free Diamonds: game data plus 50 a day from daily quests (creator report). Set the Free Monthly Pass to 0 after its 30 days. Events, codes, mail and guild war payouts are not included.');
    const incomeFields=fields(incomePanel);
    field(incomeFields,'incPass','Free Monthly Pass (per day)');field(incomeFields,'incWish','Wishing Sign-in (per day)');field(incomeFields,'incQuests','Daily quests (per day)');
    field(incomeFields,'incSpring','Diamond Spring, first exchange (net per day)');field(incomeFields,'incSpring2','Diamond Spring, second exchange (net per day)');
    field(incomeFields,'incWeekend','Weekend sign-in tickets (Diamonds per day)');field(incomeFields,'incOther','Anything else (per day)');
    const incomeButtons=el('div',undefined,'economy-presets');
    for(const [key,label] of [['vip0','Fill typical VIP 0 numbers'],['vip5','Fill typical VIP 5 numbers']]){const b=el('button',label,'button');b.type='button';b.addEventListener('click',()=>{for(const [k,v] of Object.entries(INCOME_PRESETS[key])){values[k]=v;inputs[k].value=v;}save();update();});incomeButtons.append(b);}
    const useIncome=el('button','Use this in the savings forecast','button');useIncome.type='button';useIncome.addEventListener('click',()=>{try{const r=dailyIncome(values);values.dailyIncome=String(r.day);inputs.dailyIncome.value=values.dailyIncome;save();update();}catch(_){}});incomeButtons.append(useIncome);
    incomePanel.append(incomeButtons);const incomeResult=result(incomePanel);
    const forecastPanel=panel('Savings forecast','Use your daily income after your usual costs.','This is a simple estimate with no assumed events, investment compounding or guaranteed future income.');
    const forecastFields=fields(forecastPanel);field(forecastFields,'forecastBalance','Current diamond balance');field(forecastFields,'dailyIncome','Estimated net diamonds per day');field(forecastFields,'target','Target diamond balance');const forecastResult=result(forecastPanel);
    const controls=el('div',undefined,'economy-controls');
    const reset=el('button','Clear calculator observations','button');reset.type='button';reset.addEventListener('click',()=>{try{localStorage.removeItem(STORAGE);}catch(_){}values=Object.assign({},defaults);for(const [k,input]of Object.entries(inputs)){if(input.type==='checkbox')input.checked=values[k];else input.value=values[k];}update();});controls.append(reset);container.append(controls);
    function update(){
      output(storageStatus,disabledStorage?'Browser storage is unavailable; calculations still work, but observations are not saved.':'Observations stay in this browser. Region: '+(!values.region.trim()?'not set':values.region.trim())+'. Use Clear calculator observations to delete them.');
      if(values.springStake===''&&values.springPayout==='')output(springResult,'Enter both numbers from your game to see the net return.');
      else try{const r=spring(values.springStake,values.springPayout);output(springResult,(r.net>=0?'+':'')+fmt(r.net)+' diamonds · '+r.roi.toFixed(2)+'% return per 48-hour cycle.');}catch(e){output(springResult,e.message,true);}
      if(!values.springStart)output(timerResult,'No stake start time saved.');else try{const t=maturity(values.springStart),due=new Date(t.dueUTC);output(timerResult,'48-hour mark: '+due.toLocaleString()+' (UTC: '+t.dueUTC+'). '+(Date.now()>=due.getTime()?'Time is up. Collect it in the game.':'Check the collection rules in the game.'));}catch(e){output(timerResult,e.message,true);}
      if(!values.pityConfirmed)output(pityResult,'Tick the box above to see the budget for the guarantee.');
      else try{const r=pity(values.pullCost,values.threshold,values.pullsDone,values.balance,values.tickets);output(pityResult,r.remaining+' pulls remaining · '+r.ticketsUsed+' eligible tickets used · '+fmt(r.required)+' diamonds required · '+fmt(r.shortfall)+' shortfall. Conditional on the rules you entered.');}catch(e){output(pityResult,e.message,true);}
      if(values.rate===''&&values.chancePulls==='')output(probabilityResult,'Enter a target-unit rate and pull count for a probability estimate.');
      else try{const r=chance(values.rate,values.chancePulls);output(probabilityResult,(r.probability*100).toFixed(2)+'% chance of at least one target in '+r.pulls+' independent pulls (pity excluded).');}catch(e){output(probabilityResult,e.message,true);}
      if(values.copyRate===''&&values.copyPulls==='')output(copyResult,'Enter the rate and the number of pulls, or fill in a preset.');
      else try{const r=copies(values.copyRate,values.copyPulls,values.copyGuarantee,values.copyChestEvery,values.copyChest),pc=x=>NF({minimumFractionDigits:1,maximumFractionDigits:1}).format(x*100)+'%';output(copyResult,'At least 1 copy: '+pc(r.atLeast1)+' · at least 2: '+pc(r.atLeast2)+' · at least 3: '+pc(r.atLeast3)+' · '+NF({minimumFractionDigits:2,maximumFractionDigits:2}).format(r.expected)+' copies on average.');}catch(e){output(copyResult,e.message,true);}
      let total=0,utility=0,selected=0,invalidSelected=false;const valid=[];
      for(const p of ['offerA','offerB']){
        try{
          const q=number(values[p+'Quantity'],'Planned copies',{integer:true});
          if(values[p+'Price']===''&&values[p+'Diamonds']===''&&q===0){output(packResults[p],'No offer entered yet.');continue;}
          const r=comparePack({price:values[p+'Price'],diamonds:values[p+'Diamonds'],tickets:values[p+'Tickets'],ticketValue:values[p+'TicketValue'],durationDays:values[p+'Days'],maxPurchases:values[p+'Cap']});
          if(q>r.maxPurchases)throw new Error('Planned copies exceed this offer’s entered purchase cap.');
          if(q>0){selected++;total+=q*r.price;utility+=q*r.utility;}
          const hasEvidence=values[p+'Source'].trim()&&values[p+'Date'];
          output(packResults[p],money(r.pricePer1000)+' per 1,000 assumed diamond-equivalents · '+fmt(r.utility)+' total per purchase · collected over '+r.durationDays+(r.durationDays===1?' day. ':' days. ')+(values[p+'Recurring']?'Recurring billing. ':'One-time offer as entered. ')+(hasEvidence?'Note saved. This tool does not check it.':'Add a note and the date you checked.'));
          packResults[p].append(el('p',r.pricePer1000Diamonds===null?'Diamonds only (no tickets): none in this offer.':'Diamonds only (no tickets): '+fmt(r.diamondsPerCurrency)+' per 1 '+(['USD','EUR','JPY','BRL'].includes(values.currency)?values.currency:'USD')+' · '+money(r.pricePer1000Diamonds)+' per 1,000 Diamonds.','muted'));
          valid.push({p,r});
        }catch(e){if(Number(values[p+'Quantity'])>0)invalidSelected=true;output(packResults[p],e.message,true);}
      }
      try{
        const b=number(values.budget,'Cash budget');
        if(invalidSelected)output(packSummary,'Cannot total this plan: fix the selected offer errors.',true);
        else {
          let text=selected?'Plan: '+money(total)+' / '+money(b)+' budget · '+fmt(utility)+' assumed diamond-equivalents. '+(total>b?'Over budget by '+money(total-b)+'.':'Unspent budget: '+money(b-total)+'.'):'Zero-purchase plan: '+money(0)+'. No paid offer selected.';
          if(valid.length===2){const comparable=values.offerARegion.trim()!==''&&values.offerARegion===values.offerBRegion&&values.offerADate&&values.offerADate===values.offerBDate&&values.offerATicketValue===values.offerBTicketValue; text+=comparable?' Compare cost per 1,000 above only after checking reward eligibility and caps.':' Offers have different or missing region/date/ticket assumptions; no best-value ranking is shown.';}
          output(packSummary,text,total>b);
        }
      }catch(e){output(packSummary,e.message,true);}
      if(values.loginUpfront===''&&values.loginDaily==='')output(loginResult,'Enter the rewards and the days from your game.');
      else try{const r=loginRewards(values.loginUpfront,values.loginDaily,values.loginClaim,values.loginTotal);output(loginResult,'You collect '+fmt(r.collectible)+' of '+fmt(r.full)+' diamonds · '+fmt(r.missed)+' lost to missed days.');}catch(e){output(loginResult,e.message,true);}
      try{const r=dailyIncome(values);output(incomeResult,r.entered===0?'Enter your daily sources, or fill in the typical numbers.':fmt(r.day)+' Diamonds a day · '+fmt(r.week)+' a week.');}catch(e){output(incomeResult,e.message,true);}
      if(values.dailyIncome===''&&values.target==='')output(forecastResult,'Enter your income estimate and target.');
      else try{const r=forecast(values.forecastBalance,values.dailyIncome,values.target);output(forecastResult,r.days===null?'Target cannot be reached with zero net daily income.':r.days===0?'Your entered balance already meets the target.':fmt(r.gap)+' diamonds needed · approximately '+r.days+' days at this constant income.');}catch(e){output(forecastResult,e.message,true);}
    }
    update();
    return {refresh:update};
  }
  return {spring,pity,chance,comparePack,loginRewards,forecast,maturity,dailyIncome,INCOME_PRESETS,copies,COPY_PRESETS,mount};
});
