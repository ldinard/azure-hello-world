/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // snowflake-sdk uses native Node.js addons and cannot be bundled by webpack.
  // Marking it as external tells Next.js to require() it at runtime instead.
  experimental: {
    serverComponentsExternalPackages: ['snowflake-sdk'],
  },
};

export default nextConfig;
