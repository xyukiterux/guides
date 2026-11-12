/* TGBTC shared UI: reading progress, back-to-top, open collapsed sections on deep links */
(function(){
  var d=document;
  function ready(f){d.readyState!=='loading'?f():d.addEventListener('DOMContentLoaded',f);}
  ready(function(){
    var on=d.querySelector('.gnav a.on');if(on&&on.parentElement.scrollWidth>on.parentElement.clientWidth){on.parentElement.scrollLeft=on.offsetLeft-on.parentElement.clientWidth/2+on.clientWidth/2;}
    var prog=d.createElement('div');prog.id='tg-prog';d.body.appendChild(prog);
    var top=d.createElement('button');top.className='tg-top';top.type='button';top.setAttribute('aria-label','Back to top');top.textContent='↑';
    top.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};d.body.appendChild(top);
    function onScroll(){
      var h=d.documentElement,max=h.scrollHeight-h.clientHeight;prog.style.width=(max>0?(h.scrollTop/max*100):0)+'%';
      top.classList.toggle('show',h.scrollTop>700);
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
