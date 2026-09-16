(() => {
  const STORAGE_KEY = 'omori_mobile_v2';
  const HOME_URL = 'https://iamioo.github.io/home';
  const defaults = {
    visible: true,
    scale: 1,
    opacity: 0.9,
    preset: 'default',
    layout: null,
    screenW: 0,
    screenH: 0,
    stretch: null,
    gameScale: 1
  };
  const presets = {
    default: {
      up:    { x: 18, y: 28 }, down:  { x: 18, y: 72 }, left:  { x: 6, y: 50 }, right: { x: 30, y: 50 },
      a:     { x: 88, y: 42 }, b:     { x: 72, y: 68 }
    },
    lefthand: {
      up:    { x: 82, y: 28 }, down:  { x: 82, y: 72 }, left:  { x: 70, y: 50 }, right: { x: 94, y: 50 },
      a:     { x: 12, y: 42 }, b:     { x: 28, y: 68 }
    },
    compact: {
      up:    { x: 15, y: 30 }, down:  { x: 15, y: 65 }, left:  { x: 5, y: 48 }, right: { x: 25, y: 48 },
      a:     { x: 90, y: 38 }, b:     { x: 78, y: 60 }
    }
  };
  const screenPresets = [
    { id:'640x480',  label:'640×480',  w:640,  h:480 },
    { id:'816x624',  label:'816×624',  w:816,  h:624 },
    { id:'1024x768', label:'1024×768', w:1024, h:768 },
    { id:'1280x720', label:'1280×720', w:1280, h:720 },
  ];

  function loadState() {
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return s ? Object.assign({}, defaults, s) : { ...defaults }; } catch { return { ...defaults }; }
  }
  function saveState(patch) { state = Object.assign(state, patch); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }

  let state = loadState();
  let layout = state.layout && typeof state.layout === 'object' ? state.layout : JSON.parse(JSON.stringify(presets[state.preset] || presets.default));
  let editMode = false;

  function btnDef(id, name, label, kind, svg) {
    return { id, name, label, kind, svg };
  }
  const buttons = [
    btnDef('c-up', 'up', '', 'medium', '<svg viewBox="0 0 24 24"><path d="M12 5l7 7-2 2-5-5-5 5-2-2z"/></svg>'),
    btnDef('c-down', 'down', '', 'medium', '<svg viewBox="0 0 24 24"><path d="M12 19l-7-7 2-2 5 5 5-5 2 2z"/></svg>'),
    btnDef('c-left', 'left', '', 'medium', '<svg viewBox="0 0 24 24"><path d="M5 12l7-7 2 2-5 5 5 5-2 2z"/></svg>'),
    btnDef('c-right', 'right', '', 'medium', '<svg viewBox="0 0 24 24"><path d="M19 12l-7 7-2-2 5-5-5-5 2-2z"/></svg>'),
    btnDef('c-a', 'a', 'A', 'big', ''),
    btnDef('c-b', 'b', 'B', 'small', ''),
  ];
  const keyMap = { up:'up', down:'down', left:'left', right:'right', a:'ok', b:'escape' };
  const keyCodeMap = { up:38, down:40, left:37, right:39, a:90, b:88 };

  function applyPos() {
    const root = document.getElementById('mobileControls');
    if (!root) return;
    root.style.setProperty('--scale', String(state.scale));
    root.style.setProperty('--opacity', String(state.opacity));
    root.classList.toggle('hidden', !state.visible);
    buttons.forEach(b => {
      const el = document.getElementById(b.id);
      if (!el) return;
      const k = b.name;
      const p = layout[k] || { x:50, y:50 };
      el.style.left = p.x + '%';
      el.style.top = p.y + '%';
      el.classList.toggle('editMode', editMode);
    });
  }

  function setInput(name, down) {
    try {
      if (typeof Input !== 'undefined' && Input._currentState) {
        Input._currentState[name] = !!down;
        if (down) { Input._latestButton = name; Input._pressedTime = 0; Input._date = Date.now(); }
      }
    } catch {}
    try {
      const kc = keyCodeMap[({ok:'a',escape:'b',up:'up',down:'down',left:'left',right:'right'})[name] || name] || 0;
      if (!kc) return;
      const type = down ? 'keydown' : 'keyup';
      const e = new KeyboardEvent(type, { bubbles:true, cancelable:true, keyCode:kc, which:kc, key:name });
      Object.defineProperty(e, 'keyCode', { get: () => kc });
      Object.defineProperty(e, 'which', { get: () => kc });
      document.dispatchEvent(e);
      window.dispatchEvent(e);
    } catch {}
  }

  function buildControls() {
    let root = document.getElementById('mobileControls');
    if (!root) {
      root = document.createElement('div');
      root.id = 'mobileControls';
      document.body.appendChild(root);
    }
    root.className = '';
    root.innerHTML = '';
    buttons.forEach(b => {
      const el = document.createElement('button');
      el.id = b.id;
      el.className = 'ctrl ' + b.kind;
      el.setAttribute('aria-label', b.name);
      el.innerHTML = b.svg ? b.svg : '<span class="lbl">' + b.label + '</span>';
      if (b.name === 'up') {
        const dot = document.createElement('span');
        dot.className = 'dpad-center';
        root.appendChild(dot);
        dot.style.left = '18%';
        dot.style.top = '50%';
      }
      el.addEventListener('contextmenu', e => e.preventDefault());
      const name = keyMap[b.name];
      const onDown = (e) => {
        if (editMode) return;
        e.preventDefault(); e.stopPropagation();
        el.classList.add('pressed');
        el.setPointerCapture && e.pointerId != null && el.setPointerCapture(e.pointerId);
        setInput(name, true);
      };
      const onUp = (e) => {
        if (editMode) return;
        e.preventDefault(); e.stopPropagation();
        el.classList.remove('pressed');
        setInput(name, false);
      };
      el.addEventListener('pointerdown', onDown, { passive:false });
      el.addEventListener('pointerup', onUp, { passive:false });
      el.addEventListener('pointercancel', onUp, { passive:false });
      el.addEventListener('pointerleave', (e)=>{ if(!editMode && el.classList.contains('pressed')) onUp(e); }, { passive:false });
      el.addEventListener('touchstart', e=>{ if(!editMode) e.preventDefault(); }, {passive:false});
      enableDrag(el, b.name);
      root.appendChild(el);
    });
    applyPos();
  }

  function enableDrag(el, key) {
    let dragging = false, startX=0, startY=0, origX=0, origY=0, pid=null;
    el.addEventListener('pointerdown', (e) => {
      if (!editMode) return;
      e.preventDefault(); e.stopPropagation();
      dragging = true; pid = e.pointerId;
      el.setPointerCapture && el.setPointerCapture(pid);
      startX = e.clientX; startY = e.clientY;
      origX = layout[key].x; origY = layout[key].y;
      el.style.transition = 'none';
    }, {passive:false});
    el.addEventListener('pointermove', (e) => {
      if (!dragging || !editMode) return;
      e.preventDefault();
      const dx = ((e.clientX - startX) / window.innerWidth) * 100;
      const dy = ((e.clientY - startY) / window.innerHeight) * 100;
      let nx = origX + dx; let ny = origY + dy;
      nx = Math.max(4, Math.min(96, nx));
      ny = Math.max(8, Math.min(92, ny));
      layout[key].x = nx; layout[key].y = ny;
      el.style.left = nx + '%'; el.style.top = ny + '%';
    }, {passive:false});
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.style.transition = '';
      saveState({ layout: layout });
      try{ pid!=null && el.releasePointerCapture && el.releasePointerCapture(pid);}catch{}
    };
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  }

  function getEffectiveScreenSize(){
    try{
      if(typeof Graphics!=='undefined' && Graphics._width){
        return { w: Graphics._width, h: Graphics._height, scale: Graphics._scale, stretch: Graphics._stretchEnabled };
      }
    }catch{}
    return { w: state.screenW||816, h: state.screenH||624, scale: state.gameScale||1, stretch: state.stretch };
  }

  function applyScreenSettings(){
    try{
      if(typeof Graphics==='undefined' || !Graphics._canvas) return false;
      const w = parseInt(state.screenW,10)||0;
      const h = parseInt(state.screenH,10)||0;
      if(w>=320 && h>=240){
        Graphics._width = w; Graphics._height = h;
        Graphics._boxWidth = w; Graphics._boxHeight = h;
        if(typeof SceneManager!=='undefined'){
          SceneManager._screenWidth = w; SceneManager._screenHeight = h;
          SceneManager._boxWidth = w; SceneManager._boxHeight = h;
        }
      }
      if(typeof state.stretch==='boolean'){
        Graphics._stretchEnabled = state.stretch;
      }
      const gs = parseFloat(state.gameScale);
      if(!isNaN(gs) && gs>0){
        Graphics._scale = gs;
      }
      Graphics._updateAllElements();
      return true;
    }catch(e){ return false; }
  }

  function scheduleApplyScreen(){
    let tries=0;
    const iv=setInterval(()=>{
      tries++;
      if(applyScreenSettings()) clearInterval(iv);
      if(tries>80) clearInterval(iv);
    },150);
  }

  function buildChrome() {
    if (document.getElementById('topBar')) return;
    const bar = document.createElement('div');
    bar.id = 'topBar';
    bar.innerHTML = '<button id="menuBtn" aria-label="Menü">☰</button><span id="topTitle">OMORI — MOBILE</span>';
    document.body.appendChild(bar);

    const overlay = document.createElement('div');
    overlay.id = 'menuOverlay';
    document.body.appendChild(overlay);

    const eff = getEffectiveScreenSize();
    const curW = state.screenW||eff.w||816;
    const curH = state.screenH||eff.h||624;
    const curStretch = state.stretch===null ? (eff.stretch ? 'on' : '') : (state.stretch ? 'on' : '');
    const curScale = state.gameScale||1;

    const menu = document.createElement('div');
    menu.id = 'sideMenu';
    menu.innerHTML = `
      <div class="menuHead"><h2>MENÜ</h2><button id="closeMenu" aria-label="Schließen">✕</button></div>
      <div class="menuBody">
        <div class="menuSection">
          <h3>BILDSCHIRM</h3>
          <div class="row"><label>Breite × Höhe</label><span class="val" id="valScreen">${curW}×${curH}</span></div>
          <div class="swatchRow">
            <input type="number" id="inpW" min="320" max="3840" step="1" value="${curW}" placeholder="Breite">
            <span style="color:#666">×</span>
            <input type="number" id="inpH" min="240" max="2160" step="1" value="${curH}" placeholder="Höhe">
            <button class="btnGhost" id="btnApplyScreen" style="width:auto;padding:7px 12px;flex:1">Anwenden</button>
          </div>
          <div class="pillRow" id="screenPresetRow" style="margin-top:10px">
            ${screenPresets.map(p=>`<button class="pill" data-sw="${p.w}" data-sh="${p.h}">${p.label}</button>`).join('')}
            <button class="pill" data-sw="auto" data-sh="auto">Fenster fit</button>
          </div>
          <div class="row"><label>Stretch (füllt Fenster)</label><div class="switch ${curStretch}" id="swStretch" role="switch" tabindex="0"></div></div>
          <div class="row"><label>Game‑Scale</label><input type="range" id="rngGameScale" min="0.5" max="3" step="0.1" value="${curScale}"><span class="val" id="valGameScale">${curScale}×</span></div>
          <button class="btnGhost" id="btnFitWindow">An Fenster anpassen</button>
          <div class="hint" style="margin-top:6px">Auflösung = interne Canvas‑Größe. Stretch an = skaliert ins Fenster ohne Scroll. F3 im Spiel toggelt Stretch ebenfalls.</div>
        </div>
        <div class="menuSection">
          <h3>STEUERUNG</h3>
          <div class="row"><label>Steuerung sichtbar</label><div class="switch ${state.visible?'on':''}" id="swVisible" role="switch" tabindex="0"></div></div>
          <div class="row"><label>Bearbeiten (bewegen)</label><div class="switch" id="swEdit" role="switch" tabindex="0"></div></div>
          <div id="editHint" class="hint editBadge">Bearbeiten aktiv: Buttons ziehen zum Verschieben. Erneut tippen zum Beenden.</div>
          <div class="row"><label>Button‑Größe</label><input type="range" id="rngScale" min="0.65" max="1.6" step="0.05" value="${state.scale}"><span class="val" id="valScale">${Math.round(state.scale*100)}%</span></div>
          <div class="row"><label>Deckkraft</label><input type="range" id="rngOpacity" min="0.2" max="1" step="0.05" value="${state.opacity}"><span class="val" id="valOpacity">${Math.round(state.opacity*100)}%</span></div>
          <div class="hint" style="margin-top:6px">Tipp: Größe + Deckkraft live testen. Position per Button ziehen (Edit an).</div>
        </div>
        <div class="menuSection">
          <h3>LAYOUT</h3>
          <div class="pillRow" id="presetRow">
            <button class="pill ${state.preset==='default'?'on':''}" data-preset="default">Standard</button>
            <button class="pill ${state.preset==='lefthand'?'on':''}" data-preset="lefthand">Linkshänder</button>
            <button class="pill ${state.preset==='compact'?'on':''}" data-preset="compact">Kompakt</button>
          </div>
          <div style="height:8px"></div>
          <button class="btnGhost" id="btnReset">Positionen zurücksetzen</button>
        </div>
        <div class="menuSection">
          <h3>NAVIGATION</h3>
          <a class="linkBtn" href="${HOME_URL}" target="_blank" rel="noopener">↗ iamioo.github.io/home öffnen</a>
          <div class="hint" style="margin-top:8px">Öffnet externe Seite in neuem Tab.</div>
        </div>
        <div class="menuSection">
          <h3>HILFE</h3>
          <div class="hint">A = Bestätigen (Z / Enter / Space) · B = Zurück/Menü (X / Esc)<br>D-Pad = Bewegen · Auf Desktop keine Mobile-Buttons nötig.</div>
          <div style="height:8px"></div>
          <button class="btnGhost" id="btnFullscreen">Vollbild umschalten</button>
        </div>
      </div>
    `;
    document.body.appendChild(menu);

    const open = () => { overlay.classList.add('open'); menu.classList.add('open'); };
    const close = () => { overlay.classList.remove('open'); menu.classList.remove('open'); };
    document.getElementById('menuBtn').addEventListener('click', open);
    document.getElementById('closeMenu').addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && menu.classList.contains('open')) close(); });

    // Bildschirm
    const inpW = document.getElementById('inpW');
    const inpH = document.getElementById('inpH');
    const valScreen = document.getElementById('valScreen');
    const swStretch = document.getElementById('swStretch');
    const rngGameScale = document.getElementById('rngGameScale');
    const valGameScale = document.getElementById('valGameScale');
    function updateScreenVals(){
      const w = parseInt(inpW.value,10)||0; const h = parseInt(inpH.value,10)||0;
      if(w&&h) valScreen.textContent = w+'×'+h;
    }
    inpW.addEventListener('input', updateScreenVals);
    inpH.addEventListener('input', updateScreenVals);
    document.getElementById('btnApplyScreen').addEventListener('click', ()=>{
      const w=Math.max(320,Math.min(3840, parseInt(inpW.value,10)||0));
      const h=Math.max(240,Math.min(2160, parseInt(inpH.value,10)||0));
      if(!w||!h) return;
      saveState({screenW:w, screenH:h});
      valScreen.textContent=w+'×'+h;
      applyScreenSettings();
    });
    document.getElementById('screenPresetRow').addEventListener('click', (e)=>{
      const b=e.target.closest('[data-sw]'); if(!b) return;
      if(b.dataset.sw==='auto'){
        saveState({screenW:0, screenH:0, stretch:true});
        swStretch.classList.add('on'); state.stretch=true;
        if(typeof Graphics!=='undefined') { Graphics._stretchEnabled=true; Graphics._updateAllElements(); }
        return;
      }
      const w=parseInt(b.dataset.sw,10), h=parseInt(b.dataset.sh,10);
      inpW.value=w; inpH.value=h; valScreen.textContent=w+'×'+h;
      saveState({screenW:w, screenH:h});
      applyScreenSettings();
    });
    swStretch.addEventListener('click', ()=>{
      const on = !swStretch.classList.contains('on');
      swStretch.classList.toggle('on', on);
      saveState({stretch:on});
      try{ if(typeof Graphics!=='undefined'){ Graphics._stretchEnabled=on; Graphics._updateAllElements(); } }catch{}
    });
    rngGameScale.addEventListener('input', ()=>{
      const v=parseFloat(rngGameScale.value); valGameScale.textContent=v.toFixed(1)+'×';
      saveState({gameScale:v});
      try{ if(typeof Graphics!=='undefined'){ Graphics._scale=v; Graphics._updateAllElements(); } }catch{}
    });
    document.getElementById('btnFitWindow').addEventListener('click', ()=>{
      try{ if(typeof Graphics!=='undefined'){ Graphics._stretchEnabled=true; Graphics._updateAllElements(); saveState({stretch:true}); swStretch.classList.add('on'); } }catch{}
    });

    const swVisible = document.getElementById('swVisible');
    const swEdit = document.getElementById('swEdit');
    const rngScale = document.getElementById('rngScale');
    const rngOpacity = document.getElementById('rngOpacity');
    const valScale = document.getElementById('valScale');
    const valOpacity = document.getElementById('valOpacity');

    swVisible.addEventListener('click', ()=>{
      saveState({visible: !state.visible});
      swVisible.classList.toggle('on', state.visible);
      applyPos();
    });
    function setEdit(v){
      editMode = v;
      swEdit.classList.toggle('on', editMode);
      document.getElementById('editHint').classList.toggle('on', editMode);
      applyPos();
      if(editMode) close();
    }
    swEdit.addEventListener('click', ()=> setEdit(!editMode));
    let lastTap=0;
    document.getElementById('menuBtn').addEventListener('touchend', ()=>{
      const now=Date.now(); if(now-lastTap<350) setEdit(!editMode); lastTap=now;
    });

    rngScale.addEventListener('input', ()=>{
      const v=parseFloat(rngScale.value); saveState({scale:v}); valScale.textContent=Math.round(v*100)+'%'; applyPos();
    });
    rngOpacity.addEventListener('input', ()=>{
      const v=parseFloat(rngOpacity.value); saveState({opacity:v}); valOpacity.textContent=Math.round(v*100)+'%'; applyPos();
    });

    document.getElementById('presetRow').addEventListener('click', (e)=>{
      const b=e.target.closest('[data-preset]'); if(!b) return;
      const p=b.dataset.preset;
      layout = JSON.parse(JSON.stringify(presets[p]));
      saveState({preset:p, layout:layout});
      document.querySelectorAll('#presetRow .pill').forEach(x=>x.classList.toggle('on', x.dataset.preset===p));
      applyPos();
    });
    document.getElementById('btnReset').addEventListener('click', ()=>{
      layout = JSON.parse(JSON.stringify(presets[state.preset] || presets.default));
      saveState({layout:layout}); applyPos();
    });
    document.getElementById('btnFullscreen').addEventListener('click', async ()=>{
      try{
        if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      }catch{}
    });

    window.__omoriMenu = { open, close, setEdit, applyScreenSettings };
  }

  document.addEventListener('touchstart', (e)=>{
    if(e.target.closest && e.target.closest('#mobileControls, #topBar, #sideMenu, #menuOverlay')) {
      e.stopPropagation();
    }
  }, {capture:true, passive:false});
  document.addEventListener('touchmove', (e)=>{
    if(editMode && e.target.closest && e.target.closest('#mobileControls')) e.preventDefault();
  }, {capture:false, passive:false});

  function boot(){
    buildChrome();
    buildControls();
    const style = document.createElement('style');
    style.textContent = 'canvas{image-rendering:pixelated;image-rendering:crisp-edges}';
    document.head.appendChild(style);
    window.addEventListener('resize', applyPos);
    window.addEventListener('orientationchange', ()=> setTimeout(applyPos, 200));
    scheduleApplyScreen();
    window.addEventListener('load', scheduleApplyScreen);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('load', ()=>{ buildChrome(); buildControls(); scheduleApplyScreen(); });

  // F3 stretch sync
  document.addEventListener('keydown', (e)=>{
    if(e.keyCode===114){
      setTimeout(()=>{
        try{
          if(typeof Graphics!=='undefined'){
            const on = !!Graphics._stretchEnabled;
            saveState({stretch:on});
            const sw=document.getElementById('swStretch');
            if(sw) sw.classList.toggle('on', on);
          }
        }catch{}
      },100);
    }
  });
})();
