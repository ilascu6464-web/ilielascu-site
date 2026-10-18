const LIVE_WINDOW_MS = 90_000;
const MAX_HEARTBEAT_MS = 90_000;
const SESSION_ID = /^[A-Za-z0-9_-]{20,128}$/;

function response(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN || 'https://ilielascu.de';
  return origin === allowed ? {
    'access-control-allow-origin': allowed,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin',
  } : {};
}

function validSessionId(value) {
  return typeof value === 'string' && SESSION_ID.test(value);
}

function adminAuthorized(request, env) {
  const expected = env.ADMIN_TOKEN || '';
  const received = request.headers.get('Authorization') || '';
  return expected.length > 0 && received === `Bearer ${expected}`;
}

function adminPage() {
  return new Response(`<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RadioSIX — raport privat</title>
<style>body{font:16px system-ui;background:#101410;color:#eef7ee;max-width:920px;margin:40px auto;padding:0 20px}button{background:#39ff14;border:0;padding:10px 16px;border-radius:8px;font-weight:700}input{padding:10px;border-radius:8px;border:1px solid #768276;width:min(420px,90%)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:24px}.card{background:#1a241a;border:1px solid #334a33;border-radius:12px;padding:16px}.value{font-size:30px;font-weight:800;color:#91ff75}.muted{color:#aebaae}</style></head>
<body><h1>RadioSIX — raport privat</h1><p class="muted">Date anonime. Indicatorul public „Now” este dezactivat.</p>
<input id="token" type="password" placeholder="Admin token"><button id="load">Încarcă raportul</button><p id="error"></p><div id="report"></div>
<script>
const token = document.querySelector('#token'), report = document.querySelector('#report'), error = document.querySelector('#error');
document.querySelector('#load').onclick = async () => { error.textContent=''; report.innerHTML=''; try {
  const r = await fetch('/summary', {headers:{Authorization:'Bearer '+token.value}}); const data=await r.json(); if(!r.ok) throw new Error(data.error||'Acces refuzat');
  report.innerHTML = '<div class="grid">'+[['live','Acum live'],['last24h','Ultimele 24 h'],['last7d','Ultimele 7 zile'],['last30d','Ultimele 30 zile'],['last365d','Ultimul an'],['all','Total']].map(([k,l])=>'<div class="card"><div>'+l+'</div><div class="value">'+data.periods[k].sessions+'</div><div class="muted">sesiuni · '+Math.round(data.periods[k].activeMinutes)+' minute active</div></div>').join('')+'</div>';
} catch(e) { error.textContent=e.message; }};
</script></body></html>`, {headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/^\/api\/radiosix(?=\/|$)/, '') || '/';
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
    if (pathname === '/health') return response(JSON.stringify({ok:true}), 200, cors);
    if (pathname === '/admin' && request.method === 'GET') return adminPage();
    if (pathname === '/summary' && request.method === 'GET') {
      if (!adminAuthorized(request, env)) return response(JSON.stringify({error:'Unauthorized'}), 401);
      const now = Date.now();
      const periods = {last24h: now-86400000, last7d: now-7*86400000, last30d: now-30*86400000, last365d: now-365*86400000, all: 0};
      const result = {};
      for (const [key, since] of Object.entries(periods)) {
        const row = await env.DB.prepare('SELECT COUNT(*) AS sessions, COALESCE(SUM(active_ms),0) AS active_ms FROM sessions WHERE started_at >= ?').bind(since).first();
        result[key] = {sessions:Number(row.sessions||0), activeMinutes:Number(row.active_ms||0)/60000};
      }
      const live = await env.DB.prepare('SELECT COUNT(*) AS sessions FROM sessions WHERE last_seen_at >= ?').bind(now-LIVE_WINDOW_MS).first();
      result.live = {sessions:Number(live.sessions||0), activeMinutes:0};
      return response(JSON.stringify({generatedAt:new Date(now).toISOString(), periods:result}));
    }
    if (pathname !== '/collect' || request.method !== 'POST') return response(JSON.stringify({error:'Not found'}), 404);
    if (Object.keys(cors).length === 0) return response(JSON.stringify({error:'Origin not allowed'}), 403);
    let payload;
    try { payload = await request.json(); } catch { return response(JSON.stringify({error:'Invalid JSON'}), 400, cors); }
    const sessionId = payload?.sessionId;
    const event = payload?.event;
    if (!validSessionId(sessionId) || !['start','heartbeat','end'].includes(event)) return response(JSON.stringify({error:'Invalid event'}), 400, cors);
    const now = Date.now();
    const existing = await env.DB.prepare('SELECT last_seen_at FROM sessions WHERE session_id = ?').bind(sessionId).first();
    if (event === 'start' || !existing) {
      await env.DB.prepare('INSERT OR IGNORE INTO sessions(session_id,started_at,last_seen_at,active_ms) VALUES(?,?,?,0)').bind(sessionId,now,now).run();
    } else {
      const delta = Math.min(MAX_HEARTBEAT_MS, Math.max(0, now - Number(existing.last_seen_at||now)));
      await env.DB.prepare('UPDATE sessions SET last_seen_at=?, active_ms=active_ms+? WHERE session_id=?').bind(now,delta,sessionId).run();
    }
    return response(JSON.stringify({ok:true}), 200, cors);
  }
};
