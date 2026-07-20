import { pages } from './pages';

export interface SitemapLink {
  title: string;
  href: string;
}

export interface SitemapSection {
  title: string;
  links: SitemapLink[];
}

export interface SitemapCategoryGroup {
  category: string;
  links: SitemapLink[];
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*-\s*ilsemagazine$/i, '')
    .replace(/^Ilse'?s\s+/i, '')
    .replace(/^Page not found.*$/i, '')
    .trim();
}

function productLabel(title: string): string {
  const cleaned = cleanTitle(title);
  if (/^Top\s*10/i.test(cleaned)) return cleaned;
  // "Top 10 beste X" style from live site often shortens to "Top 10 X"
  return cleaned.replace(/^Top\s*10\s+beste\s+/i, 'Top 10 ');
}

const STATIC_PAGES: { slug: string; title: string; href?: string }[] = [
  { slug: 'afrastering', title: 'Afrastering' },
  { slug: 'blog', title: 'Blog', href: '/blog/' },
  { slug: 'contact', title: 'Contact', href: '/contact/' },
  { slug: 'kleding-en-schoeisel', title: 'Kleding en Schoeisel' },
  { slug: 'home', title: 'Home', href: '/' },
  { slug: 'over-mij', title: 'Over mij' },
  { slug: 'sitemap', title: 'Sitemap', href: '/sitemap/' },
  { slug: 'tuin', title: 'Tuin' },
  { slug: 'tuindecoratie', title: 'Tuindecoratie' },
  { slug: 'tuingereedschap', title: 'Tuingereedschap' },
  { slug: 'tuinier-blogs', title: 'Tuinier blogs' },
  { slug: 'tuinieren', title: 'Tuinieren' },
  { slug: 'tuinopslag', title: 'Tuinopslag' },
  { slug: 'verzorging', title: 'Verzorging' },
  { slug: 'wonen', title: 'Wonen' },
];

export function getSitemapPages(): SitemapLink[] {
  const links: SitemapLink[] = [];

  for (const item of STATIC_PAGES) {
    if (item.href) {
      links.push({ title: item.title, href: item.href });
      continue;
    }

    const page = pages[item.slug];
    if (!page) continue;

    const href = page.url.endsWith('/') ? page.url : `${page.url}/`;
    links.push({ title: item.title, href });
  }

  return links.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
}

export function getSitemapProducts(): SitemapLink[] {
  return Object.values(pages)
    .filter((p) => p.type === 'product' && p.slug && p.slug !== 'home')
    .map((p) => ({
      title: productLabel(p.title),
      href: p.url.endsWith('/') ? p.url : `${p.url}/`,
    }))
    .filter((l) => l.title)
    .sort((a, b) => a.title.localeCompare(b.title, 'nl'));
}

export function getSitemapArticles(): SitemapLink[] {
  return Object.values(pages)
    .filter(
      (p) =>
        p.type === 'article' &&
        p.slug &&
        !['home', 'sitemap', 'contact', '16'].includes(p.slug) &&
        !p.title.toLowerCase().includes('page not found')
    )
    .map((p) => ({
      title: cleanTitle(p.title) || p.slug,
      href: p.url.endsWith('/') ? p.url : `${p.url}/`,
    }))
    .filter((l) => l.title)
    .sort((a, b) => a.title.localeCompare(b.title, 'nl'));
}
