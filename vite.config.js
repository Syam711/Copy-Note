import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite's built-in SPA fallback has a known gotcha with multi-segment
// routes like /share/:token — client-side navigation to it (clicking
// a link inside the running app) works fine, but pasting the URL
// directly or refreshing on it hits the dev/preview server for that
// exact path and 404s, since there's no real file there.
// (https://github.com/vitejs/vite/discussions/9461)
//
// This adds an explicit fallback: any GET request that looks like a
// page navigation (no file extension, Accept: text/html) gets
// index.html instead, so React Router can take over client-side.
// Returning a function from configureServer/configurePreviewServer
// defers registration until AFTER Vite's own middlewares are set up,
// so real asset requests (JS, CSS, etc.) are still tried first.
function spaFallback() {
  const middleware = (req, res, next) => {
    if (req.method === 'GET' && !req.url.includes('.') && req.headers.accept?.includes('text/html')) {
      req.url = '/index.html';
    }
    next();
  };
  return {
    name: 'spa-fallback',
    configureServer(server) {
      return () => server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      return () => server.middlewares.use(middleware);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
})
