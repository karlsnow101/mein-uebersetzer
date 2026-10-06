(() => {
  const POSITION_KEY='mein-uebersetzer-position';
  let panel=null,drag=null,requestId=0,lastSelectedText='';
  const selectedText=()=>window.getSelection()?.toString().trim()||'';
  const hidePanel=()=>{if(panel)panel.style.display='none';};
  function fitPanel(){if(!panel)return;const m=12,maxW=Math.max(180,Math.min(innerWidth*.5,innerWidth-m*2));panel.style.width='max-content';panel.style.maxWidth=maxW+'px';panel.style.maxHeight='none';const text=panel.querySelector('.mein-uebersetzer-text');text.style.maxHeight='none';let r=panel.getBoundingClientRect();if(r.width>maxW)panel.style.width=maxW+'px';}
  function startDrag(e){if(!panel||e.button!==0)return;const r=panel.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};e.currentTarget.setPointerCapture(e.pointerId);panel.classList.add('dragging');e.preventDefault();}
  function moveDrag(e){if(!drag||e.pointerId!==drag.id)return;panel.style.left=e.clientX-drag.x+'px';panel.style.top=e.clientY-drag.y+'px';panel.style.right='auto';panel.style.bottom='auto';}
  function endDrag(e){if(!drag||e.pointerId!==drag.id)return;try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}const r=panel.getBoundingClientRect();localStorage.setItem(POSITION_KEY,JSON.stringify({left:r.left,top:r.top}));panel.classList.remove('dragging');drag=null;}
  function ensurePanel(){if(panel)return;panel=document.createElement('div');panel.id='mein-uebersetzer-panel';panel.innerHTML='<div class="mein-uebersetzer-handle">⠿ Übersetzung</div><div class="mein-uebersetzer-text"></div>';document.documentElement.appendChild(panel);const h=panel.firstElementChild;h.addEventListener('pointerdown',startDrag);h.addEventListener('pointermove',moveDrag);h.addEventListener('pointerup',endDrag);h.addEventListener('pointercancel',endDrag);try{const p=JSON.parse(localStorage.getItem(POSITION_KEY)||'null');if(p){panel.style.left=p.left+'px';panel.style.top=p.top+'px';panel.style.right='auto';panel.style.bottom='auto';}}catch{}}
  function showPanel(t){ensurePanel();panel.querySelector('.mein-uebersetzer-text').textContent=t;panel.style.display='block';fitPanel();}
  function requestTranslation(t){const id=++requestId;chrome.runtime.sendMessage({type:'translate',text:t},r=>{if(id!==requestId)return;if(chrome.runtime.lastError||!r||r.skip||r.error){hidePanel();return;}if(selectedText()!==t){hidePanel();return;}if(r.translation)showPanel(r.translation);});}
  document.addEventListener('selectionchange',()=>{const s=selectedText();if(!s){requestId++;lastSelectedText='';hidePanel();return;}if(s!==lastSelectedText){lastSelectedText=s;requestTranslation(s);}});
  document.addEventListener('mouseup',()=>{const s=selectedText();if(s&&s!==lastSelectedText){lastSelectedText=s;requestTranslation(s);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePanel();});window.addEventListener('resize',fitPanel);
})();
