/**
 * Servidor de sinalização WebRTC + credenciais TURN (Metered).
 *
 * 1) Sinalização: relay de mensagens (offer/answer/ice-candidate) entre
 *    os peers da mesma "sala", e envia um "config" com os ICE servers
 *    assim que o cliente entra na sala.
 * 2) Proxy TURN: também expõe GET /turn-credentials (usado pelo frontend
 *    web) com o mesmo conteúdo.
 *
 * IMPORTANTE: a Metered não usa usuário/senha fixos — as credenciais TURN
 * são geradas dinamicamente a cada chamada à API dela, usando a
 * METERED_API_KEY (que fica só aqui no servidor, nunca no cliente).
 *
 * Variáveis de ambiente (configurar no Railway):
 *   METERED_API_KEY  -> Secret Key do dashboard da Metered
 *   METERED_DOMAIN    -> ex: arena-vr.metered.live
 *   PORT              -> injetado automaticamente pelo Railway
 *
 * Se você tinha criado uma variável METERED_USERNAME antes, pode apagar —
 * ela não é usada nem necessária.
 */

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const METERED_API_KEY = process.env.METERED_API_KEY || '';
const METERED_DOMAIN = process.env.METERED_DOMAIN || 'arena-vr.metered.live';

const STUN_FALLBACK = [{ urls: ['stun:stun.l.google.com:19302'] }];

/**
 * Busca as credenciais TURN reais na Metered e normaliza o formato pra
 * sempre ter "urls" como array de strings (independente de como a Metered
 * devolver internamente).
 */
async function fetchIceServers() {
  if (!METERED_API_KEY) {
    console.warn('METERED_API_KEY não configurada — usando apenas STUN.');
    return STUN_FALLBACK;
  }

  try {
    const url = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;
    const meteredRes = await fetch(url);

    if (!meteredRes.ok) {
      console.error('Metered respondeu com erro:', meteredRes.status);
      return STUN_FALLBACK;
    }

    const data = await meteredRes.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.error('Resposta inesperada da Metered:', data);
      return STUN_FALLBACK;
    }

    return data.map((entry) => {
      const urlsArray = Array.isArray(entry.urls) ? entry.urls : [entry.urls];
      const normalized = { urls: urlsArray };
      if (entry.username) normalized.username = entry.username;
      if (entry.credential) normalized.credential = entry.credential;
      return normalized;
    });
  } catch (err) {
    console.error('Erro ao buscar credenciais TURN na Metered:', err);
    return STUN_FALLBACK;
  }
}

// ---- Servidor HTTP: /turn-credentials (usado pelo frontend web) ----
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/turn-credentials') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const iceServers = await fetchIceServers();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ iceServers }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Falha ao buscar credenciais TURN' }));
    }
    return;
  }
  res.writeHead(404);
  res.end();
});

// ---- WebSocket de sinalização (mesma porta/servidor HTTP acima) ----
const wss = new WebSocket.Server({ server });

// rooms: Map<roomId, Set<WebSocket>>
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  return rooms.get(roomId);
}

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      console.error('Mensagem inválida (não é JSON):', raw.toString());
      return;
    }

    // Primeira mensagem esperada: { type: "join", room: "minha-sala" }
    if (msg.type === 'join') {
      currentRoom = msg.room || 'default';
      getRoom(currentRoom).add(ws);
      console.log(`Cliente entrou na sala "${currentRoom}" (${getRoom(currentRoom).size} conectado(s))`);

      // Envia os ICE servers (STUN + TURN real da Metered) só pra quem entrou.
      const iceServers = await fetchIceServers();
      ws.send(JSON.stringify({ type: 'config', iceServers }));
      return;
    }

    // Qualquer outra mensagem (offer, answer, ice-candidate) é repassada
    // para os demais clientes da mesma sala.
    if (currentRoom) {
      for (const client of getRoom(currentRoom)) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      }
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
      }
      console.log(`Cliente saiu da sala "${currentRoom}"`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server + proxy TURN rodando na porta ${PORT}`);
  if (!METERED_API_KEY) {
    console.warn('AVISO: METERED_API_KEY não configurada — TURN vai cair no fallback STUN.');
  }
});