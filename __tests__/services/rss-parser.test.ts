import { parseRssFeed } from '@/services/rss-parser';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test RSS Feed</title>
    <link>https://example.com</link>
    <description>A test feed</description>
    <item>
      <title>First Article</title>
      <link>https://example.com/1</link>
      <description>&lt;p&gt;This is the first article summary.&lt;/p&gt;</description>
      <guid>article-1</guid>
      <pubDate>Mon, 01 Jun 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second Article</title>
      <link>https://example.com/2</link>
      <description>Plain text summary</description>
      <content:encoded><![CDATA[<p>Full content with <img src="https://example.com/img.jpg" /> image</p>]]></content:encoded>
      <guid>article-2</guid>
      <pubDate>Tue, 02 Jun 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const SAMPLE_ATOM = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <link href="https://example.com" rel="alternate" />
  <entry>
    <title>Atom Entry 1</title>
    <link href="https://example.com/atom/1" rel="alternate" />
    <id>atom-entry-1</id>
    <summary>Summary of atom entry 1</summary>
    <content type="html">&lt;p&gt;Full content of atom entry 1&lt;/p&gt;</content>
    <published>2026-06-01T12:00:00Z</published>
  </entry>
  <entry>
    <title>Atom Entry 2</title>
    <link href="https://example.com/atom/2" rel="alternate" />
    <id>atom-entry-2</id>
    <summary>Summary of atom entry 2</summary>
    <updated>2026-06-02T12:00:00Z</updated>
  </entry>
</feed>`;

describe('parseRssFeed', () => {
  describe('RSS 2.0', () => {
    it('parses feed title', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.title).toBe('Test RSS Feed');
    });

    it('parses all items', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.items).toHaveLength(2);
    });

    it('parses item title and url', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.items[0].title).toBe('First Article');
      expect(feed.items[0].url).toBe('https://example.com/1');
    });

    it('parses guid', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.items[0].guid).toBe('article-1');
    });

    it('parses pubDate', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.items[0].publishedAt).toContain('Mon, 01 Jun 2026');
    });

    it('strips HTML from summary', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.items[0].summary).toBe('This is the first article summary.');
    });

    it('extracts image URL from content:encoded', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.items[1].imageUrl).toBe('https://example.com/img.jpg');
    });

    it('uses content:encoded as content when available', () => {
      const feed = parseRssFeed(SAMPLE_RSS);
      expect(feed.items[1].content).toContain('<img src=');
    });

    it('truncates summary to 300 chars', () => {
      const longDescription = '<p>' + '这是一段很长的文字。'.repeat(50) + '</p>';
      const xml = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>T</title>
<item><title>Long</title><link>https://a.com</link>
<description>${longDescription}</description>
<guid>g</guid></item></channel></rss>`;
      const feed = parseRssFeed(xml);
      expect(feed.items[0].summary.length).toBeLessThanOrEqual(301); // 300 + ellipsis
    });
  });

  describe('Atom', () => {
    it('parses feed title', () => {
      const feed = parseRssFeed(SAMPLE_ATOM);
      expect(feed.title).toBe('Test Atom Feed');
    });

    it('parses all entries', () => {
      const feed = parseRssFeed(SAMPLE_ATOM);
      expect(feed.items).toHaveLength(2);
    });

    it('extracts link href from alternate link', () => {
      const feed = parseRssFeed(SAMPLE_ATOM);
      expect(feed.items[0].url).toBe('https://example.com/atom/1');
    });

    it('parses entry id as guid', () => {
      const feed = parseRssFeed(SAMPLE_ATOM);
      expect(feed.items[0].guid).toBe('atom-entry-1');
    });

    it('uses published date', () => {
      const feed = parseRssFeed(SAMPLE_ATOM);
      expect(feed.items[0].publishedAt).toBe('2026-06-01T12:00:00Z');
    });

    it('falls back to updated date when published is missing', () => {
      const feed = parseRssFeed(SAMPLE_ATOM);
      expect(feed.items[1].publishedAt).toBe('2026-06-02T12:00:00Z');
    });

    it('uses content as content field', () => {
      const feed = parseRssFeed(SAMPLE_ATOM);
      expect(feed.items[0].content).toContain('Full content of atom entry 1');
    });
  });

  describe('edge cases', () => {
    it('throws on unsupported format', () => {
      expect(() => parseRssFeed('<html><body>Not a feed</body></html>')).toThrow(
        'Unsupported feed format',
      );
    });

    it('handles single item (not array)', () => {
      const xml = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>T</title>
<item><title>Only</title><link>https://a.com</link>
<description>Desc</description><guid>g</guid></item>
</channel></rss>`;
      const feed = parseRssFeed(xml);
      expect(feed.items).toHaveLength(1);
      expect(feed.items[0].title).toBe('Only');
    });

    it('handles feed with no items', () => {
      const xml = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Empty</title></channel></rss>`;
      const feed = parseRssFeed(xml);
      expect(feed.items).toHaveLength(0);
    });
  });
});
