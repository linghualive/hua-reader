import { XMLParser } from 'fast-xml-parser';

export interface ParsedItem {
  title: string;
  summary: string;
  content: string;
  url: string;
  guid: string;
  imageUrl: string;
  publishedAt: string;
}

export interface ParsedFeed {
  title: string;
  items: ParsedItem[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: false,
});

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function safeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

function extractImageUrl(html: string): string {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function getText(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (typeof node === 'object' && node !== null && '#text' in node) {
    return String((node as Record<string, unknown>)['#text']);
  }
  return '';
}

function getContent(item: Record<string, unknown>): string {
  // Try content:encoded first (RSS 2.0 extension), then content, then description
  const contentEncoded =
    item['content:encoded'] ?? item['content_encoded'];
  if (contentEncoded) return getText(contentEncoded);

  const content = item['content'];
  if (content) {
    // Atom: content may have @_type attribute
    if (typeof content === 'object' && content !== null) {
      const contentObj = content as Record<string, unknown>;
      if ('#text' in contentObj) return String(contentObj['#text']);
      // Content might be nested XML - try to convert back
      return getText(content);
    }
    return getText(content);
  }

  return '';
}

function parseRssItems(items: unknown[]): ParsedItem[] {
  return items.map((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    const content = getContent(item) || getText(item['description']);
    const summary = getText(item['description']) || content;

    return {
      title: stripHtml(getText(item['title'])),
      summary: truncate(stripHtml(summary), 300),
      content: content || getText(item['description']),
      url: getText(item['link']),
      guid: getText(item['guid']) || getText(item['link']) || getText(item['title']),
      imageUrl: extractImageUrl(content || getText(item['description'])),
      publishedAt: safeDate(getText(item['pubDate']) || getText(item['dc:date'])),
    };
  });
}

function parseAtomItems(entries: unknown[]): ParsedItem[] {
  return entries.map((rawEntry) => {
    const entry = rawEntry as Record<string, unknown>;

    // Atom link can be object with @_href or array
    let url = '';
    const link = entry['link'];
    if (Array.isArray(link)) {
      const altLink = link.find(
        (l: Record<string, unknown>) =>
          l['@_rel'] === 'alternate' || !l['@_rel'],
      ) as Record<string, unknown> | undefined;
      url = altLink ? String(altLink['@_href'] ?? '') : '';
    } else if (typeof link === 'object' && link !== null) {
      url = String((link as Record<string, unknown>)['@_href'] ?? '');
    } else {
      url = getText(link);
    }

    const content =
      getContent(entry) || getText(entry['summary']);
    const summary = getText(entry['summary']) || content;

    return {
      title: stripHtml(getText(entry['title'])),
      summary: truncate(stripHtml(summary), 300),
      content: content || getText(entry['summary']),
      url,
      guid: getText(entry['id']) || url || getText(entry['title']),
      imageUrl: extractImageUrl(content || getText(entry['summary'])),
      publishedAt: safeDate(getText(entry['published']) || getText(entry['updated'])),
    };
  });
}

export function parseRssFeed(xml: string): ParsedFeed {
  const parsed = parser.parse(xml);

  // RSS 2.0
  if (parsed.rss) {
    const channel = parsed.rss.channel;
    const items = channel.item
      ? Array.isArray(channel.item)
        ? channel.item
        : [channel.item]
      : [];
    return {
      title: getText(channel.title),
      items: parseRssItems(items),
    };
  }

  // Atom
  if (parsed.feed) {
    const feed = parsed.feed;
    const entries = feed.entry
      ? Array.isArray(feed.entry)
        ? feed.entry
        : [feed.entry]
      : [];
    return {
      title: getText(feed.title),
      items: parseAtomItems(entries),
    };
  }

  throw new Error('Unsupported feed format: neither RSS 2.0 nor Atom detected');
}
