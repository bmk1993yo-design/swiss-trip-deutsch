"use client";

import { useEffect } from "react";

/** 배포 환경에서만 오프라인 캐시용 서비스 워커를 등록한다. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
