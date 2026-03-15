// Purpose: Nuclear bypass for local Firebase Auth popup blocks by fully
// relaxing COOP and COEP isolation.

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Purpose: Produce a self-contained build with only necessary node_modules
    // for Docker/Cloud Run. Vercel safely ignores this flag.
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Purpose: Suppress the Suspense boundary requirement for useSearchParams()
    // in client-side layouts/pages during static prerendering. This is the
    // official Next.js 14 escape hatch.
    experimental: {
        missingSuspenseWithCSRBailout: false,
        // Purpose: Sprint 213 — Prevent next-barrel-loader from exhaustively
        // re-exporting all 2000+ icons on every compile.
        optimizePackageImports: ['lucide-react'],
    },
    // Purpose: Nuclear bypass — fully disables cross-origin isolation that
    // blocks Firebase Auth's signInWithPopup window.closed polling.
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "unsafe-none",
                    },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "unsafe-none",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
