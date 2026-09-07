/* All live dialogue shares one speaker-anchored bubble, indoors and outside. */
const speechBubble=document.createElement('aside');
speechBubble.id='speechBubble';
speechBubble.className='speech-bubble hidden';
speechBubble.setAttribute('role','status');
speechBubble.setAttribute('aria-live','polite');
speechBubble.setAttribute('aria-atomic','true');
const speechName=document.createElement('strong'),speechLine=document.createElement('p');
speechBubble.append(speechName,speechLine);document.body.appendChild(speechBubble);
const speechPoint=new THREE.Vector3();
let speechSize=null,speechViewport='';
addEventListener('resize',()=>{speechSize=null;});
if(document.fonts)document.fonts.ready.then(()=>{speechSize=null;});
function updateSpeech(){
  const talk=S.talking;
  if(!talk||S.paused||S.transition||S.asleep){speechBubble.classList.add('hidden');return;}
  if(speechName.textContent!==talk.who.n){speechName.textContent=talk.who.n;speechSize=null;}
  if(speechLine.textContent!==talk.line){speechLine.textContent=talk.line;speechSize=null;}
  const a=talk.anchor;
  if(a)speechPoint.set(a.x,a.y,a.z);
  else if(talk.who.x!==undefined){const x=U(talk.who.x),z=U(talk.who.y);speechPoint.set(x,groundY(x,z)+2.1,z);}
  else speechPoint.copy(playerMesh.position).add(new THREE.Vector3(0,2.1,0));
  camera.updateMatrixWorld();speechPoint.project(camera);
  speechBubble.classList.remove('hidden');
  const viewport=innerWidth+'x'+innerHeight;
  if(!speechSize||speechViewport!==viewport){speechSize=speechBubble.getBoundingClientRect();speechViewport=viewport;}
  const rect=speechSize,margin=12;
  const x=(speechPoint.x+1)*innerWidth/2,y=(1-speechPoint.y)*innerHeight/2;
  const left=Math.max(margin,Math.min(innerWidth-rect.width-margin,x-rect.width/2));
  const top=Math.max(hudBottom+16,Math.min(innerHeight-rect.height-170,y-rect.height-16));
  speechBubble.style.left=left+'px';speechBubble.style.top=top+'px';
  speechBubble.style.setProperty('--tail-x',Math.max(18,Math.min(rect.width-18,x-left))+'px');
  // If the speaker is off-camera, retain the named line without a misleading tail.
  speechBubble.classList.toggle('off-camera',speechPoint.z>1||x<0||x>innerWidth||y<0||y>innerHeight);
}
