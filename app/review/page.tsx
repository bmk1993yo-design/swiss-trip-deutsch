import Link from "next/link";
import ReviewView from "@/components/ReviewView";
import { getLessons } from "@/lib/lessons";

export const metadata = { title: "복습 | Swiss Trip Deutsch" };

export default function ReviewPage() {
  const lessons = getLessons().map(({ date, day, unlockAt, theme, approved, words }) => ({
    date,
    day,
    unlockAt,
    theme,
    approved,
    words,
  }));

  return (
    <div className="space-y-6">
      <Link href="/" className="text-muted text-sm">
        ‹ 홈
      </Link>
      <h1 className="text-2xl font-bold">지난 단어 복습</h1>
      <ReviewView lessons={lessons} />
    </div>
  );
}
