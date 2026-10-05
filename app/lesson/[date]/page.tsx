import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LessonHeader from "@/components/LessonHeader";
import LessonView from "@/components/LessonView";
import ReviewDayView from "@/components/ReviewDayView";
import { getDay, getDays, getLessons } from "@/lib/lessons";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDays().map((d) => ({ date: d.date }));
}

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = getDay((await params).date);
  return { title: lesson ? `Day ${lesson.day} · ${lesson.theme.title} | Swiss Trip Deutsch` : "Swiss Trip Deutsch" };
}

export default async function LessonPage({ params }: Props) {
  const lesson = getDay((await params).date);
  if (!lesson) notFound();
  const reviewed = lesson.type === "review" ? getLessons().filter((l) => lesson.reviewOf.includes(l.date)) : [];

  return (
    <div className="space-y-6">
      <Link href="/" className="text-muted text-sm">
        ‹ 홈
      </Link>
      <LessonHeader day={lesson.day} theme={lesson.theme} date={lesson.date} draft={!lesson.approved} />
      {lesson.type === "review" ? (
        <ReviewDayView review={lesson} lessons={reviewed} />
      ) : (
        <LessonView lesson={lesson} />
      )}
    </div>
  );
}
