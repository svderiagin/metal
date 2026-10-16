import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Image from 'next/image.js';
import * as jsxRuntime from 'react/jsx-runtime';

const source=ts.transpileModule(fs.readFileSync('components/home/HeroCarousel.tsx','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,esModuleInterop:true},
}).outputText;
const componentModule={exports:{}};
const imports={
 react:React,'react/jsx-runtime':jsxRuntime,'next/image':Image,
 '@/components/layout/PageContainer':{PageContainer:({children})=>React.createElement('div',null,children)},
 '@/data/hero-slides':{AUTO_ROTATE_MS:2000},
 './HeroCarousel.module.css':{hero:'hero',photograph:'photograph',shade:'shade',control:'control'},
};
vm.runInNewContext(source,{module:componentModule,exports:componentModule.exports,require:name=>{
 assert.ok(name in imports,name);return imports[name];
}});
const {HeroCarousel}=componentModule.exports;
const slides=[1,2,3].map(n=>({id:'hero-'+n,src:'/images/hero/'+n+'.jpg'}));

test('server HTML shows the first hero photograph before hydration and requests only that slide',()=>{
 const html=renderToStaticMarkup(React.createElement(HeroCarousel,{slides},React.createElement('h1',null,'Каталог металлопроката')));
 assert.equal((html.match(/<img\b/g)??[]).length,1);
 assert.match(html,/data-active="true"/);
 assert.match(html,/loading="eager"/);
 assert.match(html,/fetchPriority="high"/i);
 assert.match(html,/Каталог металлопроката/);
 assert.doesNotMatch(html,/%2F[23]\.jpg/);
});

test('missing hero photographs leave the heading and navigation available',()=>{
 const html=renderToStaticMarkup(React.createElement(HeroCarousel,{slides:[]},React.createElement('a',{href:'/catalog'},'Перейти в каталог')));
 assert.doesNotMatch(html,/<img\b/);
 assert.match(html,/href="\/catalog"/);
 assert.doesNotMatch(html,/Предыдущая фотография|Следующая фотография/);
});
