import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readProjectData} from './project-data.mjs';

const pipe=readProjectData('lib/profilePipe.ts');
const profileSheet=readProjectData('lib/profileSheet.ts');
const {revalidateCartPrice}=readProjectData('lib/cartPricing.ts');
const catalog=readProjectData('lib/catalog.ts');
const rows=catalog.getProductVariantsByCategoryId('cat-trp').filter(pipe.isProfilePipeVariant);
const base=rows.find(p=>p.profileWidthMm===40&&p.profileHeightMm===40&&p.wallThicknessMm===2);

function evaluateModule(file,imports,globals={}) {
 const testModule={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(source,{module:testModule,exports:testModule.exports,require:name=>{assert.ok(name in imports,name);return imports[name];},...globals});return testModule.exports;
}

function setup(variant={...base,price:157,priceConfirmed:true,quoteOnly:false}) {
 let cursor=0;const state=[];const timers=[];const cart={hydrated:true,lines:[],addItem(productId,quantity,measurement,pieceOrder){assert.equal(measurement,undefined);const result=revalidateCartPrice(variant,{quantity,pieceOrder});assert.equal(result.invalidReason,undefined);cart.lines=[{productId,quantity,...result}];},removeItem(){cart.lines=[];}};
 const jsx=(type,props)=>typeof type==='function'?type(props):{type,props};
 const imports={react:{useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=value;}];},useEffect(effect){effect();}},'react/jsx-runtime':{jsx,jsxs:jsx},'@/hooks/useCart':{useCart:()=>cart},'@/components/ui/Button':{Button:'button'},'@/components/ui/Input':{Input:'input'},'@/lib/currency':readProjectData('lib/currency.ts'),'@/lib/numberFormat':readProjectData('lib/numberFormat.ts'),'@/lib/profilePipe':pipe,'./QuoteRequestButton':{QuoteRequestButton:'quote'},'./FilterPanel.module.css':{default:{}},'./RebarTable.module.css':{default:{}}};
 const {ProfilePipeVariantItem}=evaluateModule('components/catalog/ProfilePipeVariantItem.tsx',imports,{window:{setTimeout(fn){timers.push(fn);},clearTimeout(){}}});
 const nodes=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat().flatMap(nodes)];
 function render(view='table'){cursor=0;const tree=nodes(ProfilePipeVariantItem({variant,view}));return {tree,inputs:tree.filter(n=>n.type==='input').map(n=>n.props),action:tree.find(n=>['button','quote'].includes(n.type)).props,outputs:tree.filter(n=>n.type==='output').map(n=>n.props)};}
 return {cart,timers,render,change(index,value){render().inputs[index].onChange({target:{value}});}};
}

test('profile table recalculates 2 pipes into 12 metres and 1884 rubles, replaces the cart line and removes zero',()=>{
 const h=setup();assert.equal(h.render().action.disabled,true);h.change(0,'2');assert.equal(h.render().inputs[0].step,1);assert.equal(h.render().outputs[0].children,'12');assert.equal(h.render().outputs[1].children.replace(/\s/gu,''),'1884,00₽');
 h.render().action.onClick();assert.equal(h.cart.lines[0].quantity,12);assert.equal(h.cart.lines[0].pieceOrder.pieces,2);assert.equal(h.cart.lines[0].estimatedTotal,1884);assert.equal(h.render().action.children,'✓ В корзине');
 h.change(0,'1.5');assert.equal(h.render().inputs[0].value,'2');
 h.change(0,'3');assert.equal(h.render().action.children,'Обновить');h.render().action.onClick();assert.equal(h.cart.lines.length,1);assert.equal(h.cart.lines[0].quantity,18);assert.equal(h.cart.lines[0].estimatedTotal,2826);
 h.change(0,'0');assert.equal(h.render().action.children,'Удалить');h.render().action.onClick();assert.equal(h.cart.lines.length,0);assert.equal(h.render().action.children,'Удалено');h.timers.at(-1)();assert.equal(h.render().action.children,'В корзину');
});

