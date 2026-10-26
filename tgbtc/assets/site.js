/* TGBTC shared UI: reading progress, floating TOC, back-to-top, open collapsed sections on deep links */
(function(){
  var d=document;
  function ready(f){d.readyState!=='loading'?f():d.addEventListener('DOMContentLoaded',f);}
  ready(function(){
    var on=d.querySelector('.gnav a.on');if(on&&on.parentElement.scrollWidth>on.parentElement.clientWidth){on.parentElement.scrollLeft=on.offsetLeft-on.parentElement.clientWidth/2+on.clientWidth/2;}
    var prog=d.createElement('div');prog.id='tg-prog';d.body.appendChild(prog);
    var top=d.createElement('button');top.className='tg-top';top.type='button';top.setAttribute('aria-label','Back to top');top.textContent='↑';
    top.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};d.body.appendChild(top);
    var hs=[].slice.call(d.querySelectorAll('.wrap h2[id], .wrap section > h2, .sec > h2'));
    var seen=[];hs=hs.filter(function(h){if(seen.indexOf(h)>-1)return false;seen.push(h);return true;});
    var links=[];
    if(hs.length>=3){
      var toc=d.createElement('nav');toc.className='tg-toc';toc.setAttribute('aria-label','On this page');
      var t=d.createElement('b');t.textContent='ON THIS PAGE';toc.appendChild(t);
      hs.forEach(function(h,i){
        if(!h.id){var s=h.closest('section');h.id=(s&&s.id)?s.id+'-h':'sec-'+i;}
        var a=d.createElement('a');a.href='#'+h.id;
        var ic=h.querySelector('.hi');var label=h.cloneNode(true);[].forEach.call(label.querySelectorAll('.hi,.s,.cnt,div,small,span.attr'),function(x){x.remove();});
        a.innerHTML=(ic?'<span>'+ic.textContent+'</span>':'')+'<span>'+label.textContent.trim().slice(0,60)+'</span>';
        a.onclick=function(){if(window.innerWidth<1560)toc.classList.remove('open');};
        toc.appendChild(a);links.push([h,a]);
      });
      d.body.appendChild(toc);
      var fab=d.createElement('button');fab.className='tg-fab';fab.type='button';fab.innerHTML='<span class="fi">☰</span><span class="ft"> On this page</span>';fab.setAttribute('aria-label','On this page');
      fab.onclick=function(e){e.stopPropagation();toc.classList.toggle('open');};d.body.appendChild(fab);
      d.addEventListener('click',function(e){if(window.innerWidth<1560&&!toc.contains(e.target))toc.classList.remove('open');});
    }
    function onScroll(){
      var h=d.documentElement,max=h.scrollHeight-h.clientHeight;prog.style.width=(max>0?(h.scrollTop/max*100):0)+'%';
      top.classList.toggle('show',h.scrollTop>700);
      var cur=null;links.forEach(function(p){if(p[0].getBoundingClientRect().top<120)cur=p[1];});
      links.forEach(function(p){p[1].classList.toggle('cur',p[1]===cur);});
    }
    window.addEventListener('scroll',onScroll,{passive:true});onScroll();
    function openTo(){
      var id=decodeURIComponent(location.hash.slice(1));if(!id)return;var el=d.getElementById(id);if(!el)return;
      var p=el.parentElement,opened=false;while(p){if(p.tagName==='DETAILS'&&!p.open){p.open=true;opened=true;}p=p.parentElement;}
      if(opened)setTimeout(function(){el.scrollIntoView();},30);
    }
    window.addEventListener('hashchange',openTo);openTo();
  });
})();
