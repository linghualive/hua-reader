const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

function isChinese(text: string): boolean {
  const chineseChars = text.match(/[一-鿿]/g) || [];
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && chineseChars.length / totalChars > 0.3;
}

export async function detectAndTranslate(text: string): Promise<{ translated: string; targetLang: string }> {
  const targetLang = isChinese(text) ? 'en' : 'zh-CN';
  const translated = await translateText(text, 'auto', targetLang);
  return { translated, targetLang };
}

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
  // Detect language from first chunk of text
  const allText = html.replace(/<[^>]*>/g, '').trim();
  if (!allText) return html;
  const targetLang = isChinese(allText) ? 'en' : 'zh-CN';
  const labelFrom = targetLang === 'en' ? '中' : 'EN';
  const labelTo = targetLang === 'en' ? 'EN' : '中';

  // Match all block-level content
  const blockRegex = /<(p|h[1-6]|li|blockquote|div)[^>]*>[\s\S]*?<\/\1>/gi;
  const blocks = html.match(blockRegex) || [];

  if (blocks.length === 0) {
    const translated = await translateText(allText, 'auto', targetLang);
    return html + buildTranslationBlock(translated, labelTo);
  }

  let result = html;
  const batchSize = 3;

  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    const textsToTranslate = batch
      .map(b => b.replace(/<[^>]*>/g, '').trim())
      .filter(t => t.length > 5);

    if (textsToTranslate.length === 0) continue;

    try {
      const translations = await Promise.all(
        textsToTranslate.map(t => translateText(t, 'auto', targetLang))
      );

      let tIdx = 0;
      for (const block of batch) {
        const plainText = block.replace(/<[^>]*>/g, '').trim();
        if (plainText.length <= 5) continue;
        const translated = translations[tIdx++];
        if (translated && translated !== plainText) {
          result = result.replace(block, block + buildTranslationBlock(translated, labelTo));
        }
      }
    } catch {
      // Skip failed batch
    }
  }

  return result;
}

function buildTranslationBlock(text: string, label: string): string {
  return `<div style="color:#888;font-size:0.88em;line-height:1.6;margin:4px 0 16px;padding:8px 12px;border-left:3px solid #4F46E5;background:rgba(79,70,229,0.05);border-radius:0 6px 6px 0"><span style="font-size:0.75em;color:#4F46E5;font-weight:600;margin-right:4px">${label}</span>${escapeHtml(text)}</div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
