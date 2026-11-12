(()=>{
'use strict';
const data=window.RHJ_DATA;
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=s=>String(s||'').replace(/\.(mp4|jpg|jpeg|png|pdf)$/i,'').replace(/\s+/g,' ').replace(/\bpost\b$/i,'').replace(/\s+(final|last|updated|v\d+)$/i,'').trim();
const vids=data.rows.filter(x=>x.kind==='video');
const featured=vids.filter(x=>x.featured).sort((a,b)=>a.order-b.order);
const remaining=vids.filter(x=>!x.featured);
const posters=data.rows.filter(x=>x.kind==='post');
const graphics=data.rows.filter(x=>x.kind==='graphic'&&x.file);
const printables=data.rows.filter(x=>x.kind==='print');
const printablePreview=printables.filter(x=>x.file&&!x.privateReview);
const brand=s=>{s=s.toLowerCase();if(/furas/.test(s))return 'Furas Makkah';if(/lala/.test(s))return 'LALA';if(/trip.?planner|trip planner/.test(s))return 'Trip Planner';if(/true journey|journey/.test(s))return 'True Journey';if(/umrah|nafrah/.test(s))return 'Umrah';if(/greece|dubai|tour|egypt|schengen|visa|travel|hotel/.test(s))return 'Travel';return 'Other'};
let modalList=[],modalPosition=0,modalImages=[];
const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('inView');observer.unobserve(e.target)}}),{threshold:.08}):null;
function reveal(){if(observer)$$('.reveal').forEach(x=>observer.observe(x));else $$('.reveal').forEach(x=>x.classList.add('inView'))}
// YouTube-inspired in-place playback; original design and gallery structure are unchanged.
const hoverTime=new Map();
let hoverDelay=null;
const canHover=matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId=new Map(vids.map(v=>[v.id,v]));
const levels=v=>Object.keys(v.qualities||{}).sort((a,b)=>parseInt(b,10)-parseInt(a,10));
const bestAuto=v=>{
 const supported=levels(v);
 if(!supported.length)return null;
 const slow=navigator.connection?.saveData||['slow-2g','2g','3g'].includes(navigator.connection?.effectiveType);
 return slow?(supported.find(n=>parseInt(n,10)<=720)||supported.at(-1)):(supported.find(n=>parseInt(n,10)<=1080)||supported[0]);
};
function videoCard(v,featuredCard=false,i=0){
 const title=pretty(v.name),available=!!levels(v).length;
 const img=v.file?`<img loading="lazy" decoding="async" src="${esc(v.file)}" alt="Original film frame: ${esc(title)}">`:`<div class="cardUnavailable"><strong>${esc(title)}</strong><small>FULL ORIGINAL UNAVAILABLE</small></div>`;
 const action=available?'LONG HOVER TO PREVIEW · CLICK TO PLAY':'MASTER FILE PENDING';
 if(featuredCard)return `<article class="reelCard tilt${available?'':' mediaPending'}" tabindex="0" role="button" aria-label="Play ${esc(title)}" data-open="video" data-id="${esc(v.id)}">${img}<span class="reelIndex">FILM / ${String(i+1).padStart(2,'0')}</span><span class="reelPlay" aria-hidden="true">▶</span><span class="hoverStatus">PREVIEW MUTED · CLICK TO CONTINUE</span><div class="reelText"><strong>${esc(title)}</strong><small>${esc(v.category)} · ${esc(action)}</small></div></article>`;
 return `<article class="filmCard tilt${available?'':' mediaPending'}" tabindex="0" role="button" aria-label="Play ${esc(title)}" data-open="video" data-id="${esc(v.id)}">${img}<span class="filmPlay" aria-hidden="true">▶</span><span class="hoverStatus">PREVIEW MUTED · CLICK TO CONTINUE</span><div class="filmText"><strong>${esc(title)}</strong><small>${esc(v.category)} · ${available?'PLAY HERE':'MASTER PENDING'}</small></div></article>`;
}
$('#featuredTrack').innerHTML=featured.map((v,i)=>videoCard(v,true,i)).join('');
const mediaCard=e=>e.target.closest?.('.reelCard[data-id],.filmCard[data-id]');
function pauseHover(card){
 if(!card)return;
 const video=card.querySelector('video.hoverPreview');
 if(video){if(Number.isFinite(video.currentTime))hoverTime.set(card.dataset.id,video.currentTime);video.pause();video.removeAttribute('src');video.load();video.remove();}
 card.classList.remove('isPreviewing');
}
function startHover(card){
 const v=byId.get(card.dataset.id);if(!v||!v.qualities||card.querySelector('video.hoverPreview')||viewer.classList.contains('open'))return;
 const level=v.qualities['720p']?'720p':bestAuto(v);
 if(!level)return;
 const movie=document.createElement('video');movie.className='hoverPreview';movie.muted=true;movie.loop=false;movie.playsInline=true;movie.preload='auto';movie.autoplay=true;movie.setAttribute('aria-hidden','true');
 movie.addEventListener('loadedmetadata',()=>{const t=hoverTime.get(v.id)||0;if(t>0&&t<movie.duration-.25)movie.currentTime=t;movie.play().catch(()=>{})},{once:true});
 movie.addEventListener('timeupdate',()=>{hoverTime.set(v.id,movie.currentTime)});
 movie.addEventListener('ended',()=>{hoverTime.set(v.id,0);movie.currentTime=0;movie.play().catch(()=>{})});
 card.insertBefore(movie,card.querySelector('.reelIndex,.filmPlay'));
 movie.src=v.qualities[level];card.classList.add('isPreviewing');
}
if(canHover){
 document.addEventListener('pointerover',e=>{const card=mediaCard(e);if(!card||card.contains(e.relatedTarget))return;clearTimeout(hoverDelay);hoverDelay=setTimeout(()=>{if(card.isConnected)startHover(card)},650)});
 document.addEventListener('pointerout',e=>{const card=mediaCard(e);if(!card||card.contains(e.relatedTarget))return;clearTimeout(hoverDelay);pauseHover(card)});
}
$('#featuredPrev').addEventListener('click',()=>$('#featuredTrack').scrollBy({left:-350,behavior:'smooth'}));
$('#featuredNext').addEventListener('click',()=>$('#featuredTrack').scrollBy({left:350,behavior:'smooth'}));
function buttons(list,place,fn){place.innerHTML=list.map((t,i)=>`<button type="button" class="${i===0?'active':''}" data-value="${esc(t)}">${esc(t)}</button>`).join('');place.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('button',place).forEach(n=>n.classList.toggle('active',n===b));fn()})}
const filmCats=['All',...new Set(remaining.map(v=>v.category))];
buttons(filmCats,$('#filmFilters'),renderFilms);
$('#filmSearch').addEventListener('input',renderFilms);
function renderFilms(){const cat=$('.active',$('#filmFilters'))?.dataset.value||'All';const q=$('#filmSearch').value.trim().toLowerCase();let showing=remaining.filter(v=>(cat==='All'||cat===v.category)&&(!q||v.name.toLowerCase().includes(q)));$('#filmGrid').innerHTML=showing.map(v=>videoCard(v,false)).join('');$('#filmCount').textContent=`${showing.length} OF ${remaining.length} REMAINING VIDEOS`;if(!showing.length)$('#filmGrid').innerHTML='<p class="viewerNotice">No films match this filter.</p>'}
renderFilms();
const posterCats=['All',...new Set(posters.map(x=>brand(x.name)))];
buttons(posterCats,$('#designFilters'),renderPosters);$('#designSearch').addEventListener('input',renderPosters);
function renderPosters(){const cat=$('.active',$('#designFilters'))?.dataset.value||'All';const q=$('#designSearch').value.trim().toLowerCase();const out=posters.filter(v=>(cat==='All'||cat===brand(v.name))&&(!q||v.name.toLowerCase().includes(q)));$('#postGrid').innerHTML=out.map(v=>`<figure class="posterCard tilt" role="button" tabindex="0" data-open="post" data-id="${esc(v.id)}"><img loading="lazy" decoding="async" src="${esc(v.file||'')}" alt="${esc(pretty(v.name))}"><figcaption>${esc(pretty(v.name))}<span>↗</span></figcaption></figure>`).join('');if(!out.length)$('#postGrid').innerHTML='<p class="viewerNotice">No designs match this filter.</p>'}
renderPosters();
// Concept variants stay together. Exactly one identity tile per project.
const identityGroups=Object.groupBy?Object.groupBy(graphics,x=>x.group):graphics.reduce((o,x)=>((o[x.group]??=[]).push(x),o),{});
const identities=Object.entries(identityGroups).map(([name,assets])=>({name,assets}));
$('#identityCount').textContent=`${identities.length} UNIQUE IDENTITY PROJECTS · ${graphics.length} SOURCE IMAGES`;
$('#identityGrid').innerHTML=identities.map((g,i)=>`<button class="identityCard tilt" type="button" data-open="identity" data-id="${i}" aria-label="View ${esc(g.name)} identity"><div class="identityArt"><img loading="lazy" src="${esc(g.assets[0].file)}" alt="${esc(g.name)} identity"></div><div class="identityInfo">${esc(g.name)}<small>${g.assets.length} VIEW${g.assets.length>1?'S':''} ↗</small></div></button>`).join('');
$('#printGrid').innerHTML=printablePreview.map(x=>`<article class="printCard tilt" role="button" tabindex="0" data-open="print" data-id="${esc(x.id)}"><img src="${esc(x.file)}" loading="lazy" alt="${esc(pretty(x.name))}"><div class="printName">${esc(pretty(x.name))} ↗</div></article>`).join('');
const viewer=$('#viewer'),viewerMedia=$('#viewerMedia');
let activeVideo=null;
let qualitySelection='Auto';
function formatClock(t){t=Math.max(0,Number.isFinite(t)?t:0);return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`}
function openViewer(category,id){
 modalImages=[];
 if(category==='video'){modalList=vids;modalPosition=vids.findIndex(x=>x.id===id);}
 else if(category==='post'){modalList=posters;modalPosition=posters.findIndex(x=>x.id===id);}
 else if(category==='print'){modalList=printablePreview;modalPosition=printablePreview.findIndex(x=>x.id===id);}
 else if(category==='identity'){const gr=identities[Number(id)];if(!gr)return;modalList=gr.assets.map(x=>({...x,groupTitle:gr.name}));modalPosition=0;}
 else return;
 if(modalPosition<0)return;
 let initialTime=0;
 if(category==='video'){
  const card=$(`[data-open="video"][data-id="${id}"]`);
  const preview=card?.querySelector('video.hoverPreview');
  initialTime=preview?preview.currentTime:(hoverTime.get(id)||0);
  if(card)pauseHover(card);
 }
 viewer.dataset.kind=category;viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.body.classList.add('modalOpen');
 renderViewer(initialTime);$('#viewerClose').focus();
}
function disposePlayer(){if(!activeVideo)return;const video=activeVideo;activeVideo=null;video.pause();video.removeAttribute('src');video.load();}
function renderViewer(start=0){
 const v=modalList[modalPosition];if(!v)return;
 disposePlayer();viewerMedia.replaceChildren();const kind=viewer.dataset.kind;
 $('#viewerCategory').textContent=kind==='video'?'FILM / FULL LENGTH ON SITE':kind==='post'?'HIGH-RES SOCIAL DESIGN':kind==='identity'?'VISUAL IDENTITY SYSTEM':'PRINT & SPATIAL DESIGN';
 $('#viewerTitle').textContent=kind==='identity'?v.groupTitle:pretty(v.name);
 const badge=$('#viewerSource');badge.textContent=kind==='video'?'FULL LENGTH · ON-SITE':'HIGH-RES · ON-SITE';
 if(kind==='video'){
  const available=levels(v);
  if(!available.length){$('#viewerInfo').textContent='SOURCE VIDEO NOT RECOVERED · ON-SITE PLAYBACK UNAVAILABLE';viewerMedia.innerHTML='<div class="viewerNotice"><strong>Video not yet available</strong>The original file is missing from the export. This card will play here after the master video is added to the website media folder—no Drive redirect.</div>'}
  else{const max=available[0];$('#viewerInfo').textContent=`FULL FILM · ${formatClock(v.duration||0)} · UP TO ${max.replace('p','P')} · SEEKABLE · ON-SITE`;
   createPlayer(v,start);
  }
 }else{
  $('#viewerInfo').textContent=(v.width?`ORIGINAL ${v.width} × ${v.height} · `:'')+'FULL IMAGE · ON-SITE';
  const image=document.createElement('img');image.src=v.file||'';image.alt=v.name;image.decoding='async';viewerMedia.appendChild(image);
 }
 $('#viewerPrev').style.visibility=modalList.length>1?'visible':'hidden';$('#viewerNext').style.visibility=modalList.length>1?'visible':'hidden';
}
function createPlayer(v,start=0){
 const available=levels(v);let playingDesired=true;qualitySelection='Auto';
 const player=document.createElement('section');player.className='ytPlayer';player.setAttribute('aria-label',`Full video player: ${v.name}`);
 player.innerHTML=`<video class="ytVideo" playsinline preload="metadata" aria-label="${esc(pretty(v.name))}"></video><button type="button" class="ytCentral" aria-label="Play or pause video">▶</button>
 <div class="ytControls"><input class="ytSeek" type="range" min="0" max="1000" value="0" aria-label="Seek video timeline"><div class="ytControlRow">
 <button class="ytPlay" aria-label="Pause video" title="Play/Pause (Space)">Ⅱ</button>
 <button class="ytBack" aria-label="Back ten seconds" title="Back 10 seconds">↶<small>10</small></button>
 <button class="ytForward" aria-label="Forward ten seconds" title="Forward 10 seconds">↷<small>10</small></button>
 <span class="ytClock" aria-live="off">0:00 / ${formatClock(v.duration||0)}</span><span class="ytGrow"></span>
 <button class="ytMute" aria-label="Mute or unmute">◖))</button><input class="ytVolume" type="range" min="0" max="100" value="80" aria-label="Volume">
 <label class="ytSpeedLabel">SPEED <select class="ytSpeed" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option selected value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
 <div class="ytQualityWrap"><button class="ytQuality" aria-label="Video quality settings" aria-expanded="false">⚙ <span>Auto</span></button><div class="ytQualityMenu" hidden aria-label="Available playback resolutions"></div></div>
 <button class="ytFull" aria-label="Enter fullscreen" title="Fullscreen (F)">⛶</button></div></div>`;
 viewerMedia.appendChild(player);
 const video=$('.ytVideo',player),center=$('.ytCentral',player),play=$('.ytPlay',player),seek=$('.ytSeek',player),clock=$('.ytClock',player),mute=$('.ytMute',player),volume=$('.ytVolume',player),speed=$('.ytSpeed',player),quality=$('.ytQuality',player),menu=$('.ytQualityMenu',player);
 activeVideo=video;video.poster=v.file||'';video.volume=.8;
 const level=bestAuto(v);
 function sync(){
  const d=Number.isFinite(video.duration)?video.duration:v.duration||0;
  const t=Number.isFinite(video.currentTime)?video.currentTime:0;
  seek.value=d?String(Math.round(t/d*1000)):'0';seek.style.setProperty('--seekProgress',`${seek.value/10}%`);
  clock.textContent=`${formatClock(t)} / ${formatClock(d)}`;
  play.textContent=video.paused?'▶':'Ⅱ';play.setAttribute('aria-label',video.paused?'Play video':'Pause video');
  center.classList.toggle('isHidden',!video.paused);center.textContent=video.paused?'▶':'Ⅱ';
  mute.textContent=video.muted||video.volume===0?'◖×':'◖))';
 }
 const toggle=()=>{if(video.paused){video.play().catch(()=>{})}else video.pause()};
 function seekBy(n){const d=Number.isFinite(video.duration)?video.duration:v.duration||0;video.currentTime=Math.max(0,Math.min(d,video.currentTime+n));sync()}
 function renderQualityButtons(){
  const actual=qualitySelection==='Auto'?bestAuto(v):qualitySelection;
  quality.querySelector('span').textContent=qualitySelection==='Auto'?`Auto (${actual})`:qualitySelection;
  menu.innerHTML=`<button type="button" data-quality="Auto" class="${qualitySelection==='Auto'?'chosen':''}">Auto · ${esc(bestAuto(v)||'')}</button>`+available.map(l=>`<button type="button" data-quality="${esc(l)}" class="${qualitySelection===l?'chosen':''}">${esc(l)} ${parseInt(l)>=1080?'HD':''}</button>`).join('');
 }
 function loadLevel(l,atTime,playNow){
  const url=v.qualities[l];if(!url)return;
  video.pause();video.src=url;video.preload='metadata';video.playsInline=true;
  video.addEventListener('loadedmetadata',()=>{
   try{if(Number.isFinite(video.duration)&&video.duration>0)video.currentTime=Math.max(0,Math.min(atTime,video.duration-.03));}catch(e){}
   video.playbackRate=Number(speed.value);if(playNow)video.play().catch(()=>{});sync();
  },{once:true});video.load();
 }
 play.addEventListener('click',toggle);center.addEventListener('click',toggle);video.addEventListener('click',toggle);
 video.addEventListener('timeupdate',sync);video.addEventListener('play',sync);video.addEventListener('pause',sync);video.addEventListener('durationchange',sync);
 video.addEventListener('error',()=>{if(video!==activeVideo)return;$('#viewerInfo').textContent='VIDEO COULD NOT LOAD. VERIFY THE MEDIA FILE IS INSTALLED.';sync()});
 video.addEventListener('ended',()=>{hoverTime.set(v.id,0);sync()});
 seek.addEventListener('input',()=>{const d=video.duration||v.duration||0;video.currentTime=d*Number(seek.value)/1000;sync()});
 $('.ytBack',player).addEventListener('click',()=>seekBy(-10));$('.ytForward',player).addEventListener('click',()=>seekBy(10));
 mute.addEventListener('click',()=>{video.muted=!video.muted;sync()});volume.addEventListener('input',()=>{video.volume=Number(volume.value)/100;video.muted=video.volume===0;sync()});
 speed.addEventListener('change',()=>{video.playbackRate=Number(speed.value)});
 quality.addEventListener('click',()=>{menu.hidden=!menu.hidden;quality.setAttribute('aria-expanded',String(!menu.hidden))});
 menu.addEventListener('click',e=>{const b=e.target.closest('[data-quality]');if(!b)return;const choice=b.dataset.quality;const wasPaused=video.paused,t=video.currentTime;qualitySelection=choice;menu.hidden=true;quality.setAttribute('aria-expanded','false');renderQualityButtons();loadLevel(choice==='Auto'?bestAuto(v):choice,t,!wasPaused)});
 $('.ytFull',player).addEventListener('click',()=>{if(document.fullscreenElement){document.exitFullscreen?.()}else if(player.requestFullscreen)player.requestFullscreen().catch(()=>video.webkitEnterFullscreen?.());else video.webkitEnterFullscreen?.()});
 player.seekBy=seekBy;player.togglePlayback=toggle;
 renderQualityButtons();loadLevel(level,start,playingDesired);sync();
}
function viewerNav(d){disposePlayer();modalPosition=(modalPosition+d+modalList.length)%modalList.length;renderViewer()}
function closeViewer(){disposePlayer();viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');document.body.classList.remove('modalOpen');viewerMedia.replaceChildren()}
$('#viewerPrev').addEventListener('click',()=>viewerNav(-1));$('#viewerNext').addEventListener('click',()=>viewerNav(1));$('#viewerClose').addEventListener('click',closeViewer);viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
document.addEventListener('keydown',e=>{if(!viewer.classList.contains('open'))return;if(e.key==='Escape'){closeViewer();return;}const a=document.activeElement;
 if(a?.matches('input,select,textarea'))return;
 if(viewer.dataset.kind==='video'&&activeVideo){const player=$('.ytPlayer',viewerMedia);if(e.key==='ArrowLeft'){e.preventDefault();player?.seekBy(-10)}else if(e.key==='ArrowRight'){e.preventDefault();player?.seekBy(10)}else if(e.key===' '||e.key.toLowerCase()==='k'){e.preventDefault();player?.togglePlayback()}else if(e.key.toLowerCase()==='f'){e.preventDefault();player?.requestFullscreen?.()}}
 else{if(e.key==='ArrowLeft')viewerNav(-1);if(e.key==='ArrowRight')viewerNav(1)}
});
document.addEventListener('click',e=>{const target=e.target.closest('[data-open]');if(target)openViewer(target.dataset.open,target.dataset.id)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-open]')){e.preventDefault();openViewer(e.target.dataset.open,e.target.dataset.id)}});
const nav=$('#nav'),menu=$('#menuToggle');menu.addEventListener('click',()=>{nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(nav.classList.contains('open')))});$$('.nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero=$('#heroStage');if(!reduce){document.addEventListener('pointermove',e=>{if(!hero||e.pointerType==='touch')return;const x=e.clientX/window.innerWidth-.5,y=e.clientY/window.innerHeight-.5;hero.style.setProperty('--mx',x.toFixed(3));hero.style.setProperty('--my',y.toFixed(3));const cursor=$('#cursor');cursor.style.opacity='1';cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';});document.addEventListener('mouseover',e=>$('#cursor').classList.toggle('active',!!e.target.closest('a,button,.tilt')))}
function scrollProgress(){const max=document.documentElement.scrollHeight-window.innerHeight;$('#pageProgress').style.width=`${Math.min(100,window.scrollY/Math.max(1,max)*100)}%`};document.addEventListener('scroll',scrollProgress,{passive:true});scrollProgress();
// Small hover depth to complement the breathing hero sculpture; excludes touch and reduced motion.
if(!reduce&&matchMedia('(hover:hover)').matches){document.addEventListener('pointermove',e=>{const t=e.target.closest('.tilt');if(!t)return;if(t.classList.contains('reelCard')||t.classList.contains('posterCard')||t.classList.contains('identityCard')){const r=t.getBoundingClientRect();let nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;t.style.transform=`perspective(900px) rotateX(${-ny*5}deg) rotateY(${nx*5}deg) translateZ(6px)`;}});document.addEventListener('pointerout',e=>{const t=e.target.closest('.tilt');if(t&&!t.contains(e.relatedTarget))t.style.transform=''})}
reveal();
let value=0;const pre=$('#preloader');if(reduce){pre.classList.add('hidden')}else{const started=performance.now();const progress=()=>{const elapsed=performance.now()-started;const step=Math.min(100,Math.round(100*(1-Math.pow(1-Math.min(1,elapsed/1250),2))));if(step!==value){value=step;$('#preCount').textContent=String(step).padStart(3,'0');$('#preBar').style.width=step+'%'}if(elapsed<1250)requestAnimationFrame(progress);else setTimeout(()=>pre.classList.add('hidden'),160)};requestAnimationFrame(progress)}
})();
