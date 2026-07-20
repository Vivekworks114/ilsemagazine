/**
 * Ensure blog/article HTML has a visible H1 when Elementor omitted the title.
 * Matches live theme-post-title widget markup.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function ensureArticleTitle(html: string, title: string): string {
  if (!title?.trim()) return html;
  if (/<h1\b/i.test(html)) return html;

  const titleBlock = `<div class="elementor-element elementor-widget elementor-widget-theme-post-title elementor-page-title elementor-widget-heading article-page__title-widget" data-widget_type="theme-post-title.default"><div class="elementor-widget-container"><h1 class="elementor-heading-title elementor-size-default article-page__title">${escapeHtml(title.trim())}</h1></div></div>`;

  // Live order: breadcrumbs → title → post-info
  if (/elementor-widget-breadcrumbs/i.test(html)) {
    return html.replace(
      /(<div[^>]*\belementor-widget-breadcrumbs\b[\s\S]*?<\/div>\s*<\/div>)/i,
      `$1\n${titleBlock}`
    );
  }

  if (/elementor-widget-post-info/i.test(html)) {
    return html.replace(
      /(<div[^>]*\belementor-widget-post-info\b[\s\S]*?<\/div>\s*<\/div>)/i,
      `${titleBlock}\n$1`
    );
  }

  return html.replace(
    /(<div[^>]*\belementor-col-66\b[^>]*>\s*<div[^>]*\belementor-widget-wrap\b[^>]*>)/i,
    `$1\n${titleBlock}`
  );
}
