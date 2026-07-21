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

const RAILWAY_DOMAIN =
  (import.meta as ImportMeta & { env: ImportMetaEnv }).env.VITE_RAILWAY_URL ||
  "signaling-server-test-production.up.railway.app"; // Fallback se a env não estiver setada

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

  const sendOffer = async (pc: RTCPeerConnection, ws: WebSocket) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(
        JSON.stringify({
          type: "offer",
          offer: {
            type: offer.type,
            sdp: offer.sdp,
          },
        })
      );
      setStatus("Offer enviada, aguardando Unity...");
    } catch (err) {
      console.error("Erro ao criar/enviar offer:", err);
    }
  };

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

      // FORMATAÇÃO DO ICE CANDIDATE ALINHADA COM C# JsonUtility
      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex ?? 0,
              },
            })
          );
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") setStatus("Conectado — Transmitindo para Unity!");
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("Conexão com a Unity perdida");
        }
      };

      ws.onopen = () => {
        setStatus("Conectado ao signaling. Entrando na sala...");
        ws.send(JSON.stringify({ type: "join", room }));

        // Dispara a oferta inicial
        setTimeout(() => sendOffer(pc, ws), 1000);
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        // Se a Unity acabou de entrar na sala, podemos re-enviar a offer se necessário
        if (msg.type === "peer-joined") {
          console.log("[WebRTC] Novo peer detectado na sala. Re-enviando oferta...");
          sendOffer(pc, ws);
        }

        if (msg.type === "answer") {
          console.log("[WebRTC] Answer recebida da Unity");
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
    <div className="flex flex-col items-center justify-center gap-4 p-6 bg-card text-card-foreground rounded-xl border border-border">
      <h1 className="text-xl font-bold">Transmissor de Câmera VR</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Transmita a câmera e áudio deste dispositivo diretamente para o visor VR (Unity).
      </p>

      <div className="flex flex-wrap gap-2 items-center justify-center">
        <input
          className="border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="nome-da-sala"
          disabled={isStreaming}
        />
        {!isStreaming ? (
          <button
            onClick={start}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            Iniciar transmissão
          </button>
        ) : (
          <button
            onClick={stop}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            Parar
          </button>
        )}
      </div>

      <div className="font-semibold text-sm text-primary">{status}</div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-md rounded-lg border border-border aspect-video bg-black object-cover -scale-x-100"
      />
    </div>
  );
}