/** Trích đoạn tóm tắt ngắn từ Markdown AI để hiển thị trên card. */
export function extractInsightsTeaser(insights: string, maxLength = 220): string {
  const summaryMatch = insights.match(/##\s*Tóm tắt nhanh\s*\n+([\s\S]*?)(?=\n##\s|$)/i);
  if (summaryMatch?.[1]) {
    const text = summaryMatch[1]
      .replace(/^[-*]\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    if (text) {
      return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
    }
  }

  const plain = insights
    .replace(/^#+\s.*$/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (!plain) return '';
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
}
