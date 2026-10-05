// 서버(빌드 시점) 전용. data/lessons/*.json 을 읽는다.
import fs from "node:fs";
import path from "node:path";
import type { DayEntry, Lesson, Theme } from "@/types/lesson";

const LESSONS_DIR = path.join(process.cwd(), "data", "lessons");

/** 목록 화면에 필요한 최소 정보. 클라이언트로 내려보내도 내용이 노출되지 않는다. */
export interface LessonSummary {
  type: DayEntry["type"];
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

function readDay(file: string): DayEntry {
  return JSON.parse(fs.readFileSync(path.join(LESSONS_DIR, file), "utf8")) as DayEntry;
}

/** 표시 가능한 날 전체 — 새 레슨과 복습 날 (날짜 오름차순). */
export function getDays(): DayEntry[] {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  const drafts = showDrafts();
  const all = fs
    .readdirSync(LESSONS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .map(readDay)
    .filter((d) => drafts || d.approved);
  // 복습 날은 대상 레슨이 하나라도 표시 가능할 때만 보여준다.
  const lessonDates = new Set(all.filter((d) => d.type === "lesson").map((d) => d.date));
  return all.filter((d) => d.type === "lesson" || d.reviewOf.some((date) => lessonDates.has(date)));
}

export function getDay(date: string): DayEntry | undefined {
  return getDays().find((d) => d.date === date);
}

/** 새 레슨만 */
export function getLessons(): Lesson[] {
  return getDays().filter((d): d is Lesson => d.type === "lesson");
}

export function getLessonSummaries(): LessonSummary[] {
  return getDays().map(({ type, date, day, unlockAt, theme, approved }) => ({
    type,
    date,
    day,
    unlockAt,
    theme,
    approved,
  }));
}
