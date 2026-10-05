"use client";

import { useCallback, useEffect, useState } from "react";

// 학습 기록과 표시 설정은 이 브라우저의 localStorage에만 저장된다.
const PREFIX = "std:";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 사파리 개인정보 보호 모드 등에서는 저장하지 않고 넘어간다.
  }
}

/** localStorage와 동기화되는 state. 마운트 전에는 fallback 값을 쓴다. */
export function useStoredState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    setValue(read(key, fallback));
    // fallback은 매 렌더마다 새 객체일 수 있으므로 key만 의존한다.
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      write(key, next);
    },
    [key],
  );

  return [value, update];
}

export interface DisplaySettings {
  showIpa: boolean;
  showKorean: boolean;
  hideMeaning: boolean;
  hideGerman: boolean;
}

export const DEFAULT_SETTINGS: DisplaySettings = {
  showIpa: true,
  showKorean: true,
  hideMeaning: false,
  hideGerman: false,
};

export function useDisplaySettings() {
  return useStoredState<DisplaySettings>("settings", DEFAULT_SETTINGS);
}

/** 학습 완료한 레슨 날짜 목록 */
export function useCompleted() {
  return useStoredState<string[]>("completed", []);
}
