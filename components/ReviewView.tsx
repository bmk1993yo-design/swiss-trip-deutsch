"use client";

import { useState } from "react";
import type { Word } from "@/types/lesson";
import type { LessonSummary } from "@/lib/lessons";
import { isUnlocked, useNow } from "@/lib/unlock";
import AudioButton from "./AudioButton";
import Maskable from "./Maskable";
import { VOICES } from "@/lib/voices";

export interface ReviewLesson extends LessonSummary {
  words: Word[];
}

export default function ReviewView({ lessons }: { lessons: ReviewLesson[] }) {
  const now = useNow();
  const [hideMeaning, setHideMeaning] = useState(true);

  if (!now) return <div className="card h-48 animate-pulse" />;
  const unlocked = lessons.filter((l) => isUnlocked(l.unlockAt, now)).reverse();
  if (unlocked.length === 0) {
    return <p className="card text-muted p-6 text-center">아직 복습할 레슨이 없습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        aria-pressed={hideMeaning}
        onClick={() => setHideMeaning(!hideMeaning)}
        className={[
          "rounded-full border px-3 py-1.5 text-sm font-medium",
          hideMeaning ? "border-swiss bg-swiss text-white" : "border-line text-muted",
        ].join(" ")}
      >
        뜻 가리기 (탭하면 보임)
      </button>

      {unlocked.map((l) => (
        <section key={l.date} className="space-y-2">
          <h2 className="font-bold">
            Day {String(l.day).padStart(2, "0")} · {l.theme.emoji} {l.theme.title}
          </h2>
          <ul className="card divide-y divide-[var(--line)]">
            {l.words.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{w.german}</p>
                  <p className="text-muted text-sm">
                    <Maskable masked={hideMeaning}>{w.meaning}</Maskable>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {VOICES.map((v) => (
                    <AudioButton key={v.id} src={w.audio[v.id].normal} label={`단어 듣기 (${v.label})`} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
