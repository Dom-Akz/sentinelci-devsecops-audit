/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: { instrumentationHook: true },
  webpack: (config, { isServer }) => {
    if (isServer && Array.isArray(config.externals)) {
      config.externals.push("better-sqlite3");
    }
    return config;
  },
};
