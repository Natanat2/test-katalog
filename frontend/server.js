import { createReadStream, existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 5173);

const clientDistDir = path.resolve(__dirname, 'dist/client');
const serverEntryPath = path.resolve(__dirname, 'dist/server/entry-server.js');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function getPathname(rawUrl) {
  try {
    return new URL(rawUrl || '/', 'http://localhost').pathname || '/';
  } catch {
    return '/';
  }
}

function resolveClientFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.posix.normalize(decoded);
  const relative = normalized.replace(/^\/+/, '');
  const absolute = path.resolve(clientDistDir, relative);

  if (!absolute.startsWith(clientDistDir)) {
    return null;
  }

  return absolute;
}

function serializeState(state) {
  const serialized = JSON.stringify(state || {})
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');

  return `<script>window.__SSR_DATA__=${serialized};</script>`;
}

async function serveStatic(res, filePath) {
  const contentType = getContentType(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);

  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(res);
  });
}

async function createRequestHandler() {
  let vite = null;
  let productionTemplate = '';
  let productionRender = null;

  if (isProduction) {
    productionTemplate = await fs.readFile(path.resolve(clientDistDir, 'index.html'), 'utf-8');
    const entryModule = await import(pathToFileURL(serverEntryPath).href);
    productionRender = entryModule.render;
  } else {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      root: __dirname,
      appType: 'custom',
      server: {
        middlewareMode: true
      }
    });
  }

  return async function handleRequest(req, res) {
    const pathname = getPathname(req.url);

    try {
      if (!isProduction) {
        await new Promise((resolve, reject) => {
          vite.middlewares(req, res, (error) => (error ? reject(error) : resolve()));
        });

        if (res.writableEnded) {
          return;
        }

        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(pathname, template);
        const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
        const { html, headTags, ssrData } = await render(pathname);
        const stateScript = serializeState(ssrData);

        const page = template
          .replace('<!--app-head-->', headTags || '')
          .replace('<!--app-html-->', html || '')
          .replace('<!--app-state-->', stateScript);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(page);
        return;
      }

      const staticFilePath = resolveClientFile(pathname);
      if (staticFilePath && existsSync(staticFilePath)) {
        const stats = await fs.stat(staticFilePath);
        if (stats.isFile()) {
          await serveStatic(res, staticFilePath);
          return;
        }
      }

      const { html, headTags, ssrData } = await productionRender(pathname);
      const stateScript = serializeState(ssrData);
      const page = productionTemplate
        .replace('<!--app-head-->', headTags || '')
        .replace('<!--app-html-->', html || '')
        .replace('<!--app-state-->', stateScript);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(page);
    } catch (error) {
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(error);
      }

      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(error?.stack || String(error));
    }
  };
}

const handler = await createRequestHandler();

http
  .createServer((req, res) => {
    handler(req, res);
  })
  .listen(port, () => {
    console.log(`SSR server started: http://localhost:${port}`);
  });
