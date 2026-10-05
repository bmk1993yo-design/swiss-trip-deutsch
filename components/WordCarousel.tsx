"use client";

import { useRef, useState } from "react";
import type { Word } from "@/types/lesson";
import type { DisplaySettings } from "@/lib/storage";
import WordCard from "./WordCard";

export default function WordCarousel({ words, settings }: { words: Word[]; settings: DisplaySettings }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function onScroll() {
    const row = rowRef.current;
    if (!row) return;
    setIndex(Math.round(row.scrollLeft / row.clientWidth));
  }

  function go(i: number) {
    const row = rowRef.current;
    if (!row) return;
    row.scrollTo({ left: i * row.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div ref={rowRef} onScroll={onScroll} className="snap-row -mx-4 flex overflow-x-auto">
        {words.map((w) => (
          <div key={w.id} className="w-full shrink-0 px-4">
            <WordCard word={w} settings={settings} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(Math.max(0, index - 1))}
          disabled={index === 0}
          className="text-muted px-2 py-1 text-xl disabled:opacity-20"
          aria-label="이전 단어"
        >
          ‹
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-muted text-sm tabular-nums">
            {index + 1} / {words.length}
          </span>
          <div className="flex gap-1.5">
            {words.map((w, i) => (
              <button
                key={w.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}번째 단어`}
                className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-swiss" : "w-2 bg-black/15 dark:bg-white/20"}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(Math.min(words.length - 1, index + 1))}
          disabled={index === words.length - 1}
          className="text-muted px-2 py-1 text-xl disabled:opacity-20"
          aria-label="다음 단어"
        >
          ›
        </button>
      </div>
    </div>
  );
}
