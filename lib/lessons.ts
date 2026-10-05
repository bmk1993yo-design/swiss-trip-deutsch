// 서버(빌드 시점) 전용. data/lessons/*.json 을 읽는다.
import fs from "node:fs";
import path from "node:path";
import type { Lesson, Theme } from "@/types/lesson";

const LESSONS_DIR = path.join(process.cwd(), "data", "lessons");

/** 목록 화면에 필요한 최소 정보. 클라이언트로 내려보내도 내용이 노출되지 않는다. */
export interface LessonSummary {
  date: string;
  day: number;
  unlockAt: string;
  theme: Theme;
  approved: boolean;
}

/** 개발 모드이거나 SHOW_DRAFTS=1 이면 검수 전 레슨도 보여준다. */
export function showDrafts(): boolean {
  return process.env.NODE_ENV === "development" || process.env.SHOW_DRAFTS === "1";
}

function readLesson(file: string): Lesson {
  return JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), "utf8")) as Lesson;
}

/** 표시 가능한 레슨 전체 (날짜 오름차순). */
export function getLessons(): Lesson[] {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  const drafts = showDrafts();
  return fs
    .readdirSync(LESSONS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .map(readLesson)
    .filter((l) => drafts || l.approved);
}

export function getLesson(date: string): Lesson | undefined {
  return getLessons().find((l) => l.date === date);
}

export function getLessonSummaries(): LessonSummary[] {
  return getLessons().map(({ date, day, unlockAt, theme, approved }) => ({
    date,
    day,
    unlockAt,
    theme,
    approved,
  }));
}
