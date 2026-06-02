const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text: string, from: string = 'auto', to: string = 'zh-CN'): Promise<string> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: from,
    tl: to,
    dt: 't',
    q: text,
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`);
  if (!response.ok) throw new Error(`Translation failed: ${response.status}`);

  const data = await response.json();
  return (data[0] as any[]).map((s: any) => s[0]).join('');
}

export async function translateHtmlParagraphs(html: string): Promise<string> {
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
  if (paragraphs.length === 0) {
    const plain = html.replace(/<[^>]*>/g, '').trim();
    if (!plain) return html;
    const translated = await translateText(plain);
    return html + `\n<p style="color:#666;font-style:italic;margin-top:12px">${escapeHtml(translated)}</p>`;
  }

  let result = html;
  // Translate in batches to avoid URL length limits
  const batchSize = 3;
  for (let i = 0; i < paragraphs.length; i += batchSize) {
    const batch = paragraphs.slice(i, i + batchSize);
    const textsToTranslate = batch.map(p => p.replace(/<[^>]*>/g, '').trim()).filter(t => t.length > 0);
    if (textsToTranslate.length === 0) continue;

    try {
      const translations = await Promise.all(
        textsToTranslate.map(t => translateText(t))
      );

      let translationIdx = 0;
      for (const p of batch) {
        const plainText = p.replace(/<[^>]*>/g, '').trim();
        if (!plainText) continue;
        const translated = translations[translationIdx++];
        if (translated && translated !== plainText) {
          const translatedBlock = `<div style="color:#888;font-size:0.9em;line-height:1.6;margin:4px 0 16px;padding:8px 12px;border-left:3px solid #4F46E5;background:rgba(79,70,229,0.05);border-radius:0 6px 6px 0">${escapeHtml(translated)}</div>`;
          result = result.replace(p, p + translatedBlock);
        }
      }
    } catch {
      // Skip failed batch
    }
  }

  return result;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
