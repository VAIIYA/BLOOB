import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Allow partykit websocket connections during dev
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
                ],
            },
        ];
    },
    webpack: (config) => {
        // Required for @solana/web3.js
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        return config;
    },
};

export default nextConfig;
