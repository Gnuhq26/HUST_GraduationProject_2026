export function normalizeInsightsMarkdown(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => fixUnclosedBoldInLine(line))
    .join('\n');
}

function fixUnclosedBoldInLine(line: string): string {
  const markers = line.match(/\*\*/g);
  if (!markers || markers.length % 2 === 0) {
    return line;
  }

  // "- **Nhãn: phần còn lại" → "- **Nhãn:** phần còn lại"
  const listWithColon = line.match(/^(\s*[-*]\s+)\*\*([^*]+?)(\s*:\s*)(.*)$/);
  if (listWithColon) {
    return `${listWithColon[1]}**${listWithColon[2].trim()}**${listWithColon[3]}${listWithColon[4]}`;
  }

  // "- **Nhãn không có dấu :" → đóng ** ở cuối nhãn
  const listItem = line.match(/^(\s*[-*]\s+)\*\*([^*]+)$/);
  if (listItem) {
    return `${listItem[1]}**${listItem[2].trim()}**`;
  }

  // Dòng thường: "**Nhãn: ..." chưa đóng
  const plainWithColon = line.match(/^(\s*)\*\*([^*]+?)(\s*:\s*)(.*)$/);
  if (plainWithColon) {
    return `${plainWithColon[1]}**${plainWithColon[2].trim()}**${plainWithColon[3]}${plainWithColon[4]}`;
  }

  // Không sửa được — bỏ ** lẻ để không lộ ký tự thô
  return line.replace(/\*\*/g, '');
}
