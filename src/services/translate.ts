const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

function isChinese(text: string): boolean {
  const chineseChars = text.match(/[一-鿿]/g) || [];
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && chineseChars.length / totalChars > 0.3;
}

async function googleTranslate(text: string, from: string, to: string): Promise<string> {
  const params = new URLSearchParams({ client: 'gtx', sl: from, tl: to, dt: 't', q: text });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return (data[0] as any[]).map((s: any) => s[0]).join('');
  } finally {
    clearTimeout(timer);
  }
}

async function myMemoryTranslate(text: string, from: string, to: string): Promise<string> {
  const langPair = `${from === 'auto' ? 'en' : from}|${to}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(`${MYMEMORY_URL}?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${langPair}`, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.responseData?.translatedText || '';
  } finally {
    clearTimeout(timer);
  }
}

export async function translateText(text: string, from: string = 'auto', to: string = 'zh-CN'): Promise<string> {
  // Try Google first, fallback to MyMemory
  try {
    return await googleTranslate(text, from, to);
  } catch {
    return await myMemoryTranslate(text, from, to);
  }
}

export async function translateHtmlParagraphs(html: string): Promise<string> {
  const allText = html.replace(/<[^>]*>/g, '').trim();
  if (!allText) throw new Error('没有可翻译的内容');

  const targetLang = isChinese(allText) ? 'en' : 'zh-CN';
  const labelTo = targetLang === 'en' ? 'EN' : '中';

  const blockRegex = /<(p|h[1-6]|li|blockquote|div)[^>]*>[\s\S]*?<\/\1>/gi;
  const blocks = html.match(blockRegex) || [];

  if (blocks.length === 0) {
    // No block elements, translate the whole text
    const translated = await translateText(allText, 'auto', targetLang);
    if (!translated) throw new Error('翻译返回为空');
    return html + buildTranslationBlock(translated, labelTo);
  }

  let result = html;
  let translatedCount = 0;

  // Translate one by one to avoid overwhelming the API
  for (const block of blocks) {
    const plainText = block.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= 5) continue;

    try {
      const translated = await translateText(plainText, 'auto', targetLang);
      if (translated && translated !== plainText) {
        result = result.replace(block, block + buildTranslationBlock(translated, labelTo));
        translatedCount++;
      }
    } catch {
      // Skip this paragraph, continue with next
    }
  }

  if (translatedCount === 0) throw new Error('翻译失败，请检查网络');
  return result;
}

function buildTranslationBlock(text: string, label: string): string {
  return `<div style="color:#888;font-size:0.88em;line-height:1.6;margin:4px 0 16px;padding:8px 12px;border-left:3px solid #4F46E5;background:rgba(79,70,229,0.05);border-radius:0 6px 6px 0"><span style="font-size:0.75em;color:#4F46E5;font-weight:600;margin-right:4px">${label}</span>${escapeHtml(text)}</div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
