(function(){
'use strict';
function q(id){return document.getElementById(id);}
function log(m){var b=q('logArea');var s='['+new Date().toLocaleTimeString()+'] '+m;console.log(s);if(b){b.textContent+=s+'\n';b.scrollTop=b.scrollHeight;}}
function css(){
 if(q('studioLayoutStyle')){return;}
 var st=document.createElement('style');st.id='studioLayoutStyle';st.textContent='\nbody.studio-mode main{grid-template-columns:310px minmax(700px,1fr) 300px!important;}\nbody.studio-mode .panel-left{padding:10px!important;background:#121420!important;}\n#workflowMenu{background:#080a12;border:1px solid #333a55;border-radius:10px;padding:10px;margin-bottom:10px;}\n#workflowMenu h3{font-size:13px;color:#00cec9;margin:0 0 8px 0;}\n.workflow-parent{border:1px solid #2d344c;background:#181b2a;border-radius:8px;margin-bottom:8px;overflow:hidden;}\n.workflow-parent-title{padding:8px 9px;color:#fff;font-weight:700;font-size:12px;background:#22263a;cursor:pointer;}\n.workflow-child{display:block;width:100%;border:0;border-top:1px solid #30364f;background:#10131d;color:#aeb7d6;text-align:left;padding:7px 10px;font-size:11px;cursor:pointer;}\n.workflow-child:hover{background:#1c2234;color:#fff;}\n.workflow-child.active{background:#6c5ce7;color:#fff;}\n#studioHeader{background:#10131d;border:1px solid #333a55;border-radius:10px;margin:8px 8px 8px 8px;padding:10px;display:flex;align-items:center;gap:10px;}\n#studioHeader .title{font-size:15px;font-weight:800;color:#a29bfe;}\n#studioHeader .desc{font-size:12px;color:#9aa3c2;}\n.studio-page{display:none!important;}\n.studio-page.active{display:block!important;}\n#studioPageHost{flex:1;overflow:auto;padding:0 8px 8px 8px;}\n.studio-card{background:#151827;border:1px solid #333a55;border-radius:10px;margin-bottom:10px;padding:10px;}\n.studio-card h2{font-size:15px;color:#00cec9;margin:0 0 8px 0;}\n.studio-card p{font-size:12px;color:#aeb7d6;line-height:1.5;margin:4px 0;}\n.studio-step-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}\n.studio-kpi{background:#0b0d15;border:1px solid #333a55;border-radius:8px;padding:8px;font-size:11px;color:#9aa3c2;}\n.studio-kpi b{display:block;color:#fff;font-size:13px;margin-bottom:3px;}\n#singlePage .prompt-area{border:1px solid #333a55;border-radius:10px;background:#151827;margin-bottom:10px;}\n#singlePage .gallery{min-height:360px;border:1px solid #333a55;border-radius:10px;background:#050609;}\n#singlePage .log-area{height:130px;border:1px solid #333a55;border-radius:10px;margin-top:8px;}\n#llmProdPanel,#prodPanel{max-height:none!important;display:block!important;grid-template-columns:1fr!important;}\n#llmProdPanel>div,#prodPanel>div{min-width:0;}\n#llmProdPanel canvas,#prodPanel canvas{max-height:420px;object-fit:contain;}\nbody.studio-mode .panel-right{background:#11131f!important;}\nbody.studio-mode .panel-right.collapsed{display:none;}\n#rightToggle{margin-left:auto;}\n@media(max-width:1200px){body.studio-mode main{grid-template-columns:260px 1fr!important;}body.studio-mode .panel-right{display:none!important;}}\n';document.head.appendChild(st);
}
function makeMenu(){
 var left=document.querySelector('.panel-left');if(!left||q('workflowMenu')){return;}
 var menu=document.createElement('div');menu.id='workflowMenu';menu.innerHTML='<h3>작업 진행 메뉴</h3>'+parent('01. 준비','setup',[['setup','참조 이미지 / 모델 연결'],['single','단일 이미지 테스트']])+parent('02. 기획','planning',[['llm','외부 LLM Shot Card'],['internal','간이 자동 분할']])+parent('03. 생성','generation',[['batch','일괄 이미지 생성'],['preview','타임라인 프리뷰']])+parent('04. 출력','export',[['export','WebM 출력 / 검수']]);left.insertBefore(menu,left.firstChild);
 menu.addEventListener('click',function(e){var b=e.target.closest('.workflow-child');if(!b){return;}showPage(b.getAttribute('data-page'));});
}
function parent(title,key,children){var h='<div class="workflow-parent"><div class="workflow-parent-title">'+title+'</div>';children.forEach(function(c){h+='<button class="workflow-child" data-page="'+c[0]+'">└ '+c[1]+'</button>';});return h+'</div>';}
function makeHost(){
 var center=document.querySelector('.panel-center');if(!center||q('studioPageHost')){return;}
 var header=document.createElement('div');header.id='studioHeader';header.innerHTML='<div><div class="title">Media Generation Studio</div><div class="desc" id="studioDesc">좌측 메뉴 순서대로 진행합니다. 각 단계는 부모-자식 관계로 이어지고, 결과는 오른쪽 작업 페이지에서 눈으로 확인합니다.</div></div><button class="btn btn-sm" id="rightToggle">Model Panel</button>';
 var host=document.createElement('div');host.id='studioPageHost';
 center.insertBefore(header,center.firstChild);center.insertBefore(host,header.nextSibling);
 q('rightToggle').onclick=function(){var r=document.querySelector('.panel-right');if(r){r.classList.toggle('collapsed');}};
}
function moveIntoPages(){
 var host=q('studioPageHost');if(!host||q('setupPage')){return false;}
 var prompt=document.querySelector('.prompt-area');var gallery=document.querySelector('.gallery');var logArea=document.querySelector('.log-area');var llm=q('llmProdPanel');var prod=q('prodPanel');
 if(!prompt||!gallery||!logArea||!llm||!prod){return false;}
 var setup=page('setupPage','setup','01. 준비: 참조 이미지와 모델 연결','Connect 후 Character Reference를 선택하고, 모델 콤보가 자동으로 채워졌는지 확인합니다.');setup.appendChild(statusGrid());
 var single=page('singlePage','single','단일 이미지 테스트','한 장 이미지로 캐릭터 유지력과 텍스트 지시 반영을 빠르게 확인합니다.');single.appendChild(prompt);single.appendChild(gallery);single.appendChild(logArea);
 var llmPage=page('llmPage','llm','02. 외부 LLM Shot Card','시나리오를 외부 LLM에 넘겨 엄격한 JSON Shot Card를 받은 뒤 Import합니다.');llmPage.appendChild(llm);
 var internal=page('internalPage','internal','간이 자동 분할','외부 LLM 없이 현재 브라우저 내부 규칙으로 빠르게 장면을 나눕니다. 품질 검증용 보조 기능입니다.');internal.appendChild(prod);
 var batch=page('batchPage','batch','03. 일괄 이미지 생성','Import된 Shot Card를 순서대로 ComfyUI에 보내고 결과 이미지를 누적합니다.');batch.innerHTML+=guide(['LLM Shot Card 페이지에서 Import Shot JSON 완료','Generate Imported Images 실행','실패한 장면은 status에서 확인 후 재시도']);
 var preview=page('previewPage','preview','타임라인 프리뷰','생성된 이미지를 자막과 함께 시간순으로 상영합니다.');preview.innerHTML+=guide(['LLM Shot Card 페이지의 Play Preview 사용','각 장면의 자막과 이미지 일치 여부 확인','장면이 어긋나면 해당 Shot Card의 visual_prompt 수정']);
 var exp=page('exportPage','export','04. 출력 / 검수','프리뷰가 통과되면 WebM으로 내보내고, 다음 단계에서 FFmpeg 고급 편집으로 넘깁니다.');exp.innerHTML+=guide(['Export WebM 실행','생성된 webm 검수','다음 구현: pan/zoom, fade, BGM, TTS 결합']);
 [setup,single,llmPage,internal,batch,preview,exp].forEach(function(p){host.appendChild(p);});return true;
}
function page(id,name,title,desc){var d=document.createElement('section');d.id=id;d.className='studio-page';d.setAttribute('data-page',name);d.innerHTML='<div class="studio-card"><h2>'+title+'</h2><p>'+desc+'</p></div>';return d;}
function guide(items){return '<div class="studio-card"><h2>진행 체크리스트</h2>'+items.map(function(x,i){return '<p><b style="color:#00cec9">'+(i+1)+'.</b> '+x+'</p>';}).join('')+'</div>';}
function statusGrid(){var d=document.createElement('div');d.className='studio-card';d.innerHTML='<h2>현재 목표</h2><div class="studio-step-grid"><div class="studio-kpi"><b>1. Character</b>얼굴/복장 고정</div><div class="studio-kpi"><b>2. LLM Shot Card</b>대본 충실 프롬프트</div><div class="studio-kpi"><b>3. Timeline</b>이미지+자막 프리뷰</div></div>';return d;}
function showPage(name){
 document.querySelectorAll('.studio-page').forEach(function(p){p.classList.toggle('active',p.getAttribute('data-page')===name);});
 document.querySelectorAll('.workflow-child').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-page')===name);});
 var map={setup:'참조 이미지/모델 준비',single:'단일 이미지 검증',llm:'외부 LLM으로 Shot Card 생성/Import',internal:'간이 자동 분할 보조 기능',batch:'일괄 이미지 생성',preview:'타임라인 눈검수',export:'WebM 출력'};var desc=q('studioDesc');if(desc){desc.textContent=map[name]||'';}
}
function boot(){document.body.classList.add('studio-mode');css();makeMenu();makeHost();var tries=0;var timer=setInterval(function(){tries++;if(moveIntoPages()||tries>30){clearInterval(timer);showPage('llm');if(tries<=30){log('studio_layout.js loaded: cascading workflow UI enabled');}}},300);}
setTimeout(boot,900);
})();