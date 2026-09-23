const assert=require('node:assert/strict');
const {layout}=require('./src/chart-layout');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const width of [220,320,840])for(const hour of [0,.001,1,24,72,167.999,168]){
  const g=layout(width,hour);
  close(g.start,54);close(g.end,width-10);
  close(g.oldX,g.start+(g.end-g.start)*hour/168);
  close(g.points[0].center,g.start);close(g.points.at(-1).center,g.end);
  const spacing=g.points[1].center-g.points[0].center;
  g.points.forEach((p,i)=>{assert.ok(p.width>0);close(p.width,g.points[0].width);close(p.center,g.start+(g.end-g.start)*p.hour/168);if(i){close(p.center-g.points[i-1].center,spacing);assert.ok(g.points[i-1].center+g.points[i-1].width/2<p.center-p.width/2);}});
}
console.log('Chart geometry: equal widths and spacing, no overlaps, exact renewal time scale.');
