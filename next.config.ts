import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling pdfjs-dist on the server
  serverExternalPackages: ['pdfjs-dist', 'canvas'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling pdfjs-dist worker files
      config.externals = config.externals || [];
      config.externals.push({
        'pdfjs-dist/legacy/build/pdf.worker.mjs': 'commonjs pdfjs-dist/legacy/build/pdf.worker.mjs',
        'pdfjs-dist/build/pdf.worker.mjs': 'commonjs pdfjs-dist/build/pdf.worker.mjs',
      });
      
      // Tell webpack to ignore these modules
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist/legacy/build/pdf.worker.mjs': false,
        'pdfjs-dist/build/pdf.worker.mjs': false,
      };
    }
    return config;
  },
};

export default nextConfig;
