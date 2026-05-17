(function(){
'use strict';
function q(id){return document.getElementById(id);}
function log(m){var b=q('logArea');var s='['+new Date().toLocaleTimeString()+'] '+m;console.log(s);if(b){b.textContent+=s+'\n';b.scrollTop=b.scrollHeight;}}
function lower(x){return String(x||'').toLowerCase();}
function isFaceId(name){return lower(name).indexOf('faceid')>=0;}
function isSdxlCkpt(){var c=q('selCheckpoint');return c&&/xl|sdxl|pony|turbo/i.test(c.value||'');}
function isSd15Name(name){var l=lower(name);return l.indexOf('sd15')>=0||l.indexOf('sd1.5')>=0||l.indexOf('control_v11')>=0||l.indexOf('v11p')>=0;}
function isSdxlName(name){var l=lower(name);return l.indexOf('sdxl')>=0||l.indexOf('xl')>=0;}
function selectSafeIpAdapter(){var s=q('selIpadapter');if(!s||s.options.length===0){return;}var current=s.value||'';if(current&&!isFaceId(current)){return;}var wantXL=isSdxlCkpt();var best=-1;for(var i=0;i<s.options.length;i++){var v=s.options[i].value;if(!v||isFaceId(v)){continue;}var l=lower(v);if(wantXL&&l.indexOf('sdxl')>=0){best=i;break;}if(!wantXL&&l.indexOf('sd15')>=0){best=i;break;}if(best<0){best=i;}}
if(best>=0){s.selectedIndex=best;log('IPAdapter auto-selected non-FaceID model: '+s.value);}else{log('Only FaceID IPAdapter models detected. FaceID requires insightface + matching LoRA. Install those or add non-FaceID IPAdapter model.');}}
function selectSafeControlNet(){var s=q('selControlnet');if(!s||s.options.length===0){return;}var wantXL=isSdxlCkpt();var current=s.value||'';if(wantXL){if(current&&isSdxlName(current)&&!isSd15Name(current)){return;}var best=-1;for(var i=0;i<s.options.length;i++){var v=s.options[i].value;if(!v){continue;}if(isSdxlName(v)&&!isSd15Name(v)){best=i;break;}}
if(best>=0){s.selectedIndex=best;log('ControlNet auto-selected SDXL-compatible model: '+s.value);}else if(current){log('WARNING: current checkpoint looks SDXL, but selected ControlNet looks SD1.5 or no SDXL ControlNet exists: '+current);}}
else{if(current&&isSd15Name(current)){return;}var best15=-1;for(var j=0;j<s.options.length;j++){var v15=s.options[j].value;if(!v15){continue;}if(isSd15Name(v15)){best15=j;break;}}
if(best15>=0){s.selectedIndex=best15;log('ControlNet auto-selected SD1.5-compatible model: '+s.value);}}
}
function validateModelFamily(){var c=q('selCheckpoint');var cn=q('selControlnet');var ip=q('selIpadapter');if(ip&&ip.value&&isFaceId(ip.value)){alert('현재 선택된 IPAdapter는 FaceID 모델입니다. FaceID 모델은 insightface 모델과 전용 LoRA가 필요합니다. 지금은 non-FaceID 모델을 선택하세요.');log('Blocked FaceID IPAdapter without insightface path: '+ip.value);return false;}if(c&&cn&&c.value&&cn.value&&isSdxlCkpt()&&isSd15Name(cn.value)){alert('현재 Checkpoint는 SDXL 계열인데 ControlNet은 SD1.5 계열입니다. 이 조합은 mat1/mat2 shape mismatch를 발생시킵니다. SDXL용 OpenPose ControlNet을 선택하거나 Pose Reference를 빼고 테스트하세요.');log('Blocked SDXL checkpoint + SD1.5 ControlNet mismatch: ckpt='+c.value+' / controlnet='+cn.value);return false;}return true;}
var oldConnect=window.connectServer;
if(typeof oldConnect==='function'){
  window.connectServer=function(){var r=oldConnect.apply(this,arguments);Promise.resolve(r).then(function(){setTimeout(function(){selectSafeIpAdapter();selectSafeControlNet();},100);});return r;};
}
var oldGenerate=window.generate;
if(typeof oldGenerate==='function'){
  window.generate=function(){selectSafeIpAdapter();selectSafeControlNet();if(!validateModelFamily()){return;}return oldGenerate.apply(this,arguments);};
}
log('model_guard.js loaded: FaceID and ControlNet family guard enabled');
})();
