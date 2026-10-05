"use client";

import { useEffect, useState, type ReactNode } from "react";

/** masked=true 이면 흐리게 가리고, 탭할 때마다 보이기/가리기를 바꾼다. */
export default function Maskable({ masked, children }: { masked: boolean; children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => setRevealed(false), [masked]);

  if (!masked) return <>{children}</>;

  const toggle = () => setRevealed((r) => !r);
  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={revealed}
      aria-label={revealed ? "다시 가리기" : "가려진 내용 보기"}
      title={revealed ? "탭하면 다시 가려집니다" : "탭하면 보입니다"}
      className={revealed ? "revealed" : "masked"}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      {children}
    </span>
  );
}
