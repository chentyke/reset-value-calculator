'use strict';
const $=id=>document.getElementById(id),HOUR=3600000,CIRC=2*Math.PI*51;
const localDate=t=>{const d=new Date(t);return new Date(t-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
const now=()=>Math.floor(Date.now()/60000)*60000;
$('redeemAt').value=localDate(now());$('naturalAt').value=localDate(now()+72*HOUR);
let lastResult=null,dragging=false,dragValue=0;
let selectedStart=0,selectedNaturalDays=3;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let visual={remaining:8,hours:72},velocity={remaining:0,hours:0},frame=0,previousFrame=0;
$('dialTicks').innerHTML=Array.from({length:40},(_,i)=>{const a=i/40*Math.PI*2-Math.PI/2;return `<line x1="${62+59*Math.cos(a)}" y1="${62+59*Math.sin(a)}" x2="${62+61*Math.cos(a)}" y2="${62+61*Math.sin(a)}" stroke="#505057" stroke-width="1"/>`;}).join('');
document.querySelectorAll('.shortcuts,.quota-presets').forEach(group=>{const pill=document.createElement('span');pill.className='active-pill';pill.setAttribute('aria-hidden','true');group.prepend(pill);});
function syncPills(){document.querySelectorAll('.shortcuts,.quota-presets').forEach(group=>{const active=group.querySelector('button.active'),pill=group.querySelector('.active-pill');pill.classList.toggle('visible',!!active);if(active){pill.style.width=active.offsetWidth+'px';pill.style.height=active.offsetHeight+'px';pill.style.transform=`translate(${active.offsetLeft-3}px,${active.offsetTop-3}px)`;}});}
function setAmount(id,value){
  const el=$(id),negative=value<-.005,formatted=Math.abs(value).toFixed(2);
  el.setAttribute('aria-label',(negative?'-':'')+formatted+' 美元');el.classList.toggle('negative',negative);
  const shape=(negative?'-':'')+formatted.replace(/\d/g,'#');
  if(el.dataset.shape!==shape){el.dataset.shape=shape;el.innerHTML=(negative?'<span class="amount-sign" aria-hidden="true">−</span>':'')+'<span class="currency" aria-hidden="true">$</span>'+[...formatted].map(c=>c==='.'?'<span class="decimal" aria-hidden="true">.</span>':'<span class="digit-window" aria-hidden="true"><span class="digit-strip">'+Array.from({length:10},(_,i)=>'<span>'+i+'</span>').join('')+'</span></span>').join('');}
  const digits=[...formatted].filter(c=>/\d/.test(c));
  requestAnimationFrame(()=>el.querySelectorAll('.digit-strip').forEach((d,i)=>d.style.setProperty('--digit',digits[i])));
}
function animateVisual(){
  if(!lastResult)return;
  if(reducedMotion.matches){visual={remaining:lastResult.remaining,hours:lastResult.hours};renderVisual();return;}
  if(!frame){previousFrame=performance.now();frame=requestAnimationFrame(tick);}
}
function tick(timestamp){
  if(!lastResult){frame=0;return;}
  const dt=Math.min((timestamp-previousFrame)/1000,.032);previousFrame=timestamp;let moving=false;
  for(const key of ['remaining','hours']){const diff=lastResult[key]-visual[key];velocity[key]+=(230*diff-29*velocity[key])*dt;visual[key]+=velocity[key]*dt;if(Math.abs(diff)>.006||Math.abs(velocity[key])>.025)moving=true;else{visual[key]=lastResult[key];velocity[key]=0;}}
  renderVisual();frame=moving?requestAnimationFrame(tick):0;
}
function renderVisual(){const v=Math.max(0,Math.min(100,visual.remaining));$('dialArc').style.strokeDasharray=`${CIRC*v/100} ${CIRC}`;const a=v/100*Math.PI*2-Math.PI/2;$('dialThumb').setAttribute('cx',String(62+51*Math.cos(a)));$('dialThumb').setAttribute('cy',String(62+51*Math.sin(a)));draw();}

function read(){return{remaining:$('remaining').value.trim()===''?NaN:Number($('remaining').value),redeemAt:new Date($('redeemAt').value).getTime(),naturalAt:new Date($('naturalAt').value).getTime()};}
function setQuota(value){$('remaining').value=String(Math.max(0,Math.min(100,Math.round(value))));update();}
function update(){
  ResetTimePicker.sync();
  const c=read(),v=Number.isFinite(c.remaining)?Math.max(0,Math.min(100,c.remaining)):0;
  $('remaining').style.setProperty('--quota-digits',Math.max(1,$('remaining').value.length));
  $('dial').setAttribute('aria-valuenow',String(v));$('dial').setAttribute('aria-valuetext',v+'% 周额度剩余');
  document.querySelectorAll('[data-quota]').forEach(b=>{const active=Number(b.dataset.quota)===c.remaining;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-days]').forEach(b=>{const active=selectedNaturalDays===Number(b.dataset.days);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  try{
    document.querySelectorAll('.time-card:not(.natural) .shortcuts button').forEach(b=>{const offset=b.dataset.shift?Number(b.dataset.shift):0;const active=selectedStart===offset;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});syncPills();
    const r=ResetMath.calculate(c);lastResult={...r,remaining:c.remaining};$('error').hidden=true;
    ['plus','pro5','pro20'].forEach((id,i)=>{setAmount(id,r.values[i]);$(id).closest('article').title=`补回 $${r.replenishedValues[i].toFixed(2)} − 延期 ${(r.delayHours/24).toFixed(2)} 天的成本 $${r.delayCosts[i].toFixed(2)} = 净值 $${r.values[i].toFixed(2)}`;});
    $('newResetLabel').textContent=r.delayHours===0?'原 / 新自然重置':'新自然重置';
    $('beforeValue').textContent=c.remaining+'%';$('restored').textContent='+'+Math.round((100-c.remaining)*10)/10+'%';
    animateVisual();
  }catch(e){lastResult=null;['plus','pro5','pro20'].forEach(id=>{$(id).textContent='—';delete $(id).dataset.shape;$(id).removeAttribute('aria-label');});$('error').textContent=e.message;$('error').hidden=false;$('beforeValue').textContent='—';$('restored').textContent='—';$('chart').innerHTML='<title id="chartTitle">请修正输入后查看额度图表</title>';}
}
function draw(){
  if(!lastResult)return;
  const r={remaining:Math.max(0,Math.min(100,visual.remaining)),hours:Math.max(0,Math.min(168,visual.hours))};
  const W=Math.max(220,$('plot').clientWidth),H=Math.max(50,$('plot').clientHeight),T=25,B=H-9;
  const geometry=ResetChart.layout(W,r.hours),{left:L,start:J,end:R,oldX}=geometry;
  const y=v=>T+(100-v)/100*(B-T);
  $('chart').setAttribute('viewBox',`0 0 ${W} ${H}`);
  const dates=read(),dateLabel=t=>new Date(t).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
  let s=`<title id="chartTitle">橙色为使用重置，灰色为等待自然重置；两者柱高分别表示剩余额度，不相加。原自然重置：${dateLabel(dates.naturalAt)}。使用重置后新自然重置：${dateLabel(lastResult.newNaturalAt)}，推迟 ${(lastResult.delayHours/24).toFixed(2)} 天。各自周期内按均匀使用示意。</title>`;
  s+='<defs><linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffa77f"/><stop offset="100%" stop-color="#f17646"/></linearGradient><linearGradient id="grayFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a0a0ac"/><stop offset="100%" stop-color="#60606b"/></linearGradient></defs>';
  for(const v of [100,50,0]){if(H<95&&v===50)continue;s+=`<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#36363b" stroke-dasharray="3 5"/><text x="${L-7}" y="${y(v)+4}" text-anchor="end">${v}%</text>`;}
  for(const {hour:elapsed,center,width:bar} of geometry.points){
    const {reset,wait}=ResetMath.quotaAt(r,elapsed),left=center-bar/2;
    s+=`<g data-hour="${elapsed}" data-center="${center}"><title>${(elapsed/24).toFixed(2)} 天后 · 使用重置 ${reset.toFixed(1)}% · 等待自然重置 ${wait.toFixed(1)}%</title>`;
    const layers=[{value:reset,fill:'barFill'},{value:wait,fill:'grayFill'}].sort((a,b)=>b.value-a.value);
    layers.forEach(({value,fill},layer)=>{
      const height=Math.max(0,B-y(value)),width=Math.abs(reset-wait)<.02&&layer===1?bar/2:bar;
      if(height>.01)s+=`<rect x="${left.toFixed(2)}" y="${y(value).toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" rx="${Math.min(width/2,height/2).toFixed(2)}" fill="url(#${fill})"/>`;
    });
    s+='</g>';
  }
  // The original renewal belongs only to the waiting scenario.
  if(r.hours<168-1e-8){
    const labelX=Math.max(L+34,Math.min(R-38,oldX));
    s+=`<g><title>原自然重置：${dateLabel(dates.naturalAt)}；只有等待方案在这里恢复 100%</title><line data-marker="old" x1="${oldX}" x2="${oldX}" y1="${T}" y2="${B}" stroke="#aaaab7" stroke-dasharray="3 4"/><circle cx="${oldX}" cy="${T}" r="3" fill="#bfc0ca"/><text x="${labelX}" y="11" text-anchor="middle" style="font-size:10px">原自然重置</text></g>`;
  }
  s+=`<path d="M${L},${y(r.remaining)} H${J} V${T}" fill="none" stroke="#ffa47b" stroke-width="2" stroke-linejoin="round"/><circle cx="${J}" cy="${y(r.remaining)}" r="3" fill="#b1b1bd" stroke="#171719" stroke-width="1.5"/><circle data-marker="manual" cx="${J}" cy="${T}" r="3.5" fill="#ffad88" stroke="#171719" stroke-width="1.5"/><g><title>新自然重置：${dateLabel(lastResult.newNaturalAt)}；使用重置后在这里恢复 100%</title><line data-marker="new" x1="${R}" x2="${R}" y1="${T}" y2="${B}" stroke="#ffac86" stroke-width="1.2" stroke-dasharray="3 4"/><circle cx="${R}" cy="${T}" r="3.5" fill="#ffad88" stroke="#171719" stroke-width="1.5"/></g>`;
  $('chart').innerHTML=s;
}
function naturalPreset(){const hours=(new Date($('naturalAt').value).getTime()-now())/HOUR;return [1,3,5].find(days=>Math.abs(hours-days*24)<.01)??null;}
$('remaining').addEventListener('input',update);
$('redeemAt').addEventListener('input',()=>setStart(new Date($('redeemAt').value).getTime()));
$('naturalAt').addEventListener('input',()=>{selectedNaturalDays=naturalPreset();update();});
document.querySelectorAll('[data-quota]').forEach(b=>b.addEventListener('click',()=>setQuota(Number(b.dataset.quota))));
document.querySelectorAll('[data-days]').forEach(b=>b.addEventListener('click',()=>{selectedNaturalDays=Number(b.dataset.days);$('naturalAt').value=localDate(now()+selectedNaturalDays*24*HOUR);update();}));
function setStart(t,preset=null){selectedStart=preset;if(Number.isFinite(t))$('redeemAt').value=localDate(t);update();}
$('nowButton').addEventListener('click',()=>setStart(now(),0));
document.querySelectorAll('[data-shift]').forEach(b=>b.addEventListener('click',()=>setStart(now()+Number(b.dataset.shift)*HOUR,Number(b.dataset.shift))));
function pointerValue(e){const box=$('dial').getBoundingClientRect();let angle=Math.atan2(e.clientY-(box.top+box.height/2),e.clientX-(box.left+box.width/2))+Math.PI/2;if(angle<0)angle+=Math.PI*2;return angle/(2*Math.PI)*100;}
$('dial').addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();$('dial').focus();$('dial').setPointerCapture(e.pointerId);dragging=true;dragValue=pointerValue(e);if(dragValue<2&&Number($('remaining').value)>90)dragValue=100;setQuota(dragValue);});
$('dial').addEventListener('pointermove',e=>{if(!dragging)return;let v=pointerValue(e);if(dragValue>85&&v<15)v=100;else if(dragValue<15&&v>85)v=0;dragValue=v;setQuota(v);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('dial').addEventListener(name,()=>dragging=false);
$('dial').addEventListener('keydown',e=>{const keys={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:10,PageDown:-10};if(e.key in keys){e.preventDefault();setQuota((Number($('remaining').value)||0)+keys[e.key]);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();setQuota(e.key==='Home'?0:100);}});
new ResizeObserver(()=>{draw();syncPills();}).observe($('plot'));update();
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const tool={name:'set_reset_scenario',title:'计算重置价值',description:'设置 0–100% 剩余周额度、使用重置时间和原自然重置时间，计算扣除延期成本后的套餐净值；仅计算。',inputSchema:{type:'object',properties:{remaining:{type:'number',minimum:0,maximum:100},redeemAt:{type:'string',description:'本地时间 YYYY-MM-DDTHH:mm'},naturalAt:{type:'string',description:'本地时间 YYYY-MM-DDTHH:mm'}},required:['remaining','redeemAt','naturalAt'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['remaining','redeemAt','naturalAt'].includes(k)))throw new Error('参数无效');
    if(typeof input.remaining!=='number'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.redeemAt)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.naturalAt))throw new Error('参数格式无效');
    const result=ResetMath.calculate({remaining:input.remaining,redeemAt:new Date(input.redeemAt).getTime(),naturalAt:new Date(input.naturalAt).getTime()});
    for(const id of ['remaining','redeemAt','naturalAt'])$(id).value=String(input[id]);selectedStart=[0,6,24].find(offset=>Math.abs(new Date(input.redeemAt).getTime()-now()-offset*HOUR)<1000)??null;selectedNaturalDays=naturalPreset();update();return result;
  }};
  try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
}
