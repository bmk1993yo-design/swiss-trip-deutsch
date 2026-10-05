"use client";

import { useCompleted } from "@/lib/storage";

export default function CompleteButton({ date }: { date: string }) {
  const [completed, setCompleted] = useCompleted();
  const done = completed.includes(date);

  return (
    <button
      type="button"
      onClick={() =>
        setCompleted(done ? completed.filter((d) => d !== date) : [...completed, date].sort())
      }
      className={[
        "w-full rounded-2xl py-4 text-lg font-bold transition active:scale-[0.99]",
        done ? "bg-emerald-600 text-white" : "bg-swiss text-white",
      ].join(" ")}
    >
      {done ? "오늘 학습 완료 ✓" : "학습 완료하기"}
    </button>
  );
}
