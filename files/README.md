# Camera -> Unity VR (WebRTC)

Sistema para transmitir o vídeo da webcam de um notebook para dentro de um
ambiente VR no Unity (Quest standalone), via internet, como se fosse uma
chamada de vídeo.

## Componentes

- `server/` — Signaling server em Node.js (WebSocket). Faz apenas o relay
  das mensagens de sinalização (offer/answer/ICE), não processa vídeo.
- `web-sender/` — Página web que roda no notebook, captura a webcam com
  `getUserMedia` e envia via WebRTC.
- `unity/` — Script C# (`WebRTCCameraReceiver.cs`) para rodar no Quest,
  recebe o stream e aplica numa `RenderTexture`.

## Passo a passo

### 1. Suba o signaling server

Rode numa VPS/servidor acessível pela internet (precisa de HTTPS/WSS em
produção — use um proxy reverso com TLS, ex: Nginx + Let's Encrypt, ou
plataformas como Render/Railway/Fly.io):

```bash
cd server
npm install
node signaling-server.js
```

Isso sobe um WebSocket em `ws://SEU_SERVIDOR:8080`. Para uso real (fora de
localhost), configure TLS e use `wss://`.

### 2. Suba um TURN server

Necessário porque notebook e Quest estarão em redes diferentes, atrás de
NAT. Recomendado: [coturn](https://github.com/coturn/coturn) (open source).

```bash
sudo apt install coturn
# configure /etc/turnserver.conf com usuário/senha e o domínio do servidor
```

Anote a URL (`turn:seu-servidor:3478`), usuário e senha — vai usar tanto no
`web-sender/index.html` quanto no script Unity.

### 3. Abra a página do notebook

Abra `web-sender/index.html` num navegador (Chrome/Edge). Preencha:
- **Signaling URL**: `wss://seu-servidor:8080`
- **Room**: um nome combinado com o lado Unity (ex: `arena-1`)

Clique em "Iniciar transmissão" — o navegador vai pedir permissão da
câmera.

> Antes de abrir, edite o array `ICE_SERVERS` no arquivo para incluir seu
> TURN server.

### 4. Configure o projeto Unity

1. Instale os pacotes (Package Manager):
   - `com.unity.webrtc`
   - `NativeWebSocket` (via git URL, ver comentário no topo do .cs)
2. Adicione `WebRTCCameraReceiver.cs` a um GameObject na cena.
3. Crie uma `RenderTexture` e aplique no material de uma tela/Quad dentro
   do ambiente VR.
4. Adicione um componente `AudioSource` a algum GameObject na cena (ex: no
   mesmo GameObject da tela, pra o som parecer vir dela). Desmarque
   "Play On Awake" — o script chama `Play()` na hora certa.
5. No Inspector do componente, preencha:
   - **Signaling Url**: `wss://seu-servidor.com`
   - **Room**: `arena-1`
   - **Target Texture**: a RenderTexture criada
   - **Audio Source**: o AudioSource criado no passo 4
   - **Turn Url / Username / Credential**: dados do seu TURN server
6. Build para Android (Quest) e teste em dispositivo real.

## Ordem de conexão

O sender (notebook) espera ~1s após entrar na sala antes de criar a
`offer`, dando tempo do lado Unity entrar na sala e estar pronto para
receber. Se a conexão falhar na primeira tentativa, recarregue a página
do notebook depois que o app no Quest já estiver rodando.

## Pontos de atenção

- **Performance no Quest**: use resolução moderada (720p) na captura do
  notebook para não sobrecarregar a decodificação no hardware standalone.
- **Áudio**: ativado por padrão no sender (`audio: true`). Do lado Unity,
  lembre de configurar o `AudioSource` no Inspector — sem ele o áudio chega
  mas não é reproduzido (fica só um warning no Console).
- **Segurança**: esse exemplo não tem autenticação no signaling server —
  para uso real, adicione um token/senha na sala antes de expor
  publicamente.