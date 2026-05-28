/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx'],
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
  // Required to accept base64 image payloads up to ~30 MB in API routes
  serverExternalPackages: [],
}

// Per-route body size is enforced in the route handlers; this raises the
// framework-level limit so large payloads aren't rejected before reaching them.
nextConfig.experimental = {
  ...nextConfig.experimental,
  serverActions: { bodySizeLimit: '35mb' },
}

module.exports = nextConfig
