"use client";

import type { Lesson } from "@/types/lesson";
import { useDisplaySettings } from "@/lib/storage";
import { isUnlocked, useNow } from "@/lib/unlock";
import CompleteButton from "./CompleteButton";
import DisplayToggles from "./DisplayToggles";
import GrammarCard from "./GrammarCard";
import LockCountdown from "./LockCountdown";
import SentenceCard from "./SentenceCard";
import WordCarousel from "./WordCarousel";

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-baseline justify-between text-lg font-bold">
        {title}
        {count !== undefined && <span className="text-muted text-sm font-medium">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

export default function LessonView({ lesson }: { lesson: Lesson }) {
  const now = useNow();
  const [settings, setSettings] = useDisplaySettings();

  // 시각을 알기 전에는 아무것도 보여주지 않는다 (잠긴 내용이 잠깐 보이는 것 방지).
  if (!now) return <div className="card h-64 animate-pulse" />;

  if (!isUnlocked(lesson.unlockAt, now)) {
    return <LockCountdown unlockAt={lesson.unlockAt} now={now} label="이 레슨은" />;
  }

  return (
    <div className="space-y-8">
      <DisplayToggles settings={settings} onChange={setSettings} />

      <Section title="오늘의 단어" count={lesson.words.length}>
        <WordCarousel words={lesson.words} settings={settings} />
      </Section>

      <Section title="오늘의 문장" count={lesson.sentences.length}>
        <div className="space-y-3">
          {lesson.sentences.map((s) => (
            <SentenceCard key={s.id} sentence={s} settings={settings} />
          ))}
        </div>
      </Section>

      <Section title="오늘의 문법">
        <GrammarCard grammar={lesson.grammar} />
      </Section>

      <CompleteButton date={lesson.date} />
    </div>
  );
}
