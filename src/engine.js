'use strict';
(function(root){
  function calculate({remaining,redeemAt,naturalAt}){
    if(!Number.isFinite(remaining)||remaining<0||remaining>100)throw new Error('剩余额度应在 0% 到 100% 之间。');
    if(!Number.isFinite(redeemAt)||!Number.isFinite(naturalAt))throw new Error('请填写两个重置时间。');
    const hours=(naturalAt-redeemAt)/3600000;
    if(hours<0||hours>168)throw new Error('自然重置应在使用重置之后，且相隔不超过 7 天。');
    // User-selected valuation model: replenishment minus the price of the
    // delayed renewal. Full consumption is assumed, not capped by time left.
    const extra=1-remaining/100;
    const newNaturalAt=redeemAt+168*3600000;
    const delayHours=(newNaturalAt-naturalAt)/3600000;
    const netExtra=extra-delayHours/168;
    const replenishedValues=[20,100,200].map(price=>extra*price*7/30);
    const delayCosts=[20,100,200].map(price=>delayHours/24*price/30);
    const values=replenishedValues.map((value,i)=>Math.abs(value-delayCosts[i])<1e-10?0:value-delayCosts[i]);
    return{hours,extra,netExtra,newNaturalAt,delayHours,replenishedValues,delayCosts,values};
  }
  // Both alternatives use up each allowance by their own renewal, illustrated
  // with a linear drawdown. A manual reset starts a new seven-day window.
  function quotaAt({remaining,hours},elapsedHours){
    const phase=elapsedHours%168;
    const reset=100*(1-phase/168);
    const wait=elapsedHours<hours?remaining*(1-elapsedHours/hours):100*(1-((elapsedHours-hours)%168)/168);
    return{reset:Math.max(0,Math.min(100,reset)),wait:Math.max(0,Math.min(100,wait))};
  }
  root.ResetMath={calculate,quotaAt};if(typeof module!=='undefined')module.exports=root.ResetMath;
})(typeof globalThis!=='undefined'?globalThis:this);
