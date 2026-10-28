// Pasarela mínima que imita a la de Supabase para pruebas locales:
//   /auth/v1/* → Auth (9999)    /rest/v1/* → PostgREST (54330)
// y, opcionalmente, sirve la web estática en :8080 para probar /admin.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

export function signJwt(payload, secret = JWT_SECRET) {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const head = b64({ alg: 'HS256', typ: 'JWT' });
    const body = b64({ iss: 'supabase-local', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 365, ...payload });
    const sig = crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
    return `${head}.${body}.${sig}`;
}
export const ANON_KEY = signJwt({ role: 'anon' });
export const SERVICE_KEY = signJwt({ role: 'service_role' });

const CORS = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, prefer, accept-profile, content-profile, range, x-supabase-api-version',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-expose-headers': 'content-range, x-supabase-api-version',
};

function proxy(req, res, port, pathname) {
    const up = http.request({ host: '127.0.0.1', port, path: pathname, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${port}` } }, (r) => {
        res.writeHead(r.statusCode, { ...r.headers, ...CORS });
        r.pipe(res);
    });
    up.on('error', (e) => { res.writeHead(502, CORS); res.end(String(e)); });
    req.pipe(up);
}

export function startGateway(port = 54321) {
    const server = http.createServer((req, res) => {
        if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
        const url = req.url;
        if (url.startsWith('/auth/v1/')) return proxy(req, res, 9999, url.slice('/auth/v1'.length));
        if (url.startsWith('/rest/v1/')) return proxy(req, res, 54330, url.slice('/rest/v1'.length));
        res.writeHead(404, CORS); res.end();
    });
    return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.webp': 'image/webp' };

// Servidor estático que sustituye admin/config.js por la configuración local.
export function startStatic(port = 8080) {
    const server = http.createServer((req, res) => {
        let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (p === '/admin/config.js') {
            res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' });
            return res.end(`window.ZW_CONFIG = ${JSON.stringify({ supabaseUrl: 'http://127.0.0.1:54321', supabaseAnonKey: ANON_KEY })};`);
        }
        if (p.endsWith('/')) p += 'index.html';
        const file = path.join(ROOT, p);
        if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
            res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
            return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
        }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
        fs.createReadStream(file).pipe(res);
    });
    return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
    await startGateway();
    await startStatic();
    console.log('Pasarela Supabase: http://127.0.0.1:54321');
    console.log('Panel:             http://127.0.0.1:8080/admin/');
    console.log('Correo de pruebas: http://127.0.0.1:8025');
}
