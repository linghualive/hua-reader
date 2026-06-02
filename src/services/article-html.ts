export interface ArticleHtmlOptions {
  title: string;
  feedName: string;
  date: string;
  readingTime: string;
  content: string;
  fontSize: number;
  lineHeight: number;
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function generateArticleHtml(opts: ArticleHtmlOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="referrer" content="no-referrer" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      max-width: 100%;
    }

    body {
      font-family: "Inter", -apple-system, "PingFang SC", "Noto Sans SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      font-size: ${opts.fontSize}px;
      line-height: ${opts.lineHeight};
      color: ${opts.textColor};
      background-color: ${opts.backgroundColor};
      padding: 24px 20px 60px;
      -webkit-text-size-adjust: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      font-feature-settings: "kern" 1, "liga" 1;
      letter-spacing: -0.01em;
    }

    .article-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid ${opts.secondaryColor}22;
    }

    .article-title {
      font-family: "Inter", -apple-system, "PingFang SC", sans-serif;
      font-size: 1.65em;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 14px;
      color: ${opts.textColor};
      letter-spacing: -0.025em;
    }

    .article-meta {
      font-size: 0.82em;
      color: ${opts.secondaryColor};
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .article-meta .separator {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: ${opts.secondaryColor}66;
      display: inline-block;
    }

    .article-content {
      font-size: 1em;
      line-height: ${opts.lineHeight};
    }

    .article-content p {
      margin-bottom: 1.25em;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
    }

    .article-content img {
      max-width: 100% !important;
      width: auto !important;
      height: auto !important;
      border-radius: 10px;
      margin: 20px 0;
      display: block;
      object-fit: contain;
    }

    .article-content table {
      display: block;
      overflow-x: auto;
    }

    .article-content pre {
      overflow-x: auto;
    }

    .article-content iframe, .article-content video, .article-content embed {
      max-width: 100% !important;
    }

    .article-content a {
      color: ${opts.accentColor};
      text-decoration: none;
      border-bottom: 1px solid ${opts.accentColor}40;
      transition: border-color 0.2s;
    }

    .article-content blockquote {
      margin: 20px 0;
      padding: 14px 20px;
      border-left: 3px solid ${opts.accentColor};
      background-color: ${opts.secondaryColor}08;
      border-radius: 0 10px 10px 0;
      color: ${opts.secondaryColor};
      font-style: italic;
    }

    .article-content blockquote p {
      margin-bottom: 0.5em;
    }

    .article-content blockquote p:last-child {
      margin-bottom: 0;
    }

    .article-content pre {
      margin: 20px 0;
      padding: 18px;
      background-color: ${opts.secondaryColor}0c;
      border-radius: 10px;
      overflow-x: auto;
      font-size: 0.88em;
      line-height: 1.6;
      border: 1px solid ${opts.secondaryColor}12;
    }

    .article-content code {
      font-family: "SF Mono", "Fira Code", "JetBrains Mono", "Consolas", monospace;
      font-size: 0.88em;
      background-color: ${opts.secondaryColor}0c;
      padding: 3px 7px;
      border-radius: 5px;
    }

    .article-content pre code {
      background: none;
      padding: 0;
      border-radius: 0;
    }

    .article-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.9em;
      border-radius: 8px;
      overflow: hidden;
    }

    .article-content th,
    .article-content td {
      padding: 10px 14px;
      border: 1px solid ${opts.secondaryColor}20;
      text-align: left;
    }

    .article-content th {
      background-color: ${opts.secondaryColor}08;
      font-weight: 600;
    }

    .article-content h1,
    .article-content h2,
    .article-content h3,
    .article-content h4,
    .article-content h5,
    .article-content h6 {
      font-family: "Inter", -apple-system, "PingFang SC", sans-serif;
      margin-top: 1.8em;
      margin-bottom: 0.6em;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }

    .article-content h1 { font-size: 1.5em; }
    .article-content h2 { font-size: 1.35em; }
    .article-content h3 { font-size: 1.2em; }
    .article-content h4 { font-size: 1.1em; }

    .article-content ul,
    .article-content ol {
      margin: 16px 0;
      padding-left: 1.8em;
    }

    .article-content li {
      margin-bottom: 8px;
      line-height: ${opts.lineHeight};
    }

    .article-content li::marker {
      color: ${opts.accentColor};
    }

    .article-content hr {
      border: none;
      border-top: 1px solid ${opts.secondaryColor}20;
      margin: 32px 0;
    }

    .article-content figure {
      margin: 24px 0;
      text-align: center;
    }

    .article-content figcaption {
      font-size: 0.82em;
      color: ${opts.secondaryColor};
      margin-top: 10px;
      font-style: italic;
    }

    .article-content strong, .article-content b {
      font-weight: 600;
      color: ${opts.textColor};
    }

    .article-content em, .article-content i {
      font-style: italic;
    }

    .article-content video,
    .article-content iframe {
      max-width: 100%;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <header class="article-header">
    <h1 class="article-title">${escapeHtml(opts.title)}</h1>
    <div class="article-meta">
      <span>${escapeHtml(opts.feedName)}</span>
      <span class="separator"></span>
      <span>${escapeHtml(opts.date)}</span>
      <span class="separator"></span>
      <span>${escapeHtml(opts.readingTime)}</span>
    </div>
  </header>
  <article class="article-content">
    ${processContent(opts.content)}
  </article>
  <script>
    (function() {
      document.querySelectorAll('img').forEach(function(img) {
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.setAttribute('loading', 'lazy');
        img.setAttribute('referrerpolicy', 'no-referrer');
        img.onerror = function() { this.style.display = 'none'; };
      });

      // Tap center to toggle bars
      var tapStart = 0;
      document.addEventListener('touchstart', function(e) { tapStart = Date.now(); }, { passive: true });
      document.addEventListener('touchend', function(e) {
        var elapsed = Date.now() - tapStart;
        if (elapsed < 200 && e.changedTouches.length === 1) {
          var touch = e.changedTouches[0];
          var y = touch.clientY / window.innerHeight;
          var x = touch.clientX / window.innerWidth;
          if (y > 0.25 && y < 0.75 && x > 0.15 && x < 0.85) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'toggle_bars' }));
            }
          }
        }
      }, { passive: true });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function processContent(html: string): string {
  if (!html) return '<p>暂无内容</p>';
  return html.replace(/\s+(width|height)=["']?\d+["']?/gi, '');
}
