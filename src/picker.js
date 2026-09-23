'use strict';
(function(){
  const pad=value=>String(value).padStart(2,'0');
  const pickers=[];
  for(const id of ['redeemAt','naturalAt']){
    const field=document.getElementById(id);
    const mount=document.getElementById(id+'Picker');
    const label=id==='redeemAt'?'使用重置的时间':'原自然重置时间';
    mount.innerHTML=`<div class="time-picker" role="group" aria-label="${label}">
      <label class="time-part"><input aria-label="${label}的日" inputmode="numeric" pattern="[0-9]*" maxlength="2" type="text"><span>日</span></label>
      <label class="time-part"><input aria-label="${label}的时" inputmode="numeric" pattern="[0-9]*" maxlength="2" type="text"><span>时</span></label>
      <label class="time-part"><input aria-label="${label}的分" inputmode="numeric" pattern="[0-9]*" maxlength="2" type="text"><span>分</span></label>
    </div>`;
    const group=mount.firstElementChild;
    const inputs=[...group.querySelectorAll('input')];
    let shown='';
    function sync(){
      if(shown===field.value)return;
      const date=new Date(field.value);
      if(!Number.isFinite(date.getTime()))return;
      [date.getDate(),date.getHours(),date.getMinutes()].forEach((value,index)=>{
        inputs[index].value=index===0?String(value):pad(value);
      });
      shown=field.value;
    }
    function commit(){
      const date=new Date(field.value);
      if(!Number.isFinite(date.getTime()))return;
      const fallback=[date.getDate(),date.getHours(),date.getMinutes()];
      const limits=[31,23,59];
      const parts=inputs.map((input,index)=>{
        const value=input.value===''?fallback[index]:Number(input.value);
        return Math.max(index===0?1:0,Math.min(limits[index],value));
      });
      try{
        const reference=id==='redeemAt'?new Date():new Date(document.getElementById('redeemAt').value);
        const chosen=ResetDate.resolveDate(...parts,reference);
        shown=`${chosen.getFullYear()}-${pad(chosen.getMonth()+1)}-${pad(chosen.getDate())}T${pad(chosen.getHours())}:${pad(chosen.getMinutes())}`;
        field.value=shown;
        shown='';
        sync();
        field.dispatchEvent(new Event('input',{bubbles:true}));
      }catch(error){
        shown='';
        sync();
      }
    }
    inputs.forEach((input,index)=>{
      input.addEventListener('focus',()=>input.select());
      input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'');});
      input.addEventListener('keydown',event=>{
        if(event.key!=='Enter')return;
        event.preventDefault();
        if(index<inputs.length-1)inputs[index+1].focus();
        else input.blur();
      });
    });
    group.addEventListener('focusout',event=>{
      if(!group.contains(event.relatedTarget))commit();
    });
    pickers.push(sync);
  }
  window.ResetTimePicker={sync:()=>pickers.forEach(picker=>picker())};
  window.ResetTimePicker.sync();
})();
