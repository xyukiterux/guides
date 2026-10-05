/* guide-theme: a game-art hero above the home page's title (GameGuides/_kit/theme.py) */
(function(){var C={"root": ".content", "home": "h1", "home_text": "Complete Guide", "title": "Terraria", "kicker": "Complete Guide \u00b7 Vanilla 1.4.4"};if(C.home===".hero")return;
var root=document.querySelector(C.root);if(!root)return;
function add(){var h=root.querySelector(C.home);if(!h||h.textContent.indexOf(C.home_text)<0||root.querySelector('.gt-hero'))return;
var d=document.createElement('div');d.className='gt-hero';d.innerHTML='<span class="gt-k"></span><div class="gt-bubble"></div>';
d.querySelector('.gt-k').textContent=C.kicker;d.querySelector('.gt-bubble').textContent=C.title;h.parentNode.insertBefore(d,h);h.style.display='none';}
new MutationObserver(add).observe(root,{childList:true});add();})();
