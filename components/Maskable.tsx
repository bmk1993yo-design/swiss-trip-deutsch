"use client";

import { useEffect, useState, type ReactNode } from "react";

/** masked=true 이면 흐리게 가리고, 탭하면 보여준다. */
export default function Maskable({ masked, children }: { masked: boolean; children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => setRevealed(false), [masked]);

  if (!masked || revealed) return <>{children}</>;
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="가려진 내용 보기"
      className="masked"
      onClick={() => setRevealed(true)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setRevealed(true)}
    >
      {children}
    </span>
  );
}
