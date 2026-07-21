/**
 * Servidor de sinalização WebRTC simples.
 * Faz o relay de mensagens (offer/answer/ice-candidate) entre os peers
 * conectados na mesma "sala" (room). Não processa vídeo — só troca
 * metadados de sinalização entre o notebook (sender) e o Quest (receiver).
 *
 * Uso:
 *   npm install
 *   node signaling-server.js
 *
 * Variável de ambiente PORT (default 8080).
 */

/**
 * Servidor de sinalização WebRTC com suporte a ICE Servers (Metered/STUN).
 * Faz o relay de mensagens entre peers e distribui credenciais TURN do Metered.
 */

const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Variáveis de Ambiente do Railway (com fallbacks de segurança)
const METERED_DOMAIN = process.env.METERED_DOMAIN || 'arena-vr.metered.live';
const METERED_USERNAME = process.env.METERED_USERNAME || '';
const METERED_API_KEY = process.env.METERED_API_KEY || '';

// Gera a lista de ICE Servers com as variáveis de ambiente
function getIceServers() {
  const servers = [
    { urls: ['stun:stun.l.google.com:19302'] }
  ];

  if (METERED_USERNAME && METERED_API_KEY) {
    // Porta 3478 (UDP)
    servers.push({
      urls: [`turn:${METERED_DOMAIN}:3478`],
      username: METERED_USERNAME,
      credential: METERED_API_KEY
    });

    // Porta 443 (TCP/TLS - Fallback para 4G/5G e Firewalls estritos)
    servers.push({
      urls: [`turns:${METERED_DOMAIN}:443?transport=tcp`],
      username: METERED_USERNAME,
      credential: METERED_API_KEY
    });
  }

  return servers;
}

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

  ws.on('message', (raw) => {
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

      // ENVIAR CONFIGURAÇÃO DE ICE SERVERS APENAS PARA QUEM ACABOU DE ENTRAR
      const configPayload = {
        type: 'config',
        iceServers: getIceServers()
      };
      ws.send(JSON.stringify(configPayload));
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

console.log(`Signaling server rodando na porta ${PORT}`);