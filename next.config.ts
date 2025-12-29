import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling heavy packages on the server
  serverExternalPackages: ['pdfjs-dist', 'canvas', 'tone', '@tonejs/midi', 'bcrypt', 'opensheetmusicdisplay', 'verovio'],
  
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
