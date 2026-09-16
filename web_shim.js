// Web shim: stellt require/nw/greenworks/crypto/fs/path für Browser bereit
(function(){
  var dummyWin = { on:function(){}, removeListener:function(){}, showDevTools:function(){} };
  var stubs = {
    'nw.gui': { Window: { get: function(){ return dummyWin; } } },
    'os': { platform: function(){ return ''; }, homedir: function(){ return ''; } },
    'path': { join: function(){ return Array.prototype.join.call(arguments,'/'); }, resolve: function(){ return ''; }, dirname: function(p){ return p; }, basename: function(p){ return p; }, extname: function(){ return ''; } },
    'fs': { existsSync:function(){return false}, readFileSync:function(){return ''}, writeFileSync:function(){}, readdirSync:function(){return []}, statSync:function(){return {isFile:function(){return false}} } },
    'crypto': { createHash:function(){ return { update:function(){return this}, digest:function(){return ''} } }, randomBytes:function(n){ var a=new Uint8Array(n); if(window.crypto) window.crypto.getRandomValues(a); return a; } },
    'child_process': { exec:function(){} }
  };
  function fakeRequire(id){
    if(!id) return {};
    var k = String(id).replace(/\\/g,'/').trim();
    if(stubs[k]) return stubs[k];
    if(k.indexOf('greenworks')!==-1) return { initAPI:function(){return false} };
    if(k.indexOf('js-yaml')!==-1) return { safeLoad:function(){return {}}, load:function(){return {}}, dump:function(){return ''} };
    if(k.indexOf('pixi')!==-1) return window.PIXI || {};
    return {};
  }
  if(typeof window.require==='undefined') window.require = fakeRequire;
  if(typeof global!=='undefined' && typeof global.require==='undefined') global.require = fakeRequire;
  // Utils.isNwjs im Web immer false
  var _orig;
  function patchUtils(){
    if(typeof Utils!=='undefined' && Utils.isNwjs && !_orig){
      _orig = Utils.isNwjs;
      Utils.isNwjs = function(){ return false; };
    }
  }
  patchUtils();
  document.addEventListener('DOMContentLoaded', patchUtils);
  window.addEventListener('load', patchUtils);
  // Falls GTP_OmoriFixes SceneManager.requestUpdate mit require crasht -> per P2 abfangen
  function patchSceneManager(){
    if(typeof SceneManager==='undefined') return;
    // original sichern und require-Guard drum bauen
    if(SceneManager._webPatched) return;
    SceneManager._webPatched = true;
    var orig = SceneManager.requestUpdate;
    // Prüfen ob orig require enthält (workaround)
    SceneManager.requestUpdate = function(){
      try{ return orig.apply(this, arguments); }catch(e){
        if(e && /require is not defined|require\(/.test(e.message)){
          // Fallback: normaler Browser-Loop
          if(!this.ticker){
            this.ticker = new PIXI.ticker.Ticker();
            this.ticker.maxFPS = 60;
            this.ticker.add(this.update, this);
            this.ticker.start();
            return;
          }
          if(this._stopped && this.ticker.started) this.ticker.stop();
          else if(!this.ticker.started) this.ticker.start();
          return;
        }
        throw e;
      }
    };
  }
  var tries=0;
  var iv=setInterval(function(){ tries++; patchUtils(); patchSceneManager(); if(tries>200) clearInterval(iv); if(typeof SceneManager!=='undefined' && SceneManager._webPatched) clearInterval(iv); }, 50);
})();
