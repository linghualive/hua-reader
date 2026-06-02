import { parseOpml, generateOpml, type OpmlCategory } from '@/services/opml';

const NESTED_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test</title></head>
  <body>
    <outline text="Tech" title="Tech">
      <outline type="rss" text="Hacker News" title="Hacker News" xmlUrl="https://hnrss.org/frontpage" />
      <outline type="rss" text="Ars Technica" title="Ars Technica" xmlUrl="https://feeds.arstechnica.com/arstechnica/index" />
    </outline>
    <outline text="News" title="News">
      <outline type="rss" text="BBC" title="BBC" xmlUrl="https://feeds.bbci.co.uk/news/rss.xml" />
    </outline>
  </body>
</opml>`;

const FLAT_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test</title></head>
  <body>
    <outline type="rss" text="Feed 1" xmlUrl="https://example.com/feed1.xml" />
    <outline type="rss" text="Feed 2" xmlUrl="https://example.com/feed2.xml" />
  </body>
</opml>`;

describe('parseOpml', () => {
  it('parses nested OPML with categories', () => {
    const categories = parseOpml(NESTED_OPML);
    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe('Tech');
    expect(categories[0].feeds).toHaveLength(2);
    expect(categories[0].feeds[0].title).toBe('Hacker News');
    expect(categories[0].feeds[0].xmlUrl).toBe('https://hnrss.org/frontpage');
  });

  it('parses second category', () => {
    const categories = parseOpml(NESTED_OPML);
    expect(categories[1].name).toBe('News');
    expect(categories[1].feeds).toHaveLength(1);
    expect(categories[1].feeds[0].title).toBe('BBC');
  });

  it('handles flat OPML (feeds without categories)', () => {
    const categories = parseOpml(FLAT_OPML);
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('未分类');
    expect(categories[0].feeds).toHaveLength(2);
    expect(categories[0].feeds[0].title).toBe('Feed 1');
    expect(categories[0].feeds[1].xmlUrl).toBe('https://example.com/feed2.xml');
  });

  it('throws on invalid OPML', () => {
    expect(() => parseOpml('<html>not opml</html>')).toThrow('Invalid OPML');
  });

  it('handles single outline (not array)', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0"><head><title>T</title></head>
<body>
  <outline text="Cat">
    <outline type="rss" text="F" xmlUrl="https://a.com/feed" />
  </outline>
</body></opml>`;
    const categories = parseOpml(xml);
    expect(categories).toHaveLength(1);
    expect(categories[0].feeds).toHaveLength(1);
  });

  it('uses @_text as fallback for @_title', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0"><head><title>T</title></head>
<body>
  <outline type="rss" text="NoTitle" xmlUrl="https://a.com/feed" />
</body></opml>`;
    const categories = parseOpml(xml);
    expect(categories[0].feeds[0].title).toBe('NoTitle');
  });
});

describe('generateOpml', () => {
  it('generates valid OPML structure', () => {
    const categories: OpmlCategory[] = [
      {
        name: 'Tech',
        feeds: [
          { title: 'HN', xmlUrl: 'https://hnrss.org/frontpage' },
        ],
      },
    ];
    const opml = generateOpml(categories);
    expect(opml).toContain('<?xml version="1.0"');
    expect(opml).toContain('<opml version="2.0">');
    expect(opml).toContain('Hua Reader Feeds');
    expect(opml).toContain('text="Tech"');
    expect(opml).toContain('xmlUrl="https://hnrss.org/frontpage"');
  });

  it('escapes special XML characters', () => {
    const categories: OpmlCategory[] = [
      {
        name: 'A & B',
        feeds: [
          { title: '"Test" <Feed>', xmlUrl: 'https://a.com/feed?a=1&b=2' },
        ],
      },
    ];
    const opml = generateOpml(categories);
    expect(opml).toContain('A &amp; B');
    expect(opml).toContain('&quot;Test&quot; &lt;Feed&gt;');
    expect(opml).toContain('a=1&amp;b=2');
  });

  it('roundtrips through parse and generate', () => {
    const original: OpmlCategory[] = [
      {
        name: 'Tech',
        feeds: [
          { title: 'Feed A', xmlUrl: 'https://a.com/rss' },
          { title: 'Feed B', xmlUrl: 'https://b.com/rss' },
        ],
      },
      {
        name: 'News',
        feeds: [
          { title: 'Feed C', xmlUrl: 'https://c.com/rss' },
        ],
      },
    ];
    const opml = generateOpml(original);
    const parsed = parseOpml(opml);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe('Tech');
    expect(parsed[0].feeds).toHaveLength(2);
    expect(parsed[0].feeds[0].title).toBe('Feed A');
    expect(parsed[1].name).toBe('News');
    expect(parsed[1].feeds[0].xmlUrl).toBe('https://c.com/rss');
  });
});
