import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'fabric-aligning-guidelines': './node_modules/fabric/dist-extensions/aligning_guidelines/index.mjs',
    },
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    // Allow direct import of fabric's aligning_guidelines extension
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'fabric-aligning-guidelines': require('path').resolve(
        __dirname,
        'node_modules/fabric/dist-extensions/aligning_guidelines/index.mjs'
      ),
    };
    return config;
  },
};

export default nextConfig;
