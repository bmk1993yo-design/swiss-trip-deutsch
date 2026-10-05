import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LessonHeader from "@/components/LessonHeader";
import LessonView from "@/components/LessonView";
import { getLesson, getLessons } from "@/lib/lessons";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLessons().map((l) => ({ date: l.date }));
}

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = getLesson((await params).date);
  return { title: lesson ? `Day ${lesson.day} · ${lesson.theme.title} | Swiss Trip Deutsch` : "Swiss Trip Deutsch" };
}

export default async function LessonPage({ params }: Props) {
  const lesson = getLesson((await params).date);
  if (!lesson) notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-muted text-sm">
        ‹ 홈
      </Link>
      <LessonHeader day={lesson.day} theme={lesson.theme} date={lesson.date} draft={!lesson.approved} />
      <LessonView lesson={lesson} />
    </div>
  );
}
