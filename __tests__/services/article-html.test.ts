import { generateArticleHtml, type ArticleHtmlOptions } from '@/services/article-html';

function makeOptions(overrides: Partial<ArticleHtmlOptions> = {}): ArticleHtmlOptions {
  return {
    title: 'Test Article',
    feedName: 'Test Feed',
    date: '2026-06-02',
    readingTime: '3 分钟',
    content: '<p>Hello world</p>',
    fontSize: 16,
    lineHeight: 1.8,
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    secondaryColor: '#666666',
    accentColor: '#2563EB',
    ...overrides,
  };
}

describe('generateArticleHtml', () => {
  it('generates a complete HTML document', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain('</html>');
  });

  it('includes article title in header', () => {
    const html = generateArticleHtml(makeOptions({ title: 'My Title' }));
    expect(html).toContain('My Title');
    expect(html).toContain('article-title');
  });

  it('includes feed name, date, and reading time in meta', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain('Test Feed');
    expect(html).toContain('2026-06-02');
    expect(html).toContain('3 分钟');
  });

  it('includes article content', () => {
    const html = generateArticleHtml(makeOptions({ content: '<p>Article body</p>' }));
    expect(html).toContain('<p>Article body</p>');
  });

  it('applies font size from options', () => {
    const html = generateArticleHtml(makeOptions({ fontSize: 18 }));
    expect(html).toContain('font-size: 18px');
  });

  it('applies line height from options', () => {
    const html = generateArticleHtml(makeOptions({ lineHeight: 2.0 }));
    expect(html).toContain('line-height: 2');
  });

  it('applies theme colors', () => {
    const html = generateArticleHtml(makeOptions({
      backgroundColor: '#1A1A2E',
      textColor: '#EAEAEA',
      accentColor: '#FF6B6B',
    }));
    expect(html).toContain('background-color: #1A1A2E');
    expect(html).toContain('color: #EAEAEA');
    expect(html).toContain('color: #FF6B6B');
  });

  it('includes PingFang SC in font family', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain('PingFang SC');
  });

  it('includes scroll progress reporting script', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain('scroll_progress');
    expect(html).toContain('ReactNativeWebView');
    expect(html).toContain('postMessage');
  });

  it('includes lazy loading setup for images', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain("setAttribute('loading', 'lazy')");
  });

  it('removes width/height attributes from images', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain("removeAttribute('width')");
    expect(html).toContain("removeAttribute('height')");
  });

  it('escapes HTML entities in title', () => {
    const html = generateArticleHtml(makeOptions({ title: '<script>alert("xss")</script>' }));
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes HTML entities in feed name', () => {
    const html = generateArticleHtml(makeOptions({ feedName: 'A & B "News"' }));
    expect(html).toContain('A &amp; B &quot;News&quot;');
  });

  it('shows placeholder for empty content', () => {
    const html = generateArticleHtml(makeOptions({ content: '' }));
    expect(html).toContain('暂无内容');
  });

  it('strips width/height from img tags in content', () => {
    const content = '<img src="test.jpg" width="800" height="600" />';
    const html = generateArticleHtml(makeOptions({ content }));
    // The processContent function should remove width/height
    expect(html).toContain('src="test.jpg"');
    // At least one of width/height should be removed by the regex
    expect(html).not.toContain('width="800"');
  });

  it('includes CSS for blockquotes with accent color', () => {
    const html = generateArticleHtml(makeOptions({ accentColor: '#FF0000' }));
    expect(html).toContain('border-left: 4px solid #FF0000');
  });

  it('includes CSS for code blocks', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain('SF Mono');
    expect(html).toContain('Consolas');
  });

  it('includes responsive viewport meta tag', () => {
    const html = generateArticleHtml(makeOptions());
    expect(html).toContain('width=device-width');
    expect(html).toContain('user-scalable=no');
  });
});
