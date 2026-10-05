"use client";

import Link from "next/link";
import type { LessonSummary } from "@/lib/lessons";
import { useCompleted } from "@/lib/storage";
import { isUnlocked, useNow } from "@/lib/unlock";
import { formatLessonDate } from "@/lib/format";
import LockCountdown from "./LockCountdown";

function dayLabel(l: LessonSummary) {
  return `Day ${String(l.day).padStart(2, "0")} · ${l.theme.emoji} ${l.theme.title}`;
}

export default function HomeView({ lessons }: { lessons: LessonSummary[] }) {
  const now = useNow();
  const [completed] = useCompleted();

  if (lessons.length === 0) {
    return <p className="card text-muted p-6 text-center">아직 공개 준비된 레슨이 없습니다.</p>;
  }
  if (!now) return <div className="card h-48 animate-pulse" />;

  const unlocked = lessons.filter((l) => isUnlocked(l.unlockAt, now));
  const current = unlocked.at(-1);
  const next = lessons.find((l) => !isUnlocked(l.unlockAt, now));
  const past = unlocked.slice(0, -1).reverse();
  const doneCount = unlocked.filter((l) => completed.includes(l.date)).length;

  return (
    <div className="space-y-6">
      {current && (
        <Link href={`/lesson/${current.date}`} className="card block p-6 transition active:scale-[0.99]">
          <p className="text-sm font-semibold text-swiss">오늘의 레슨</p>
          <p className="mt-1 text-2xl font-bold">{dayLabel(current)}</p>
          <p className="text-muted mt-1 text-sm">{formatLessonDate(current.date)}</p>
          <p className="mt-4 font-semibold">
            {completed.includes(current.date) ? "학습 완료 ✓ · 다시 보기 →" : "학습 시작하기 →"}
          </p>
        </Link>
      )}

      {next && (
        <LockCountdown
          unlockAt={next.unlockAt}
          now={now}
          label={`${current ? "다음 레슨" : "첫 레슨"} ${dayLabel(next)}은`}
        />
      )}

      {unlocked.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-muted text-xs">완료한 레슨</p>
            <p className="text-2xl font-bold tabular-nums">
              {doneCount}
              <span className="text-muted text-base font-medium"> / {unlocked.length}</span>
            </p>
          </div>
          <Link href="/review" className="card p-4">
            <p className="text-muted text-xs">지난 단어</p>
            <p className="text-lg font-bold">복습하기 →</p>
          </Link>
        </div>
      )}

      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold">지난 레슨</h2>
          <ul className="card divide-y divide-[var(--line)]">
            {past.map((l) => (
              <li key={l.date}>
                <Link href={`/lesson/${l.date}`} className="flex items-center justify-between px-4 py-3">
                  <span>
                    <span className="block font-medium">{dayLabel(l)}</span>
                    <span className="text-muted text-xs">{formatLessonDate(l.date)}</span>
                  </span>
                  <span className={completed.includes(l.date) ? "text-emerald-600" : "text-muted"}>
                    {completed.includes(l.date) ? "✓" : "›"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
