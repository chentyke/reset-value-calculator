const assert=require('node:assert/strict');
const {calculate,quotaAt}=require('./src/engine');
const start=Date.UTC(2026,8,22,12),hour=3600000;
const base={remaining:8,redeemAt:start,naturalAt:start+72*hour};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const r=calculate(base);
close(r.replenishedValues[2],.92*200*7/30);
close(r.delayCosts[2],4*200/30);
close(r.values[2],(.92*7-4)*200/30);
assert.equal(r.newNaturalAt,start+168*hour);
assert.equal(r.delayHours,96);
close(r.values[1],r.values[0]*5);close(r.values[2],r.values[0]*10);
// Approved example: zero quota, one day to old renewal, six days of delay.
const oneDay=calculate({...base,remaining:0,naturalAt:start+24*hour});
close(oneDay.values[2],200/30);close(oneDay.delayCosts[2],6*200/30);
// Full immediate use still replenishes 100%, even with one minute left.
const minute=calculate({...base,remaining:0,naturalAt:start+hour/60});
close(minute.replenishedValues[2],200*7/30);assert.ok(minute.values[2]<.01);
// Negative net value is preserved, not hidden behind a zero clamp.
close(calculate({...base,remaining:50,naturalAt:start+24*hour}).values[2],-2.5*200/30);
close(calculate({...base,remaining:0,naturalAt:start}).values[2],0);
close(calculate({...base,remaining:0,naturalAt:start+168*hour}).values[2],200*7/30);
close(calculate({...base,remaining:100,naturalAt:start+168*hour}).values[2],0);
close(calculate({...base,remaining:50,naturalAt:start+84*hour}).values[2],0);
// Renewal timing must be independent for the two alternatives.
const scenario={remaining:50,hours:24};
close(quotaAt(scenario,0).reset,100);close(quotaAt(scenario,0).wait,50);
assert.ok(quotaAt(scenario,24-1e-6).wait<.001);
close(quotaAt(scenario,24).wait,100);close(quotaAt(scenario,24).reset,100*6/7);
close(quotaAt(scenario,168).reset,100);close(quotaAt(scenario,168).wait,100/7);
close(quotaAt({remaining:0,hours:0},168).wait,100);
for(const change of [{remaining:NaN},{remaining:-1},{remaining:101},{naturalAt:start-1},{naturalAt:start+169*hour},{redeemAt:NaN}])assert.throws(()=>calculate({...base,...change}));
console.log('Net valuation, delay costs, signed values, and independent renewal timelines passed.');
