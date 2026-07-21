import { ReactNode } from 'react';
import {
  Radio,
  RotateCcw,
  Calendar,
  BarChart3,
  Wallet,
  Server,
  Menu,
  X,
  LogIn,
  Video,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  activePanel: string;
  setActivePanel: (panel: string) => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
}

const navItems = [
  { id: 'camera-sender', label: 'Câmera VR', icon: Video },
  { id: 'streaming', label: 'Transmissão', icon: Radio },
  { id: 'replay', label: 'Replay', icon: RotateCcw },
  { id: 'events', label: 'Eventos', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'infra', label: 'Infraestrutura', icon: Server },
];

export function DashboardLayout({ children, activePanel, setActivePanel, onLogin, isLoggedIn }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
            <img src="https://mgx-backend-cdn.metadl.com/generate/images/1190109/2026-07-12/sktworqaaizq/logo-cambui-sports_variant_9.png" alt="Cambuí Sports" className="w-10 h-10" />
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground leading-tight">Cambuí Sports</h2>
              <span className="text-xs text-muted-foreground">VR Streaming</span>
            </div>
            <button
              className="ml-auto lg:hidden text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePanel(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground glow-green'
                      : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : ''} />
                  {item.label}
                  {item.id === 'streaming' && (
                    <span className="ml-auto flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
                      <span className="text-xs text-red-400">AO VIVO</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-sidebar-border">
            {!isLoggedIn && onLogin ? (
              <button
                onClick={onLogin}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
              >
                <LogIn size={16} />
                Entrar no Sistema
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Sistema Operacional
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card/50">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {navItems.find((n) => n.id === activePanel)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
              <span className="text-xs font-medium text-red-400">1 Evento Ao Vivo</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-medium text-primary">12.450 viewers</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}