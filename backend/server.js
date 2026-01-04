const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const DATA_FILE = path.join(__dirname, 'messages.json');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function loadMessages() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    // File may not exist yet; ignore.
  }
  return [];
}

function persistMessages(messages) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist messages:', err);
  }
}

function ensureDataFile() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Failed to initialize messages file:', err);
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { ...headers, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if ((url.pathname === '/api/messages' || url.pathname === '/api/messages/') && req.method === 'GET') {
    const messages = loadMessages().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    sendJson(res, 200, messages);
    return;
  }

  if ((url.pathname === '/api/messages' || url.pathname === '/api/messages/') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024) req.destroy();
    });

    req.on('end', () => {
      try {
        const { text } = JSON.parse(body || '{}');
        const trimmed = (text || '').toString().trim();
        if (!trimmed) return sendJson(res, 400, { error: 'EMPTY' });
        if (trimmed.length > 10) return sendJson(res, 400, { error: 'TOO_LONG' });

        const messages = loadMessages();
        messages.unshift({ text: trimmed, timestamp: Date.now() });
        persistMessages(messages.slice(0, 100));
        sendJson(res, 200, { ok: true });
      } catch (err) {
        console.error('Bad request:', err);
        sendJson(res, 400, { error: 'INVALID_JSON' });
      }
    });
    return;
  }

  res.writeHead(404, headers);
  res.end();
});

ensureDataFile();
server.listen(PORT, () => {
  console.log(`Message board backend running on http://localhost:${PORT}/api/messages`);
});
