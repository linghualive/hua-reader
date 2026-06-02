const CN_CHARS_PER_MINUTE = 600;

export function estimateReadingTime(text: string): string {
  if (!text) return '1 分钟';
  const charCount = text.replace(/\s/g, '').length;
  const minutes = Math.max(1, Math.ceil(charCount / CN_CHARS_PER_MINUTE));
  return `${minutes} 分钟`;
}
