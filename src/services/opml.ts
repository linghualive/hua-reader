import { XMLParser } from 'fast-xml-parser';

export interface OpmlFeed {
  title: string;
  xmlUrl: string;
}

export interface OpmlCategory {
  name: string;
  feeds: OpmlFeed[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function parseOutline(outline: Record<string, unknown>): OpmlFeed | null {
  const xmlUrl = outline['@_xmlUrl'] as string | undefined;
  if (!xmlUrl) return null;
  const title =
    (outline['@_title'] as string) ||
    (outline['@_text'] as string) ||
    xmlUrl;
  return { title, xmlUrl };
}

export function parseOpml(xml: string): OpmlCategory[] {
  const parsed = parser.parse(xml);
  const body = parsed?.opml?.body;
  if (!body) throw new Error('Invalid OPML: missing body element');

  const outlines = body.outline
    ? Array.isArray(body.outline)
      ? body.outline
      : [body.outline]
    : [];

  const categories: OpmlCategory[] = [];

  for (const outline of outlines) {
    const record = outline as Record<string, unknown>;

    // Check if this outline is a feed itself (flat structure)
    const feed = parseOutline(record);
    if (feed) {
      // Flat outline: add to "Uncategorized"
      let uncategorized = categories.find((c) => c.name === '未分类');
      if (!uncategorized) {
        uncategorized = { name: '未分类', feeds: [] };
        categories.push(uncategorized);
      }
      uncategorized.feeds.push(feed);
      continue;
    }

    // Nested outline: this is a category with child feeds
    const categoryName =
      (record['@_title'] as string) ||
      (record['@_text'] as string) ||
      '未分类';
    const children = record['outline']
      ? Array.isArray(record['outline'])
        ? record['outline']
        : [record['outline']]
      : [];

    const feeds: OpmlFeed[] = [];
    for (const child of children) {
      const childFeed = parseOutline(child as Record<string, unknown>);
      if (childFeed) feeds.push(childFeed);
    }

    if (feeds.length > 0) {
      categories.push({ name: categoryName, feeds });
    }
  }

  return categories;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateOpml(categories: OpmlCategory[]): string {
  let body = '';

  for (const category of categories) {
    body += `    <outline text="${escapeXml(category.name)}" title="${escapeXml(category.name)}">\n`;
    for (const feed of category.feeds) {
      body += `      <outline type="rss" text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.xmlUrl)}" />\n`;
    }
    body += '    </outline>\n';
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Hua Reader Feeds</title>
  </head>
  <body>
${body}  </body>
</opml>`;
}
