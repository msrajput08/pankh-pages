#!/usr/bin/env python3
"""Fetch deployed static pages into versioned GitHub source tree."""
import os, urllib.request, urllib.parse, xml.etree.ElementTree as ET
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
base=os.environ["SOURCE_URL"].rstrip("/")
dest=Path(os.environ["DEST_DIR"])
minimum=int(os.environ["MIN_PAGES"])
kind=os.environ["SITE_KIND"]
def get(path):
    if not path.startswith("/") or "//" in path[1:]: raise ValueError(path)
    request=urllib.request.Request(base+path,headers={"User-Agent":"Mozilla/5.0 (compatible; GitHubBackupBot/1.0)"})
    with urllib.request.urlopen(request,timeout=35) as response:
        if response.status != 200: raise RuntimeError("Fetch failed: "+path)
        data=response.read(3000000)
    if len(data)>=3000000: raise RuntimeError("Unexpected oversized response: "+path)
    return data
xml=get("/sitemap.xml")
paths=set()
for el in ET.fromstring(xml).findall(".//{*}loc"):
    parsed=urllib.parse.urlsplit(el.text or "")
    if parsed.scheme!="https" or parsed.netloc!=urllib.parse.urlsplit(base).netloc:
        raise RuntimeError("Unexpected sitemap domain")
    if not parsed.path.endswith("/"): raise RuntimeError("Unexpected sitemap path")
    paths.add(parsed.path)
if len(paths)<minimum: raise RuntimeError(f"Sitemap has only {len(paths)} pages")
common=["/sitemap.xml","/robots.txt","/404.html","/google3d4d24a07fe849ba.html"]
if kind=="axiom":
    common+=["/assets/app.js","/assets/engine.js","/assets/catalog.json","/assets/styles.css","/assets/favicon.svg"]
else:
    common+=["/assets/app.js","/assets/styles.css","/assets/favicon.svg","/assets/og-cover.svg","/assets/NotoSansDevanagari-Regular.ttf","/assets/FONT-LICENSE.txt"]
jobs=[(p,p.lstrip("/")+"index.html") for p in sorted(paths)]
jobs += [(p,p.lstrip("/")) for p in common]
def task(t):
    path,out=t
    body=get(path)
    if out.endswith(".html") and b"<html" not in body[:3000].lower() and b"google-site-verification" not in body:
        raise RuntimeError("Not HTML: "+path)
    return out,body
with ThreadPoolExecutor(max_workers=6) as executor:
    results=list(executor.map(task,jobs))
for filename,data in results:
    out=dest/filename
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_bytes(data)
print(f"Imported {len(paths)} pages and {len(common)} shared files from {base}.")
