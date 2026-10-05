import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// 정적 사이트라 외부 리소스를 쓰지 않는다. Next.js가 넣는 인라인 스크립트 때문에
// script-src에 'unsafe-inline'이 필요하다 (nonce 방식은 정적 생성과 함께 쓸 수 없음).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // 개발 서버는 HMR에 eval·WebSocket을 쓰므로 CSP는 배포에서만
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // .opus를 octet-stream으로 보내면 Safari가 재생하지 않는다.
        source: "/audio/:path*.opus",
        headers: [{ key: "Content-Type", value: "audio/ogg; codecs=opus" }],
      },
    ];
  },
};

export default nextConfig;
