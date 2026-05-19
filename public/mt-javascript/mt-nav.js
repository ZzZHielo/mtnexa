/* ── Shared Nav Loader ── */
function loadNav(){
  var root=document.getElementById('navRoot');
  if(!root)return;
  fetch('/nav.html').then(function(r){return r.text();}).then(function(html){
    var page=location.pathname.split('/').pop()||'index.html';
    root.innerHTML=html;
    // Mark active nav link
    document.querySelectorAll('.nav-center .nav-link[href]').forEach(function(a){
      var href=a.getAttribute('href');
      if(href===page||(!page&&href==='index.html'))a.classList.add('active');
    });
    // Pill init
    initNavPill();
    // Re-apply i18n after nav loads
    if(typeof applyLang==='function')applyLang(localStorage.getItem('mt-lang')||'es');
    // Re-apply currency after nav loads
    if(typeof applyCurrency==='function')applyCurrency();
    // Sync admin visibility and user UI
    if(typeof MTAuth!=='undefined'&&MTAuth.getUser){
      var user=MTAuth.getUser();
      if(user&&MTAuth._applyUserUI)MTAuth._applyUserUI(user);
    }
  }).catch(function(err){
    console.warn('nav load failed, using fallback',err);
  });
}
function initNavPill(){
  var pill=document.getElementById('navPill');
  if(!pill)return;
  var active=document.querySelector('.nav-link.active');
  var pr=pill.parentElement.getBoundingClientRect();
  function moveTo(el){
    var er=el.getBoundingClientRect();
    pill.style.display='block';
    pill.style.left=(er.left-pr.left)+'px';
    pill.style.top=(er.top-pr.top)+'px';
    pill.style.width=er.width+'px';
    pill.style.height=er.height+'px';
  }
  if(active)moveTo(active);
  document.querySelectorAll('.nav-link:not(.nav-link-admin)').forEach(function(link){
    link.addEventListener('mouseenter',function(){moveTo(link);});
    link.addEventListener('mouseleave',function(){
      if(active)moveTo(active);else pill.style.display='none';
    });
  });
}
document.addEventListener('DOMContentLoaded',loadNav);
