#!/usr/bin/env python3
"""Fast content fetch using curl (avoids Python SSL issues on macOS)."""

import json
import re
import html as html_lib
import subprocess
from pathlib import Path

BASE = "https://ilsemagazine.nl"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"


def curl(url: str) -> str:
    r = subprocess.run(
        ["curl", "-skL", url],
        capture_output=True,
        text=True,
        timeout=30,
    )
    return r.stdout


def extract(html: str, slug: str) -> dict:
    title_m = re.search(r"<title>([^<]+)</title>", html)
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', html)
    title = html_lib.unescape(title_m.group(1).strip()) if title_m else slug
    title = re.sub(r"\s*\|\s*.*$", "", title)
    desc = html_lib.unescape(desc_m.group(1)) if desc_m else ""

    parts = re.findall(
        r'class="elementor-widget-text-editor"[^>]*>.*?elementor-widget-container">\s*(.*?)</div>',
        html,
        re.S,
    )
    content = "\n".join(parts[:4]) if parts else f"<p>{desc}</p>"

    page_type = "product" if slug.startswith("beste-") else "article"
    if slug in ("tuin", "tuingereedschap", "tuindecoratie", "afrastering", "wonen", "verzorging"):
        page_type = "category"
    elif slug in ("blog", "tuinier-blogs"):
        page_type = "archive"

    img = "/images/2022/Rectangle-1-1.png"
    if "takkenschaar" in slug:
        img = "/images/elementor/takkenschaar.jpg"
    elif "zwenksproeier" in slug or "sproeier" in slug:
        img = "/images/elementor/sproeier-tuin.jpg"
    elif "plantenrek" in slug:
        img = "/images/elementor/planten-rek.jpg"

    return {
        "slug": slug,
        "title": title,
        "description": desc,
        "featuredImage": img,
        "content": content,
        "type": page_type,
        "url": f"/{slug}/" if slug != "home" else "/",
    }


def main():
    html = curl(f"{BASE}/sitemap/")
    urls = sorted(set(re.findall(r'href="(https://ilsemagazine\.nl/[^"]+)"', html)))
    pages = {}
    for url in urls:
        if any(x in url for x in ("wp-content", "wp-json", "feed", "#", "xmlrpc")):
            continue
        slug = url.rstrip("/").split("/")[-1] or "home"
        if slug in pages:
            continue
        print(f"Fetching {slug}...")
        try:
            pages[slug] = extract(curl(url), slug)
        except Exception as e:
            print(f"  skip: {e}")

    pages["home"] = extract(curl(f"{BASE}/"), "home")
    (DATA / "pages.json").write_text(json.dumps(pages, ensure_ascii=False, indent=2))
    print(f"Saved {len(pages)} pages")


if __name__ == "__main__":
    main()
