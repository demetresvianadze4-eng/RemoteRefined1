import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, 'public');
const port = Number(process.env.PORT || 3000);
const recentRequests = new Map();

// Loads local settings without an additional dependency. Never commit the real .env file.
async function loadLocalSettings() {
  try {
    const settings = await readFile(path.join(here, '.env'), 'utf8');
    for (const rawLine of settings.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Could not read .env:', error.message);
  }
}

await loadLocalSettings();

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function reply(res, status, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function subscribe(req, res) {
  const client = req.socket.remoteAddress || 'unknown';
  const lastRequest = recentRequests.get(client) || 0;
  if (Date.now() - lastRequest < 15_000) {
    return reply(res, 429, { error: 'Please wait a moment before trying again.' });
  }

  try {
    const { email, source = 'website' } = JSON.parse(await getBody(req));
    const normalEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalEmail)) {
      return reply(res, 400, { error: 'Please enter a valid email address.' });
    }

    // Resend is used directly over its HTTPS API, so this project has no package install step.
    // Add these variables to your host: RESEND_API_KEY and RESEND_FROM_EMAIL.
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return reply(res, 503, { error: 'Email delivery has not been configured yet. Add your Resend settings to .env, then restart the site.' });
    }

    recentRequests.set(client, Date.now());
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [normalEmail],
        subject: 'Hello from RemoteRefined 👋',
        html: `<!doctype html><html><body style="margin:0;background:#f5f5f7;color:#121212;font-family:Arial,sans-serif"><main style="max-width:560px;margin:32px auto;background:#fff;padding:42px;border-radius:24px"><p style="font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">RemoteRefined</p><h1 style="font-size:40px;letter-spacing:-2px;margin:25px 0 14px">Hello. Your workspace is about to get better.</h1><p style="font-size:16px;line-height:1.55;color:#555">Thanks for joining RemoteRefined. We’ll send thoughtful product reviews and home-office ideas when they’re worth your time.</p><p style="margin-top:30px;font-size:13px;color:#777">You signed up through the ${String(source).replace(/[^a-z-]/gi, '') || 'website'} form.</p></main></body></html>`,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Email provider error:', error);
      return reply(res, 502, { error: 'We could not send that email just now. Please try again.' });
    }

    return reply(res, 200, { message: 'Hello is on its way — check your inbox.' });
  } catch (error) {
    console.error('Subscribe error:', error.message);
    return reply(res, 400, { error: 'That request could not be processed.' });
  }
}

async function serveFile(urlPath, res) {
  const requested = urlPath === '/' ? '/index.html' : decodeURIComponent(urlPath);
  const filePath = path.resolve(publicDir, `.${requested}`);
  if (!filePath.startsWith(`${publicDir}${path.sep}`)) {
    return reply(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  }

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) throw new Error('Not a file');
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  } catch {
    reply(res, 404, 'Page not found', 'text/plain; charset=utf-8');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health') return reply(res, 200, { ok: true });
  if (url.pathname === '/api/subscribe') {
    if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed.' });
    return subscribe(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, { error: 'Method not allowed.' });
  return serveFile(url.pathname, res);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`RemoteRefined is running at http://localhost:${port}`);
  console.log('It is bound to your network. Use your computer’s local IP and this port to open it on a phone on the same Wi-Fi.');
});
