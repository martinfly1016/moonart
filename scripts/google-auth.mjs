import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { URL } from 'node:url';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

export function defaultDates({ lagDays = 2, spanDays = 28 } = {}) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - lagDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - spanDays);
  return { startDate: toDateString(start), endDate: toDateString(end) };
}

export function resolveDates(args, options = {}) {
  const defaults = defaultDates(options);
  const endDate = args.end || defaults.endDate;
  if (args.start) return { startDate: args.start, endDate };
  if (args.days) {
    const start = new Date(`${endDate}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - Number(args.days));
    return { startDate: toDateString(start), endDate };
  }
  return { startDate: defaults.startDate, endDate };
}

export async function readCredentials(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function base64url(input) {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return source
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJwt(credentials, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: credentials.client_email,
    scope,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${base64url(signer.sign(credentials.private_key))}`;
}

async function getServiceAccountAccessToken(credentials, scope) {
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Service account JSON must include client_email and private_key.');
  }
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: createJwt(credentials, scope)
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function getOAuthClient(credentials) {
  const source = credentials.installed || credentials.web || credentials;
  if (!source.client_id || !source.client_secret) {
    throw new Error('OAuth credentials must include installed.client_id and installed.client_secret.');
  }
  return {
    clientId: source.client_id,
    clientSecret: source.client_secret
  };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  await fs.chmod(filePath, 0o600).catch(() => {});
}

function startOAuthCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.on('request', (request, response) => {
      const requestUrl = new URL(request.url, 'http://127.0.0.1');
      const code = requestUrl.searchParams.get('code');
      const error = requestUrl.searchParams.get('error');
      response.writeHead(error ? 400 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(error
        ? `<h1>Authorization failed</h1><p>${error}</p>`
        : '<h1>Authorization complete</h1><p>You can close this tab and return to Codex.</p>');
      server.close();
      if (error) server.emit('oauth-error', new Error(`OAuth authorization failed: ${error}`));
      else server.emit('oauth-code', code);
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        redirectUri: `http://127.0.0.1:${address.port}/oauth2callback`,
        waitForCode: new Promise((codeResolve, codeReject) => {
          server.once('oauth-code', codeResolve);
          server.once('oauth-error', codeReject);
        })
      });
    });
    server.on('error', reject);
  });
}

async function exchangeOAuthCode({ clientId, clientSecret, code, redirectUri }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth code exchange failed: ${JSON.stringify(data)}`);
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    scope: data.scope
  };
}

async function refreshOAuthToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth refresh failed: ${JSON.stringify(data)}`);
  }
  return {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    scope: data.scope
  };
}

async function getOAuthAccessToken({ credentials, tokenPath, scope, label }) {
  const { clientId, clientSecret } = getOAuthClient(credentials);
  const cached = await readJsonIfExists(tokenPath);
  if (cached?.access_token && cached?.expires_at && cached.expires_at > Date.now() + 60000) {
    return cached.access_token;
  }
  if (cached?.refresh_token) {
    try {
      const refreshed = await refreshOAuthToken({ clientId, clientSecret, refreshToken: cached.refresh_token });
      await writeJson(tokenPath, refreshed);
      return refreshed.access_token;
    } catch (error) {
      console.warn(`${error.message} Re-authorizing...`);
    }
  }

  const { redirectUri, waitForCode } = await startOAuthCallbackServer();
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('prompt', 'consent select_account');
  if (process.env.GOOGLE_OAUTH_LOGIN_HINT) {
    authUrl.searchParams.set('login_hint', process.env.GOOGLE_OAUTH_LOGIN_HINT);
  }

  console.log(`Open this URL in your browser to authorize ${label || 'Google API'} access:`);
  console.log(authUrl.toString());
  const token = await exchangeOAuthCode({
    clientId,
    clientSecret,
    code: await waitForCode,
    redirectUri
  });
  await writeJson(tokenPath, token);
  return token.access_token;
}

export function inferAuthMode(args, credentials) {
  if (args.auth) return args.auth;
  if (credentials.type === 'service_account') return 'service';
  if (credentials.installed || credentials.web || credentials.client_id) return 'oauth';
  throw new Error('Unable to infer auth mode. Pass --auth oauth or --auth service.');
}

export async function getAccessToken({ args, credentials, scope, tokenPath, label }) {
  const authMode = inferAuthMode(args, credentials);
  if (authMode === 'service') return getServiceAccountAccessToken(credentials, scope);
  if (authMode === 'oauth') {
    return getOAuthAccessToken({
      credentials,
      tokenPath: args.token || tokenPath,
      scope,
      label
    });
  }
  throw new Error(`Unknown auth mode "${authMode}". Use oauth or service.`);
}

export function csvEscape(value) {
  const str = String(value ?? '');
  if (!/[",\n]/.test(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}
