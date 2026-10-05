import type { Theme } from "@/types/lesson";
import { formatLessonDate } from "@/lib/format";

interface Props {
  day: number;
  theme: Theme;
  date: string;
  draft?: boolean;
}

export default function LessonHeader({ day, theme, date, draft }: Props) {
  return (
    <header className="space-y-1">
      <p className="text-xs font-bold tracking-[0.2em] text-swiss">🇨🇭 SWISS TRIP DEUTSCH</p>
      <h1 className="text-2xl font-bold">
        Day {String(day).padStart(2, "0")} · {theme.emoji} {theme.title}
      </h1>
      <p className="text-muted flex items-center gap-2 text-sm">
        {formatLessonDate(date)}
        {draft && (
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-black">검수 전</span>
        )}
      </p>
    </header>
  );
}
