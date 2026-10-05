"use client";

import { formatRemaining } from "@/lib/unlock";

export default function LockCountdown({ unlockAt, now, label }: { unlockAt: string; now: Date; label: string }) {
  return (
    <div className="card p-6 text-center">
      <p className="text-3xl">🔒</p>
      <p className="text-muted mt-2 text-sm">{label}</p>
      <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{formatRemaining(unlockAt, now)}</p>
      <p className="text-muted mt-1 text-sm">뒤 공개됩니다 · 매일 17:00 KST</p>
    </div>
  );
}
