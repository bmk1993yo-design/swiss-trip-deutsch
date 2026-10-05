"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * 탭할 때마다 이 항목만 가리기 ↔ 보이기를 바꾼다.
 * masked는 전체 설정(뜻 가리기·독일어 가리기)의 기본값이고,
 * 전체 설정이 바뀌면 개별로 바꾼 상태는 초기화된다.
 */
export default function Maskable({ masked, children }: { masked: boolean; children: ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => setFlipped(false), [masked]);

  const hidden = masked !== flipped;
  const toggle = () => setFlipped((f) => !f);

  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={hidden}
      aria-label={hidden ? "가려진 내용 보기" : "이 내용 가리기"}
      title={hidden ? "탭하면 보입니다" : "탭하면 가려집니다"}
      className={hidden ? "masked" : flipped ? "revealed" : "maskable"}
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
