const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (urlObj.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // 환경변수 토큰 자동 전달
  if (urlObj.pathname === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      slackToken: process.env.SLACK_TOKEN || '',
      claudeKey: process.env.CLAUDE_KEY || '',
    }));
    return;
  }

  // 대시보드 HTML
  if (urlObj.pathname === '/' || urlObj.pathname === '/index.html') {
    const htmlPath = path.join(__dirname, 'dashboard.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('dashboard.html not found');
    }
    return;
  }

  // Slack API 프록시 (/slack/...)
  if (urlObj.pathname.startsWith('/slack/')) {
    const slackEndpoint = urlObj.pathname.replace('/slack/', '');
    const token = req.headers['authorization'] || '';

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const options = {
        hostname: 'slack.com',
        path: '/api/' + slackEndpoint + urlObj.search,
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Authorization': token,
        }
      };
      proxyRequest(options, body, res);
    });
    return;
  }

  // Claude API 프록시 (/claude/...)
  if (urlObj.pathname.startsWith('/claude/')) {
    const claudeEndpoint = urlObj.pathname.replace('/claude/', '');

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/' + claudeEndpoint,
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '') || '',
          'anthropic-version': '2023-06-01',
        }
      };
      proxyRequest(options, body, res);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function proxyRequest(options, body, res) {
  const proxyReq = https.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', err => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
}

server.listen(PORT, () => {
  console.log('');
  console.log('====================================');
  console.log('  ✅ 영업IQ 프록시 서버 시작!');
  console.log('====================================');
  console.log(`  👉 http://localhost:${PORT} 으로 접속하세요`);
  console.log('  📌 종료: Ctrl+C');
  console.log('====================================');
  console.log('');
});
