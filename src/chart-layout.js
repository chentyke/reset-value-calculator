'use strict';
(function(root){
  function layout(width,oldHours){
    const left=36,start=left+18,end=width-10;
    const count=Math.max(24,Math.min(52,Math.floor((end-start)/11)));
    const step=168/(count-1),x=hours=>start+(end-start)*hours/168;
    const event=Math.max(0,Math.min(168,oldHours));
    // Keep the sampling grid uniform. Renewal markers use the same continuous
    // time scale without inserting, shifting, or resizing any columns.
    const hours=Array.from({length:count},(_,i)=>i*step);
    const nominal=(end-start)/(count-1)*.64;
    const points=hours.map(hour=>({hour,center:x(hour),width:nominal}));
    return{left,start,end,oldX:x(event),points};
  }
  root.ResetChart={layout};if(typeof module!=='undefined')module.exports=root.ResetChart;
})(typeof globalThis!=='undefined'?globalThis:this);
