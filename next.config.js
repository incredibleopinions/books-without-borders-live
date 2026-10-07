const path = require('path');

const react18 = {
  react: path.resolve(__dirname, 'node_modules/react/index.js'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom/index.js'),
  'react-dom/client': path.resolve(__dirname, 'node_modules/react-dom/client.js'),
};

// Meeting SDK 6.5 reads React 18 internals. Next aliases react to its compiled
// React 19. Keep the SDK, and the react-dom it loads, on the app's React 18.
class ZoomReact18Plugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('ZoomReact18Plugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('ZoomReact18Plugin', (resolveData) => {
        if (!resolveData) return;
        const from = `${resolveData.contextInfo?.issuer || ''} ${resolveData.context || ''}`;
        const fromZoom = from.includes(`${path.sep}@zoom${path.sep}meetingsdk`);
        const fromReactDom = from.includes(`${path.sep}node_modules${path.sep}react-dom${path.sep}`);
        if (!fromZoom && !fromReactDom) return;
        const replacement = react18[resolveData.request];
        if (replacement) resolveData.request = replacement;
      });
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@zoom/meetingsdk'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // The embedded SDK bundle contains an AMD define() for @zoom/download-manager.
    // That package is not published. At runtime the bundle uses its own copy.
    config.module.rules.push({
      test: /[\\/]@zoom[\\/]meetingsdk[\\/].*\.js$/,
      parser: { amd: false },
    });

    config.plugins.push(new ZoomReact18Plugin());

    return config;
  },
};

module.exports = nextConfig;