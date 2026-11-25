import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readProjectData} from './project-data.mjs';

export function updateCartCatalog() {
  const cache=new Map();
  const {projectCartProduct}=readProjectData('lib/cartProjection.ts',cache);
  const {getCheckoutProductLabel}=readProjectData('lib/checkoutProductLabel.ts',cache);
  const {productVariants}=readProjectData('data/products/index.ts',cache);
  const {categories}=readProjectData('data/categories.ts',cache);
  const {subcategories}=readProjectData('data/subcategories.ts',cache);
  const {productTypes}=readProjectData('data/productTypes.ts',cache);
  const names=new Map();
  for(const product of productVariants)names.set(product.name,(names.get(product.name)??0)+1);
  const typeNames=new Map(productTypes.map(({id,name})=>[id,name]));
  const value={products:productVariants.map(product=>{
      const projected=projectCartProduct(product);
      const checkoutLabel=getCheckoutProductLabel(product,typeNames.get(product.productTypeId),names.get(product.name)>1);
      return checkoutLabel?{...projected,checkoutLabel}:projected;
    }),
    categories:categories.map(({id,slug})=>({id,slug})),
    subcategories:subcategories.map(({id,slug})=>({id,slug})),
    types:productTypes.map(({id,slug})=>({id,slug}))};
  const output='data/cart-catalog.json';
  const text=JSON.stringify(value)+'\n';
  if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==text)fs.writeFileSync(output,text);
}

export function cartSourceSignature() {
  const files=[];
  function visit(folder) {
    for(const entry of fs.readdirSync(folder,{withFileTypes:true})) {
      const file=path.join(folder,entry.name);
      if(entry.isDirectory())visit(file);
      else if(/\.(ts|json)$/.test(file)&&!['cart-catalog.json','catalog-image-versions.json','catalog-images.json'].includes(entry.name)) {
        const stat=fs.statSync(file);files.push(`${file}:${stat.mtimeMs}:${stat.size}`);
      }
    }
  }
  for(const folder of ['data','lib','types'])visit(folder);
  return files.sort().join('|');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))updateCartCatalog();
