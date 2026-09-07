const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results={};
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function fresh(){await page.goto(process.env.ASTRA_URL||'http://127.0.0.1:8773');await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#beginVillage').click();}
 try{
 await fresh();await page.waitForTimeout(300);
 await page.screenshot({path:'audits/first-minute.png'});
 results.intro={resources:await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').pop(),bytes:r.transferSize,duration:Math.round(r.duration)}))),controls:await page.evaluate(()=>({runTouch:!!document.querySelector('#runBtn'),zoomTouch:!!document.querySelector('#zoomBtn'),villagers:S.villagers.length,residentNaresh:Object.values(S.res).some(v=>v?.n==='Naresh')}))};
 results.sleep=await page.evaluate(()=>{S.phase='night';S.sabhaDone=true;S.t=S.nightLen-.1;sleep(false);step(.2);return{phase:S.phase,asleep:S.asleep,sleepOverlay:!document.getElementById('sleep').classList.contains('hidden')};});
 await page.screenshot({path:'audits/sleep-at-dawn.png'});
 await fresh();results.pointerCancel=await page.evaluate(()=>{const b=document.getElementById('act');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:11}));b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerType:'touch',pointerId:11}));return{acting,actEdge};});
 await fresh();results.nightElection=await page.evaluate(()=>{VillageLife.state.done.push('water','litter','feed','truck','garden');VillageLife.election();document.getElementById('voteResult').click();return{rank:S.rank,dayLen:S.dayLen,nightLen:S.nightLen,home:S.homeId};});
 await page.locator('#memberGo').click();
 results.petitions=await page.evaluate(()=>{S.rank=2;openPlan();const plot=PLOTS.find(p=>p.id==='police');planApi.select(plot);document.getElementById('sideB').click();planApi.select(plot);const pendingButton={label:document.getElementById('sideB').textContent,disabled:document.getElementById('sideB').disabled,hidden:document.getElementById('sideB').classList.contains('hidden')};if(!pendingButton.hidden&&!pendingButton.disabled)document.getElementById('sideB').click();return{pendingButton,count:S.petitions.filter(p=>p.id==='police').length};});
 results.plannerMap=await page.evaluate(()=>{const rect=document.getElementById('mapc').getBoundingClientRect();return{width:rect.width,height:rect.height,plotHitRadiusCss:80*rect.width/2250};});
 await page.screenshot({path:'audits/planner-phone.png'});
 // The planner installs an observer per visit; track whether removed canvases stay observed.
 await page.evaluate(()=>{closeScreen();window.auditObservers=[];const Native=ResizeObserver;window.ResizeObserver=class extends Native{constructor(cb){super(cb);auditObservers.push(this);this.observing=[];}observe(el){this.observing.push(el);super.observe(el);}disconnect(){this.observing=[];super.disconnect();}};for(let i=0;i<5;i++){openPlan();closeScreen();}});
 results.plannerObservers=await page.evaluate(()=>({observers:auditObservers.length,detachedObserved:auditObservers.reduce((n,o)=>n+o.observing.filter(el=>!el.isConnected).length,0)}));
 await fresh();
 results.memory=await page.evaluate(()=>{const sample=()=>{renderer.render(scene,camera);return renderer.info.memory.geometries;};const before=sample();for(let i=0;i<12;i++){VillageLife.state.carry=null;S.player.x=1230;S.player.y=1030;VillageLife.interact(S.player,true);sample();const cow=cows[0];S.player.x=cow.position.x*10;S.player.y=cow.position.z*10;VillageLife.interact(S.player,true);sample();}return{before,after:sample()};});
 await fresh();
 results.saveClaim=await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};document.getElementById('mobileMenu').click();return{menu:document.querySelector('.card').textContent.includes('Village saved')};});
 // Smallest landscape: speech must fit below the HUD without covering controls.
 await page.setViewportSize({width:568,height:320});await fresh();
 await page.evaluate(()=>{speak(S.villagers[0],Array(55).fill('Village').join(' '),null,true);});await page.waitForTimeout(400);
 results.longSpeech=await page.evaluate(()=>{const r=document.getElementById('speechBubble').getBoundingClientRect();const j=document.getElementById('jumpBtn').getBoundingClientRect();return{bubble:{x:r.x,y:r.y,w:r.width,h:r.height},viewport:{w:innerWidth,h:innerHeight},overflows:r.bottom>innerHeight,overlapJump:r.x<j.right&&r.right>j.x&&r.y<j.bottom&&r.bottom>j.y};});
 await page.screenshot({path:'audits/long-speech-landscape.png'});
 results.errors=errors;
 }finally{fs.writeFileSync('audits/runtime-findings.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
