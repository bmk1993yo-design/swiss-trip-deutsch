"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lesson, ReviewDay, Word } from "@/types/lesson";
import { useDisplaySettings } from "@/lib/storage";
import { isUnlocked, useNow } from "@/lib/unlock";
import AudioRow from "./AudioRow";
import CompleteButton from "./CompleteButton";
import LockCountdown from "./LockCountdown";
import Pronunciation from "./Pronunciation";
import SentenceCard from "./SentenceCard";

type Direction = "de-ko" | "ko-de";

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 단어 카드 퀴즈: 보고 → 뒤집고 → 알았어요 / 다시 */
function WordQuiz({ words }: { words: Word[] }) {
  const [direction, setDirection] = useState<Direction>("de-ko");
  const [queue, setQueue] = useState<Word[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [settings] = useDisplaySettings();

  // 단어 구성이 실제로 바뀔 때만 다시 섞는다. 부모가 매초 다시 렌더링되면서
  // 배열이 새로 만들어져도 퀴즈가 처음부터 다시 시작되지 않도록 내용으로 비교한다.
  const signature = words.map((w) => w.german).join("|");
  const [wordsAtStart, setWordsAtStart] = useState(words);
  if (signature !== wordsAtStart.map((w) => w.german).join("|")) setWordsAtStart(words);

  function restart() {
    setQueue(shuffle(wordsAtStart));
    setKnown(0);
    setFlipped(false);
  }
  // 섞기는 마운트 후에 (서버 렌더링과 어긋나지 않게)
  useEffect(() => {
    setQueue(shuffle(wordsAtStart));
    setKnown(0);
    setFlipped(false);
  }, [wordsAtStart]);

  const current = queue[0];
  const total = words.length;

  function answer(gotIt: boolean) {
    setFlipped(false);
    setQueue(([head, ...rest]) => (gotIt ? rest : [...rest, head]));
    if (gotIt) setKnown((k) => k + 1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2" role="group" aria-label="퀴즈 방향">
          {(["de-ko", "ko-de"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => {
                setDirection(d);
                restart();
              }}
              className={[
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                direction === d ? "border-swiss bg-swiss text-white" : "border-line text-muted",
              ].join(" ")}
            >
              {d === "de-ko" ? "독일어 → 뜻" : "뜻 → 독일어"}
            </button>
          ))}
        </div>
        <span className="text-muted text-sm tabular-nums">
          {known} / {total}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div className="h-full bg-swiss transition-all" style={{ width: `${(known / total) * 100}%` }} />
      </div>

      {!current ? (
        <div className="card space-y-4 p-6 text-center">
          <p className="text-3xl">🎉</p>
          <p className="text-lg font-bold">이번 주 단어 {total}개를 모두 맞혔어요!</p>
          <button type="button" onClick={restart} className="border-line rounded-xl border px-4 py-2 font-semibold">
            다시 하기
          </button>
        </div>
      ) : (
        <article className="card space-y-4 p-5">
          <p className="text-muted text-xs">남은 카드 {queue.length}</p>
          <p className="text-2xl font-bold break-words">{direction === "de-ko" ? current.german : current.meaning}</p>
          {direction === "de-ko" && <AudioRow audio={current.audio} kind="단어" />}

          {flipped ? (
            <div className="border-line space-y-3 border-t pt-4">
              <p className="text-xl font-semibold">{direction === "de-ko" ? current.meaning : current.german}</p>
              {direction === "ko-de" && <AudioRow audio={current.audio} kind="단어" />}
              <Pronunciation
                data={current.pronunciation}
                showIpa={settings.showIpa}
                showKorean={settings.showKorean}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => answer(false)}
                  className="border-line rounded-xl border py-3 font-semibold"
                >
                  ↻ 다시
                </button>
                <button
                  type="button"
                  onClick={() => answer(true)}
                  className="rounded-xl bg-emerald-600 py-3 font-semibold text-white"
                >
                  ✓ 알았어요
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="w-full rounded-xl bg-black/5 py-3 font-semibold dark:bg-white/10"
            >
              정답 보기
            </button>
          )}
        </article>
      )}
    </div>
  );
}

export default function ReviewDayView({ review, lessons }: { review: ReviewDay; lessons: Lesson[] }) {
  const now = useNow();
  const [settings] = useDisplaySettings();
  const words = useMemo(() => lessons.flatMap((l) => l.words), [lessons]);

  if (!now) return <div className="card h-64 animate-pulse" />;
  if (!isUnlocked(review.unlockAt, now)) {
    return <LockCountdown unlockAt={review.unlockAt} now={now} label="이 복습은" />;
  }

  // 아직 공개 전인 레슨은 복습에서 뺀다.
  const open = lessons.filter((l) => isUnlocked(l.unlockAt, now));
  const openWords = words.filter((w) => open.some((l) => l.words.includes(w)));

  return (
    <div className="space-y-8">
      <p className="text-muted text-sm">
        {open.map((l) => `${l.theme.emoji} ${l.theme.title}`).join(" · ")}
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">단어 퀴즈</h2>
        <WordQuiz words={openWords} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">이번 주 문장 다시 듣기</h2>
        <p className="text-muted text-sm">뜻을 가린 채 듣고, 탭해서 확인하세요.</p>
        <div className="space-y-3">
          {open.flatMap((l) =>
            l.sentences.map((s) => (
              <SentenceCard key={`${l.date}-${s.id}`} sentence={s} settings={{ ...settings, hideMeaning: true }} />
            )),
          )}
        </div>
      </section>

      <CompleteButton date={review.date} />
    </div>
  );
}
