(function(){
'use strict';
function q(id){return document.getElementById(id);}
function log(m){var b=q('logArea');var s='['+new Date().toLocaleTimeString()+'] '+m;console.log(s);if(b){b.textContent+=s+'\n';b.scrollTop=b.scrollHeight;}}
function lower(x){return String(x||'').toLowerCase();}
function isFaceId(name){return lower(name).indexOf('faceid')>=0;}
function isSdxlCkpt(){var c=q('selCheckpoint');return c&&/xl|sdxl|pony|turbo/i.test(c.value||'');}
function selectSafeIpAdapter(){var s=q('selIpadapter');if(!s||s.options.length===0){return;}var current=s.value||'';if(current&&!isFaceId(current)){return;}var wantXL=isSdxlCkpt();var best=-1;for(var i=0;i<s.options.length;i++){var v=s.options[i].value;if(!v||isFaceId(v)){continue;}var l=lower(v);if(wantXL&&l.indexOf('sdxl')>=0){best=i;break;}if(!wantXL&&l.indexOf('sd15')>=0){best=i;break;}if(best<0){best=i;}}
if(best>=0){s.selectedIndex=best;log('IPAdapter auto-selected non-FaceID model: '+s.value);}else{log('Only FaceID IPAdapter models detected. FaceID requires insightface + matching LoRA. Install those or add non-FaceID IPAdapter model.');}}
var oldConnect=window.connectServer;
if(typeof oldConnect==='function'){
  window.connectServer=function(){var r=oldConnect.apply(this,arguments);Promise.resolve(r).then(function(){setTimeout(selectSafeIpAdapter,100);});return r;};
}
var oldGenerate=window.generate;
if(typeof oldGenerate==='function'){
  window.generate=function(){var s=q('selIpadapter');if(s&&s.value&&isFaceId(s.value)){alert('현재 선택된 IPAdapter는 FaceID 모델입니다. FaceID 모델은 insightface 모델과 전용 LoRA가 필요합니다. 지금은 non-FaceID 모델(ip-adapter-plus-face_sdxl_vit-h 또는 ip-adapter-plus_sdxl_vit-h)을 선택하세요.');log('Blocked FaceID IPAdapter without insightface path: '+s.value);return;}return oldGenerate.apply(this,arguments);};
}
log('model_guard.js loaded: FaceID model guard enabled');
})();
