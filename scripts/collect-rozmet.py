"""Read public catalog HTML; cache requests and save source evidence, never execute donor scripts."""
import concurrent.futures as futures
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / '.tmp/rozmet-source/pages'
CACHE.mkdir(parents=True, exist_ok=True)
ORIGIN = 'https://rozmet.ru'
PROTECTED = {'armatura', 'truba_profilnaya', 'truba-vgp', 'profnastil', 'rabitsa', 'balka_dvutavrovaya'}

class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []

    def all(self, tag=None, cls=None):
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if (not tag or child.tag == tag) and (not cls or cls in child.attrs.get('class', '').split()):
                    result.append(child)
                result.extend(child.all(tag, cls))
        return result

    def first(self, tag=None, cls=None):
        return next(iter(self.all(tag, cls)), Node())

    def text(self, blocks=False):
        if self.tag in ('script', 'style'):
            return ''
        result = ''.join(c.text(blocks) if isinstance(c, Node) else c for c in self.children)
        if blocks and self.tag in ('p', 'div', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'br'):
            result = '\n' + ('- ' if self.tag == 'li' else '') + result + '\n'
        return result

class Parser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node(); self.current = self.root
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.current)
        self.current.children.append(n)
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.current = n

    def handle_endtag(self, tag):
        node = self.current
        while node.parent:
            if node.tag == tag:
                self.current = node.parent; return
            node = node.parent

    def handle_data(self, data):
        self.current.children.append(data)

def clean(value):
    return re.sub(r'\s+', ' ', value).strip()

def prose(node):
    return '\n\n'.join(clean(line) for line in node.text(True).splitlines() if clean(line))

def fetch(url):
    url = urljoin(ORIGIN, url)
    if urlparse(url).hostname != 'rozmet.ru':
        raise ValueError('Unexpected host: ' + url)
    file = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.html')
    if not file.exists() or '--refresh' in sys.argv:
        r = subprocess.run(['curl','-sSfL','--retry','2','--max-time','45',url], capture_output=True)
        if r.returncode:
            raise RuntimeError(url + ': ' + r.stderr.decode()[-300:])
        file.write_bytes(r.stdout)
    return Parser(file.read_text()).root

def number(value):
    m = re.search(r'\d[\d\s\xa0]*(?:[.,]\d+)?', value)
    return float(re.sub(r'\s', '', m[0]).replace(',', '.')) if m else None

def ld_products(dom):
    result = []
    for script in dom.all('script'):
        if script.attrs.get('type') == 'application/ld+json':
            try:
                raw = json.loads(''.join(c for c in script.children if isinstance(c,str)))
                entries = raw if isinstance(raw,list) else raw.get('@graph',[raw])
                result.extend(e for e in entries if e.get('@type') == 'Product')
            except (ValueError,TypeError):
                pass
    return result

def section(url, name='', tile=''):
    dom = fetch(url)
    image = dom.first(cls='category-image').first('img').attrs.get('src', tile)
    intro = prose(dom.first(cls='small-description-text'))
    details = prose(dom.first(cls='category-description'))
    rows = []
    for item in dom.all(cls='bx_catalog_item_container'):
        link = item.first(cls='name').first('a')
        href = link.attrs.get('href','')
        if not href.startswith('/production/'):
            continue
        price_text = clean(item.first(cls='price-current').text())
        title = clean(link.text())
        group = item.parent
        while group.parent and 'category-subsection' not in group.attrs.get('class','').split():
            group = group.parent
        rows.append({'id':item.attrs.get('id','').split('_')[-1], 'url':urljoin(ORIGIN,href),
          'name':title, 'size':clean(item.first(cls='size-value').text()),
          'priceText':price_text, 'price':number(price_text),
          'groupName':clean(group.first(cls='subsection-head').first(cls='name').text()),
          'conditions':[n.attrs['title'] for n in item.all() if n.attrs.get('title') and n.attrs.get('class') == 'promo-icon']})
    links = {}
    for a in dom.all('a', 'menu__second-link') + dom.all('a','menu__third-link') + dom.all('a','bx_catalog_tile_img'):
        href = a.attrs.get('href','')
        if href.startswith(urlparse(url).path) and href != urlparse(url).path:
            links[urljoin(ORIGIN,href)] = clean(a.text()) or a.attrs.get('title','')
    pagination = set()
    for a in dom.all('a'):
        href = a.attrs.get('href','')
        if re.search(r'PAGEN_\d+=',href):
            pagination.add(urljoin(ORIGIN,href))
    return {'url':urljoin(ORIGIN,url),'name':clean(dom.first('h1').text()) or name,
      'intro':intro, 'details':details, 'image':urljoin(ORIGIN,image) if image else None,
      'children':links, 'rows':rows, 'pagination':sorted(pagination)}

