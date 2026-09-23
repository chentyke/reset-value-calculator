const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'src');
const output=path.join(root,'dist');
fs.mkdirSync(output,{recursive:true});
for(const file of ['index.html','style.css','resolve-date.js','picker.js','engine.js','chart-layout.js','app.js']){
  fs.copyFileSync(path.join(source,file),path.join(output,file));
}
