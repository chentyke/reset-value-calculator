'use strict';
(function(root){
  function resolveDate(day,hours,minutes,reference){
    if(!Number.isInteger(day)||day<1||day>31)throw new Error('日期应为 1 到 31 日');
    if(!Number.isInteger(hours)||hours<0||hours>23)throw new Error('小时应为 0 到 23');
    if(!Number.isInteger(minutes)||minutes<0||minutes>59)throw new Error('分钟应为 0 到 59');
    const base=new Date(reference);
    if(!Number.isFinite(base.getTime()))throw new Error('参考日期无效');
    base.setHours(0,0,0,0);
    for(let offset=0;offset<13;offset++){
      const candidate=new Date(base.getFullYear(),base.getMonth()+offset,day,hours,minutes);
      if(candidate.getDate()===day&&candidate>=base)return candidate;
    }
    throw new Error('无法推算日期');
  }
  root.ResetDate={resolveDate};
  if(typeof module!=='undefined')module.exports=root.ResetDate;
})(typeof globalThis!=='undefined'?globalThis:this);
