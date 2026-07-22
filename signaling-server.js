/**
 * Servidor de sinalização WebRTC — salas com múltiplos slots de câmera.
 *
 * Cada sala tem SLOTS_PER_ROOM câmeras (padrão 6). Um cliente web (sender)
 * reserva um slot livre numa sala; o Unity (receiver) entra na sala e
 * gerencia todas as conexões dos slots ocupados.
 *
 * Variáveis de ambiente (Railway):
 *   METERED_API_KEY, METERED_DOMAIN, PORT
 */

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const METERED_API_KEY = process.env.METERED_API_KEY || '';
const METERED_DOMAIN = process.env.METERED_DOMAIN || 'arena-vr.metered.live';
const SLOTS_PER_ROOM = parseInt(process.env.SLOTS_PER_ROOM || '6', 10);

const STUN_FALLBACK = [{ urls: ['stun:stun.l.google.com:19302'] }];

async function fetchIceServers() {
  if (!METERED_API_KEY) return STUN_FALLBACK;
  try {
    const url = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;
    const meteredRes = await fetch(url);
    if (!meteredRes.ok) {
      console.error('Metered respondeu com erro:', meteredRes.status);
      return STUN_FALLBACK;
    }
    const data = await meteredRes.json();
    if (!Array.isArray(data) || data.length === 0) return STUN_FALLBACK;
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

// ---- Estado das salas ----
// roomId -> { receivers: Set<ws>, slots: Map<slotNumber, ws|null> }
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    const slots = new Map();
    for (let i = 1; i <= SLOTS_PER_ROOM; i++) slots.set(i, null);
    rooms.set(roomId, { receivers: new Set(), slots });
  }
  return rooms.get(roomId);
}

function roomStatusPayload(roomId) {
  const r = getRoom(roomId);
  const slots = Array.from(r.slots.entries()).map(([slot, ws]) => ({
    slot,
    occupied: ws !== null,
  }));
  return { type: 'room-status', room: roomId, slots };
}

function broadcastRoomStatus(roomId) {
  const r = getRoom(roomId);
  const payload = JSON.stringify(roomStatusPayload(roomId));
  for (const recv of r.receivers) {
    if (recv.readyState === WebSocket.OPEN) recv.send(payload);
  }
}

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

// ---- HTTP: /turn-credentials (usado pelo frontend web) ----
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

// ---- WebSocket de sinalização ----
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.role = null;
  ws.room = null;
  ws.slot = null;

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      console.error('Mensagem inválida (não é JSON):', raw.toString());
      return;
    }

    switch (msg.type) {
      // Unity entra numa sala como receptor
      case 'join-room': {
        ws.role = 'receiver';
        ws.room = msg.room;
        const r = getRoom(msg.room);
        r.receivers.add(ws);

        const iceServers = await fetchIceServers();
        send(ws, { type: 'config', iceServers });
        send(ws, roomStatusPayload(msg.room));
        console.log(`[receiver] entrou na sala "${msg.room}"`);
        break;
      }

      // Web consulta quais slots estão livres, sem reservar nada ainda
      case 'get-status': {
        send(ws, roomStatusPayload(msg.room));
        break;
      }

      // Web tenta reservar um slot específico
      case 'join-slot': {
        const r = getRoom(msg.room);
        const current = r.slots.get(msg.slot);

        if (current !== null && current !== undefined) {
          send(ws, { type: 'slot-taken', room: msg.room, slot: msg.slot });
          break;
        }

        r.slots.set(msg.slot, ws);
        ws.role = 'sender';
        ws.room = msg.room;
        ws.slot = msg.slot;

        send(ws, { type: 'slot-joined', room: msg.room, slot: msg.slot });
        broadcastRoomStatus(msg.room);
        console.log(`[sender] ocupou sala "${msg.room}" slot ${msg.slot}`);
        break;
      }

      // Sender -> encaminha a offer pra todos os receivers da sala
      case 'offer': {
        const r = getRoom(msg.room);
        for (const recv of r.receivers) {
          send(recv, { type: 'offer', room: msg.room, slot: msg.slot, offer: msg.offer });
        }
        break;
      }

      // Receiver -> encaminha a answer só pro sender dono daquele slot
      case 'answer': {
        const r = getRoom(msg.room);
        const senderWs = r.slots.get(msg.slot);
        send(senderWs, { type: 'answer', room: msg.room, slot: msg.slot, answer: msg.answer });
        break;
      }

      // ICE candidate: roteia conforme o papel de quem enviou
      case 'ice-candidate': {
        const r = getRoom(msg.room);
        if (ws.role === 'sender') {
          for (const recv of r.receivers) {
            send(recv, { type: 'ice-candidate', room: msg.room, slot: msg.slot, candidate: msg.candidate });
          }
        } else if (ws.role === 'receiver') {
          const senderWs = r.slots.get(msg.slot);
          send(senderWs, { type: 'ice-candidate', room: msg.room, slot: msg.slot, candidate: msg.candidate });
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!ws.room) return;
    const r = getRoom(ws.room);

    if (ws.role === 'receiver') {
      r.receivers.delete(ws);
    } else if (ws.role === 'sender' && ws.slot != null) {
      if (r.slots.get(ws.slot) === ws) {
        r.slots.set(ws.slot, null);
        broadcastRoomStatus(ws.room);
        console.log(`[sender] liberou sala "${ws.room}" slot ${ws.slot}`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server (salas + slots) rodando na porta ${PORT}`);
  if (!METERED_API_KEY) {
    console.warn('AVISO: METERED_API_KEY não configurada — TURN vai cair no fallback STUN.');
  }
});