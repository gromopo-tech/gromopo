import type { NextConfig } from 'next'
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = withPWA({
  /* config options here */
})

export default nextConfig
