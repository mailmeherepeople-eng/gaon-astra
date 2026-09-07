const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const report={};try{
for(const mobile of [false,true]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?3:1});
 await page.goto('http://127.0.0.1:8773');await page.locator('#beginVillage').click();await page.waitForTimeout(500);
 report[mobile?'phone':'desktop']=await page.evaluate(()=>{
  const all=[];scene.traverse(m=>{if(m.isInstancedMesh)all.push(m);});
  const visible=m=>{for(let p=m;p;p=p.parent)if(!p.visible)return false;return true;};
  const count={revision:THREE.REVISION,total:all.length,cullingOff:all.filter(m=>!m.frustumCulled).length,visible:all.filter(visible).length,canopies:all.filter(m=>m.instanceMatrix.count===2100).length,leafInstances:all.filter(m=>m.instanceMatrix.count===2100).reduce((n,m)=>n+m.count,0),shadows:renderer.shadowMap.enabled,shadowSize:sun.shadow.mapSize.x};
  const state={gardenVisible:garden.visible,gardenPosition:garden.position.toArray(),hiddenBlockers:camBlockers.filter(m=>!m.visible).map(m=>({position:m.position.toArray(),name:m.name}))};
  const metrics=()=>{renderer.render(scene,camera);return{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};};
  const startBefore=metrics();
  // r128 culls by geometry.boundingSphere. Aggregate each instance transform in object-local space.
  const originals=[];for(const m of all){const g=m.geometry;g.computeBoundingSphere();originals.push([m,g,m.frustumCulled]);const bounds=new THREE.Box3().makeEmpty(),mat=new THREE.Matrix4(),sphere=new THREE.Sphere(),lo=new THREE.Vector3(),hi=new THREE.Vector3();for(let i=0;i<m.count;i++){m.getMatrixAt(i,mat);sphere.copy(g.boundingSphere).applyMatrix4(mat);lo.copy(sphere.center).addScalar(-sphere.radius);hi.copy(sphere.center).addScalar(sphere.radius);bounds.expandByPoint(lo);bounds.expandByPoint(hi);}const copy=g.clone();copy.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());m.geometry=copy;m.frustumCulled=true;}
  const startAfter=metrics();for(const [m,g,flag]of originals){m.geometry.dispose();m.geometry=g;m.frustumCulled=flag;}
  S.player.x=1110;S.player.y=805;cam.dist=7;cam.pitch=.3;cam.yaw=0;for(let i=0;i<30;i++)sync();const pump=metrics();
  return{count,state,startBefore,startAfter,pump};
 });await page.close();
}
const p=await browser.newPage({viewport:{width:900,height:400}});await p.goto('http://127.0.0.1:8773');await p.locator('#beginVillage').click();
report.shortDesktop=await p.evaluate(()=>{showPrompt('audit','<h4>A neighbour</h4><p>Choose an action.</p><button>Talk</button>');const r=promptEl.getBoundingClientRect();return{x:r.x,width:r.width,right:r.right,viewport:innerWidth};});
report.garden=await p.evaluate(()=>({visible:garden.visible,jobExists:VillageLife.jobs.some(j=>j.id==='garden')}));
await p.evaluate(()=>{S.happy=0;tick(.01);});report.gameOver={before:await p.locator('#again').count()};await p.locator('#again').click();await p.locator('#beginVillage').click();await p.waitForTimeout(350);report.gameOver.after=await p.locator('#again').count();report.gameOver.happy=await p.evaluate(()=>S.happy);await p.close();
const intro=await browser.newPage();await intro.goto('http://127.0.0.1:8773');report.unstarted={before:await intro.evaluate(()=>localStorage.getItem('gaon-astra-village-v2'))};await intro.reload();report.unstarted.after=await intro.evaluate(()=>({saved:!!localStorage.getItem('gaon-astra-village-v2'),label:document.getElementById('beginVillage').textContent}));await intro.close();
const err=await browser.newPage();await err.goto('http://127.0.0.1:8773');await err.locator('#beginVillage').click();const errors=[];err.on('pageerror',e=>errors.push(e.message));await err.evaluate(()=>{const old=tick;tick=()=>{throw new Error('audit-controlled-tick-failure');};setTimeout(()=>{tick=old;},350);});await err.waitForTimeout(500);report.frameErrors={count:errors.length,visibleBanner:await err.locator('[role="alert"]').count()};await err.close();
}finally{fs.writeFileSync('audits/merged-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
