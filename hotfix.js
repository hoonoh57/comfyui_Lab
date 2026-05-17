(function(){
'use strict';
function q(id){return document.getElementById(id);}
function setStatus(text, cls){
  var t=q('statusText');
  var d=q('statusDot');
  if(t){t.textContent=text;}
  if(d){d.className='status-dot '+(cls||'');}
}
function log(msg){
  var box=q('logArea');
  var line='['+new Date().toLocaleTimeString()+'] '+msg;
  console.log(line);
  if(box){box.textContent+=line+'\n';box.scrollTop=box.scrollHeight;}
}
window.connectServer=function(){
  var input=q('serverUrl');
  var url=input&&input.value?input.value.trim():'http://127.0.0.1:8188';
  if(url.indexOf('http://')!==0&&url.indexOf('https://')!==0){url='http://'+url;}
  if(input){input.value=url;}
  setStatus('Checking','connecting');
  fetch(url.replace(/\/+$/,'')+'/object_info',{cache:'no-store'})
    .then(function(r){if(!r.ok){throw new Error('HTTP '+r.status);}return r.json();})
    .then(function(info){
      window.ComfyLabObjectInfo=info;
      setStatus('Connected','connected');
      var g=q('btnGenerate');
      if(g){g.disabled=false;}
      log('Connected. object_info nodes='+Object.keys(info).length);
    })
    .catch(function(e){
      setStatus('Disconnected','');
      log('Connect failed: '+e.message);
      alert('ComfyUI 연결 실패: '+e.message);
    });
};
window.showAdvancedDialog=function(){
  var modal=q('advancedModal');
  var grid=q('advancedGrid');
  if(grid){grid.innerHTML='<label class="ctrl"><span>Server</span><input type="text" readonly value="'+(q('serverUrl')?q('serverUrl').value:'')+'"></label><label class="ctrl"><span>Status</span><input type="text" readonly value="hotfix loaded"></label>';}
  if(modal){modal.classList.add('show');}else{alert('Advanced hotfix loaded');}
};
window.closeAdvancedDialog=function(){var m=q('advancedModal');if(m){m.classList.remove('show');}};
window.applyAdvancedSettings=function(){window.closeAdvancedDialog();};
window.generate=window.generate||function(){alert('Generate workflow is not connected in this hotfix yet. First confirm Connect error is cleared.');};
window.interrupt=window.interrupt||function(){log('interrupt requested');};
window.handleUpload=window.handleUpload||function(input,key){
  if(!input.files||!input.files[0]){return;}
  var target=q(key==='char'?'previewChar':'previewPose');
  if(target){target.textContent=input.files[0].name;}
};
window.saveCurrentPreset=window.saveCurrentPreset||function(){localStorage.setItem('comfyui_lab_last_prompt',q('positivePrompt')?q('positivePrompt').value:'');log('Preset saved');};
window.applyProfile=window.applyProfile||function(name){log('Profile '+name);};
log('hotfix.js loaded');
})();
