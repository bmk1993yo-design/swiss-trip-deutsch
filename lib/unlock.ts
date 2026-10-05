"use client";

import { useEffect, useState } from "react";

/**
 * 현재 시각. 개발 모드에서는 URL에 ?now=2026-10-06T18:00 을 붙여
 * 잠금/해제 상태를 시험할 수 있다 (시각은 KST로 해석).
 */
export function getNow(): Date {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const override = new URLSearchParams(window.location.search).get("now");
    if (override) {
      const withZone = /[+-]\d{2}:\d{2}$|Z$/.test(override) ? override : `${override}+09:00`;
      const d = new Date(withZone);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}

/**
 * 1초마다 갱신되는 현재 시각. 서버 렌더링과 어긋나지 않도록
 * 마운트 전에는 null 을 돌려준다.
 */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const offset = getNow().getTime() - Date.now();
    const tick = () => setNow(new Date(Date.now() + offset));
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function isUnlocked(unlockAt: string, now: Date): boolean {
  return now.getTime() >= new Date(unlockAt).getTime();
}

/** "00:23:18" 형식. 하루 이상 남으면 "2일 03:10:00". */
export function formatRemaining(unlockAt: string, now: Date): string {
  let s = Math.max(0, Math.floor((new Date(unlockAt).getTime() - now.getTime()) / 1000));
  const days = Math.floor(s / 86400);
  s %= 86400;
  const hms = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}일 ${hms}` : hms;
}
