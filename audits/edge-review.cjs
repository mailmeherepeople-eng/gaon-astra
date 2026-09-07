const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const fs=require('node:fs');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge'});const out={};try{
let p=await b.newPage({viewport:{width:568,height:320},hasTouch:true,isMobile:true});await p.goto('http://127.0.0.1:8773');await p.locator('#beginVillage').click();
out.dialogue=await p.evaluate(()=>{S.phase='night';S.problems=[{k:'sick'}];const line=proposals().find(p=>p.id==='doctor').why;const who=S.villagers[0];who.x=S.player.x+20;who.y=S.player.y-15;speak(who,line,null,true);sync();updateSpeech();const r=speechBubble.getBoundingClientRect(),j=document.getElementById('jumpBtn').getBoundingClientRect();return{line,height:r.height,bottom:r.bottom,overlapJump:r.x<j.right&&r.right>j.x&&r.y<j.bottom&&r.bottom>j.y};});
await p.close();
p=await b.newPage();await p.addInitScript(()=>localStorage.setItem('gaon-astra-village-v2',JSON.stringify({v:2,state:{done:[]},sim:{buildings:[]}})));const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8773');await p.waitForTimeout(700);out.incompleteSave={errors:errs,hasStart:await p.locator('#beginVillage').count()};await p.close();
p=await b.newPage();await p.goto('http://127.0.0.1:8773');await p.locator('#beginVillage').click();
out.population=await p.evaluate(()=>{const before=S.villagers.length;S.phase='night';S.problems=[{k:'sick',x:1040,y:900,t:11,said:true}];updateProblems(.1);return{before,pop:S.pop,agents:S.villagers.length};});
out.noticeboard=await p.evaluate(()=>{S.player.x=1210;S.player.y=887;S.talking=null;tick(.01);return{prompt:document.getElementById('prompt').textContent,legacyNearby:astraNearby(S.player,false),legacyVisit:typeof window.PumpCorner,visitCorner:!!document.getElementById('visitCorner')};});
out.roles=await p.evaluate(()=>({initialNareshAgent:S.villagers.some(v=>v.n==='Naresh'),initialKamlaAgent:S.villagers.some(v=>v.n==='Kamla Devi'),initialPrakashAgent:S.villagers.some(v=>v.n==='Prakash')}));
await p.close();
}finally{fs.writeFileSync('audits/edge-findings.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));await b.close();}})();
