/**
 * Página "Camera Sender" com suporte a salas e múltiplos slots de câmera.
 *
 * Fluxo:
 *  1. Usuário digita o nome da sala e clica em "Ver câmeras".
 *  2. Abre uma conexão WebSocket e pede o status da sala (get-status).
 *  3. Mostra 6 botões (slots), cada um livre ou ocupado.
 *  4. Ao clicar num slot livre, tenta reservar (join-slot). Se confirmado,
 *     pede câmera/microfone e inicia a transmissão WebRTC pra esse slot.
 *
 * Requer VITE_RAILWAY_URL configurada (só o domínio, sem protocolo).
 */

import { useCallback, useEffect, useRef, useState } from "react";

type ImportMetaEnv = {
  readonly VITE_RAILWAY_URL: string;
  readonly VITE_API_URL: string;
};

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const RAILWAY_DOMAIN = import.meta.env.VITE_RAILWAY_URL as string;
const SIGNALING_WS_URL = `wss://${RAILWAY_DOMAIN}`;
const TURN_CREDENTIALS_URL = `https://${RAILWAY_DOMAIN}/turn-credentials`;

type SlotInfo = { slot: number; occupied: boolean };
type Stage = "room-entry" | "slot-picker" | "streaming";

async function fetchIceServers(): Promise<RTCIceServer[]> {
  const fallback: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  if (!RAILWAY_DOMAIN) return fallback;
  try {
    const res = await fetch(TURN_CREDENTIALS_URL);
    if (!res.ok) return fallback;
    const data = await res.json();
    return Array.isArray(data.iceServers) && data.iceServers.length > 0
      ? (data.iceServers as RTCIceServer[])
      : fallback;
  } catch {
    return fallback;
  }
}

export default function CameraSender() {
  const [stage, setStage] = useState<Stage>("room-entry");
  const [room, setRoom] = useState("arena-1");
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const roomRef = useRef(room);
  roomRef.current = room;

  const startStreaming = useCallback(async (slot: number) => {
    try {
      setStage("streaming");
      setStatus("Buscando credenciais TURN...");
      const iceServers = await fetchIceServers();

      setStatus("Solicitando câmera/microfone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsRef.current?.send(
            JSON.stringify({ type: "ice-candidate", room: roomRef.current, slot, candidate: event.candidate })
          );
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus(`Conectado — transmitindo (câmera ${slot})`);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("Conexão perdida");
        }
      };

      setStatus("Conectando...");
      setTimeout(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsRef.current?.send(JSON.stringify({ type: "offer", room: roomRef.current, slot, offer }));
      }, 500);
    } catch (err) {
      console.error(err);
      setStatus("Erro: " + (err as Error).message);
    }
  }, []);

  const connectAndGetStatus = useCallback(() => {
    setError("");
    const ws = new WebSocket(SIGNALING_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "get-status", room: roomRef.current }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "room-status") {
        setSlots(msg.slots);
        setStage("slot-picker");
      } else if (msg.type === "slot-taken") {
        setError(`Câmera ${msg.slot} acabou de ser ocupada — escolha outra.`);
        ws.send(JSON.stringify({ type: "get-status", room: roomRef.current }));
      } else if (msg.type === "slot-joined") {
        startStreaming(msg.slot);
      } else if (msg.type === "answer") {
        pcRef.current?.setRemoteDescription(new RTCSessionDescription(msg.answer));
      } else if (msg.type === "ice-candidate" && msg.candidate) {
        pcRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(console.error);
      }
    };

    ws.onerror = (err) => console.error("WS error:", err);
  }, [startStreaming]);

  const pickSlot = useCallback((slot: number) => {
    setSelectedSlot(slot);
    setError("");
    wsRef.current?.send(JSON.stringify({ type: "join-slot", room: roomRef.current, slot }));
  }, []);

  const stop = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;

    setStage("room-entry");
    setSlots([]);
    setSelectedSlot(null);
    setStatus("");
  }, []);

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Camera Sender</h1>

      {stage === "room-entry" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Digite o nome da sala pra ver as câmeras disponíveis.</p>
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-2 text-sm bg-background"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="nome-da-sala"
            />
            <button
              onClick={connectAndGetStatus}
              className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium"
            >
              Ver câmeras
            </button>
          </div>
        </div>
      )}

      {stage === "slot-picker" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Sala <strong>{room}</strong> — escolha uma câmera disponível:
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-3 gap-2">
            {slots.map(({ slot, occupied }) => (
              <button
                key={slot}
                disabled={occupied}
                onClick={() => pickSlot(slot)}
                className={`px-4 py-3 rounded text-sm font-medium border ${
                  occupied
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : selectedSlot === slot
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent"
                }`}
              >
                Câmera {slot}
                <br />
                <span className="text-xs">{occupied ? "ocupada" : "livre"}</span>
              </button>
            ))}
          </div>
          <button onClick={stop} className="text-xs text-muted-foreground underline mt-2">
            Voltar
          </button>
        </div>
      )}

      {stage === "streaming" && (
        <div className="flex flex-col items-center gap-3">
          <div className="font-semibold text-sm">{status}</div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md rounded-lg border aspect-video bg-black"
          />
          <button
            onClick={stop}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded text-sm font-medium"
          >
            Parar
          </button>
        </div>
      )}
    </div>
  );
}