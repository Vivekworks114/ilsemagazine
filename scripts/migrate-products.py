#!/usr/bin/env python3
"""Fetch beste-* product pages from the live site into src/content/pages/*.mdx."""

from __future__ import annotations

import html as html_lib
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES_DIR = ROOT / "src/content/pages"
SLUGS_PATH = ROOT / "src/data/slugs.json"
PUBLIC_UPLOADS = ROOT / "public/wp-content/uploads"
BASE = "https://ilsemagazine.nl"
DEFAULT_IMAGE = "/images/2022/Rectangle-1-1.png"


def curl(url: str) -> str:
    result = subprocess.run(
        ["curl", "-sfL", url],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"curl failed for {url}")
    return result.stdout


def yaml_quote(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def rewrite_urls(content: str) -> str:
    content = re.sub(
        r"https?://(?:www\.)?ilsemagazine\.nl/wp-content/uploads/([^\s\"'<>]+)",
        r"/wp-content/uploads/\1",
        content,
    )
    content = re.sub(
        rf"{re.escape(BASE)}/(?P<slug>[a-z0-9\-_/]+)/?",
        r"/\g<slug>/",
        content,
    )
    return content


def download_image(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["curl", "-sfL", url, "-o", str(dest)],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0 and dest.exists() and dest.stat().st_size > 0


def html_to_markdown(html: str) -> str:
    html = re.sub(r"<!--[\s\S]*?-->", "", html or "")
    html = re.sub(r"\[[^\]]*\]", "", html)
    try:
        from markdownify import markdownify as md
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        for tag in soup.find_all(["script", "style", "iframe", "noscript"]):
            tag.decompose()
        text = md(str(soup), heading_style="ATX", bullets="-", strip=["script", "style"])
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        return text.replace("{", "\\{").replace("}", "\\}")
    except ImportError:
        text = re.sub(r"<[^>]+>", " ", html)
        return re.sub(r"\s+", " ", text).strip().replace("{", "\\{").replace("}", "\\}")


def extract_page(html: str, slug: str) -> dict:
    title_m = re.search(r"<title>([^<]+)</title>", html)
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', html)
    title = html_lib.unescape(title_m.group(1).strip()) if title_m else slug
    title = re.sub(r"\s*\|\s*.*$", "", title)
    description = html_lib.unescape(desc_m.group(1)) if desc_m else title

    parts = re.findall(
        r"elementor-widget-text-editor[^>]*>\s*<div class=\"elementor-widget-container\">\s*(.*?)</div>",
        html,
        re.S,
    )
    headings = re.findall(
        r"elementor-heading-title[^>]*>(.*?)</h[1-6]>",
        html,
        re.S,
    )
    h1 = re.sub(r"<[^>]+>", "", headings[0]).strip() if headings else title

    body_html = "\n".join(parts)
    body_html = rewrite_urls(body_html)
    body_md = html_to_markdown(body_html)

    featured = DEFAULT_IMAGE
    img_match = re.search(
        r'src="(?:https://ilsemagazine\.nl)?(/wp-content/uploads/[^"]+)"',
        body_html,
    )
    if img_match:
        featured = img_match.group(1)
        remote = f"{BASE}{featured}"
        dest = PUBLIC_UPLOADS / featured.split("/wp-content/uploads/", 1)[1]
        download_image(remote, dest)

    if not body_md:
        body_md = description or f"Lees alles over {title} op IlseMagazine.nl."

    return {
        "slug": slug,
        "title": h1 or title,
        "description": description[:500] if description else title,
        "featuredImage": featured,
        "body": body_md,
    }


def write_mdx(page: dict) -> None:
    frontmatter = f"""---
title: {yaml_quote(page["title"])}
description: {yaml_quote(page["description"])}
featuredImage: {yaml_quote(page["featuredImage"])}
pageType: product
---

"""
    path = PAGES_DIR / f"{page['slug']}.mdx"
    path.write_text(frontmatter + page["body"] + "\n", encoding="utf-8")


def migrate_slug(slug: str) -> str:
    dest = PAGES_DIR / f"{slug}.mdx"
    if dest.exists():
        return f"skip {slug}"
    html = curl(f"{BASE}/{slug}/")
    page = extract_page(html, slug)
    write_mdx(page)
    return f"ok {slug}"


def main() -> None:
    slugs = json.loads(SLUGS_PATH.read_text())
    product_slugs = sorted(s for s in slugs if s.startswith("beste-"))
    PAGES_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Migrating {len(product_slugs)} product pages...")
    ok = skip = err = 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(migrate_slug, slug): slug for slug in product_slugs}
        for future in as_completed(futures):
            slug = futures[future]
            try:
                result = future.result()
                if result.startswith("skip"):
                    skip += 1
                else:
                    ok += 1
                    print(result)
            except Exception as exc:
                err += 1
                print(f"error {slug}: {exc}")

    clean_slugs = [
        s
        for s in slugs
        if s not in {"category/blog", "category/uncategorized", "comments/feed", "feed"}
    ]
    SLUGS_PATH.write_text(json.dumps(clean_slugs, indent=2) + "\n", encoding="utf-8")
    print(f"Done: {ok} migrated, {skip} skipped, {err} errors. Slugs cleaned: {len(slugs) - len(clean_slugs)} removed.")


if __name__ == "__main__":
    main()
