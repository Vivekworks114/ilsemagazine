/**
 * Featured-image helpers: skip placeholders, avoid duplicates, inject into Elementor HTML.
 */

const PLACEHOLDER_HINTS = [
  '/images/2022/Rectangle-1-1', // migration default placeholder (not the real about-page photo)
  'Frame-496',
  'Favicon-ilsemagazine',
  'Vector18',
  'b7fff427-7f97-445e-9b1a-7b56a8c82e2a', // author avatar
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function imageBasenames(src: string): string[] {
  const file = src.split('/').pop() ?? src;
  const withoutSize = file.replace(/-\d+x\d+(?=\.[a-z]+$)/i, '');
  return [...new Set([file, withoutSize])];
}

function isPlaceholderImage(src: string): boolean {
  return PLACEHOLDER_HINTS.some((hint) => src.includes(hint));
}

export function isUsableFeaturedImage(src: string | undefined): src is string {
  if (!src?.trim()) return false;
  return !isPlaceholderImage(src);
}

/** Skip layout featured image when missing, placeholder, or already in the MDX body. */
export function shouldShowFeaturedImage(
  featuredImage: string | undefined,
  body: string | undefined
): boolean {
  if (!isUsableFeaturedImage(featuredImage)) return false;
  if (!body) return true;
  if (body.includes(featuredImage)) return false;
  return !imageBasenames(featuredImage).some((name) => body.includes(name));
}

/** True when HTML already has a real content image (not author/logo/placeholder). */
export function htmlHasContentImage(html: string): boolean {
  const srcs = [
    ...html.matchAll(/\b(?:src|data-lazy-src)=["']([^"']+)["']/gi),
  ].map((m) => m[1]);

  return srcs.some((src) => {
    if (!src || src.startsWith('data:')) return false;
    if (isPlaceholderImage(src)) return false;
    if (/300x(257|300)/.test(src)) return false;
    return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(src) || src.includes('/uploads/');
  });
}

export function injectFeaturedImage(
  html: string,
  featuredImage: string | undefined,
  alt: string
): string {
  if (!isUsableFeaturedImage(featuredImage)) return html;
  if (html.includes(featuredImage)) return html;
  if (htmlHasContentImage(html)) return html;
  // Live already has a featured-image widget
  if (/elementor-widget-theme-post-featured-image/i.test(html)) return html;

  const block = `<div class="elementor-element elementor-widget elementor-widget-theme-post-featured-image elementor-widget-image article-page__featured" data-widget_type="theme-post-featured-image.default"><div class="elementor-widget-container"><img class="article-page__featured-image" src="${escapeHtml(featuredImage)}" alt="${escapeHtml(alt)}" width="1280" height="720" loading="eager" decoding="async" /></div></div>`;

  // Live order preference: after post-info (date), else after title/H1, else after breadcrumbs
  if (/elementor-widget-post-info/i.test(html)) {
    return html.replace(
      /(<div[^>]*\belementor-widget-post-info\b[\s\S]*?<\/div>\s*<\/div>)/i,
      `$1\n${block}`
    );
  }

  if (/elementor-widget-theme-post-title|article-page__title-widget/i.test(html)) {
    return html.replace(
      /(<div[^>]*\b(?:elementor-widget-theme-post-title|article-page__title-widget)\b[\s\S]*?<\/div>\s*<\/div>)/i,
      `$1\n${block}`
    );
  }

  if (/elementor-widget-heading[\s\S]*?<h1\b/i.test(html)) {
    return html.replace(
      /(<div[^>]*\belementor-widget-heading\b[\s\S]*?<h1\b[\s\S]*?<\/div>\s*<\/div>)/i,
      `$1\n${block}`
    );
  }

  if (/elementor-widget-breadcrumbs/i.test(html)) {
    return html.replace(
      /(<div[^>]*\belementor-widget-breadcrumbs\b[\s\S]*?<\/div>\s*<\/div>)/i,
      `$1\n${block}`
    );
  }

  return `${block}\n${html}`;
}
