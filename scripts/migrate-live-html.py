#!/usr/bin/env python3
"""Fetch full Elementor HTML from live ilsemagazine.nl for product and blog pages."""

from __future__ import annotations

import html as html_lib
import json
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_DIR = ROOT / "src/data/page-html"
PAGES_DIR = ROOT / "src/content/pages"
BLOG_DIR = ROOT / "src/content/blog"
SLUGS_PATH = ROOT / "src/data/slugs.json"
BASE = "https://ilsemagazine.nl"


def curl(url: str) -> str:
    result = subprocess.run(
        ["curl", "-sfL", url],
        capture_output=True,
        text=True,
        timeout=90,
    )
    if result.returncode != 0:
        raise RuntimeError(f"curl failed for {url}")
    return result.stdout


def yaml_quote(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def rewrite_urls(content: str) -> str:
    """Rewrite live site URLs to local paths — no image downloads (already migrated)."""
    content = re.sub(
        r"https?://(?:www\.)?ilsemagazine\.nl/wp-content/uploads/([^\s\"'<>]+)",
        r"/wp-content/uploads/\1",
        content,
    )
    content = re.sub(
        rf"https?://(?:www\.)?ilsemagazine\.nl(?P<path>/[a-z0-9\-_/]+/?)",
        r"\g<path>",
        content,
    )
    content = re.sub(r'href="(/[^"]+?)(?<!/)/"', r'href="\1/"', content)
    return content


def build_toc_html(content: str) -> str:
    headings = re.findall(
        r'<h([2-4])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)</h\1>',
        content,
        re.S,
    )
    if not headings:
        return ""

    items: list[str] = []
    for level, anchor, raw_title in headings:
        title = re.sub(r"<[^>]+>", "", raw_title).strip()
        if not title or title.lower() == "inhoudsopgave":
            continue
        slug = anchor or re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        indent = "  " * (int(level) - 2)
        items.append(
            f'{indent}<li class="elementor-toc__item"><a class="elementor-toc__link" href="#{slug}">{html_lib.escape(title)}</a></li>'
        )

    if not items:
        return ""

    return (
        '<div class="elementor-toc__body elementor-toc__body--static">'
        '<ul class="elementor-toc__list">'
        + "".join(items)
        + "</ul></div>"
    )


def inject_toc(content: str) -> str:
    toc = build_toc_html(content)
    if not toc:
        return content
    return re.sub(
        r'(<div id="elementor-toc__[^"]+" class="elementor-toc__body">)\s*'
        r'<div class="elementor-toc__spinner-container">[\s\S]*?</div>\s*(</div>)',
        rf"\1{toc}\2",
        content,
        count=1,
    )


def add_heading_ids(content: str) -> str:
    def add_id(match: re.Match) -> str:
        tag = match.group(1)
        attrs = match.group(2)
        inner = match.group(3)
        if 'id="' in attrs:
            return match.group(0)
        title = re.sub(r"<[^>]+>", "", inner).strip()
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "section"
        return f'<h{tag}{attrs} id="{slug}">{inner}</h{tag}>'

    return re.sub(r"<h([2-4])([^>]*)>(.*?)</h\1>", add_id, content, flags=re.S)


def extract_elementor_html(page_html: str) -> str | None:
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return None

    soup = BeautifulSoup(page_html, "html.parser")
    root = soup.select_one("div.elementor-14") or soup.select_one(
        "div.elementor-location-single"
    )
    if not root:
        return None

    for tag in root.select("script, style, noscript, footer"):
        tag.decompose()

    content = root.decode_contents()
    content = add_heading_ids(content)
    content = rewrite_urls(content)
    content = inject_toc(content)
    return content.strip()


def parse_meta(page_html: str, slug: str) -> dict:
    title_m = re.search(r"<title>([^<]+)</title>", page_html)
    desc_m = re.search(r'<meta name="description" content="([^"]*)"', page_html)
    title = html_lib.unescape(title_m.group(1).strip()) if title_m else slug
    title = re.sub(r"\s*\|\s*.*$", "", title)
    description = html_lib.unescape(desc_m.group(1)) if desc_m else title
    h1_m = re.search(
        r"elementor-heading-title[^>]*>(.*?)</h[1-6]>",
        page_html,
        re.S,
    )
    if h1_m:
        h1 = re.sub(r"<[^>]+>", "", h1_m.group(1)).strip()
        if h1 and "Top 10" in h1:
            title = h1
    return {"title": title, "description": description[:500]}


def write_product_mdx(slug: str, meta: dict) -> None:
    frontmatter = f"""---
title: {yaml_quote(meta["title"])}
description: {yaml_quote(meta["description"])}
pageType: product
---

"""
    (PAGES_DIR / f"{slug}.mdx").write_text(frontmatter, encoding="utf-8")


def write_blog_mdx(slug: str, meta: dict, existing_path: Path) -> None:
    if existing_path.exists():
        text = existing_path.read_text(encoding="utf-8")
        if text.startswith("---") and "useLiveHtml: true" in text.split("---", 2)[1]:
            return
        if text.startswith("---"):
            parts = text.split("---", 2)
            fm = parts[1].rstrip() + "\nuseLiveHtml: true\n"
            body = parts[2] if len(parts) > 2 else "\n"
            existing_path.write_text(f"---{fm}---{body}", encoding="utf-8")
            return
    frontmatter = f"""---
title: {yaml_quote(meta["title"])}
description: {yaml_quote(meta["description"])}
pubDate: "2026-01-01T00:00:00"
useLiveHtml: true
---

"""
    existing_path.write_text(frontmatter, encoding="utf-8")


def migrate_slug(slug: str, force: bool = False) -> str:
    html_path = HTML_DIR / f"{slug}.html"
    if html_path.exists() and not force:
        return f"skip {slug}"

    page_html = curl(f"{BASE}/{slug}/")
    content = extract_elementor_html(page_html)
    if not content:
        raise RuntimeError("no elementor content found")

    meta = parse_meta(page_html, slug)
    HTML_DIR.mkdir(parents=True, exist_ok=True)
    html_path.write_text(content, encoding="utf-8")

    if slug.startswith("beste-"):
        write_product_mdx(slug, meta)
    else:
        write_blog_mdx(slug, meta, BLOG_DIR / f"{slug}.mdx")

    return f"ok {slug}"


def main() -> None:
    force = "--force" in sys.argv
    slugs = json.loads(SLUGS_PATH.read_text())
    product_slugs = sorted(s for s in slugs if s.startswith("beste-"))
    blog_slugs = sorted(p.stem for p in BLOG_DIR.glob("*.mdx"))
    all_slugs = sorted(set(product_slugs + blog_slugs))

    if not force:
        all_slugs = [s for s in all_slugs if not (HTML_DIR / f"{s}.html").exists()]

    total = len(all_slugs)
    print(f"Migrating HTML for {total} remaining pages (force={force})...", flush=True)
    if total == 0:
        print("Nothing to do — all pages already migrated.", flush=True)
        return

    ok = skip = err = 0
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(migrate_slug, slug, force): slug for slug in all_slugs}
        for i, future in enumerate(as_completed(futures), 1):
            slug = futures[future]
            try:
                result = future.result()
                if result.startswith("skip"):
                    skip += 1
                else:
                    ok += 1
                    print(f"[{i}/{total}] {result}", flush=True)
            except Exception as exc:
                err += 1
                print(f"[{i}/{total}] error {slug}: {exc}", flush=True)

    print(f"Done: {ok} migrated, {skip} skipped, {err} errors.", flush=True)


if __name__ == "__main__":
    main()
