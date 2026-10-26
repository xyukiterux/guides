/* Evidence-controlled calculators. Inputs are observations, never live offer claims. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Economy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORAGE = 'tgbtc-economy-v1';
  function number(value, name, options = {}) {
    if (value === '' || value === null || value === undefined || typeof value === 'boolean') throw new Error(name + ' is required.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || (options.positive && n <= 0) || (options.integer && !Number.isInteger(n)))
      throw new Error(name + ' must be a ' + (options.positive ? 'positive' : 'non-negative') + (options.integer ? ' whole number.' : ' number.'));
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
    return {price,utility,diamonds,tickets,ticketValue,durationDays:days,maxPurchases,pricePer1000:price/utility*1000,utilityPerCurrency:utility/price,utilityPerCollectionDay:utility/days};
  }
  function forecast(balance, daily, target) {
    const b=number(balance,'Current balance'), d=number(daily,'Net daily income'), t=number(target,'Target');
    return {gap:Math.max(0,t-b),days:t<=b?0:(d===0?null:Math.ceil((t-b)/d))};
  }
  function maturity(startLocal) {
    if (!startLocal) throw new Error('Choose the stake start time.');
    const start = new Date(startLocal);
    if (!Number.isFinite(start.getTime())) throw new Error('Enter a valid stake start time.');
    return {startUTC:start.toISOString(),dueUTC:new Date(start.getTime()+48*60*60*1000).toISOString()};
  }
  const defaults = {
    region:'Unconfirmed',currency:'USD',budget:'0',springStake:'',springPayout:'',springStart:'',springSource:'',springDate:'',
    pullCost:'',threshold:'',pullsDone:'0',balance:'0',tickets:'0',rate:'',chancePulls:'',pityConfirmed:false,pitySource:'',pityDate:'',
    forecastBalance:'0',dailyIncome:'',target:'',
    offerAName:'Offer A',offerAPrice:'',offerADiamonds:'',offerATickets:'0',offerATicketValue:'0',offerADays:'1',offerACap:'1',offerAQuantity:'0',offerASource:'',offerADate:'',offerARegion:'Unconfirmed',offerARecurring:false,
    offerBName:'Offer B',offerBPrice:'',offerBDiamonds:'',offerBTickets:'0',offerBTicketValue:'0',offerBDays:'1',offerBCap:'1',offerBQuantity:'0',offerBSource:'',offerBDate:'',offerBRegion:'Unconfirmed',offerBRecurring:false
  };
  function readStored(profile) {
    const state = Object.assign({},defaults);
    if(profile && typeof profile.region==='string') state.region=profile.region;
    try {
      const stored=JSON.parse(localStorage.getItem(STORAGE)||'null');
      if(stored && stored.version===1 && stored.values && typeof stored.values==='object') {
        for(const key of Object.keys(defaults)) {
          const value=stored.values[key];
          if(typeof defaults[key]==='boolean' ? typeof value==='boolean' : typeof value==='string' && value.length<2000) state[key]=value;
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
    const money=n=>new Intl.NumberFormat(undefined,{style:'currency',currency:['USD','EUR','JPY'].includes(values.currency)?values.currency:'USD'}).format(n);
    const fmt=n=>new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(n);
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
    field(settings,'region','Your server / region','text',{maxlength:'80'});
    select(settings,'currency','Cash currency (no conversion)',[['USD','USD'],['EUR','EUR'],['JPY','JPY']]);
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
    const packsPanel=panel('Compare offers you see','Enter the TOTAL Diamonds you can collect, not a daily reward.','Compare the same region, currency and date. Only give tickets a value when they help the same goal. Random rewards and non-Diamond items are left out.');
    const packResults={};
    for(const p of ['offerA','offerB']){
      const box=el('section',undefined,'panel');packsPanel.append(box);box.append(el('h3',p==='offerA'?'Offer A':'Offer B'));
      const fs=fields(box);field(fs,p+'Name','Offer name','text',{maxlength:'100'});field(fs,p+'Price','Cash price');field(fs,p+'Diamonds','Total collectible diamonds');field(fs,p+'Tickets','Eligible tickets','number',{step:'1'});field(fs,p+'TicketValue','Diamonds you count per ticket');field(fs,p+'Days','Days to collect total rewards','number',{step:'1',min:'1'});field(fs,p+'Cap','Purchase cap for this window','number',{step:'1',min:'1'});field(fs,p+'Quantity','Copies in your plan','number',{step:'1'});field(fs,p+'Region','Server or region','text',{maxlength:'80'});field(box,p+'Recurring','Recurring / subscription (price entered is one billing period)','checkbox');observed(box,p);packResults[p]=result(box);
    }
    const packSummary=result(packsPanel);
    info(packsPanel,'Diamond-equivalent utility is your assumption, not an exchange guarantee. A recurring plan here counts only the entered number of billing periods; it does not cancel automatically. Uncollected daily rewards reduce actual value. First-purchase bonuses and caps must be included from your game screen.');
    const forecastPanel=panel('Savings forecast','Use your daily income after your usual costs.','This is a simple estimate with no assumed events, investment compounding or guaranteed future income.');
    const forecastFields=fields(forecastPanel);field(forecastFields,'forecastBalance','Current diamond balance');field(forecastFields,'dailyIncome','Estimated net diamonds per day');field(forecastFields,'target','Target diamond balance');const forecastResult=result(forecastPanel);
    const controls=el('div',undefined,'economy-controls');
    const reset=el('button','Clear calculator observations','button');reset.type='button';reset.addEventListener('click',()=>{try{localStorage.removeItem(STORAGE);}catch(_){}values=Object.assign({},defaults);for(const [k,input]of Object.entries(inputs)){if(input.type==='checkbox')input.checked=values[k];else input.value=values[k];}update();});controls.append(reset);container.append(controls);
    function update(){
      output(storageStatus,disabledStorage?'Browser storage is unavailable; calculations still work, but observations are not saved.':'Observations stay in this browser. Region: '+(!values.region||values.region==='Unspecified'?'not set':values.region)+'. Use Clear calculator observations to delete them.');
      if(values.springStake===''&&values.springPayout==='')output(springResult,'Enter both numbers from your game to see the net return.');
      else try{const r=spring(values.springStake,values.springPayout);output(springResult,(r.net>=0?'+':'')+fmt(r.net)+' diamonds · '+r.roi.toFixed(2)+'% return per 48-hour cycle.');}catch(e){output(springResult,e.message,true);}
      if(!values.springStart)output(timerResult,'No stake start time saved.');else try{const t=maturity(values.springStart),due=new Date(t.dueUTC);output(timerResult,'48-hour mark: '+due.toLocaleString()+' (UTC: '+t.dueUTC+'). '+(Date.now()>=due.getTime()?'Time is up. Collect it in the game.':'Check the collection rules in the game.'));}catch(e){output(timerResult,e.message,true);}
      if(!values.pityConfirmed)output(pityResult,'Tick the box above to see the budget for the guarantee.');
      else try{const r=pity(values.pullCost,values.threshold,values.pullsDone,values.balance,values.tickets);output(pityResult,r.remaining+' pulls remaining · '+r.ticketsUsed+' eligible tickets used · '+fmt(r.required)+' diamonds required · '+fmt(r.shortfall)+' shortfall. Conditional on the rules you entered.');}catch(e){output(pityResult,e.message,true);}
      if(values.rate===''&&values.chancePulls==='')output(probabilityResult,'Enter a target-unit rate and pull count for a probability estimate.');
      else try{const r=chance(values.rate,values.chancePulls);output(probabilityResult,(r.probability*100).toFixed(2)+'% chance of at least one target in '+r.pulls+' independent pulls (pity excluded).');}catch(e){output(probabilityResult,e.message,true);}
      let total=0,utility=0,selected=0,invalidSelected=false;const valid=[];
      for(const p of ['offerA','offerB']){
        try{
          const q=number(values[p+'Quantity'],'Planned copies',{integer:true});
          if(values[p+'Price']===''&&values[p+'Diamonds']===''&&q===0){output(packResults[p],'No offer entered yet.');continue;}
          const r=comparePack({price:values[p+'Price'],diamonds:values[p+'Diamonds'],tickets:values[p+'Tickets'],ticketValue:values[p+'TicketValue'],durationDays:values[p+'Days'],maxPurchases:values[p+'Cap']});
          if(q>r.maxPurchases)throw new Error('Planned copies exceed this offer’s entered purchase cap.');
          if(q>0){selected++;total+=q*r.price;utility+=q*r.utility;}
          const hasEvidence=values[p+'Source'].trim()&&values[p+'Date'];
          output(packResults[p],money(r.pricePer1000)+' per 1,000 assumed diamond-equivalents · '+fmt(r.utility)+' total per purchase · collected over '+r.durationDays+' days. '+(values[p+'Recurring']?'Recurring billing. ':'One-time offer as entered. ')+(hasEvidence?'Note saved. This tool does not check it.':'Add a note and the date you checked.'));
          valid.push({p,r});
        }catch(e){if(Number(values[p+'Quantity'])>0)invalidSelected=true;output(packResults[p],e.message,true);}
      }
      try{
        const b=number(values.budget,'Cash budget');
        if(invalidSelected)output(packSummary,'Cannot total this plan: fix the selected offer errors.',true);
        else {
          let text=selected?'Plan: '+money(total)+' / '+money(b)+' budget · '+fmt(utility)+' assumed diamond-equivalents. '+(total>b?'Over budget by '+money(total-b)+'.':'Unspent budget: '+money(b-total)+'.'):'Zero-purchase plan: '+money(0)+'. No paid offer selected.';
          if(valid.length===2){const comparable=values.offerARegion===values.offerBRegion&&values.offerADate&&values.offerADate===values.offerBDate&&values.offerATicketValue===values.offerBTicketValue; text+=comparable?' Compare cost per 1,000 above only after checking reward eligibility and caps.':' Offers have different or missing region/date/ticket assumptions; no best-value ranking is shown.';}
          output(packSummary,text,total>b);
        }
      }catch(e){output(packSummary,e.message,true);}
      if(values.dailyIncome===''&&values.target==='')output(forecastResult,'Enter your income estimate and target.');
      else try{const r=forecast(values.forecastBalance,values.dailyIncome,values.target);output(forecastResult,r.days===null?'Target cannot be reached with zero net daily income.':r.days===0?'Your entered balance already meets the target.':fmt(r.gap)+' diamonds needed · approximately '+r.days+' days at this constant income.');}catch(e){output(forecastResult,e.message,true);}
    }
    update();
    return {refresh:update};
  }
  return {spring,pity,chance,comparePack,forecast,maturity,mount};
});
