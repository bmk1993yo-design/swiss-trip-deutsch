import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // .opus를 octet-stream으로 보내면 Safari가 재생하지 않는다.
        source: "/audio/:path*.opus",
        headers: [{ key: "Content-Type", value: "audio/ogg; codecs=opus" }],
      },
    ];
  },
};

export default nextConfig;
