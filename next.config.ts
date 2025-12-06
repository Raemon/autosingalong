import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling pdfjs-dist on the server
  serverExternalPackages: ['pdfjs-dist', 'canvas', 'tone', '@tonejs/midi'],
  
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
