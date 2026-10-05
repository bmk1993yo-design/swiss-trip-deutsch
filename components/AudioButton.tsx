"use client";

import { useEffect, useState } from "react";

// 한 번에 하나의 음성만 재생되도록 Audio 객체를 공유한다.
let shared: HTMLAudioElement | null = null;

type Status = "idle" | "playing" | "missing";

interface Props {
  src?: string;
  label: string;
  variant?: "normal" | "slow";
}

export default function AudioButton({ src, label, variant = "normal" }: Props) {
  const [status, setStatus] = useState<Status>(src ? "idle" : "missing");

  useEffect(() => setStatus(src ? "idle" : "missing"), [src]);

  async function play() {
    if (!src || status === "missing") return;
    shared?.pause();
    const audio = new Audio(src);
    shared = audio;
    audio.onended = () => setStatus("idle");
    audio.onpause = () => setStatus("idle");
    audio.onerror = () => setStatus("missing");
    try {
      setStatus("playing");
      await audio.play();
    } catch {
      setStatus("missing");
    }
  }

  const icon = variant === "slow" ? "🐢" : "🔊";
  const missing = status === "missing";

  return (
    <button
      type="button"
      onClick={play}
      disabled={missing}
      aria-label={missing ? `${label} (음성 준비 중)` : label}
      title={missing ? "음성 준비 중" : label}
      className={[
        "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-lg transition",
        missing
          ? "cursor-not-allowed opacity-30"
          : status === "playing"
            ? "bg-swiss text-white"
            : "bg-black/5 active:scale-95 dark:bg-white/10",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}
