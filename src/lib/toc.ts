export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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

function isTocTitle(attrs: string): boolean {
  return (
    /elementor-toc__header-title/i.test(attrs) ||
    /id=["']inhoudsopgave["']/i.test(attrs)
  );
}

/** Extract h2–h6 from article content, excluding sidebar columns. */
export function extractHeadings(html: string): TocItem[] {
  // Drop sidebar columns so FAQ / related headings are not indexed
  const withoutSidebar = html.replace(
    /<div[^>]*\bclass="[^"]*\belementor-col-33\b[^"]*"[^>]*>[\s\S]*?(?=<section[^>]*\belementor-top-section\b|<div[^>]*\bclass="[^"]*\belementor-col-66\b|$)/gi,
    ''
  );

  const headingRe = /<h([2-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const items: TocItem[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = headingRe.exec(withoutSidebar)) !== null) {
    const level = Number(match[1]);
    const attrs = match[2];
    const inner = match[3];

    if (isTocTitle(attrs)) continue;

    const text = stripTags(inner);
    if (!text) continue;

    const idAttr = attrs.match(/\bid=["']([^"']+)["']/i);
    let id = idAttr ? idAttr[1] : slugify(text);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    items.push({ id, text, level });
  }

  return items;
}

/** Hierarchical TOC list matching Elementor hierarchical_view. */
export function buildTocHtml(items: TocItem[]): string {
  if (items.length === 0) {
    return '<p class="elementor-toc__empty">Er zijn geen kopteksten gevonden op deze pagina.</p>';
  }

  type Node = { item: TocItem; children: Node[] };
  const root: Node[] = [];
  const stack: { level: number; node: Node }[] = [];

  for (const item of items) {
    const node: Node = { item, children: [] };

    while (stack.length && item.level <= stack[stack.length - 1].level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ level: item.level, node });
  }

  function render(nodes: Node[]): string {
    if (!nodes.length) return '';
    return (
      `<ol class="elementor-toc__list">` +
      nodes
        .map(
          (n) =>
            `<li class="elementor-toc__list-item"><a class="elementor-toc__link" href="#${escapeHtml(n.item.id)}">${escapeHtml(n.item.text)}</a>${render(n.children)}</li>`
        )
        .join('') +
      `</ol>`
    );
  }

  return render(root);
}

/** Ensure heading ids exist, then inject TOC lists into every TOC widget body. */
export function injectTableOfContents(html: string): string {
  const items = extractHeadings(html);
  const tocHtml = buildTocHtml(items);

  let result = html.replace(
    /<h([2-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (full, level, attrs, inner) => {
      if (isTocTitle(attrs) || /\bid=["']/i.test(attrs)) return full;
      const text = stripTags(inner);
      if (!text) return full;
      return `<h${level}${attrs} id="${slugify(text)}">${inner}</h${level}>`;
    }
  );

  result = result.replace(
    /<div([^>]*class="[^"]*elementor-toc__body[^"]*"[^>]*)>[\s\S]*?<\/div>/gi,
    (_full, attrs) => `<div${attrs}>${tocHtml}</div>`
  );

  result = result.replace(
    /(<div[^>]*class="[^"]*elementor-toc__header-title[^"]*"[^>]*>)\s*Inhoud\s*(<\/div>)/gi,
    '$1Inhoudsopgave$2'
  );
  result = result.replace(
    /(<h[1-6][^>]*class="[^"]*elementor-toc__header-title[^"]*"[^>]*>)\s*Inhoud\s*(<\/h[1-6]>)/gi,
    '$1Inhoudsopgave$2'
  );

  return result;
}
