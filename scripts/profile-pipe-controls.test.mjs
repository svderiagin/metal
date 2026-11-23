import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readProjectData} from './project-data.mjs';

const pipe=readProjectData('lib/profilePipe.ts');
const profileSheet=readProjectData('lib/profileSheet.ts');
const vgp=readProjectData('lib/vgp.ts');
const catalogOffer=readProjectData('lib/catalogOffer.ts');
const orderMeasurement=readProjectData('lib/orderMeasurement.ts');
const {revalidateCartPrice}=readProjectData('lib/cartPricing.ts');
const catalog=readProjectData('lib/catalog.ts');
const rows=catalog.getProductVariantsByCategoryId('cat-trp').filter(pipe.isProfilePipeVariant);
const base=rows.find(p=>p.profileWidthMm===40&&p.profileHeightMm===40&&p.wallThicknessMm===2);

function evaluateModule(file,imports,globals={}) {
 const testModule={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(source,{module:testModule,exports:testModule.exports,require:name=>{assert.ok(name in imports,name);return imports[name];},...globals});return testModule.exports;
}

function setup(variant={...base,price:157,priceConfirmed:true,quoteOnly:false}) {
 let cursor=0;const state=[];const timers=[];
 const cart={
   hydrated:true,
   lines:[],
   addItem(productId,quantity,measurement,pieceOrder){
     assert.equal(measurement,undefined);
     const result=revalidateCartPrice(variant,{quantity,pieceOrder});
     assert.equal(result.invalidReason,undefined);
     cart.lines=[{productId,quantity,...result}];
   },
   updatePieceOrder(productId,pieces,lengthMeters){
     assert.equal(cart.lines[0]?.productId,productId);
     cart.addItem(productId,pieces*lengthMeters,undefined,{pieces,lengthMeters});
   },
   removeItem(){cart.lines=[];},
 };
 const jsx=(type,props)=>typeof type==='function'?type(props):{type,props};
 const layout = {
   CatalogVariantLayout: ({view, specifications, tableSpecifications, order}) =>
     jsx('row', {children: [view === 'table' ? tableSpecifications.cells : specifications, order]}),
   CatalogVariantSpecifications: 'specifications',
   CatalogVariantOrder: ({quantity, secondaryQuantity, action, total}) =>
     jsx('order', {children: [quantity, secondaryQuantity, total, action]}),
 };
 const imports={react:{useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=value;}];},useEffect(effect){effect();}},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'@/hooks/useCart':{useCart:()=>cart},'@/components/ui/Button':{Button:'button'},'@/components/ui/Input':{Input:'input'},'@/components/ui/Icon':{Icon:()=>null},'@/lib/catalogNumberInput':readProjectData('lib/catalogNumberInput.ts'),'@/lib/cartQuantityInput':readProjectData('lib/cartQuantityInput.ts'),'@/lib/currency':readProjectData('lib/currency.ts'),'@/lib/numberFormat':readProjectData('lib/numberFormat.ts'),'@/lib/profilePipe':pipe,'./QuoteRequestButton':{QuoteRequestButton:'quote'},'./CatalogVariantLayout':layout,'./FilterPanel.module.css':{default:{}},'./RebarTable.module.css':{default:{}}};
 imports['./CatalogPositionDetails'] = {CatalogPositionDetails: 'details'};
 imports['./CatalogGuideFigure'] = {CatalogGuideFigure: 'figure'};
 // Keep the legacy local state slots; shared drafts are exercised in browser tests.
 imports['./OrderDraftProvider'] = {
   useOrderDraft(...args) {
     const [draft, setDraft] = imports.react.useState(null);
     const [message, setMessage] = imports.react.useState(args[2]);
     return {draft, setDraft, message, setMessage};
   },
 };
 const {ProfilePipeVariantItem}=evaluateModule('components/catalog/ProfilePipeVariantItem.tsx',imports,{window:{setTimeout(fn){timers.push(fn);},clearTimeout(){}}});
 const nodes=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat().flatMap(nodes)];
 function render(view='table'){
   cursor=0;
   const tree=nodes(ProfilePipeVariantItem({variant,view}));
   const action=nodes(tree.find(n=>n.type==='order')).find(n=>['button','quote'].includes(n.type)).props;
   const actionText=[action.children,...nodes(action.children).map(node=>node.props.children)]
     .filter(value=>typeof value==='string').join('');
   const control = (type, label) => tree.find(node =>
     node.type === type && node.props['aria-label'] === label + variant.name)?.props;
   return {
     pieces: control('input', 'Количество целых труб для '),
     length: control('input', 'Длина одной трубы для '),
     meters: control('output', 'Заказ в метрах для '),
     total: control('output', 'Сумма заказа для '),
     action, actionText,
   };
 }
 return {cart,timers,render,change(field,value,view){render(view)[field].onChange({target:{value}});},
   blur(field,view){render(view)[field].onBlur();}};
}

