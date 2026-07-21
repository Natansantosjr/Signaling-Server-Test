/**
 * Página "Camera Sender" — captura a câmera/microfone do dispositivo e
 * transmite via WebRTC para o ambiente VR (Unity), usando o signaling
 * server + proxy TURN hospedado no Railway.
 *
 * Requer a variável de ambiente VITE_RAILWAY_URL configurada no Vercel,
 * contendo apenas o domínio (sem protocolo), ex:
 *   VITE_RAILWAY_URL=signaling-server-test-production.up.railway.app
 *
 * Rota sugerida: /camera-sender
 * (adicione no seu arquivo de rotas, ex: App.tsx)
 *   <Route path="/camera-sender" element={<CameraSender />} />
 */

import { useCallback, useRef, useState } from "react";

type ImportMetaEnv = {
  VITE_RAILWAY_URL: string;
};

const RAILWAY_DOMAIN = (import.meta as ImportMeta & { env: ImportMetaEnv }).env.VITE_RAILWAY_URL;
const SIGNALING_WS_URL = `wss://${RAILWAY_DOMAIN}`;
const TURN_CREDENTIALS_URL = `https://${RAILWAY_DOMAIN}/turn-credentials`;

async function fetchIceServers(): Promise<RTCIceServer[]> {
  const fallback: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

  if (!RAILWAY_DOMAIN) {
    console.warn("VITE_RAILWAY_URL não configurada — usando apenas STUN público.");
    return fallback;
  }

  try {
    const res = await fetch(TURN_CREDENTIALS_URL);
    if (!res.ok) {
      console.error("Falha ao buscar credenciais TURN:", res.status);
      return fallback;
    }
    const data = await res.json();
    if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      return data.iceServers as RTCIceServer[];
    }
    return fallback;
  } catch (err) {
    console.error("Erro ao buscar credenciais TURN, usando apenas STUN:", err);
    return fallback;
  }
}

export default function CameraSender() {
  const [room, setRoom] = useState("arena-1");
  const [status, setStatus] = useState("Desconectado");
  const [isStreaming, setIsStreaming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    try {
      setIsStreaming(true);
      setStatus("Buscando credenciais TURN...");
      const iceServers = await fetchIceServers();

      setStatus("Solicitando câmera/microfone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setStatus("Conectando ao signaling server...");
      const ws = new WebSocket(SIGNALING_WS_URL);
      wsRef.current = ws;

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") setStatus("Conectado — transmitindo");
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("Conexão perdida");
        }
      };

      ws.onopen = () => {
        setStatus("Conectado ao signaling server, entrando na sala...");
        ws.send(JSON.stringify({ type: "join", room }));

        // Aguarda um instante pra dar tempo do lado Unity entrar na sala
        // antes de enviar a offer.
        setTimeout(async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: "offer", offer }));
          setStatus("Offer enviada, aguardando resposta do Unity...");
        }, 1000);
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
        } else if (msg.type === "ice-candidate" && msg.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (err) {
            console.error("Erro ao adicionar ICE candidate:", err);
          }
        }
      };

      ws.onclose = () => setStatus("Desconectado do signaling server");
      ws.onerror = (err) => console.error("WS error:", err);
    } catch (err) {
      console.error(err);
      setStatus("Erro: " + (err as Error).message);
      setIsStreaming(false);
    }
  }, [room]);

  const stop = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;

    wsRef.current?.close();
    wsRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    setStatus("Desconectado");
    setIsStreaming(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Camera Sender</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Envia o vídeo e áudio da câmera deste dispositivo para o ambiente VR
        via WebRTC.
      </p>

      <div className="flex flex-wrap gap-2 items-center justify-center">
        <input
          className="border rounded px-3 py-2 text-sm bg-background"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="nome-da-sala"
          disabled={isStreaming}
        />
        {!isStreaming ? (
          <button
            onClick={start}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium"
          >
            Iniciar transmissão
          </button>
        ) : (
          <button
            onClick={stop}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded text-sm font-medium"
          >
            Parar
          </button>
        )}
      </div>

      <div className="font-semibold text-sm">{status}</div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-md rounded-lg border aspect-video bg-black"
      />
    </div>
  );
}
