// 서버·클라이언트 공용 날짜 표시 함수

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-10-06" → "2026. 10. 6 (화)" */
export function formatLessonDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}. ${m}. ${d} (${weekday})`;
}

/** Forvo 원어민 발음 페이지. 명사는 관사를 뗀다: "das Perron" → https://ko.forvo.com/word/perron/#de */
export function forvoUrl(german: string, isNoun: boolean): string {
  const word = isNoun ? german.split(" ").slice(1).join(" ") : german;
  const slug = encodeURIComponent(word.trim().toLowerCase().replace(/\s+/g, "_"));
  return `https://ko.forvo.com/word/${slug}/#de`;
}
