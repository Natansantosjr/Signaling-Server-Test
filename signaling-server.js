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

const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

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

console.log(`Signaling server rodando em ws://localhost:${PORT}`);
