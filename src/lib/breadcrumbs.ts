/**
 * Normalize Elementor/ZBMP breadcrumbs into a single clean trail.
 * Never emits raw HTML as visible text.
 */

export interface Crumb {
  label: string;
  href?: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeHref(href: string): string {
  try {
    if (href.startsWith('http')) {
      const url = new URL(href);
      if (url.hostname.includes('ilsemagazine.nl')) {
        return url.pathname.endsWith('/') || url.pathname === ''
          ? url.pathname || '/'
          : `${url.pathname}/`;
      }
    }
  } catch {
    /* keep as-is */
  }
  if (href === 'https://ilsemagazine.nl' || href === 'http://ilsemagazine.nl') return '/';
  return href;
}

function capitalizeLabel(label: string): string {
  if (!label) return label;
  // Single slug-like token: "schutting" → "Schutting"
  if (/^[a-z0-9-]+$/i.test(label) && !label.includes(' ')) {
    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  }
  // Already mixed / multi-word — keep, but ensure first letter uppercase
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Reject anything that looks like markup fragments. */
function isJunkLabel(label: string): boolean {
  const t = label.trim();
  if (!t) return true;
  if (/[<>]|<\//.test(t)) return true;
  if (/&lt;|&gt;|&#/.test(t)) return true;
  if (/\bid\s*=|\bclass\s*=|\bhref\s*=|\baria-/i.test(t)) return true;
  if (/^(p|span|a|div|ol|li|meta|nav|ul)$/i.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  if (t.length > 180) return true;
  return false;
}

function extractCrumbsFromZbmp(olHtml: string): Crumb[] {
  const crumbs: Crumb[] = [];
  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;

  while ((match = liRe.exec(olHtml)) !== null) {
    const li = match[1];
    const link = li.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (link) {
      const href = normalizeHref(link[1]);
      let label = stripTags(link[2]);
      if (!label) {
        const meta =
          li.match(/itemprop=["']name["'][^>]*content=["']([^"']+)["']/i) ||
          li.match(/content=["']([^"']+)["'][^>]*itemprop=["']name["']/i);
        label = meta?.[1] ?? (href === '/' ? 'Home' : '');
      }
      if (label && !isJunkLabel(label)) {
        crumbs.push({ label: capitalizeLabel(label), href });
      }
      continue;
    }

    const nameSpan =
      li.match(/<span[^>]*itemprop=["']name["'][^>]*>([\s\S]*?)<\/span>/i) ||
      li.match(/itemprop=["']name["'][^>]*>([\s\S]*?)<\/span>/i);
    const label = stripTags(nameSpan?.[1] ?? '');
    if (label && !isJunkLabel(label)) crumbs.push({ label: capitalizeLabel(label) });
  }

  return crumbs;
}

function extractSimpleCrumbs(inner: string): Crumb[] {
  const crumbs: Crumb[] = [];

  const lastMatch = inner.match(
    /class=["']breadcrumb_last["'][^>]*>([\s\S]*?)<\/span>/i
  );
  const lastLabel = lastMatch ? stripTags(lastMatch[1]) : '';

  const linkRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRe.exec(inner)) !== null) {
    // Ignore empty icon-only home links inside nested markup noise
    const href = normalizeHref(linkMatch[1]);
    const label = stripTags(linkMatch[2]);
    if (!label || isJunkLabel(label)) {
      if (!label && href === '/') {
        crumbs.push({ label: 'Home', href: '/' });
      }
      continue;
    }
    crumbs.push({ label: capitalizeLabel(label), href });
  }

  if (lastLabel && !isJunkLabel(lastLabel)) {
    const already = crumbs.some(
      (c) => c.label.toLowerCase() === lastLabel.toLowerCase()
    );
    if (!already) crumbs.push({ label: capitalizeLabel(lastLabel) });
  }

  return crumbs;
}

function dedupeCrumbs(crumbs: Crumb[]): Crumb[] {
  const out: Crumb[] = [];
  for (const crumb of crumbs) {
    if (isJunkLabel(crumb.label)) continue;
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.label.toLowerCase() === crumb.label.toLowerCase()
    ) {
      if (!prev.href && crumb.href) prev.href = crumb.href;
      continue;
    }
    out.push({ ...crumb });
  }

  if (out.length === 0 || out[0].label.toLowerCase() !== 'home') {
    out.unshift({ label: 'Home', href: '/' });
  } else {
    out[0] = { label: 'Home', href: out[0].href || '/' };
  }

  // If somehow only junk survived, keep Home only
  return out.filter((c, i) => i === 0 || !isJunkLabel(c.label));
}

export function buildBreadcrumbHtml(crumbs: Crumb[]): string {
  const clean = dedupeCrumbs(crumbs);
  const items = clean
    .map((crumb, index) => {
      const isLast = index === clean.length - 1;
      if (isLast || !crumb.href) {
        return `<li class="page-breadcrumbs__item"${isLast ? ' aria-current="page"' : ''}><span class="page-breadcrumbs__current">${escapeHtml(crumb.label)}</span></li>`;
      }
      return `<li class="page-breadcrumbs__item"><a class="page-breadcrumbs__link" href="${escapeHtml(crumb.href)}">${escapeHtml(crumb.label)}</a></li>`;
    })
    .join('<li class="page-breadcrumbs__sep" aria-hidden="true">&gt;</li>');

  return `<nav class="page-breadcrumbs" aria-label="Breadcrumb"><ol class="page-breadcrumbs__list">${items}</ol></nav>`;
}

export function extractBreadcrumbs(breadcrumbBlock: string): Crumb[] {
  const zbmp = breadcrumbBlock.match(
    /<ol\b[^>]*class="[^"]*zbmp-breadcrumb[^"]*"[^>]*>([\s\S]*?)<\/ol>/i
  );
  if (zbmp) {
    return dedupeCrumbs(extractCrumbsFromZbmp(zbmp[1]));
  }
  return dedupeCrumbs(extractSimpleCrumbs(breadcrumbBlock));
}

function fallbackCrumbsFromPage(html: string): Crumb[] {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title = h1 ? stripTags(h1[1]) : '';
  if (title && !isJunkLabel(title)) {
    return [
      { label: 'Home', href: '/' },
      { label: title },
    ];
  }
  return [{ label: 'Home', href: '/' }];
}

/** Replace every breadcrumbs widget with a clean single-line trail. */
export function normalizeBreadcrumbs(html: string): string {
  let result = html.replace(
    /<div([^>]*\belementor-widget-breadcrumbs\b[^>]*)>[\s\S]*?<div class="elementor-widget-container">([\s\S]*?)<\/div>\s*<\/div>/gi,
    (_full, widgetAttrs, containerInner) => {
      let crumbs = extractBreadcrumbs(containerInner);
      // If parser failed and produced suspiciously many crumbs, fall back
      if (crumbs.length > 6 || crumbs.some((c) => isJunkLabel(c.label))) {
        crumbs = fallbackCrumbsFromPage(html);
      }
      return `<div${widgetAttrs}><div class="elementor-widget-container">${buildBreadcrumbHtml(crumbs)}</div></div>`;
    }
  );

  // Safety: remove any leftover legacy breadcrumb paragraphs outside our nav
  result = result.replace(
    /<p\b[^>]*id=["']breadcrumbs["'][^>]*>[\s\S]*?<\/p>/gi,
    ''
  );

  return result;
}
