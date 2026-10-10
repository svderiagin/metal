import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
// Evaluate only our own editable TypeScript data, never downloaded code.
export function readProjectData(file,cache=new Map()){
 const absolute=path.resolve(file);
 if(cache.has(absolute))return cache.get(absolute);
 const dataModule={exports:{}};cache.set(absolute,dataModule.exports);
 const js=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,resolveJsonModule:true,esModuleInterop:true}}).outputText;
 const require=(name)=>{
  let p=name.startsWith('@/')?path.resolve(name.slice(2)):path.resolve(path.dirname(absolute),name);
  if(p.endsWith('.json'))return JSON.parse(fs.readFileSync(p,'utf8'));
  if(fs.existsSync(p+'.ts'))p+='.ts';else p=path.join(p,'index.ts');
  return readProjectData(p,cache);
 };
 vm.runInNewContext(js,{module:dataModule,exports:dataModule.exports,require,console},{filename:absolute});
 return dataModule.exports;
}
