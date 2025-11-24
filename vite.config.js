import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Enable specific polyfills
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    // Custom plugin to serve .gz files without auto-decompression
    {
      name: 'raw-gz',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.endsWith('.gz')) {
            const filePath = path.join(server.config.root, req.url);
            if (fs.existsSync(filePath)) {
              // Serve as binary without content-encoding header
              res.setHeader('Content-Type', 'application/octet-stream');
              res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
              res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
              // Do NOT set content-encoding: gzip
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['@aztec/bb.js'],
  },
  resolve: {
    alias: {
      pino: 'pino/browser.js',
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