def product(row):
    dom = fetch(row['url'])
    ld = next((p for p in ld_products(dom) if p.get('offers',{}).get('@type') == 'Offer'), {})
    specs = {}
    for prop in dom.first(cls='characteristics-content').all(cls='property'):
        name,value = clean(prop.first(cls='name').text()).rstrip(':'), clean(prop.first(cls='value').text())
        if name and value: specs[name] = value
    if not specs:
        for prop in dom.first(cls='small-properties-body').all(cls='property'):
            name,value = clean(prop.first(cls='name').text()).rstrip(':'), clean(prop.first(cls='value').text())
            if name and value: specs[name] = value
    images = []
    for a in dom.first(cls='detail-product-images').all('a'):
        href = a.attrs.get('href','')
        if href.startswith('/upload/') and urljoin(ORIGIN,href) not in images:
            images.append(urljoin(ORIGIN,href))
    offer = ld.get('offers',{})
    price_text = clean(dom.first(cls='detail-price').text())
    visible_price = number(price_text)
    if not price_text: visible_price = row['price']
    description = prose(dom.first(cls='description-content'))
    # Do not use the truncated preview or SEO meta description as product copy.
    stock = clean(dom.first(cls='buy-stock-wrap').text())
    return {**row,'name':clean(dom.first('h1').text()) or row['name'],
      'sku':str(ld.get('sku','')), 'price':visible_price,
      'priceText':price_text or row['priceText'], 'schemaPrice':offer.get('price'),
      'unitCode':offer.get('priceSpecification',{}).get('unitCode'),
      'availability':offer.get('availability'), 'stockText':stock,
      'description':description,'specifications':specs,'images':images,
      'priceConditions':list(dict.fromkeys(row['conditions'] + [n.attrs['title'] for n in dom.first(cls='detail-product-images').all() if 'promo-icon' in n.attrs.get('class','').split() and n.attrs.get('title')])),
      'priceConditionsText':prose(dom.first(cls='detail-promo-desc'))}

def main():
    dom = fetch('/production/')
    roots = []
    for a in dom.all('a','bx_catalog_tile_img'):
        slug = a.attrs.get('href','').strip('/').split('/')[-1]
        if slug in PROTECTED: continue
        img = re.search(r"url\(['\"]?([^)'\"]+)",a.attrs.get('style',''))
        roots.append((a.attrs['href'],a.attrs['title'],img[1] if img else ''))
    sections = {}
    queue = roots
    with futures.ThreadPoolExecutor(max_workers=5) as pool:
        while queue:
            batch = list(pool.map(lambda args: section(*args),queue))
            queue = []
            for item in batch:
                sections[item['url']] = item
                for href,name in item['children'].items():
                    if href not in sections: queue.append((href,name,''))
            queue = list({item[0]:item for item in queue}.values())
        page_urls = {url for item in sections.values() for url in item['pagination']}
        for page in pool.map(lambda url: section(url),sorted(page_urls)):
            base = page['url'].split('?')[0]
            if base in sections: sections[base]['rows'].extend(page['rows'])
        rows = {}
        duplicate_rows = 0
        for item in sections.values():
            for row in item['rows']:
                if row['url'] in rows: duplicate_rows += 1
                else: rows[row['url']] = row
        products = list(pool.map(product, rows.values()))
    result = {'source':ORIGIN+'/production/','roots':[urljoin(ORIGIN,r[0]) for r in roots],
      'sections':list(sections.values()),'products':products,'duplicateRows':duplicate_rows}
    output = ROOT/'imports/rozmet-source.json'
    output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    if '--images' in sys.argv:
        urls = {section['image'] for section in result['sections'] if section['image']}
        urls.update(url for product in products for url in product['images'])
        urls = sorted(url for url in urls if 'tile-empty' not in url)
        def download(url):
            suffix = Path(urlparse(url).path).suffix.lower() or '.jpg'
            target = ROOT/'public/images/catalog/rozmet'/(hashlib.sha256(url.encode()).hexdigest()[:20]+suffix)
            target.parent.mkdir(parents=True,exist_ok=True)
            if target.exists() and '--refresh' not in sys.argv: return
            temporary = target.with_suffix(suffix+'.part')
            response = subprocess.run(['curl','-sSfL','--retry','2','--max-time','45',url,'-o',str(temporary)],capture_output=True)
            if response.returncode: raise RuntimeError(url+': '+response.stderr.decode())
            temporary.replace(target)
        with futures.ThreadPoolExecutor(max_workers=5) as pool:
            list(pool.map(download, urls))
    print(json.dumps({'roots':len(roots),'sections':len(sections),'products':len(products),'duplicateRows':duplicate_rows,
      'categories':[{'name':sections[urljoin(ORIGIN,r[0])]['name'],'products':sum(1 for p in products if p['url'].startswith(urljoin(ORIGIN,r[0])))} for r in roots]},ensure_ascii=False,indent=2),flush=True)

if __name__ == '__main__': main()
