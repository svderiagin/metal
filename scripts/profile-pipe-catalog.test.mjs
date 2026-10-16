import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {randomBytes} from 'node:crypto';
import {readProjectData} from './project-data.mjs';

const cache=new Map();
const catalog=readProjectData('lib/catalog.ts',cache);
const pipe=readProjectData('lib/profilePipe.ts',cache);
const {normalizeCartItems,createCartLines}=readProjectData('lib/cart.ts',cache);
const {revalidateCartPrice}=readProjectData('lib/cartPricing.ts',cache);
const {parseCreateOrderInput}=readProjectData('lib/server/validation.ts',cache);
const {hasValidOrderAmount}=readProjectData('lib/server/payments.ts',cache);
const {normalizePipeWeight}=readProjectData('lib/pipeWeight.ts',cache);
const {trubyProfilnyeProducts}=readProjectData('data/products/trubyProfilnye.ts',cache);
const reference=JSON.parse(fs.readFileSync('imports/profile-pipe-reference-prices.json','utf8'));
const products=catalog.getProductVariantsByCategoryId('cat-trp').filter(pipe.isProfilePipeVariant);
const find=(width,height,wall)=>products.find(p=>p.profileWidthMm===width&&p.profileHeightMm===height&&p.wallThicknessMm===wall);
const confirmed=(product,price)=>({...product,price,quoteOnly:false,priceConfirmed:true});

test('exactly 28 square and 23 rectangular combinations retain every supplied reference price without publishing it',()=>{
 const expectedSquare={'15×15':{'1.5':47},'20×20':{'1.5':59,2:73},'25×25':{'1.5':75,2:99},'30×30':{'1.5':98,2:123},'40×40':{'1.5':129,2:157,3:210},'50×50':{'1.5':155,2:201,3:289,4:380},'60×60':{'1.5':215,2:235,3:325,4:460},'80×80':{2:343,3:435,4:638},'100×100':{3:570,4:745,5:1050},'120×120':{3:780,4:960},'140×140':{4:1170},'160×160':{4:1390}};
 const expectedRect={'30×20':{2:109},'40×20':{'1.5':85,2:110,3:150},'40×25':{'1.5':115,2:135},'50×25':{'1.5':123,2:145,3:210},'60×30':{'1.5':147,2:180,3:260},'60×40':{'1.5':163,2:215,3:290,4:375},'80×40':{2:265,3:350},'80×60':{2:332,3:412},'100×50':{2:357,3:440},'100×60':{3:480}};
 assert.equal(products.length,51);assert.equal(products.filter(p=>p.subcategoryId==='cat-trp-sub-1').length,28);assert.equal(products.filter(p=>p.subcategoryId==='cat-trp-sub-2').length,23);
 assert.equal(new Set(products.map(p=>`${pipe.profilePipeSize(p)}×${p.wallThicknessMm}`)).size,51);
 assert.equal(reference.priceStatus,'unconfirmed-reference');assert.equal(reference.rows.length,51);
 for(const expected of [expectedSquare,expectedRect])for(const [size,walls]of Object.entries(expected))for(const [wall,price]of Object.entries(walls)){
  const [width,height]=size.split('×').map(Number);const product=find(width,height,Number(wall));assert.ok(product,`${size}×${wall}`);
  const row=reference.rows.find(r=>r.widthMm===width&&r.heightMm===height&&r.wallThicknessMm===Number(wall));assert.equal(row.referencePricePerMeter,price);
  assert.equal(product.price,null);assert.equal(product.quoteOnly,true);assert.equal(product.priceConfirmed,false);assert.equal(product.unit,'meter');assert.equal(product.priceUnit,'за метр');assert.equal(product.availability,'UNKNOWN');assert.equal(product.inStock,false);assert.equal(product.weightPerMeterKg,undefined);assert.equal(product.weight,undefined);assert.equal(product.standard,'');assert.equal(product.material,'');assert.equal(product.steelGrade,undefined);assert.ok(!('referencePricePerMeter' in product));
  if(width===height&&width===80&&Number(wall)===2){assert.equal(product.lengthMeters,undefined);assert.deepEqual(Array.from(product.lengthRangeMeters),[6,12]);}
  else assert.equal(product.lengthMeters,width!==height||width<=60?6:12);
 }
 assert.deepEqual(Array.from(trubyProfilnyeProducts,p=>[p.id,p.sku,p.price]),[['prd-087','MS-0087',96910],['prd-088','MS-0088',105360],['prd-089','MS-0089',98280],['prd-090','MS-0090',106730]]);
});

test('all 51 rows calculate whole-pipe orders only from confirmed commercial prices and valid lengths',()=>{
 for(const product of products){
  const row=reference.rows.find(r=>r.widthMm===product.profileWidthMm&&r.heightMm===product.profileHeightMm&&r.wallThicknessMm===product.wallThicknessMm);
  for(const length of product.lengthRangeMeters??[product.lengthMeters]){
   const offer=confirmed(product,row.referencePricePerMeter);const result=pipe.profilePipeOrder(offer,2,length);
   assert.equal(result.meters,2*length);assert.equal(result.estimatedTotal,2*length*row.referencePricePerMeter);
   const cart=revalidateCartPrice(offer,{quantity:result.meters,pieceOrder:{pieces:2,lengthMeters:length}});
   assert.equal(cart.invalidReason,undefined);assert.equal(cart.estimatedTotal,result.estimatedTotal);
   assert.equal(pipe.profilePipeOrder(product,2,length).estimatedTotal,null);assert.ok(revalidateCartPrice(product,{quantity:result.meters,pieceOrder:{pieces:2,lengthMeters:length}}).invalidReason);
  }
 }
 const example=pipe.profilePipeOrder(confirmed(find(40,40,2),157),2);assert.equal(example.meters,12);assert.equal(example.estimatedTotal,1884);
});