test('profile table recalculates 2 pipes into 12 metres and 1884 rubles, replaces the cart line and removes zero',()=>{
 const h=setup();
 assert.equal(h.render().pieces.value,'');
 h.blur('pieces');
 assert.equal(h.render().pieces.value,'');
 assert.equal(h.render().action.disabled,true);
 assert.equal(h.cart.lines.length,0);
 h.change('pieces','2');assert.equal(h.render().pieces.inputMode,'numeric');assert.equal(h.render().meters.children,'12');assert.equal(h.render().total.children.replace(/\s/gu,''),'1884,00₽');
 h.render().action.onClick();assert.equal(h.cart.lines[0].quantity,12);assert.equal(h.cart.lines[0].pieceOrder.pieces,2);assert.equal(h.cart.lines[0].estimatedTotal,1884);assert.equal(h.render().actionText,'В корзине');
 h.change('pieces','1,5');assert.equal(h.render().pieces.value,'1,5');
 h.blur('pieces');assert.equal(h.render().pieces.value,'2');
 h.change('pieces','-0');h.blur('pieces');assert.equal(h.render().pieces.value,'-0');assert.equal(h.render().action.disabled,true);
 assert.equal(h.cart.lines[0].pieceOrder.pieces,2);
 h.change('pieces','3');assert.equal(h.render().actionText,'Обновить');h.render().action.onClick();assert.equal(h.cart.lines.length,1);assert.equal(h.cart.lines[0].quantity,18);assert.equal(h.cart.lines[0].estimatedTotal,2826);
 h.change('pieces','0');assert.equal(h.render().actionText,'Удалить');h.render().action.onClick();assert.equal(h.cart.lines.length,0);assert.equal(h.render().actionText,'Удалено');h.timers.at(-1)();assert.equal(h.render().actionText,'В корзину');
});

test('reference prices stay quote-only while requests carry whole pieces and correctly calculated metres',()=>{
 const h=setup(base);assert.equal(h.render().action.label,'Запросить цену');assert.equal(h.render().action.order.quantity,null);h.change('pieces','2');assert.equal(h.render().action.order.quantity,2);assert.equal(h.render().action.order.unit,'шт.');assert.equal(h.render().action.order.meters,12);assert.equal(h.render().total.children,'Цена уточняется');assert.equal(h.cart.lines.length,0);
 assert.equal(h.render('card').pieces.inputMode,'numeric');
});

