#!/usr/bin/env python3
"""Verify internal links from nav, footer, homepage, and built dist output."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
DATA = ROOT / "src/data"


def curl_head(path: str) -> int:
    url = f"http://localhost:4321{path}" if not path.startswith("http") else path
    if path.startswith("http"):
        result = subprocess.run(
            ["curl", "-sfL", "-o", "/dev/null", "-w", "%{http_code}", url],
            capture_output=True,
            text=True,
            timeout=15,
        )
    else:
        file_path = DIST / path.strip("/") / "index.html" if path != "/" else DIST / "index.html"
        return 200 if file_path.exists() else 404
    try:
        return int(result.stdout.strip())
    except ValueError:
        return 0


def collect_hrefs_from_ts(path: Path) -> list[str]:
    text = path.read_text()
    return re.findall(r"href:\s*['\"]([^'\"]+)['\"]", text)


def collect_hrefs_from_html(html: str) -> list[str]:
    return re.findall(r'href="(/[^"#?][^"]*)"', html)


def main() -> None:
    if not DIST.exists():
        print("dist/ not found — run npm run build first")
        raise SystemExit(1)

    internal: set[str] = set()

    for ts in [DATA / "navigation.ts", DATA / "footer.ts", DATA / "homepage.ts"]:
        if ts.exists():
            for href in collect_hrefs_from_ts(ts):
                if href.startswith("/") and not href.startswith("//"):
                    internal.add(href.rstrip("/") + "/" if href != "/" else "/")

    for html_file in DIST.rglob("index.html"):
        rel = html_file.relative_to(DIST)
        slug_dir = str(rel.parent).replace("\\", "/")
        if slug_dir == ".":
            page_path = "/"
        else:
            page_path = f"/{slug_dir}/"
        for href in collect_hrefs_from_html(html_file.read_text(errors="ignore")):
            if href.startswith("/") and not href.startswith("//"):
                if not any(
                    href.endswith(ext)
                    for ext in (".css", ".js", ".png", ".jpg", ".webp", ".svg", ".ico", ".woff2")
                ):
                    internal.add(href if href.endswith("/") or href == "/" else href + "/")

    missing: list[tuple[str, str]] = []
    for href in sorted(internal):
        path = href if href != "/" else "/"
        status = curl_head(path)
        if status != 200:
            missing.append((href, str(status)))

    print(f"Checked {len(internal)} internal links")
    if missing:
        print(f"Missing/broken ({len(missing)}):")
        for href, status in missing[:50]:
            print(f"  {status} {href}")
        raise SystemExit(1)

    print("All internal links resolve OK")


if __name__ == "__main__":
    main()
