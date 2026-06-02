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
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      font-size: ${opts.fontSize}px;
      line-height: ${opts.lineHeight};
      color: ${opts.textColor};
      background-color: ${opts.backgroundColor};
      padding: 20px 16px 60px;
      -webkit-text-size-adjust: 100%;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .article-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid ${opts.secondaryColor}33;
    }

    .article-title {
      font-size: 1.5em;
      font-weight: 700;
      line-height: 1.4;
      margin-bottom: 12px;
      color: ${opts.textColor};
    }

    .article-meta {
      font-size: 0.85em;
      color: ${opts.secondaryColor};
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .article-content p {
      margin-bottom: 1em;
      text-align: justify;
    }

    .article-content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
      display: block;
    }

    .article-content a {
      color: ${opts.accentColor};
      text-decoration: none;
      border-bottom: 1px solid ${opts.accentColor}66;
    }

    .article-content a:active {
      opacity: 0.7;
    }

    .article-content blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      border-left: 4px solid ${opts.accentColor};
      background-color: ${opts.secondaryColor}11;
      border-radius: 0 8px 8px 0;
      color: ${opts.secondaryColor};
    }

    .article-content blockquote p {
      margin-bottom: 0.5em;
    }

    .article-content blockquote p:last-child {
      margin-bottom: 0;
    }

    .article-content pre {
      margin: 16px 0;
      padding: 16px;
      background-color: ${opts.secondaryColor}15;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.9em;
      line-height: 1.5;
    }

    .article-content code {
      font-family: "SF Mono", "Menlo", "Consolas", monospace;
      font-size: 0.9em;
      background-color: ${opts.secondaryColor}15;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .article-content pre code {
      background: none;
      padding: 0;
    }

    .article-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 0.9em;
    }

    .article-content th,
    .article-content td {
      padding: 8px 12px;
      border: 1px solid ${opts.secondaryColor}33;
      text-align: left;
    }

    .article-content th {
      background-color: ${opts.secondaryColor}11;
      font-weight: 600;
    }

    .article-content h1,
    .article-content h2,
    .article-content h3,
    .article-content h4,
    .article-content h5,
    .article-content h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.3;
    }

    .article-content h1 { font-size: 1.4em; }
    .article-content h2 { font-size: 1.3em; }
    .article-content h3 { font-size: 1.2em; }
    .article-content h4 { font-size: 1.1em; }

    .article-content ul,
    .article-content ol {
      margin: 12px 0;
      padding-left: 2em;
    }

    .article-content li {
      margin-bottom: 6px;
    }

    .article-content hr {
      border: none;
      border-top: 1px solid ${opts.secondaryColor}33;
      margin: 24px 0;
    }

    .article-content figure {
      margin: 16px 0;
      text-align: center;
    }

    .article-content figcaption {
      font-size: 0.85em;
      color: ${opts.secondaryColor};
      margin-top: 8px;
    }

    .article-content video,
    .article-content iframe {
      max-width: 100%;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <header class="article-header">
    <h1 class="article-title">${escapeHtml(opts.title)}</h1>
    <div class="article-meta">
      <span>${escapeHtml(opts.feedName)}</span>
      <span>${escapeHtml(opts.date)}</span>
      <span>${escapeHtml(opts.readingTime)}</span>
    </div>
  </header>
  <article class="article-content">
    ${processContent(opts.content)}
  </article>
  <script>
    (function() {
      // Remove hardcoded width/height from images for responsiveness
      document.querySelectorAll('img').forEach(function(img) {
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.setAttribute('loading', 'lazy');
      });

      // Report scroll progress
      var lastProgress = 0;
      function reportProgress() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        );
        var winHeight = window.innerHeight;
        var scrollable = docHeight - winHeight;
        var progress = scrollable > 0 ? Math.min(100, Math.round((scrollTop / scrollable) * 100)) : 100;
        if (progress !== lastProgress) {
          lastProgress = progress;
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'scroll_progress',
              progress: progress
            }));
          }
        }
      }

      window.addEventListener('scroll', reportProgress, { passive: true });
      reportProgress();
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
  // Remove hardcoded width/height attributes from img tags
  return html.replace(
    /\s+(width|height)=["']?\d+["']?/gi,
    '',
  );
}
