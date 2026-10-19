import fs from 'node:fs';
import path from 'node:path';
import {templates} from '../src/catalog.mjs';
const out=path.resolve(import.meta.dirname,'../dist');
const routes=['/', '/privacy/',...templates.map(t=>`/${t.slug}/`)];
const errs=[];
const exists=(p)=>fs.existsSync(p);
for(const route of routes){
 const pathName=path.join(out,route,'index.html');
 if(!exists(pathName)){errs.push(`Missing: ${route}`);continue}
 const html=fs.readFileSync(pathName,'utf8');
 for(const tag of ['<h1','<meta name="description"','<title>','<main','<html lang="en"'])if(!html.includes(tag))errs.push(`${route}: missing ${tag}`);
 const h1=(html.match(/<h1[\s>]/g)||[]).length;
 if(h1!==1)errs.push(`${route}: found ${h1} H1s`);
 const anchors=[...html.matchAll(/<a\s+[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 for(const href of anchors){if(!href.startsWith('/')||href.startsWith('//'))continue;
  const target=href.split('#')[0].split('?')[0];if(!target)continue;
  let file=path.join(out,target);if(target.endsWith('/'))file=path.join(file,'index.html');
  if(!exists(file))errs.push(`${route}: broken internal link ${href}`);
 }
}
for(const file of ['assets/app.js','assets/styles.css','assets/favicon.svg','assets/og-cover.svg','assets/NotoSansDevanagari-Regular.ttf','assets/FONT-LICENSE.txt','robots.txt','404.html'])if(!exists(path.join(out,file)))errs.push(`Missing static asset ${file}`);
if(process.env.SITE_URL && !exists(path.join(out,'sitemap.xml')))errs.push('Missing sitemap.xml for SITE_URL');
if(errs.length){console.error(errs.join('\n'));process.exit(1)}
console.log(`✓ ${routes.length} complete static pages, all internal links valid, and required assets present.`);
