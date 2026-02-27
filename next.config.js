/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@stackframe/stack',
    '@stackframe/stack-shared',
  ],
};

module.exports = nextConfig;
