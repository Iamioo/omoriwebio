// Nach plugins.js/main.js: fängt GTP_OmoriFixes im Web ab
(function(){
  function ensureRequire(){
    if(typeof window.require==='function' && typeof require==='undefined'){
      try{ window.eval('var require = window.require'); }catch{}
      try{ globalThis.require = window.require; }catch{}
    }
  }
  ensureRequire();
  function patch(){
    if(typeof SceneManager==='undefined' || typeof PIXI==='undefined') return false;
    // überschreibt die GTP-Version mit Web-tauglicher Version
    SceneManager.requestUpdate = function(){
      if (!this.ticker) {
        this.ticker = new PIXI.ticker.Ticker();
        this.ticker.maxFPS = 60;
        this.ticker.add(this.update, this);
        this.ticker.start();
        return;
      } else {
        if(this._stopped && this.ticker.started) { this.ticker.stop(); }
        else if(!this.ticker.started) { this.ticker.start(); }
        return;
      }
    };
    SceneManager._clearMinimizeHandler = function(){ if(this._minimizeHandler){ clearInterval(this._minimizeHandler); this._minimizeHandler=undefined; } };
    return true;
  }
  var tries=0;
  var iv=setInterval(function(){ tries++; ensureRequire(); if(patch()) clearInterval(iv); if(tries>300) clearInterval(iv); },30);
  window.addEventListener('load', function(){ ensureRequire(); patch(); });
})();