test('reference prices stay quote-only while requests carry whole pieces and correctly calculated metres',()=>{
 const h=setup(base);assert.equal(h.render().action.label,'Запросить цену');assert.equal(h.render().action.order.quantity,null);h.change(0,'2');assert.equal(h.render().action.order.quantity,2);assert.equal(h.render().action.order.unit,'шт.');assert.equal(h.render().action.order.meters,12);assert.equal(h.render().outputs[1].children,'Цена уточняется');assert.equal(h.cart.lines.length,0);
 assert.equal(h.render('card').inputs[0].step,1);
});

test('80 by 80 by 2 needs an explicit length, preserves it after saving and rejects out-of-range lengths',()=>{
 const product=rows.find(p=>p.profileWidthMm===80&&p.wallThicknessMm===2);
 const h=setup({...product,price:343,priceConfirmed:true,quoteOnly:false});h.change(1,'2');assert.equal(h.render().action.disabled,true);assert.equal(h.render().outputs[0].children,'—');
 h.change(0,'7.5');assert.equal(h.render().outputs[0].children,'15');h.render().action.onClick();assert.equal(h.cart.lines[0].pieceOrder.lengthMeters,7.5);assert.equal(h.cart.lines[0].quantity,15);assert.equal(h.render().inputs[0].value,'7.5');
 h.change(0,'5');assert.equal(h.render().action.disabled,true);h.change(0,'12');h.render().action.onClick();assert.equal(h.cart.lines[0].quantity,24);assert.equal(h.cart.lines[0].pieceOrder.pieces,2);
});

test('the real cart provider replaces piece orders, preserves length and rejects fractional updates',()=>{
 const product={...base,price:157,priceConfirmed:true,quoteOnly:false};let cursor=0;const state=[];const timers=[];const storage=new Map();
 const react={createContext:()=>({}),useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useEffect(effect){effect();},useMemo:fn=>fn(),useCallback:fn=>fn};
 const mockCatalog={...catalog,getProductVariantById:id=>id===product.id?product:catalog.getProductVariantById(id)};
 const cart=evaluateModule('lib/cart.ts',{'./catalog':mockCatalog,'./cartPricing':{revalidateCartPrice},'./variantPresentation':readProjectData('lib/variantPresentation.ts'),'./profilePipe':pipe,'./profileSheet':profileSheet});
 const imports={react,'react/jsx-runtime':{jsx:(type,props)=>({type,props})},'@/lib/constants':readProjectData('lib/constants.ts'),'@/lib/catalog':mockCatalog,'@/lib/cart':cart,'@/lib/profilePipe':pipe,'@/lib/profileSheet':profileSheet,'@/lib/cartPricing':{revalidateCartPrice}};
 const {CartProvider}=evaluateModule('context/CartContext.tsx',imports,{window:{setTimeout(fn){timers.push(fn);},clearTimeout(){}},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}});
 const render=()=>{cursor=0;return CartProvider({children:null}).props.value;};render();timers.shift()();
 render().addItem(product.id,12,undefined,{pieces:2,lengthMeters:6});assert.equal(render().lines[0].estimatedTotal,1884);
 render().addItem(product.id,18,undefined,{pieces:3,lengthMeters:6});assert.equal(render().items.length,1);assert.equal(render().lines[0].estimatedTotal,2826);
 render().updateQuantity(product.id,15);assert.equal(render().lines[0].quantity,18);
 render().updateQuantity(product.id,24);assert.equal(render().lines[0].pieceOrder.pieces,4);assert.equal(render().totalAmount,3768);
 render().addItem(product.id,12,undefined,{pieces:2,lengthMeters:12});assert.equal(render().lines[0].quantity,24);
 render().removeItem(product.id);assert.equal(render().items.length,0);
});