test('fractional pieces, ambiguous lengths, false totals, unknown prices and unsupported units cannot purchase',()=>{
 const product=confirmed(find(40,40,2),157);const ranged=confirmed(find(80,80,2),343);
 for(const pieces of [-1,.5,1.5,1000,NaN,Infinity])assert.equal(pipe.profilePipeOrder(product,pieces),null);
 assert.equal(pipe.profilePipeOrder(ranged,2),null);
 for(const length of [0,5,13,NaN,Infinity])assert.equal(pipe.profilePipeOrder(ranged,2,length),null);
 assert.equal(pipe.profilePipeOrder(ranged,2,7.5).meters,15);
 assert.equal(pipe.profilePipeOrder(product,2,12),null);
 for(const variant of [{...product,priceConfirmed:false},{...product,quoteOnly:true},{...product,priceQualifier:'from'},{...product,price:NaN},{...product,price:Infinity},{...product,unit:'ton'},{...product,priceUnit:'за тонну'}])assert.equal(pipe.profilePipeOrder(variant,2).estimatedTotal,null);
 for(const item of [{quantity:2,pieceOrder:{pieces:2,lengthMeters:6}},{quantity:12,pieceOrder:{pieces:1.5,lengthMeters:8}},{quantity:12,pieceOrder:{pieces:1,lengthMeters:12}},{quantity:0},{quantity:Infinity},{quantity:12,measurement:{inputMode:'meter',meters:12,weightTons:1}}])assert.ok(revalidateCartPrice(product,item).invalidReason);
 const overflow=revalidateCartPrice({...product,price:Number.MAX_VALUE},{quantity:12,pieceOrder:{pieces:2,lengthMeters:6}});assert.ok(overflow.invalidReason);assert.equal(overflow.estimatedTotal,0);
 const weight=normalizePipeWeight({...product,weightPerMeterKg:2});assert.equal(weight.weightPerMeterKg,undefined);
 assert.equal(normalizePipeWeight({...product,weightPerMeterKg:2,weightConfirmed:true}).weightPerMeterKg,2);
});

test('cart reload keeps selected length, replaces cached quantity and rejects malformed piece metadata',()=>{
 const ranged=find(80,80,2);const items=normalizeCartItems([{productId:ranged.id,quantity:999,pieceOrder:{pieces:2,lengthMeters:7.5}}]);
 assert.equal(items[0].quantity,15);assert.equal(items[0].pieceOrder.lengthMeters,7.5);
 assert.ok(createCartLines(items)[0].invalidReason);assert.equal(createCartLines(items)[0].estimatedTotal,0);
 for(const pieceOrder of [{pieces:1.5,lengthMeters:6},{pieces:0,lengthMeters:6},{pieces:1000,lengthMeters:6},{pieces:2,lengthMeters:-1}])assert.equal(normalizeCartItems([{productId:ranged.id,quantity:12,pieceOrder}]).length,0);
 assert.equal(normalizeCartItems([{productId:ranged.id,quantity:12,pieceOrder:{pieces:999,lengthMeters:Number.MAX_VALUE}}]).length,0);
 assert.equal(normalizeCartItems([{productId:ranged.id,quantity:12,pieceOrder:{pieces:2,lengthMeters:6},measurement:{inputMode:'meter',meters:12,weightTons:1}}]).length,0);
});

test('server order validation and payment totals use metres, not pieces or fabricated mass',()=>{
 const product=confirmed(find(40,40,2),157);const testModule={exports:{}};
 const source=ts.transpileModule(fs.readFileSync('lib/server/orders.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(source,{module:testModule,exports:testModule.exports,process:{env:{NODE_ENV:'test'}},require:name=>name==='node:crypto'?{randomBytes}:name==='@/lib/catalog'?{getProductVariantById:id=>id===product.id?product:undefined}:readProjectData(name.replace('@/','')+'.ts',cache)});
 const body={items:[{productId:product.id,quantity:12,pieceOrder:{pieces:2,lengthMeters:6}}],customer:{type:'INDIVIDUAL',fullName:'Тест',email:'test@example.invalid',phone:'+79000000000'},delivery:{address:'Тестовый адрес'},paymentMethod:'INVOICE'};
 const parsed=parseCreateOrderInput(body);assert.ok(parsed);assert.equal(parsed.items[0].pieceOrder.pieces,2);
 const order=testModule.exports.createTrustedOrder(parsed);assert.equal(order.totalAmount,1884);assert.equal(order.items[0].quantity,12);assert.equal(order.items[0].unitPrice,157);assert.equal(order.items[0].pieceOrder.pieces,2);assert.equal(hasValidOrderAmount(order),true);
 order.items[0].subtotal=314;assert.equal(hasValidOrderAmount(order),false);
 const big=parseCreateOrderInput({...body,items:[{productId:product.id,quantity:5994,pieceOrder:{pieces:999,lengthMeters:6}}]});assert.ok(big);assert.equal(testModule.exports.createTrustedOrder(big).items[0].quantity,5994);
 assert.equal(parseCreateOrderInput({...body,items:[{productId:product.id,quantity:12,pieceOrder:{pieces:1.5,lengthMeters:6}}]}),null);
 assert.equal(testModule.exports.createTrustedOrder({...parsed,items:[{productId:product.id,quantity:12,pieceOrder:{pieces:2,lengthMeters:12}}]}),null);
});
