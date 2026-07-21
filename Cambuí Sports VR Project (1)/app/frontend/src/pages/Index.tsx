import { useEffect, useState } from 'react';
import { client } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LiveStreamPanel } from '@/components/LiveStreamPanel';
import { ReplayPanel } from '@/components/ReplayPanel';
import { EventsPanel } from '@/components/EventsPanel';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { WalletPanel } from '@/components/WalletPanel';
import { InfraPanel } from '@/components/InfraPanel';
import CameraSender from './CameraSender';

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('streaming');

  useEffect(() => {
    client.auth.me()
      .then((res) => {
        if (res?.data) setUser(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    client.auth.toLogin();
  };

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/assets/logo-cambui-sports.png" alt="Cambuí Sports" className="w-16 h-16 animate-pulse" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activePanel) {
      case 'camera-sender': 
      return <CameraSender />;
      case 'streaming': return <LiveStreamPanel />;
      case 'replay': return <ReplayPanel />;
      case 'events': return <EventsPanel />;
      case 'analytics': return <AnalyticsPanel />;
      case 'wallet': return <WalletPanel />;
      case 'infra': return <InfraPanel />;
      default: return <LiveStreamPanel />;
    }
  };

  return (
    <div className="dark">
      <DashboardLayout activePanel={activePanel} setActivePanel={setActivePanel} onLogin={handleLogin} isLoggedIn={!!user}>
        {renderPanel()}
      </DashboardLayout>
    </div>
  );
}