test('80 by 80 by 2 requires a selected length and clamps positive out-of-range lengths',()=>{
 const product=rows.find(p=>p.profileWidthMm===80&&p.profileHeightMm===80&&p.wallThicknessMm===2);
 const h=setup({...product,price:343,priceConfirmed:true,quoteOnly:false});
 h.change('pieces','2');
 assert.equal(h.render().meters.children,'—');
 assert.equal(h.render().action.disabled,true);
 h.change('length','abc');h.blur('length');
 assert.equal(h.render().length.value,'abc');
 assert.equal(h.render().action.disabled,true);
 h.change('length','6');
 assert.equal(h.render().action.disabled,false);
 h.render().action.onClick();
 assert.equal(h.cart.lines[0].pieceOrder.lengthMeters,6);
 assert.equal(h.cart.lines[0].quantity,12);
 h.change('length','7.5','card');
 assert.equal(h.render('card').pieces.value,'2');
 assert.equal(h.render('card').length.value,'7.5');
 assert.equal(h.render('card').meters.children,'15');
 assert.equal(h.render().meters.children,'15');h.render().action.onClick();assert.equal(h.cart.lines[0].pieceOrder.lengthMeters,7.5);assert.equal(h.cart.lines[0].quantity,15);assert.equal(h.render().length.value,'7.5');
 h.change('length','5');assert.equal(h.render().length['aria-invalid'],true);h.blur('length');assert.equal(h.render().length.value,'6');
 h.change('length','20');h.blur('length');assert.equal(h.render().length.value,'12');
 h.render().action.onClick();assert.equal(h.cart.lines[0].quantity,24);assert.equal(h.cart.lines[0].pieceOrder.pieces,2);
});

test('the real cart provider replaces piece orders, preserves length and rejects fractional updates',()=>{
 const product={...base,price:157,priceConfirmed:true,quoteOnly:false};let cursor=0;const state=[];const timers=[];const storage=new Map();
 const react={createContext:()=>({}),useState(initial){const i=cursor++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},useEffect(effect){effect();},useMemo:fn=>fn(),useCallback:fn=>fn,useRef(initial){const i=cursor++;return state[i]??={current:initial};}};
 const mockCatalog={...catalog,getProductVariantById:id=>id===product.id?product:catalog.getProductVariantById(id)};
 const cart=evaluateModule('lib/cart.ts',{'./cartCatalog':mockCatalog,'./cartPricing':{revalidateCartPrice},'./variantPresentation':readProjectData('lib/variantPresentation.ts'),'./profilePipe':pipe,'./profileSheet':profileSheet,'./catalogOffer':catalogOffer,'./orderMeasurement':orderMeasurement});
 const mutations=evaluateModule('lib/cartMutations.ts',{'./cart':cart,'./cartPricing':{revalidateCartPrice},'./profilePipe':pipe,'./vgp':vgp,'./pipeFamily':readProjectData('lib/pipeFamily.ts'),'./wholePipeOrder':readProjectData('lib/wholePipeOrder.ts'),'./catalogOffer':catalogOffer,'./orderMeasurement':orderMeasurement});
 const imports={'@/lib/cartMutations':mutations,react,'react/jsx-runtime':{jsx:(type,props)=>({type,props})},'@/lib/constants':readProjectData('lib/constants.ts'),'@/lib/cartCatalog':mockCatalog,'@/lib/cart':cart,'@/lib/profilePipe':pipe,'@/lib/profileSheet':profileSheet,'@/lib/cartPricing':{revalidateCartPrice}};
 const {CartProvider}=evaluateModule('context/CartContext.tsx',imports,{window:{setTimeout(fn){timers.push(fn);},clearTimeout(){},addEventListener(){},removeEventListener(){}},localStorage:{
   get length(){return storage.size;},key:index=>[...storage.keys()][index]??null,
   getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key),
 }});
 const render=()=>{cursor=0;return CartProvider({children:null}).props.value;};render();timers.shift()();
 render().addItem(product.id,12,undefined,{pieces:2,lengthMeters:6});assert.equal(render().lines[0].estimatedTotal,1884);
 render().addItem(product.id,12,undefined,{pieces:2,lengthMeters:6});assert.equal(render().lines[0].quantity,12);
 render().updatePieceOrder(product.id,3,6);assert.equal(render().items.length,1);assert.equal(render().lines[0].estimatedTotal,2826);
 render().updateQuantity(product.id,15);assert.equal(render().lines[0].quantity,18);
 render().updateQuantity(product.id,24);assert.equal(render().lines[0].pieceOrder.pieces,4);assert.equal(render().totalAmount,3768);
 render().updatePieceOrder(product.id,2,12);assert.equal(render().lines[0].quantity,24);
 render().removeItem(product.id);assert.equal(render().items.length,0);
});
