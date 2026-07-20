# Architecture Design

## System Overview
Cambuí Sports VR - Sistema de transmissão de jogos ao vivo para ambiente VR. Dashboard web para controle e monitoramento de transmissões esportivas imersivas com multi-câmeras, replay instantâneo, analytics em tempo real, integração wallet/blockchain e monitoramento de infraestrutura.

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- Backend: Atoms Cloud (Auth, Database, File Storage)
- Database: PostgreSQL via Atoms Cloud entities
- Styling: Dark theme with green accent (sports/VR aesthetic)

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| Dashboard Layout | Sidebar navigation, top bar, responsive layout | DashboardLayout.tsx |
| Live Streaming | Multi-camera grid, quality selector, stream metrics | LiveStreamPanel.tsx |
| Replay System | Replay player, speed controls, replay list | ReplayPanel.tsx |
| Events | Event listing, status management, match info | EventsPanel.tsx |
| Analytics | Real-time metrics, camera distribution, audience chart | AnalyticsPanel.tsx |
| Wallet/Blockchain | Balance display, NFTs, transactions, blockchain status | WalletPanel.tsx |
| Infrastructure | LiveKit cluster, encoders, CDN, Redis monitoring | InfraPanel.tsx |

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Dark theme | Default dark mode | VR/sports streaming aesthetic, reduces eye strain |
| Single-page dashboard | Panel switching via state | Fast navigation, no page reloads |
| Atoms Cloud backend | Database entities | Simplified CRUD for events, cameras, replays, analytics |
| WebRTC simulation | UI representation | Real streaming would require LiveKit infrastructure |

## File Tree Plan
```
app/frontend/src/
├── App.tsx
├── index.css
├── lib/api.ts
├── pages/Index.tsx
├── components/
│   ├── DashboardLayout.tsx
│   ├── LiveStreamPanel.tsx
│   ├── ReplayPanel.tsx
│   ├── EventsPanel.tsx
│   ├── AnalyticsPanel.tsx
│   ├── WalletPanel.tsx
│   └── InfraPanel.tsx
```

## Implementation Guide
1. User authenticates via Atoms Cloud auth
2. Dashboard loads with sidebar navigation (6 panels)
3. Live Streaming panel shows 6 cameras from database with expand/collapse
4. Replay panel loads replays from DB with playback controls
5. Events panel shows all matches with status indicators
6. Analytics panel displays real-time metrics from DB
7. Wallet panel shows simulated blockchain/wallet data
8. Infra panel shows simulated cluster health metrics